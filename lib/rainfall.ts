import { config } from "./config";
import { RainfallResponse } from "./types";
import { isValidNumber, isValidObject } from "./validation";

export async function fetchRainfall(): Promise<{
  rain12h: number | null;
  rain24h: number | null;
  rain72h: number | null;
  error?: string;
}> {
  const { lat, lon, timezone } = config.weather;
  const url = `${config.rainfall.apiUrl}/api/rain?lat=${lat}&lon=${lon}&tz=${timezone}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        rain12h: null,
        rain24h: null,
        rain72h: null,
        error: "Rainfall API unavailable",
      };
    }

    const rawData = await response.json();
    
    if (!isValidObject(rawData) || !isValidObject(rawData.rain)) {
      return {
        rain12h: null,
        rain24h: null,
        rain72h: null,
        error: "Invalid rainfall response",
      };
    }
    
    const data = rawData as unknown as RainfallResponse;

    return {
      rain12h: isValidNumber(data.rain["12h"]) ? data.rain["12h"] : null,
      rain24h: isValidNumber(data.rain["24h"]) ? data.rain["24h"] : null,
      rain72h: isValidNumber(data.rain["72h"]) ? data.rain["72h"] : null,
    };
  } catch (error) {
    console.error("Rainfall API error:", error);
    return {
      rain12h: null,
      rain24h: null,
      rain72h: null,
      error: "Rainfall API unavailable",
    };
  }
}
