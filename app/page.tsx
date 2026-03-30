import GrainCard from "@/components/GrainCard";
import WeatherCard from "@/components/WeatherCard";
import SprayCard from "@/components/SprayCard";
import { fetchCurrentWeather } from "@/lib/weather";
import { fetchRainfall } from "@/lib/rainfall";
import { calculateSprayDecision } from "@/lib/spray";
import { fetchGrainPrices } from "@/lib/grain";
import { config } from "@/lib/config";

export const revalidate = 900;

type WeatherData = Awaited<ReturnType<typeof fetchCurrentWeather>>;

async function getWeatherData(weather: WeatherData) {
  const rainfall = await fetchRainfall();
  
  const hasError = weather.error || rainfall.error;
  
  return {
    locationLabel: config.weather.locationLabel,
    rain1d: rainfall.rain1d,
    rain3d: rainfall.rain3d,
    rain7d: rainfall.rain7d,
    windMph: weather.windMph,
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
      thresholds: { maxWindMph: config.spray.maxWindMph, maxGustMph: config.spray.maxGustMph },
      updatedAt: new Date().toISOString(),
    };
  }
  
  return calculateSprayDecision({
    windMph: weather.windMph,
    gustMph: weather.gustMph,
    isRainingNow: weather.isRainingNow ?? false,
    rainPredicted: weather.rainPredicted ?? false,
  });
}

export default async function Home() {
  const [weather, grainData] = await Promise.all([
    fetchCurrentWeather(),
    fetchGrainPrices(),
  ]);
  
  const [weatherData, sprayData] = await Promise.all([
    getWeatherData(weather),
    Promise.resolve(getSprayData(weather)),
  ]);

  const hasAnyError = weatherData.error || sprayData.reason.includes("unavailable");

  return (
    <main className="space-y-2">
      <GrainCard data={grainData} />
      <WeatherCard data={weatherData} />
      <SprayCard data={sprayData} />
      {hasAnyError && (
        <p className="text-center text-xs text-red-500">
          Check API connections
        </p>
      )}
    </main>
  );
}
