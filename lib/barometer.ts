import { config } from "./config";
import { isValidNumber } from "./validation";

export interface BarometerData {
  /** Current pressure in inches of mercury */
  pressureInHg: number | null;
  /** Current pressure in hPa */
  pressureHpa: number | null;
  /** Trend over last 12 hours in hPa */
  trend: "Rising Fast" | "Rising" | "Steady" | "Falling" | "Falling Fast";
  /** Change in hPa over last 12 hours */
  changeHpa: number | null;
  /** Simple weather forecast based on pressure trend */
  forecast: string;
  error?: string;
  updatedAt: string;
}

function hpaToInHg(hpa: number): number {
  return Math.round(hpa * 0.02953 * 100) / 100;
}

function getTrend(changeHpa: number): BarometerData["trend"] {
  if (changeHpa > 5) return "Rising Fast";
  if (changeHpa > 1.5) return "Rising";
  if (changeHpa > -1.5) return "Steady";
  if (changeHpa > -5) return "Falling";
  return "Falling Fast";
}

function getForecast(trend: BarometerData["trend"], pressureInHg: number): string {
  // Classic barometric forecasting rules of thumb
  if (trend === "Falling Fast" || trend === "Falling") {
    if (pressureInHg < 29.8) return "Storm likely within 12-24 hrs";
    return "Weather change expected — rain possible";
  }
  if (trend === "Rising Fast" || trend === "Rising") {
    if (pressureInHg > 30.1) return "Fair, dry weather settling in";
    return "Improving conditions — clearing ahead";
  }
  // Steady
  if (pressureInHg > 30.0) return "Fair weather continues";
  if (pressureInHg > 29.6) return "Current conditions likely to hold";
  return "Unsettled — watch for changes";
}

export async function fetchBarometer(): Promise<BarometerData> {
  const { lat, lon, timezone } = config.weather;

  // Get 12 past hours + current to determine trend
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=surface_pressure&timezone=${encodeURIComponent(timezone)}&forecast_days=1&past_hours=12`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Farm-Command/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { pressureInHg: null, pressureHpa: null, trend: "Steady", changeHpa: null, forecast: "", error: "API unavailable", updatedAt: new Date().toISOString() };
    }

    const rawData: Record<string, unknown> = await response.json();
    const hourly = rawData.hourly as Record<string, unknown[]> | undefined;

    if (!hourly || !Array.isArray(hourly.time) || hourly.time.length < 2) {
      return { pressureInHg: null, pressureHpa: null, trend: "Steady", changeHpa: null, forecast: "", error: "Invalid response", updatedAt: new Date().toISOString() };
    }

    // Find the current hour index — don't just use the last element because
    // Open-Meteo returns the full 16-day forecast which has nulls at the end.
    const now = new Date();
    const currentHourStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}T${String(now.getHours()).padStart(2,"0")}:00`;
    let currentIdx = hourly.time.indexOf(currentHourStr);
    if (currentIdx === -1 || !isValidNumber(hourly.surface_pressure[currentIdx])) {
      // Fallback: walk backwards from the end to find last non-null
      currentIdx = hourly.surface_pressure.length - 1;
      while (currentIdx >= 0 && !isValidNumber(hourly.surface_pressure[currentIdx])) currentIdx--;
    }
    if (currentIdx < 0 || !isValidNumber(hourly.surface_pressure[currentIdx])) {
      return { pressureInHg: null, pressureHpa: null, trend: "Steady", changeHpa: null, forecast: "", error: "Invalid response", updatedAt: new Date().toISOString() };
    }

    const pressureHpa = hourly.surface_pressure[currentIdx] as number;
    const pressureInHg = hpaToInHg(pressureHpa);

    // Find index 12 hours back for trend calculation
    const pastHourStr = (() => {
      const d = new Date(now);
      d.setHours(d.getHours() - 12);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:00`;
    })();
    let pastIdx = hourly.time.indexOf(pastHourStr);
    if (pastIdx === -1) pastIdx = 0;

    const oldestHpa = hourly.surface_pressure[pastIdx];
    const changeHpa = isValidNumber(oldestHpa) ? Math.round((pressureHpa - (oldestHpa as number)) * 10) / 10 : null;

    const trend = changeHpa !== null ? getTrend(changeHpa) : "Steady";
    const forecast = getForecast(trend, pressureInHg);

    return { pressureInHg, pressureHpa, trend, changeHpa, forecast, updatedAt: new Date().toISOString() };
  } catch (e) {
    console.error("Barometer API error:", e);
    return { pressureInHg: null, pressureHpa: null, trend: "Steady", changeHpa: null, forecast: "", error: "API unavailable", updatedAt: new Date().toISOString() };
  }
}
