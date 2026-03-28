function parseValidatedFloat(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = parseFloat(value || "");
  if (isNaN(parsed) || parsed < min || parsed > max) {
    console.warn(`Invalid env var, using fallback: ${value} -> ${fallback}`);
    return fallback;
  }
  return parsed;
}

export const config = {
  weather: {
    lat: parseValidatedFloat(process.env.WEATHER_LAT, 38.4626783, -90, 90),
    lon: parseValidatedFloat(process.env.WEATHER_LON, -93.5373719, -180, 180),
    locationLabel: process.env.WEATHER_LOCATION_LABEL || "Windsor, MO",
    timezone: process.env.TIMEZONE || "America/Chicago",
  },
  spray: {
    maxWindMph: parseFloat(process.env.MAX_SPRAY_WIND_MPH || "10"),
    maxGustMph: parseFloat(process.env.MAX_SPRAY_GUST_MPH || "15"),
    rainThreshold: parseFloat(process.env.RAIN_THRESHOLD || "20"),
    rainForecastHours: parseInt(process.env.RAIN_FORECAST_HOURS || "3", 10),
  },
  grain: {
    priceDropThreshold: parseFloat(process.env.GRAIN_PRICE_DROP_THRESHOLD || "-0.03"),
    commoditiesApiKey: process.env.COMMODITIES_API_KEY || "",
  },
  rainfall: {
    apiUrl: process.env.RAINFALL_API_URL || "https://rain-api.vercel.app",
    fieldId: process.env.FIELD_ID || "",
  },
};
