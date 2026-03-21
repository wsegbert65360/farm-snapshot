import { config } from "./config";
import { GrainData } from "./types";
import { isValidNumber, isValidObject } from "./validation";

const COMMODITIES_API_BASE = "https://commodities-api.com/api/latest";
const METRIC_TON_TO_BUSHEL = {
  corn: 39.368,
  soybeans: 36.744,
} as const;

async function fetchCommodityPrice(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  reportDate: string;
} | null> {
  const apiKey = config.grain.commoditiesApiKey;
  if (!apiKey) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `${COMMODITIES_API_BASE}?access_key=${apiKey}&base=USD&symbols=${symbol}`,
      {
        cache: "no-store",
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const rawData = await response.json();
    
    if (!isValidObject(rawData) || !isValidObject(rawData.data) || !isValidObject(rawData.data.rates)) {
      return null;
    }
    
    const data = rawData as { data: { rates: Record<string, number> } };
    const pricePerMetricTon = data.data.rates[symbol];
    
    if (!isValidNumber(pricePerMetricTon)) {
      return null;
    }
    const conversionFactor = METRIC_TON_TO_BUSHEL[symbol as keyof typeof METRIC_TON_TO_BUSHEL];
    if (!conversionFactor) {
      return null;
    }
    const bushelPrice = pricePerMetricTon / conversionFactor;

    const yesterdayDate = getYesterdayDate();
    const yesterdayController = new AbortController();
    const yesterdayTimeoutId = setTimeout(() => yesterdayController.abort(), 10000);
    const yesterdayResponse = await fetch(
      `${COMMODITIES_API_BASE}?access_key=${apiKey}&base=USD&symbols=${symbol}&date=${yesterdayDate}`,
      {
        cache: "no-store",
        signal: yesterdayController.signal,
      }
    );
    clearTimeout(yesterdayTimeoutId);

    let change = 0;
    let changePercent = 0;

    if (yesterdayResponse.ok) {
      const yesterdayData = await yesterdayResponse.json();
      if (yesterdayData?.data?.rates?.[symbol]) {
        const yesterdayPricePerTon = yesterdayData.data.rates[symbol];
        const yesterdayPrice = yesterdayPricePerTon / conversionFactor;
        change = bushelPrice - yesterdayPrice;
        changePercent = yesterdayPrice > 0 ? (change / yesterdayPrice) * 100 : 0;
      }
    }

    return {
      price: Math.round(bushelPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      reportDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Grain API error:", error);
    return null;
  }
}

function getYesterdayDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

export async function fetchGrainPrices(): Promise<GrainData> {
  const { priceDropThreshold } = config.grain;

  const [cornData, soybeansData] = await Promise.all([
    fetchCommodityPrice("CORN"),
    fetchCommodityPrice("SOYBEANS"),
  ]);

  if (!cornData || !soybeansData) {
    return {
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
    };
  }

  const reportDate = cornData.reportDate;

  const cornRecommendation: "SELL" | "HOLD" = cornData.change <= priceDropThreshold ? "SELL" : "HOLD";
  const cornReason =
    cornRecommendation === "SELL"
      ? `Price fell by ${Math.abs(cornData.change).toFixed(2)} today`
      : cornData.change > 0
      ? "Price improved today"
      : "Price stable today";

  const soybeansRecommendation: "SELL" | "HOLD" = soybeansData.change <= priceDropThreshold ? "SELL" : "HOLD";
  const soybeansReason =
    soybeansRecommendation === "SELL"
      ? `Price fell by ${Math.abs(soybeansData.change).toFixed(2)} today`
      : soybeansData.change > 0
      ? "Price improved today"
      : "Price stable today";

  return {
    corn: {
      price: cornData.price,
      change: cornData.change,
      changePercent: cornData.changePercent,
      recommendation: cornRecommendation,
      reason: cornReason,
    },
    soybeans: {
      price: soybeansData.price,
      change: soybeansData.change,
      changePercent: soybeansData.changePercent,
      recommendation: soybeansRecommendation,
      reason: soybeansReason,
    },
    updatedAt: reportDate,
  };
}
