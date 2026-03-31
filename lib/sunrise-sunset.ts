import { config } from "./config";
import { isValidObject } from "./validation";

interface SunriseSunsetData {
  sunrise: string;
  sunset: string;
  daylightMinutes: number;
  error?: string;
  updatedAt: string;
}

export async function fetchSunriseSunset(): Promise<SunriseSunsetData> {
  const { lat, lon, timezone } = config.weather;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset,daylight_duration&timezone=${encodeURIComponent(timezone)}&forecast_days=1`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Farm-Command/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { sunrise: "--:--", sunset: "--:--", daylightMinutes: 0, error: "API unavailable", updatedAt: new Date().toISOString() };
    }

    const rawData: Record<string, unknown> = await response.json();
    const daily = rawData.daily as Record<string, unknown[]> | undefined;

    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      return { sunrise: "--:--", sunset: "--:--", daylightMinutes: 0, error: "Invalid response", updatedAt: new Date().toISOString() };
    }

    const sunriseRaw = daily.sunrise?.[0];
    const sunsetRaw = daily.sunset?.[0];
    const daylightSec = daily.daylight_duration?.[0];

    if (typeof sunriseRaw !== "string" || typeof sunsetRaw !== "string") {
      return { sunrise: "--:--", sunset: "--:--", daylightMinutes: 0, error: "Invalid response", updatedAt: new Date().toISOString() };
    }

    // Format ISO time to local h:mm AM/PM
    const formatTime = (iso: string) => {
      const date = new Date(iso);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
      });
    };

    const daylightMinutes = typeof daylightSec === "number" ? Math.round(daylightSec / 60) : 0;

    return {
      sunrise: formatTime(sunriseRaw),
      sunset: formatTime(sunsetRaw),
      daylightMinutes,
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error("Sunrise/sunset API error:", e);
    return { sunrise: "--:--", sunset: "--:--", daylightMinutes: 0, error: "API unavailable", updatedAt: new Date().toISOString() };
  }
}
