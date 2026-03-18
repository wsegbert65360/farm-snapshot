import { GrainData } from "@/lib/types";

interface GrainCardProps {
  data: GrainData;
}

export default function GrainCard({ data }: GrainCardProps) {
  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Grain</h2>
      <div className="space-y-4">
        <CommodityRow
          name="CORN"
          price={data.corn.price}
          change={data.corn.change}
          recommendation={data.corn.recommendation}
          reason={data.corn.reason}
          formatChange={formatChange}
        />
        <div className="border-t border-slate-100 pt-4">
          <CommodityRow
            name="SOYBEANS"
            price={data.soybeans.price}
            change={data.soybeans.change}
            recommendation={data.soybeans.recommendation}
            reason={data.soybeans.reason}
            formatChange={formatChange}
          />
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
        Data: {new Date(data.updatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })}
      </p>
    </div>
  );
}

interface CommodityRowProps {
  name: string;
  price: number;
  change: number;
  recommendation: "SELL" | "HOLD";
  reason: string;
  formatChange: (change: number) => string;
}

function CommodityRow({ name, price, change, recommendation, reason, formatChange }: CommodityRowProps) {
  const badgeClass = recommendation === "SELL" ? "bg-orange-500" : "bg-green-500";

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-700">{name}</span>
        <span className={`px-2 py-0.5 rounded text-white text-xs font-medium ${badgeClass}`}>
          {recommendation}, {formatChange(change)}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">${price.toFixed(2)}</span>
        <span className={`text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          {formatChange(change)}
        </span>
      </div>
      <p className="text-sm text-slate-500 mt-1">{reason}</p>
    </div>
  );
}
