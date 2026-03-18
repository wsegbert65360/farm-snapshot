import GrainCard from "@/components/GrainCard";
import WeatherCard from "@/components/WeatherCard";
import SprayCard from "@/components/SprayCard";
import { fetchGrainPrices } from "@/lib/grain";
import { fetchCurrentWeather } from "@/lib/weather";
import { fetchRainfall } from "@/lib/rainfall";
import { calculateSprayDecision } from "@/lib/spray";
import { config } from "@/lib/config";

export const revalidate = 900;

type WeatherData = Awaited<ReturnType<typeof fetchCurrentWeather>>;

async function getWeatherData(weather: WeatherData) {
  const rainfall = await fetchRainfall();
  
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
    rainPredicted: weather.rainPredicted ?? false,
    error: hasError ? "Data unavailable" : undefined,
    updatedAt: new Date().toISOString(),
  };
}

function getSprayData(weather: WeatherData) {
  if (weather.error || weather.windMph === null) {
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
  const weather = await fetchCurrentWeather();
  
  const [grainData, weatherData, sprayData] = await Promise.all([
    fetchGrainPrices(),
    getWeatherData(weather),
    Promise.resolve(getSprayData(weather)),
  ]);

  const hasAnyError = grainData.corn.reason.includes("unavailable") || 
                      weatherData.error || 
                      sprayData.reason.includes("unavailable");

  if (hasAnyError) {
    return (
      <main className="space-y-2">
        <GrainCard data={grainData} />
        <WeatherCard data={weatherData} />
        <SprayCard data={sprayData} />
        <p className="text-center text-xs text-red-500">
          ⚠️ Check API connections
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-2">
      <GrainCard data={grainData} />
      <WeatherCard data={weatherData} />
      <SprayCard data={sprayData} />
    </main>
  );
}
