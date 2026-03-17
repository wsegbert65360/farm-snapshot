import GrainCard from "@/components/GrainCard";
import WeatherCard from "@/components/WeatherCard";
import SprayCard from "@/components/SprayCard";
import { fetchGrainPrices } from "@/lib/grain";
import { fetchCurrentWeather } from "@/lib/weather";
import { fetchRainfall } from "@/lib/rainfall";
import { calculateSprayDecision } from "@/lib/spray";
import { config } from "@/lib/config";

async function getGrainData() {
  try {
    return await fetchGrainPrices();
  } catch {
    return {
      corn: { price: 0, change: 0, recommendation: "HOLD" as const, reason: "Loading..." },
      soybeans: { price: 0, change: 0, recommendation: "HOLD" as const, reason: "Loading..." },
      updatedAt: new Date().toISOString(),
    };
  }
}

async function getWeatherData() {
  try {
    const [weather, rainfall] = await Promise.all([
      fetchCurrentWeather(),
      fetchRainfall(),
    ]);
    return {
      locationLabel: config.weather.locationLabel,
      rain12h: rainfall.rain12h,
      rain24h: rainfall.rain24h,
      rain72h: rainfall.rain72h,
      windMph: weather.windMph,
      gustMph: weather.gustMph,
      tempF: weather.tempF,
      isRainingNow: weather.isRainingNow,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      locationLabel: config.weather.locationLabel,
      rain12h: 0,
      rain24h: 0,
      rain72h: 0,
      windMph: 0,
      gustMph: null,
      tempF: null,
      isRainingNow: false,
      updatedAt: new Date().toISOString(),
    };
  }
}

async function getSprayData() {
  try {
    const weather = await fetchCurrentWeather();
    return calculateSprayDecision(weather);
  } catch {
    return {
      status: "WAIT" as const,
      reason: "Loading...",
      windMph: 0,
      gustMph: null,
      thresholds: config.spray,
      updatedAt: new Date().toISOString(),
    };
  }
}

export default async function Home() {
  const [grainData, weatherData, sprayData] = await Promise.all([
    getGrainData(),
    getWeatherData(),
    getSprayData(),
  ]);

  const lastUpdated = new Date(
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
      <p className="text-center text-sm text-slate-400">Last updated: {lastUpdated}</p>
    </main>
  );
}
