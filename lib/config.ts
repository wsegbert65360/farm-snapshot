export const config = {
  weather: {
    lat: parseFloat(process.env.WEATHER_LAT || "38.53"),
    lon: parseFloat(process.env.WEATHER_LON || "-93.52"),
    locationLabel: process.env.WEATHER_LOCATION_LABEL || "Windsor, MO",
    timezone: process.env.TIMEZONE || "America/Chicago",
  },
  spray: {
    maxWindMph: parseFloat(process.env.MAX_SPRAY_WIND_MPH || "10"),
    maxGustMph: parseFloat(process.env.MAX_SPRAY_GUST_MPH || "15"),
    rainThreshold: parseFloat(process.env.RAIN_THRESHOLD || "20"),
    rainForecastHours: parseFloat(process.env.RAIN_FORECAST_HOURS || "3"),
  },
  grain: {
    sellThreshold: parseFloat(process.env.GRAIN_SELL_THRESHOLD || "-0.03"),
  },
  rainfall: {
    apiUrl: process.env.RAINFALL_API_URL || "https://rain-api.vercel.app",
  },
};
