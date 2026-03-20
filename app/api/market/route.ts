import { NextResponse } from "next/server";
import axios from "axios";
import { config } from "@/lib/config";

const COMMODITIES_API_BASE = "https://commodities-api.com/api/latest";
const METRIC_TON_TO_BUSHEL = {
  corn: 39.368,
  soybeans: 36.744,
  wheat: 36.744,
};

async function fetchCommodityPrice(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
} | null> {
  const apiKey = config.grain.commoditiesApiKey;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await axios.get(
      `${COMMODITIES_API_BASE}?access_key=${apiKey}&base=USD&symbols=${symbol}`,
      { timeout: 10000 }
    );

    const data = response.data;
    if (!data?.data?.rates?.[symbol]) {
      return null;
    }

    const pricePerMetricTon = data.data.rates[symbol];
    const bushelPrice = pricePerMetricTon / METRIC_TON_TO_BUSHEL[symbol as keyof typeof METRIC_TON_TO_BUSHEL];

    const yesterdayResponse = await axios.get(
      `${COMMODITIES_API_BASE}?access_key=${apiKey}&base=USD&symbols=${symbol}&date=${getYesterdayDate()}`,
      { timeout: 10000 }
    );

    let change = 0;
    let changePercent = 0;

    const yesterdayData = yesterdayResponse.data;
    if (yesterdayData?.data?.rates?.[symbol]) {
      const yesterdayPricePerTon = yesterdayData.data.rates[symbol];
      const yesterdayPrice = yesterdayPricePerTon / METRIC_TON_TO_BUSHEL[symbol as keyof typeof METRIC_TON_TO_BUSHEL];
      change = bushelPrice - yesterdayPrice;
      changePercent = (change / yesterdayPrice) * 100;
    }

    return {
      price: Math.round(bushelPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

function getYesterdayDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = config.grain.commoditiesApiKey;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "API key not configured",
        corn: { price: 0, change: 0, changePercent: 0, recommendation: "HOLD", reason: "API not configured" },
        soybeans: { price: 0, change: 0, changePercent: 0, recommendation: "HOLD", reason: "API not configured" },
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  try {
    const [cornData, soybeansData] = await Promise.all([
      fetchCommodityPrice("CORN"),
      fetchCommodityPrice("SOYBEANS"),
    ]);

    const { sellThreshold } = config.grain;

    const getRecommendation = (change: number): "SELL" | "HOLD" => {
      return change <= sellThreshold ? "SELL" : "HOLD";
    };

    const getReason = (change: number, recommendation: "SELL" | "HOLD"): string => {
      if (recommendation === "SELL") {
        return `Price dropped ${Math.abs(change).toFixed(2)} today`;
      }
      return change > 0 ? "Price improved today" : "Price stable today";
    };

    const result = {
      corn: cornData
        ? {
            price: cornData.price,
            change: cornData.change,
            changePercent: cornData.changePercent,
            recommendation: getRecommendation(cornData.change),
            reason: getReason(cornData.change, getRecommendation(cornData.change)),
          }
        : {
            price: 0,
            change: 0,
            changePercent: 0,
            recommendation: "HOLD" as const,
            reason: "Data unavailable",
          },
      soybeans: soybeansData
        ? {
            price: soybeansData.price,
            change: soybeansData.change,
            changePercent: soybeansData.changePercent,
            recommendation: getRecommendation(soybeansData.change),
            reason: getReason(soybeansData.change, getRecommendation(soybeansData.change)),
          }
        : {
            price: 0,
            change: 0,
            changePercent: 0,
            recommendation: "HOLD" as const,
            reason: "Data unavailable",
          },
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch market data",
        corn: { price: 0, change: 0, changePercent: 0, recommendation: "HOLD", reason: "Request failed" },
        soybeans: { price: 0, change: 0, changePercent: 0, recommendation: "HOLD", reason: "Request failed" },
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
