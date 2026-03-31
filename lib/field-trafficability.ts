import { config } from "./config";
import { isValidNumber, isValidObject } from "./validation";

export interface TrafficDay {
  date: string;
  label: string;
  precipIn: number;
}

export interface FieldTrafficabilityData {
  /** Overall field status */
  rating: "Passable" | "Caution" | "No-Go";
  /** One-line reason */
  reason: string;
  /** Past 7 days rainfall total in inches */
  totalRain7d: number;
  /** Yesterday's rainfall in inches */
  yesterdayRainIn: number;
  /** Current temperature in °F */
  tempF: number | null;
  /** Ground frozen (temp below 32°F) */
  groundFrozen: boolean;
  /** Daily breakdown for the past 7 days */
  history: TrafficDay[];
  /** Whether rain is expected in the next 24 hours */
  rainExpected: boolean;
  error?: string;
  updatedAt: string;
}

function mmToIn(mm: number): number {
  return Math.round((mm / 25.4) * 100) / 100;
}

function toF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  const diff = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 0 && diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function rateTrafficability(total7d: number, yesterday: number, tempF: number | null, rainExpected: boolean): { rating: FieldTrafficabilityData["rating"]; reason: string } {
  const frozen = tempF !== null && tempF <= 32;

  // Frozen ground overrides everything — equipment can travel even on wet ground
  if (frozen) {
    if (total7d > 2) return { rating: "Caution", reason: "Ground frozen but saturated — risk of rutting when it thaws" };
    return { rating: "Passable", reason: "Ground frozen — safe for equipment travel" };
  }

  // Heavy recent rain (yesterday)
  if (yesterday > 0.75) {
    return { rating: "No-Go", reason: `${yesterday}" rain yesterday — fields too soft for heavy equipment` };
  }

  // Rain expected soon
  if (rainExpected && total7d > 1) {
    return { rating: "Caution", reason: "More rain coming and fields already damp — wait if possible" };
  }

  // High 7-day total
  if (total7d > 3) {
    return { rating: "No-Go", reason: `${total7d}" rain in 7 days — fields are saturated, stay out` };
  }

  if (total7d > 1.5) {
    return { rating: "Caution", reason: `${total7d}" in the past week — use lighter equipment, watch for soft spots` };
  }

  if (total7d > 0.5) {
    return { rating: "Caution", reason: `${total7d}" recent rain — mostly passable but low spots may be soft` };
  }

  // Dry conditions
  if (total7d < 0.1) {
    return { rating: "Passable", reason: "Very dry — all fields should be firm and ready" };
  }

  return { rating: "Passable", reason: `${total7d}" recent rain — fields drying out, good to go` };
}

export async function fetchFieldTrafficability(): Promise<FieldTrafficabilityData> {
  const { lat, lon, timezone } = config.weather;

  // Fetch past 7 days daily precip + current temp + tomorrow's precip
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max&past_days=7&forecast_days=2&current=temperature_2m&timezone=${encodeURIComponent(timezone)}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Farm-Command/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { rating: "Caution", reason: "", totalRain7d: 0, yesterdayRainIn: 0, tempF: null, groundFrozen: false, history: [], rainExpected: false, error: "API unavailable", updatedAt: new Date().toISOString() };
    }

    const rawData = await response.json();

    if (!isValidObject(rawData) || !isValidObject(rawData.daily) || !isValidObject(rawData.current)) {
      return { rating: "Caution", reason: "", totalRain7d: 0, yesterdayRainIn: 0, tempF: null, groundFrozen: false, history: [], rainExpected: false, error: "Invalid response", updatedAt: new Date().toISOString() };
    }

    const daily = rawData.daily as Record<string, (number | string)[]>;
    const current = rawData.current as Record<string, number>;
    const times = (daily.time as string[]) || [];
    const precip = (daily.precipitation_sum as number[]) || [];
    const precipProb = (daily.precipitation_probability_max as number[]) || [];

    const tempF = isValidNumber(current.temperature_2m) ? toF(current.temperature_2m) : null;
    const groundFrozen = tempF !== null && tempF <= 32;
    const now = new Date();

    // Find today's index by matching the date string
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(now);
    let todayIdx = -1;
    for (let i = 0; i < times.length; i++) {
      if (times[i] === todayStr) { todayIdx = i; break; }
    }
    // Fallback: if today not found, assume second-to-last entry
    if (todayIdx === -1) todayIdx = Math.max(0, times.length - 2);

    const history: TrafficDay[] = [];
    let totalRain7d = 0;
    let yesterdayRainIn = 0;

    // Build history from past entries (everything before today)
    const historyEnd = Math.min(todayIdx, 7);
    const historyStart = Math.max(0, todayIdx - 7);
    for (let i = historyStart; i < historyEnd; i++) {
      const precipIn = isValidNumber(precip[i]) ? mmToIn(precip[i]) : 0;
      totalRain7d += precipIn;
      history.push({
        date: times[i],
        label: dayLabel(times[i]),
        precipIn,
      });
    }

    // Yesterday is the last entry in history
    if (history.length > 0) {
      yesterdayRainIn = history[history.length - 1].precipIn;
    }

    // Check tomorrow's rain probability (entry after today)
    const tomorrowIdx = todayIdx + 1 < times.length ? todayIdx + 1 : todayIdx;
    const tomorrowProb = isValidNumber(precipProb[tomorrowIdx]) ? precipProb[tomorrowIdx] : 0;
    const rainExpected = tomorrowProb >= 30;

    const { rating, reason } = rateTrafficability(totalRain7d, yesterdayRainIn, tempF, rainExpected);

    return {
      rating,
      reason,
      totalRain7d: Math.round(totalRain7d * 100) / 100,
      yesterdayRainIn,
      tempF,
      groundFrozen,
      history: history.reverse(), // Most recent first
      rainExpected,
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error("Field trafficability API error:", e);
    return { rating: "Caution", reason: "", totalRain7d: 0, yesterdayRainIn: 0, tempF: null, groundFrozen: false, history: [], rainExpected: false, error: "API unavailable", updatedAt: new Date().toISOString() };
  }
}
