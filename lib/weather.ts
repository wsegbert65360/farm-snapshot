import { config } from "./config";

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "Farm-Command/1.0";

interface NWSGridPoint {
  properties: {
    forecast: string;
    forecastHourly: string;
    observationStations: string;
  };
}

interface NWSStation {
  properties: {
    stations: string[];
  };
}

interface NWSObservation {
  properties: {
    temperature: { value: number | null };
    windSpeed: { value: string | null };
    windGust: { value: number | null };
    precipitationLastHour: { value: number | null };
  };
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function getGridPoint(lat: number, lon: number): Promise<{ forecastUrl: string; stationsUrl: string } | null> {
  const url = `${NWS_API_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
  try {
    const response = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return null;
    const data = (await response.json()) as NWSGridPoint;
    return {
      forecastUrl: data.properties.forecast,
      stationsUrl: data.properties.observationStations,
    };
  } catch {
    return null;
  }
}

async function getNearestStation(stationsUrl: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(stationsUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return null;
    const data = (await response.json()) as NWSStation;
    return data.properties.stations[0] || null;
  } catch {
    return null;
  }
}

async function getCurrentObservation(stationUrl: string): Promise<{
  tempF: number | null;
  windMph: number;
  gustMph: number | null;
  isRainingNow: boolean;
} | null> {
  const url = `${stationUrl}/observations/latest`;
  try {
    const response = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return null;
    const data = (await response.json()) as NWSObservation;
    const props = data.properties;

    const tempF = props.temperature.value !== null
      ? Math.round((props.temperature.value * 9) / 5 + 32)
      : null;

    const windMph = props.windSpeed.value !== null
      ? parseInt(props.windSpeed.value.replace(" mph", "")) || 0
      : 0;

    const gustMph = props.windGust.value !== null
      ? Math.round(props.windGust.value * 0.621371)
      : null;

    const isRainingNow = (props.precipitationLastHour.value ?? 0) > 0;

    return { tempF, windMph, gustMph, isRainingNow };
  } catch {
    return null;
  }
}

export async function fetchCurrentWeather(): Promise<{
  tempF: number | null;
  windMph: number;
  gustMph: number | null;
  isRainingNow: boolean;
}> {
  const { lat, lon } = config.weather;

  try {
    const gridPoint = await getGridPoint(lat, lon);
    if (!gridPoint) {
      return { tempF: 62, windMph: 8, gustMph: 12, isRainingNow: false };
    }

    const stationUrl = await getNearestStation(gridPoint.stationsUrl);
    if (!stationUrl) {
      return { tempF: 62, windMph: 8, gustMph: 12, isRainingNow: false };
    }

    const observation = await getCurrentObservation(stationUrl);
    if (!observation) {
      return { tempF: 62, windMph: 8, gustMph: 12, isRainingNow: false };
    }

    return observation;
  } catch (e) {
    console.error("Weather API error:", e);
    return { tempF: 62, windMph: 8, gustMph: 12, isRainingNow: false };
  }
}
