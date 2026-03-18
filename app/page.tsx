import GrainCard from "@/components/GrainCard";
import WeatherCard from "@/components/WeatherCard";
import SprayCard from "@/components/SprayCard";
import { fetchGrainPrices } from "@/lib/grain";
import { fetchCurrentWeather } from "@/lib/weather";
import { fetchRainfall } from "@/lib/rainfall";
import { calculateSprayDecision } from "@/lib/spray";
import { config } from "@/lib/config";

async function getGrainData() {
  const data = await fetchGrainPrices();
  return data;
}

async function getWeatherData() {
  const [weather, rainfall] = await Promise.all([
    fetchCurrentWeather(),
    fetchRainfall(),
  ]);
  
  const hasError = weather.error || rainfall.error;
  
  return {
    locationLabel: config.weather.locationLabel,
    rain12h: rainfall.rain12h ?? 0,
    rain24h: rainfall.rain24h ?? 0,
    rain72h: rainfall.rain72h ?? 0,
    windMph: weather.windMph ?? 0,
    gustMph: weather.gustMph,
    tempF: weather.tempF,
    isRainingNow: weather.isRainingNow ?? false,
    error: hasError ? "Data unavailable" : undefined,
    updatedAt: new Date().toISOString(),
  };
}

async function getSprayData() {
  const weather = await fetchCurrentWeather();
  
  if (weather.error) {
    return {
      status: "WAIT" as const,
      reason: "Weather data unavailable",
      windMph: 0,
      gustMph: null,
      thresholds: config.spray,
      updatedAt: new Date().toISOString(),
    };
  }
  
  return calculateSprayDecision(weather);
}

export default async function Home() {
  const [grainData, weatherData, sprayData] = await Promise.all([
    getGrainData(),
    getWeatherData(),
    getSprayData(),
  ]);

  const hasAnyError = grainData.corn.reason.includes("unavailable") || 
                      weatherData.error || 
                      sprayData.reason.includes("unavailable");

  const lastUpdated = hasAnyError 
    ? "Error - data unavailable" 
    : new Date(
        Math.max(
          new Date(grainData.updatedAt).getTime(),
          new Date(weatherData.updatedAt).getTime(),
          new Date(sprayData.updatedAt).getTime()
        )
      ).toLocaleString();

  return (
    <main className="space-y-6">
      <GrainCard data={grainData} />
      <WeatherCard data={weatherData} />
      <SprayCard data={sprayData} />
      <p className={`text-center text-sm ${hasAnyError ? "text-red-500" : "text-slate-400"}`}>
        {hasAnyError ? "⚠️ Some data unavailable - check API connections" : `Last updated: ${lastUpdated}`}
      </p>
    </main>
  );
}
