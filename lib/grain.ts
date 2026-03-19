import { config } from "./config";
import { GrainData } from "./types";

const CORN_SYMBOL = "ZC=F";
const SOYBEANS_SYMBOL = "ZS=F";

async function fetchYahooQuote(symbol: string): Promise<{
  price: number;
  change: number;
  reportDate: string;
} | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    const timestamps = result?.timestamp || [];

    if (!meta || !meta.regularMarketPrice) {
      return null;
    }

    const rawPrice = meta.regularMarketPrice;
    let price = rawPrice;
    
    if (rawPrice > 100) {
      price = rawPrice / 100;
    }
    
    let change = 0;
    let reportDate = new Date().toISOString();
    
    if (timestamps.length >= 2) {
      const currentPrice = meta.regularMarketPrice;
      const prevTimestamp = timestamps[timestamps.length - 2];
      const prevResult = result?.indicators?.quote?.[0];
      
      if (prevResult && prevResult.close && prevResult.close.length >= 2) {
        const prevPriceRaw = prevResult.close[prevResult.close.length - 2];
        let prevPrice = prevPriceRaw;
        if (prevPriceRaw > 100) {
          prevPrice = prevPriceRaw / 100;
        }
        change = price - prevPrice;
        reportDate = new Date(prevTimestamp * 1000).toISOString();
      }
    }

    if (change === 0 && meta.previousClose) {
      let prevClose = meta.previousClose;
      if (prevClose > 100) {
        prevClose = prevClose / 100;
      }
      change = price - prevClose;
    }

    return { price, change, reportDate };
  } catch {
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

  const reportDate = cornData.reportDate;

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
    updatedAt: reportDate,
  };
}
