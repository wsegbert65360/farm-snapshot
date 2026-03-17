import { NextResponse } from "next/server";
import { fetchCurrentWeather } from "@/lib/weather";
import { fetchRainfall } from "@/lib/rainfall";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [weather, rainfall] = await Promise.all([fetchCurrentWeather(), fetchRainfall()]);

    const data = {
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

    return NextResponse.json(data);
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch weather data",
        locationLabel: config.weather.locationLabel,
        rain12h: 0,
        rain24h: 0,
        rain72h: 0,
        windMph: 0,
        gustMph: null,
        tempF: null,
        isRainingNow: false,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
