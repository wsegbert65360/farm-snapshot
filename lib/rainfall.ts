import axios from "axios";
import { config } from "./config";
import { RainfallResponse } from "./types";

export async function fetchRainfall(): Promise<{
  rain12h: number | null;
  rain24h: number | null;
  rain72h: number | null;
  error?: string;
}> {
  const { lat, lon, timezone } = config.weather;
  const url = `${config.rainfall.apiUrl}/api/rain?lat=${lat}&lon=${lon}&tz=${timezone}`;

  try {
    const response = await axios.get<RainfallResponse>(url, {
      timeout: 10000,
    });

    return {
      rain12h: response.data.rain["12h"],
      rain24h: response.data.rain["24h"],
      rain72h: response.data.rain["72h"],
    };
  } catch (error) {
    console.error("Rainfall fetch error:", error);
    return {
      rain12h: null,
      rain24h: null,
      rain72h: null,
      error: "Rainfall API unavailable",
    };
  }
}
