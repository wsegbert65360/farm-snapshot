import { config } from "./config";
import { isValidNumber, isValidObject } from "./validation";

export interface RainHour {
  /** ISO datetime string (e.g. "2025-06-15T08:00") */
  time: string;
  /** Short hour label (e.g. "8AM", "2PM") */
  label: string;
  /** Precipitation probability 0-100 */
  prob: number;
  /** Expected precipitation in inches */
  precipIn: number;
  /** Whether this hour is in the past (already elapsed) */
  isNow: boolean;
}

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes - weather data doesn't change that fast

type CachedData = {
  data: RainTimelineData;
  expiresAt: number;
};

// In-memory cache (per-process, resets on server restart)
let cache: CachedData | null = null;

// Request coalescing: track in-flight requests
let inFlightPromise: Promise<RainTimelineData> | null = null;

export interface RainTimelineData {
  /** Hourly entries for the next 24 hours */
  hours: RainHour[];
  /** Total expected rain in inches over the window */
  totalPrecipIn: number;
  /** Longest consecutive dry streak in hours */
  dryStreak: number;
  /** Whether rain is expected in the next 3 hours */
  rainSoon: boolean;
  error?: string;
  updatedAt: string;
}

function mmToIn(mm: number): number {
  return Math.round((mm / 25.4) * 100) / 100;
}

function formatHour(isoTime: string): string {
  // Open-Meteo returns times in the configured timezone (e.g. "2026-03-31T08:00")
  // Extract hour directly from string to avoid server timezone double-conversion
  const match = isoTime.match(/T(\d{2}):/);
  if (!match) return "?";
  let h = parseInt(match[1], 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}${ampm}`;
}

function extractHourFromTime(isoTime: string): number {
  const match = isoTime.match(/T(\d{2}):/);
  return match ? parseInt(match[1], 10) : -1;
}

function findNowIndex(times: string[]): number {
  // Use the server's current hour in the farm's timezone
  const currentHourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: config.weather.timezone,
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  const currentHour = parseInt(currentHourStr, 10);

  // Find the first hour entry that matches the current hour
  // Prefer the matching hour from the current day (look from end to get most recent)
  for (let i = times.length - 1; i >= 0; i--) {
    if (extractHourFromTime(times[i]) === currentHour) return i;
  }
  return 0;
}

function isCacheValid(): boolean {
  if (!cache) return false;
  return Date.now() < cache.expiresAt;
}

async function fetchFromAPI(): Promise<RainTimelineData> {
  const { lat, lon, timezone } = config.weather;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,precipitation&forecast_hours=24&timezone=${encodeURIComponent(timezone)}`;

  console.log('[RainTimeline] Fetching URL:', url);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Farm-Command/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    console.log('[RainTimeline] Response status:', response.status, 'OK:', response.ok);

    if (!response.ok) {
      console.error('[RainTimeline] API returned non-OK status:', response.status);
      
      // Distinguish rate limiting (429) from generic failures
      if (response.status === 429) {
        return { 
          hours: [], 
          totalPrecipIn: 0, 
          dryStreak: 0, 
          rainSoon: false, 
          error: "Rate limited - try again later", 
          updatedAt: new Date().toISOString() 
        };
      }
      
      return { hours: [], totalPrecipIn: 0, dryStreak: 0, rainSoon: false, error: "API unavailable", updatedAt: new Date().toISOString() };
    }

    const rawData = await response.json();

    if (!isValidObject(rawData) || !isValidObject(rawData.hourly)) {
      return { hours: [], totalPrecipIn: 0, dryStreak: 0, rainSoon: false, error: "Invalid response", updatedAt: new Date().toISOString() };
    }

    const hourly = rawData.hourly as Record<string, (number | string)[]>;
    const times = (hourly.time as string[]) || [];
    const probs = (hourly.precipitation_probability as number[]) || [];
    const precip = (hourly.precipitation as number[]) || [];

    if (times.length === 0) {
      return { hours: [], totalPrecipIn: 0, dryStreak: 0, rainSoon: false, error: "No hourly data", updatedAt: new Date().toISOString() };
    }

    const nowIdx = findNowIndex(times);
    let totalPrecip = 0;
    let longestDryStreak = 0;
    let currentDryStreak = 0;
    const hours: RainHour[] = [];

    for (let i = nowIdx; i < Math.min(nowIdx + 24, times.length); i++) {
      const prob = isValidNumber(probs[i]) ? probs[i] : 0;
      const precipMm = isValidNumber(precip[i]) ? precip[i] : 0;
      const precipIn = mmToIn(precipMm);

      totalPrecip += precipIn;

      if (prob < 20) {
        currentDryStreak++;
        longestDryStreak = Math.max(longestDryStreak, currentDryStreak);
      } else {
        currentDryStreak = 0;
      }

      hours.push({
        time: times[i],
        label: formatHour(times[i]),
        prob,
        precipIn,
        isNow: i === nowIdx,
      });
    }

    // Check if rain is expected in the next 3 hours
    const next3 = hours.slice(0, 3);
    const rainSoon = next3.some((h) => h.prob >= 30);

    return {
      hours,
      totalPrecipIn: Math.round(totalPrecip * 100) / 100,
      dryStreak: longestDryStreak,
      rainSoon,
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error("[RainTimeline] Exception:", e);
    if (e instanceof Error) {
      console.error("[RainTimeline] Error name:", e.name, "message:", e.message);
    }
    return { hours: [], totalPrecipIn: 0, dryStreak: 0, rainSoon: false, error: "API unavailable", updatedAt: new Date().toISOString() };
  }
}

export async function fetchRainTimeline(): Promise<RainTimelineData> {
  // Check cache first
  if (isCacheValid()) {
    console.log('[RainTimeline] Using cached data (expires in', Math.round((cache!.expiresAt - Date.now()) / 1000), 'seconds)');
    return cache!.data;
  }

  // If a request is already in-flight, return that promise (coalesce)
  if (inFlightPromise) {
    console.log('[RainTimeline] Using in-flight request');
    return inFlightPromise;
  }

  // Start a new fetch request
  inFlightPromise = fetchFromAPI().then((data) => {
    // Cache successful responses (or responses with errors we want to cache)
    // Don't cache if we got a rate limit error - let the next request retry sooner
    if (!data.error || data.error === "API unavailable") {
      cache = {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
    } else if (data.error === "Rate limited - try again later") {
      // For rate limiting, cache for a shorter time to reduce retry pressure
      cache = {
        data,
        expiresAt: Date.now() + (60 * 1000), // 1 minute
      };
    }
    
    return data;
  }).finally(() => {
    // Clear in-flight marker
    inFlightPromise = null;
  });

  return inFlightPromise;
}
