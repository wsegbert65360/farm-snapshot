import axios from "axios";
import { config } from "./config";
import { RainfallResponse } from "./types";

export async function fetchRainfall(): Promise<{
  rain12h: number;
  rain24h: number;
  rain72h: number;
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
      rain12h: 0.15,
      rain24h: 0.45,
      rain72h: 1.2,
    };
  }
}
