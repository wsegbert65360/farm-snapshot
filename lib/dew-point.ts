import { config } from "./config";
import { isValidNumber, isValidObject } from "./validation";

export interface DewPointData {
  tempF: number | null;
  dewPointF: number | null;
  humidity: number | null;
  /** Comfort level based on dew point */
  comfort: "Comfortable" | "Slightly Humid" | "Humid" | "Muggy" | "Oppressive" | "";
  /** Spraying advisory based on humidity */
  sprayNote: string;
  error?: string;
  updatedAt: string;
}

function toF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

function getComfortLevel(dewPointF: number): DewPointData["comfort"] {
  if (dewPointF < 55) return "Comfortable";
  if (dewPointF < 60) return "Slightly Humid";
  if (dewPointF < 65) return "Humid";
  if (dewPointF < 70) return "Muggy";
  return "Oppressive";
}

function getSprayNote(humidity: number): string {
  if (humidity < 40) return "Low drift risk — good spray window";
  if (humidity < 60) return "Fair conditions for spraying";
  if (humidity < 80) return "High humidity — watch for drift";
  return "Very humid — avoid spraying";
}

export async function fetchDewPoint(): Promise<DewPointData> {
  const { lat, lon } = config.weather;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,dew_point_2m,relative_humidity_2m`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Farm-Command/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { tempF: null, dewPointF: null, humidity: null, comfort: "", sprayNote: "", error: "API unavailable", updatedAt: new Date().toISOString() };
    }

    const rawData = await response.json();

    if (!isValidObject(rawData) || !isValidObject(rawData.current)) {
      return { tempF: null, dewPointF: null, humidity: null, comfort: "", sprayNote: "", error: "Invalid response", updatedAt: new Date().toISOString() };
    }

    const current = rawData.current as Record<string, number>;

    const tempF = isValidNumber(current.temperature_2m) ? toF(current.temperature_2m) : null;
    const dewPointF = isValidNumber(current.dew_point_2m) ? toF(current.dew_point_2m) : null;
    const humidity = isValidNumber(current.relative_humidity_2m) ? current.relative_humidity_2m : null;

    const comfort = dewPointF !== null ? getComfortLevel(dewPointF) : "";
    const sprayNote = humidity !== null ? getSprayNote(humidity) : "";

    return { tempF, dewPointF, humidity, comfort, sprayNote, updatedAt: new Date().toISOString() };
  } catch (e) {
    console.error("Dew point API error:", e);
    return { tempF: null, dewPointF: null, humidity: null, comfort: "", sprayNote: "", error: "API unavailable", updatedAt: new Date().toISOString() };
  }
}

