import { config } from "./config";
import { SprayData } from "./types";

const REASON_RAIN_DETECTED = "Rain detected";
const REASON_RAIN_EXPECTED = "Rain expected within 3 hours";
const REASON_WIND_TOO_HIGH = (max: number) => `Wind above ${max} mph`;
const REASON_GUST_TOO_HIGH = (max: number) => `Gusts above ${max} mph`;
const REASON_OK = "Conditions favorable for spraying";

export function calculateSprayDecision(weather: {
  windMph: number;
  gustMph: number | null;
  isRainingNow: boolean;
  rainPredicted: boolean | null;
}): SprayData {
  const { maxWindMph, maxGustMph, rainForecastHours } = config.spray;

  if (weather.isRainingNow) {
    return {
      status: "WAIT",
      reason: REASON_RAIN_DETECTED,
      windMph: weather.windMph,
      gustMph: weather.gustMph,
      thresholds: { maxWindMph, maxGustMph },
      updatedAt: new Date().toISOString(),
    };
  }

  if (weather.rainPredicted) {
    return {
      status: "WAIT",
      reason: `${REASON_RAIN_EXPECTED} (>${config.spray.rainThreshold}% chance)`,
      windMph: weather.windMph,
      gustMph: weather.gustMph,
      thresholds: { maxWindMph, maxGustMph },
      updatedAt: new Date().toISOString(),
    };
  }

  if (weather.windMph > maxWindMph) {
    return {
      status: "WAIT",
      reason: REASON_WIND_TOO_HIGH(maxWindMph),
      windMph: weather.windMph,
      gustMph: weather.gustMph,
      thresholds: { maxWindMph, maxGustMph },
      updatedAt: new Date().toISOString(),
    };
  }

  if (weather.gustMph !== null && weather.gustMph > maxGustMph) {
    return {
      status: "WAIT",
      reason: REASON_GUST_TOO_HIGH(maxGustMph),
      windMph: weather.windMph,
      gustMph: weather.gustMph,
      thresholds: { maxWindMph, maxGustMph },
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    status: "GO",
    reason: REASON_OK,
    windMph: weather.windMph,
    gustMph: weather.gustMph,
    thresholds: { maxWindMph, maxGustMph },
    updatedAt: new Date().toISOString(),
  };
}
