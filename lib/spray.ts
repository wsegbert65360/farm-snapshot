import { config } from "./config";
import { SprayData } from "./types";

export function calculateSprayDecision(weather: {
  windMph: number;
  gustMph: number | null;
  isRainingNow: boolean;
  rainPredicted: boolean | null;
}): SprayData {
  const { maxWindMph, maxGustMph } = config.spray;

  if (weather.isRainingNow) {
    return {
      status: "WAIT",
      reason: "Rain detected",
      windMph: weather.windMph,
      gustMph: weather.gustMph,
      thresholds: { maxWindMph, maxGustMph },
      updatedAt: new Date().toISOString(),
    };
  }

  if (weather.rainPredicted) {
    return {
      status: "WAIT",
      reason: "Rain expected within 3 hours",
      windMph: weather.windMph,
      gustMph: weather.gustMph,
      thresholds: { maxWindMph, maxGustMph },
      updatedAt: new Date().toISOString(),
    };
  }

  if (weather.windMph > maxWindMph) {
    return {
      status: "WAIT",
      reason: `Wind above ${maxWindMph} mph`,
      windMph: weather.windMph,
      gustMph: weather.gustMph,
      thresholds: { maxWindMph, maxGustMph },
      updatedAt: new Date().toISOString(),
    };
  }

  if (weather.gustMph !== null && weather.gustMph > maxGustMph) {
    return {
      status: "WAIT",
      reason: `Gusts above ${maxGustMph} mph`,
      windMph: weather.windMph,
      gustMph: weather.gustMph,
      thresholds: { maxWindMph, maxGustMph },
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    status: "GO",
    reason: "Wind acceptable",
    windMph: weather.windMph,
    gustMph: weather.gustMph,
    thresholds: { maxWindMph, maxGustMph },
    updatedAt: new Date().toISOString(),
  };
}
