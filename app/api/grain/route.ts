import { NextResponse } from "next/server";
import { fetchGrainPrices } from "@/lib/grain";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchGrainPrices();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Grain API error:", error);
    return NextResponse.json(
      {
        corn: {
          price: 0,
          change: 0,
          changePercent: 0,
          recommendation: "HOLD",
          reason: "API unavailable - check connection",
        },
        soybeans: {
          price: 0,
          change: 0,
          changePercent: 0,
          recommendation: "HOLD",
          reason: "API unavailable - check connection",
        },
        updatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
