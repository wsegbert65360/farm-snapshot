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
        error: "Failed to fetch grain data",
        corn: {
          price: 0,
          change: 0,
          recommendation: "HOLD",
          reason: "Data unavailable",
        },
        soybeans: {
          price: 0,
          change: 0,
          recommendation: "HOLD",
          reason: "Data unavailable",
        },
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
