import { config } from "./config";
import { GrainData } from "./types";

interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        previousClose: number;
        symbol: string;
      };
    }>;
    error: null | string;
  };
}

const CORN_SYMBOL = "ZC=F";
const SOYBEANS_SYMBOL = "ZS=F";

async function fetchYahooQuote(symbol: string): Promise<{
  price: number;
  change: number;
} | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.log(`Yahoo fetch failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as YahooFinanceResponse;
    const result = data.chart?.result?.[0];

    if (!result?.meta) return null;

    const price = result.meta.regularMarketPrice / 100;
    const prevClose = result.meta.previousClose / 100;
    const change = price - prevClose;

    return { price, change };
  } catch (e) {
    console.log(`Yahoo fetch error:`, e);
    return null;
  }
}

export async function fetchGrainPrices(): Promise<GrainData> {
  const { sellThreshold } = config.grain;

  const [cornData, soybeansData] = await Promise.all([
    fetchYahooQuote(CORN_SYMBOL),
    fetchYahooQuote(SOYBEANS_SYMBOL),
  ]);

  if (!cornData || !soybeansData) {
    return {
      corn: {
        price: 0,
        change: 0,
        recommendation: "HOLD",
        reason: "API unavailable - check connection",
      },
      soybeans: {
        price: 0,
        change: 0,
        recommendation: "HOLD",
        reason: "API unavailable - check connection",
      },
      updatedAt: new Date().toISOString(),
    };
  }

  const cornRecommendation: "SELL" | "HOLD" = cornData.change <= sellThreshold ? "SELL" : "HOLD";
  const cornReason =
    cornRecommendation === "SELL"
      ? `Price fell by ${Math.abs(cornData.change).toFixed(2)} today`
      : cornData.change > 0
      ? "Price improved today"
      : "Price stable today";

  const soybeansRecommendation: "SELL" | "HOLD" = soybeansData.change <= sellThreshold ? "SELL" : "HOLD";
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
      recommendation: cornRecommendation,
      reason: cornReason,
    },
    soybeans: {
      price: soybeansData.price,
      change: soybeansData.change,
      recommendation: soybeansRecommendation,
      reason: soybeansReason,
    },
    updatedAt: new Date().toISOString(),
  };
}
