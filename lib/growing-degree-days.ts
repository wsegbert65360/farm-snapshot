import { config } from "./config";
import { isValidNumber, isValidObject } from "./validation";

export interface GDDData {
  /** Today's GDD (corn, base 50°F) */
  todayGDD: number;
  /** Accumulated GDD since April 1 (standard corn planting baseline) */
  seasonGDD: number;
  /** Accumulated GDD since May 1 (soybean planting baseline) */
  soySeasonGDD: number;
  /** 7-day GDD trend */
  weekGDD: number;
  /** Daily GDD values for the last 7 days */
  dailyGDD: { date: string; gdd: number }[];
  error?: string;
  updatedAt: string;
}

interface OpenMeteoDailyResponse {
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
  };
}

const CORN_BASE = 50; // °F — standard corn GDD base temperature
const SOY_BASE = 50;  // °F — standard soybean GDD base temperature

function toF(c: number): number {
  return (c * 9) / 5 + 32;
}

function calcGDD(maxF: number, minF: number, base: number): number {
  // Standard GDD calculation: ((max + min) / 2) - base
  // Capped: max cannot exceed 86°F, min cannot go below base
  const cappedMax = Math.min(maxF, 86);
  const cappedMin = Math.max(minF, base);
  const avg = (cappedMax + cappedMin) / 2;
  return Math.max(0, Math.round((avg - base) * 10) / 10);
}

function getStartDate(month: number, day: number, timezone: string): Date {
  const now = new Date();
  // Get current year in the farm's timezone
  const yearStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric",
  }).format(now);
  const year = parseInt(yearStr, 10);
  // Use noon to avoid DST boundary issues
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00`);
  return start;
}

export async function fetchGDD(): Promise<GDDData> {
  const { lat, lon, timezone } = config.weather;

  // Fetch daily max/min temps for the season (April 1 to today)
  // Use timezone-aware date comparison to avoid off-by-one errors
  const now = new Date();
  const todayInTz = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const seasonStart = getStartDate(4, 1, timezone); // April 1
  const soyStart = getStartDate(5, 1, timezone);    // May 1

  // Calculate days since April 1, clamped to non-negative
  const todayDate = new Date(todayInTz + "T12:00:00");
  const diffDays = Math.max(0, Math.ceil((todayDate.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)));
  const fetchDays = Math.max(diffDays + 1, 7);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(timezone)}&forecast_days=1&past_days=${fetchDays}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Farm-Command/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { todayGDD: 0, seasonGDD: 0, soySeasonGDD: 0, weekGDD: 0, dailyGDD: [], error: "API unavailable", updatedAt: new Date().toISOString() };
    }

    const rawData: Record<string, unknown> = await response.json();
    const daily = rawData.daily as OpenMeteoDailyResponse["daily"] | undefined;

    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      return { todayGDD: 0, seasonGDD: 0, soySeasonGDD: 0, weekGDD: 0, dailyGDD: [], error: "Invalid response", updatedAt: new Date().toISOString() };
    }

    // Calculate GDD for each day
    const allGDD: { date: string; gdd: number; maxF: number; minF: number }[] = [];
    for (let i = 0; i < daily.time.length; i++) {
      const maxC = daily.temperature_2m_max[i];
      const minC = daily.temperature_2m_min[i];
      if (isValidNumber(maxC) && isValidNumber(minC)) {
        const maxF = toF(maxC);
        const minF = toF(minC);
        const gdd = calcGDD(maxF, minF, CORN_BASE);
        allGDD.push({ date: daily.time[i], gdd, maxF, minF });
      } else {
        allGDD.push({ date: daily.time[i], gdd: 0, maxF: 0, minF: 0 });
      }
    }

    // Today's GDD
    const todayGDD = allGDD.length > 0 ? allGDD[allGDD.length - 1].gdd : 0;

    // Accumulated GDD since April 1
    const apr1Str = `${seasonStart.getFullYear()}-04-01`;
    const seasonGDD = allGDD
      .filter(d => d.date >= apr1Str)
      .reduce((sum, d) => sum + d.gdd, 0);

    // Accumulated GDD since May 1
    const may1Str = `${soyStart.getFullYear()}-05-01`;
    const soySeasonGDD = allGDD
      .filter(d => d.date >= may1Str)
      .reduce((sum, d) => sum + d.gdd, 0);

    // 7-day GDD
    const last7 = allGDD.slice(-7);
    const weekGDD = last7.reduce((sum, d) => sum + d.gdd, 0);

    // Daily GDD for last 7 days (for mini chart)
    const dailyGDD = last7.map(d => ({ date: d.date, gdd: d.gdd }));

    return { todayGDD, seasonGDD, soySeasonGDD, weekGDD, dailyGDD, updatedAt: new Date().toISOString() };
  } catch (e) {
    console.error("GDD API error:", e);
    return { todayGDD: 0, seasonGDD: 0, soySeasonGDD: 0, weekGDD: 0, dailyGDD: [], error: "API unavailable", updatedAt: new Date().toISOString() };
  }
}
