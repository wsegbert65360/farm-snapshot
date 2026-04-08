import { config } from "./config";
import { isValidNumber, isValidObject } from "./validation";
import { ForecastDay } from "./types";

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
  };
  hourly?: {
    precipitation_probability: number[];
    precipitation: number[];
    wind_speed_10m: number[];
  };
}

interface OpenMeteoDailyResponse {
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_probability_max: (number | null)[];
    precipitation_sum: (number | null)[];
    wind_speed_10m_max: (number | null)[];
    weathercode: (number | null)[];
  };
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

function toMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

export async function fetchCurrentWeather(): Promise<{
  tempF: number | null;
  windMph: number | null;
  gustMph: number | null;
  isRainingNow: boolean | null;
  rainPredicted: boolean | null;
  error?: string;
}> {
  const { lat, lon } = config.weather;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m&hourly=precipitation_probability,precipitation,wind_speed_10m`;

  console.log("[Weather] Fetching current weather from Open-Meteo...");

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Farm-Command/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log("[Weather] Response status:", response.status, response.statusText);

    if (!response.ok) {
      console.error("[Weather] API returned error:", response.status, response.statusText);
      return { tempF: null, windMph: null, gustMph: null, isRainingNow: null, rainPredicted: null, error: "Weather API unavailable" };
    }

    const rawData = await response.json();

    if (!isValidObject(rawData) || !isValidObject(rawData.current)) {
      return { tempF: null, windMph: null, gustMph: null, isRainingNow: null, rainPredicted: null, error: "Invalid weather response" };
    }

    const data = rawData as unknown as OpenMeteoResponse;
    const current = data.current;

    const tempF = current.temperature_2m !== null
      ? toF(current.temperature_2m)
      : null;

    const windMph = current.wind_speed_10m !== null
      ? toMph(current.wind_speed_10m)
      : null;

    const gustMph = current.wind_gusts_10m !== null
      ? toMph(current.wind_gusts_10m)
      : null;

    const isRainingNow = current.precipitation > 0;

    let rainPredicted: boolean | null = null;
    const hourlyPrecip = data.hourly?.precipitation_probability;
    const forecastHours = config.spray.rainForecastHours;
    const rainThreshold = config.spray.rainThreshold;
    if (hourlyPrecip && hourlyPrecip.length > 0) {
      rainPredicted = hourlyPrecip.slice(0, forecastHours).some(p => p > rainThreshold);
    }

    return { tempF, windMph, gustMph, isRainingNow, rainPredicted };
  } catch (e) {
    console.error("Weather API error:", e);
    return { tempF: null, windMph: null, gustMph: null, isRainingNow: null, rainPredicted: null, error: "Weather API unavailable" };
  }
}

export async function fetchDailyForecast(days = 10): Promise<{
  days: ForecastDay[];
  error?: string;
}> {
  const { lat, lon, timezone } = config.weather;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,weathercode&timezone=${encodeURIComponent(timezone)}&forecast_days=${days}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Farm-Command/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { days: [], error: "Forecast API unavailable" };
    }

    const rawData: Record<string, unknown> = await response.json();
    const daily = rawData.daily as OpenMeteoDailyResponse["daily"] | undefined;

    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      return { days: [], error: "Invalid forecast response" };
    }

    const today = new Date();

    const forecastDays: ForecastDay[] = daily.time.map((dateStr, i) => {
      const date = new Date(dateStr + "T12:00:00");
      const isToday = date.toDateString() === today.toDateString();
      const isTomorrow = (() => {
        const tom = new Date(today);
        tom.setDate(tom.getDate() + 1);
        return date.toDateString() === tom.toDateString();
      })();

      let dayLabel: string;
      if (isToday) dayLabel = "Today";
      else if (isTomorrow) dayLabel = "Tmrw";
      else dayLabel = DAY_LABELS[date.getDay()] || dateStr.slice(5);

      return {
        date: dateStr,
        dayLabel,
        highF: isValidNumber(daily.temperature_2m_max[i]) ? toF(daily.temperature_2m_max[i]!) : 0,
        lowF: isValidNumber(daily.temperature_2m_min[i]) ? toF(daily.temperature_2m_min[i]!) : 0,
        rainChance: isValidNumber(daily.precipitation_probability_max[i]) ? daily.precipitation_probability_max[i]! : 0,
        rainMm: isValidNumber(daily.precipitation_sum[i]) ? Math.round(daily.precipitation_sum[i]! * 100) / 100 : 0,
        windMph: isValidNumber(daily.wind_speed_10m_max[i]) ? toMph(daily.wind_speed_10m_max[i]!) : 0,
        weatherCode: isValidNumber(daily.weathercode[i]) ? daily.weathercode[i]! : 0,
      };
    });

    return { days: forecastDays };
  } catch (e) {
    console.error("Forecast API error:", e);
    return { days: [], error: "Forecast API unavailable" };
  }
}
