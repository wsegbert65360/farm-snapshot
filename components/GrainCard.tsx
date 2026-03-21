"use client";

import { useState, useEffect, useCallback } from "react";
import { GrainData } from "@/lib/types";

interface MarketData {
  corn: {
    price: number;
    change: number;
    changePercent: number;
    recommendation: "SELL" | "HOLD";
    reason: string;
  };
  soybeans: {
    price: number;
    change: number;
    changePercent: number;
    recommendation: "SELL" | "HOLD";
    reason: string;
  };
  updatedAt: string;
  error?: string;
}

export default function GrainCard() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/grain");
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-slate-900">Grain</h2>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="animate-pulse text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-slate-900">Grain</h2>
        </div>
        <div className="text-center py-4">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button
            onClick={fetchMarketData}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isMarketUp = data.corn.change > 0 || data.soybeans.change > 0;
  const isMarketDown = data.corn.change < 0 || data.soybeans.change < 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">Grain</h2>
          <MarketStatusIndicator isUp={isMarketUp} isDown={isMarketDown} />
        </div>
        {lastUpdated && (
          <span className="text-xs text-slate-400">
            Updated {new Date(lastUpdated).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })}
          </span>
        )}
      </div>
      <div className="space-y-2">
        <CommodityRow
          name="CORN"
          price={data.corn.price}
          change={data.corn.change}
          changePercent={data.corn.changePercent}
          recommendation={data.corn.recommendation}
        />
        <div className="border-t border-slate-100 pt-2">
          <CommodityRow
            name="SOYBEANS"
            price={data.soybeans.price}
            change={data.soybeans.change}
            changePercent={data.soybeans.changePercent}
            recommendation={data.soybeans.recommendation}
          />
        </div>
      </div>
      {error && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <button
            onClick={fetchMarketData}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

interface MarketStatusIndicatorProps {
  isUp: boolean;
  isDown: boolean;
}

function MarketStatusIndicator({ isUp, isDown }: MarketStatusIndicatorProps) {
  if (!isUp && !isDown) return null;
  
  return (
    <span
      className={`w-2 h-2 rounded-full ${isUp ? "bg-green-500" : "bg-red-500"}`}
      title={isUp ? "Market Up" : "Market Down"}
    />
  );
}

interface CommodityRowProps {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  recommendation: "SELL" | "HOLD";
}

function CommodityRow({ name, price, change, changePercent, recommendation }: CommodityRowProps) {
  const isUp = change > 0;
  const isDown = change < 0;
  const changeBg = isUp ? "bg-green-100" : isDown ? "bg-red-100" : "bg-slate-100";
  const formatChange = isUp ? `+${change.toFixed(2)}` : change.toFixed(2);
  const formatPercent = isUp ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-700 text-base">{name}</span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${recommendation === "SELL" ? "bg-orange-500" : "bg-green-500"}`}>
          {recommendation}
        </span>
      </div>
      <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${changeBg}`}>
        <span className="text-sm text-slate-500">${price.toFixed(2)}</span>
        <span className={`text-2xl font-bold ${isUp ? "text-green-600" : isDown ? "text-red-600" : "text-slate-500"}`}>
          {formatChange}
        </span>
        <span className={`text-xs ${isUp ? "text-green-600" : isDown ? "text-red-600" : "text-slate-500"}`}>
          ({formatPercent})
        </span>
      </div>
    </div>
  );
}
