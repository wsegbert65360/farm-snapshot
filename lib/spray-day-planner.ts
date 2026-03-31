import { config } from "./config";
import { isValidNumber } from "./validation";

export interface SprayDay {
  date: string;
  dayLabel: string;
  rating: "GO" | "WAIT";
  reason: string;
  rainChance: number;
  windMph: number;
  gustMph: number;
  /** Day number (1=today, 2=tomorrow) */
  dayNum: number;
}

export interface SprayDayPlannerData {
  days: SprayDay[];
  /** Number of GO days in the next 7 */
  goodDaysCount: number;
  /** Number of total days shown */
  totalDays: number;
  error?: string;
  updatedAt: string;
}

function toMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tmrw";
  return DAY_LABELS[date.getDay()] || dateStr.slice(5);
}

function rateDay(rainChance: number, windMph: number, gustMph: number, maxWind: number, maxGust: number, rainThresh: number): { rating: "GO" | "WAIT"; reason: string } {
  const issues: string[] = [];

  // Check rain first — most important factor
  if (rainChance >= 60) {
    issues.push(`Rain ${rainChance}%`);
  } else if (rainChance >= rainThresh) {
    issues.push(`Rain ${rainChance}%`);
  }

  // Check wind
  if (windMph > maxWind) {
    issues.push(`Wind ${windMph}mph > ${maxWind}mph`);
  }

  // Check gusts
  if (gustMph > maxGust) {
    issues.push(`Gusts ${gustMph}mph > ${maxGust}mph`);
  }

  if (issues.length > 0) {
    return { rating: "WAIT", reason: issues.join(" · ") };
  }

  // All clear — add positive context
  const parts: string[] = [];
  if (windMph === 0) {
    parts.push("No wind");
  } else {
    parts.push(`Wind ${windMph}mph`);
  }
  parts.push(`Rain ${rainChance}%`);
  return { rating: "GO", reason: parts.join(" · ") };
}

export async function fetchSprayDayPlanner(): Promise<SprayDayPlannerData> {
  const { lat, lon, timezone } = config.weather;
  const { maxWindMph, maxGustMph, rainThreshold } = config.spray;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&timezone=${encodeURIComponent(timezone)}&forecast_days=7`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Farm-Command/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { days: [], goodDaysCount: 0, totalDays: 0, error: "API unavailable", updatedAt: new Date().toISOString() };
    }

    const rawData: Record<string, unknown> = await response.json();
    const daily = rawData.daily as Record<string, unknown[]> | undefined;

    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      return { days: [], goodDaysCount: 0, totalDays: 0, error: "Invalid response", updatedAt: new Date().toISOString() };
    }

    const days: SprayDay[] = daily.time.map((dateStr, i) => {
      const rainChance = isValidNumber(daily.precipitation_probability_max[i]) ? daily.precipitation_probability_max[i] as number : 0;
      const windKmh = isValidNumber(daily.wind_speed_10m_max[i]) ? daily.wind_speed_10m_max[i] as number : 0;
      const gustKmh = isValidNumber(daily.wind_gusts_10m_max[i]) ? daily.wind_gusts_10m_max[i] as number : 0;
      const windMph = toMph(windKmh);
      const gustMph = toMph(gustKmh);

      const { rating, reason } = rateDay(rainChance, windMph, gustMph, maxWindMph, maxGustMph, rainThreshold);

      return {
        date: dateStr as string,
        dayLabel: getDayLabel(dateStr as string),
        rating,
        reason,
        rainChance,
        windMph,
        gustMph,
        dayNum: i + 1,
      };
    });

    const goodDaysCount = days.filter(d => d.rating === "GO").length;

    return { days, goodDaysCount, totalDays: days.length, updatedAt: new Date().toISOString() };
  } catch (e) {
    console.error("Spray day planner API error:", e);
    return { days: [], goodDaysCount: 0, totalDays: 0, error: "API unavailable", updatedAt: new Date().toISOString() };
  }
}
