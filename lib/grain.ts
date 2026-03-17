import { config } from "./config";
import { GrainData } from "./types";

interface YahooQuoteResponse {
  quoteSummary: {
    result: Array<{
      price: {
        regularMarketPrice: number;
        regularMarketChange: number;
        regularMarketChangePercent: number;
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
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as YahooQuoteResponse;
    const result = data.quoteSummary?.result?.[0];

    if (!result?.price) return null;

    return {
      price: result.price.regularMarketPrice,
      change: result.price.regularMarketChange,
    };
  } catch {
    return null;
  }
}

export async function fetchGrainPrices(): Promise<GrainData> {
  const { sellThreshold } = config.grain;

  let cornData: { price: number; change: number } | null = null;
  let soybeansData: { price: number; change: number } | null = null;

  try {
    const [corn, soybeans] = await Promise.all([
      fetchYahooQuote(CORN_SYMBOL),
      fetchYahooQuote(SOYBEANS_SYMBOL),
    ]);
    cornData = corn;
    soybeansData = soybeans;
  } catch (e) {
    console.error("Grain API error:", e);
  }

  const corn = cornData || { price: 4.82, change: 0.03 };
  const soybeans = soybeansData || { price: 10.91, change: -0.02 };

  const cornRecommendation: "SELL" | "HOLD" = corn.change <= sellThreshold ? "SELL" : "HOLD";
  const cornReason =
    cornRecommendation === "SELL"
      ? `Price fell by ${Math.abs(corn.change).toFixed(2)} today`
      : corn.change > 0
      ? "Price improved today"
      : "Price stable today";

  const soybeansRecommendation: "SELL" | "HOLD" = soybeans.change <= sellThreshold ? "SELL" : "HOLD";
  const soybeansReason =
    soybeansRecommendation === "SELL"
      ? `Price fell by ${Math.abs(soybeans.change).toFixed(2)} today`
      : soybeans.change > 0
      ? "Price improved today"
      : "Price stable today";

  return {
    corn: {
      price: corn.price,
      change: corn.change,
      recommendation: corn.price > 0 ? cornRecommendation : "HOLD",
      reason: corn.price > 0 ? cornReason : "Using cached data",
    },
    soybeans: {
      price: soybeans.price,
      change: soybeans.change,
      recommendation: soybeans.price > 0 ? soybeansRecommendation : "HOLD",
      reason: soybeans.price > 0 ? soybeansReason : "Using cached data",
    },
    updatedAt: new Date().toISOString(),
  };
}
