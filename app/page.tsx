import GrainCard from "@/components/GrainCard";
import WeatherCard from "@/components/WeatherCard";
import SprayCard from "@/components/SprayCard";
import { GrainData, WeatherData, SprayData } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function getGrainData(): Promise<GrainData> {
  try {
    const res = await fetch(`${API_URL}/api/grain`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch grain");
    return res.json();
  } catch {
    return {
      corn: { price: 0, change: 0, recommendation: "HOLD", reason: "Loading..." },
      soybeans: { price: 0, change: 0, recommendation: "HOLD", reason: "Loading..." },
      updatedAt: new Date().toISOString(),
    };
  }
}

async function getWeatherData(): Promise<WeatherData> {
  try {
    const res = await fetch(`${API_URL}/api/weather`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch weather");
    return res.json();
  } catch {
    return {
      locationLabel: "Loading...",
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

async function getSprayData(): Promise<SprayData> {
  try {
    const res = await fetch(`${API_URL}/api/spray`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch spray");
    return res.json();
  } catch {
    return {
      status: "WAIT",
      reason: "Loading...",
      windMph: 0,
      gustMph: null,
      thresholds: { maxWindMph: 10, maxGustMph: 15 },
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
