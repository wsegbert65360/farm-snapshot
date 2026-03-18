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
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-slate-900">Grain</h2>
        <span className="text-xs text-slate-400">
          {new Date(data.updatedAt).toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "numeric", day: "numeric" })}
        </span>
      </div>
      <div className="space-y-2">
        <CommodityRow
          name="CORN"
          price={data.corn.price}
          change={data.corn.change}
          recommendation={data.corn.recommendation}
          formatChange={formatChange}
        />
        <div className="border-t border-slate-100 pt-2">
          <CommodityRow
            name="SOYBEANS"
            price={data.soybeans.price}
            change={data.soybeans.change}
            recommendation={data.soybeans.recommendation}
            formatChange={formatChange}
          />
        </div>
      </div>
    </div>
  );
}

interface CommodityRowProps {
  name: string;
  price: number;
  change: number;
  recommendation: "SELL" | "HOLD";
  formatChange: (change: number) => string;
}

function CommodityRow({ name, price, change, recommendation, formatChange }: CommodityRowProps) {
  const badgeClass = recommendation === "SELL" ? "bg-orange-500" : "bg-green-500";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-700 text-sm">{name}</span>
        <span className={`px-1.5 py-0.5 rounded text-white text-xs font-medium ${badgeClass}`}>
          {recommendation}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-slate-900">${price.toFixed(2)}</span>
        <span className={`text-xs ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
          {formatChange(change)}
        </span>
      </div>
    </div>
  );
}
