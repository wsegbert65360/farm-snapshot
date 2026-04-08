import { config } from "./config";
import { GrainData } from "./types";
import { isValidNumber, isValidObject } from "./validation";

const YAHOO_FINANCE_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

// Cents per bushel — Yahoo returns corn in cents/bushel, soybeans in cents/bushel
const SYMBOLS = {
  corn: "ZC=F",     // CBOT Corn Futures
  soybeans: "ZS=F", // CBOT Soybean Futures
} as const;

async function fetchFuturesPrice(symbol: string): Promise<{
  price: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
} | null> {
  try {
    const url = `${YAHOO_FINANCE_BASE}/${symbol}?interval=1d&range=2d`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Farm-Command/1.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`Yahoo Finance returned ${response.status} for ${symbol}`);
      return null;
    }

    const rawData: Record<string, unknown> = await response.json();

    const chart = rawData.chart as Record<string, unknown> | undefined;
    const results = chart?.result as Record<string, unknown>[] | undefined;
    if (!isValidObject(rawData) || !results?.[0] || !isValidObject(results[0].meta)) {
      console.error(`Invalid Yahoo Finance response for ${symbol}`);
      return null;
    }

    const meta = results[0].meta as Record<string, unknown>;
    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose;

    if (!isValidNumber(price) || !isValidNumber(previousClose)) {
      console.error(`Missing price data for ${symbol}`);
      return null;
    }

    return {
      price: price as number,
      previousClose: previousClose as number,
      dayHigh: isValidNumber(meta.regularMarketDayHigh) ? (meta.regularMarketDayHigh as number) : (price as number),
      dayLow: isValidNumber(meta.regularMarketDayLow) ? (meta.regularMarketDayLow as number) : (price as number),
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

export async function fetchGrainPrices(): Promise<GrainData> {
  const { priceDropThreshold } = config.grain;

  console.log("[Grain] Starting grain price fetch...");

  const [cornData, soybeansData] = await Promise.all([
    fetchFuturesPrice(SYMBOLS.corn),
    fetchFuturesPrice(SYMBOLS.soybeans),
  ]);

  console.log("[Grain] Corn data:", cornData ? "received" : "null");
  console.log("[Grain] Soybeans data:", soybeansData ? "received" : "null");

  if (!cornData || !soybeansData) {
    console.error("[Grain] Missing data - corn:", cornData, "soybeans:", soybeansData);
    return {
      corn: {
        price: 0,
        change: 0,
        changePercent: 0,
        recommendation: "HOLD",
        reason: "API unavailable — check connection",
      },
      soybeans: {
        price: 0,
        change: 0,
        changePercent: 0,
        recommendation: "HOLD",
        reason: "API unavailable — check connection",
      },
      updatedAt: new Date().toISOString(),
    };
  }

  console.log("[Grain] Successfully fetched both commodities");

  // Corn: Yahoo returns cents per bushel — convert to $/bushel
  const cornPrice = cornData.price / 100;
  const cornPrev = cornData.previousClose / 100;
  const cornChange = Math.round((cornPrice - cornPrev) * 100) / 100;
  const cornChangePercent = cornPrev > 0
    ? Math.round((cornChange / cornPrev) * 10000) / 100
    : 0;

  const cornRecommendation: "SELL" | "HOLD" = cornChange <= priceDropThreshold ? "SELL" : "HOLD";
  const cornReason =
    cornRecommendation === "SELL"
      ? `Price fell by ${Math.abs(cornChange).toFixed(2)} today`
      : cornChange > 0
      ? "Price improved today"
      : "Price stable today";

  // Soybeans: Yahoo returns cents per bushel — convert to $/bushel
  const soyPrice = soybeansData.price / 100;
  const soyPrev = soybeansData.previousClose / 100;
  const soyChange = Math.round((soyPrice - soyPrev) * 100) / 100;
  const soyChangePercent = soyPrev > 0
    ? Math.round((soyChange / soyPrev) * 10000) / 100
    : 0;

  const soyRecommendation: "SELL" | "HOLD" = soyChange <= priceDropThreshold ? "SELL" : "HOLD";
  const soyReason =
    soyRecommendation === "SELL"
      ? `Price fell by ${Math.abs(soyChange).toFixed(2)} today`
      : soyChange > 0
      ? "Price improved today"
      : "Price stable today";

  return {
    corn: {
      price: cornPrice,
      change: cornChange,
      changePercent: cornChangePercent,
      recommendation: cornRecommendation,
      reason: cornReason,
    },
    soybeans: {
      price: soyPrice,
      change: soyChange,
      changePercent: soyChangePercent,
      recommendation: soyRecommendation,
      reason: soyReason,
    },
    updatedAt: new Date().toISOString(),
  };
}
