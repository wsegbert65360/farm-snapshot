import { config } from "./config";

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    precipitation: number;
    wind_speed_10m: number;
  };
  hourly?: {
    precipitation_probability: number[];
    precipitation: number[];
    wind_speed_10m: number[];
  };
}

export async function fetchCurrentWeather(): Promise<{
  tempF: number | null;
  windMph: number | null;
  gustMph: number | null;
  isRainingNow: boolean | null;
  error?: string;
}> {
  const { lat, lon } = config.weather;
  
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m&hourly=precipitation_probability,precipitation,wind_speed_10m`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Farm-Command/1.0",
      },
    });

    if (!response.ok) {
      return { tempF: null, windMph: null, gustMph: null, isRainingNow: null, error: "Weather API unavailable" };
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const current = data.current;

    const tempF = current.temperature_2m !== null
      ? Math.round((current.temperature_2m * 9) / 5 + 32)
      : null;

    const windMph = current.wind_speed_10m !== null
      ? Math.round(current.wind_speed_10m * 0.621371)
      : null;

    const isRainingNow = current.precipitation > 0;

    let gustMph: number | null = null;
    if (data.hourly && data.hourly.wind_speed_10m) {
      const maxWind = Math.max(...data.hourly.wind_speed_10m.slice(0, 24));
      gustMph = Math.round(maxWind * 0.621371);
    }

    return { tempF, windMph, gustMph, isRainingNow };
  } catch (e) {
    console.error("Weather API error:", e);
    return { tempF: null, windMph: null, gustMph: null, isRainingNow: null, error: "Weather API unavailable" };
  }
}
