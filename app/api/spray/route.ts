import { NextResponse } from "next/server";
import { fetchCurrentWeather } from "@/lib/weather";
import { calculateSprayDecision } from "@/lib/spray";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const weather = await fetchCurrentWeather();
    const data = calculateSprayDecision(weather);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Spray API error:", error);
    const { maxWindMph, maxGustMph } = config.spray;
    return NextResponse.json(
      {
        error: "Failed to calculate spray decision",
        status: "WAIT",
        reason: "Data unavailable",
        windMph: 0,
        gustMph: null,
        thresholds: { maxWindMph, maxGustMph },
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
