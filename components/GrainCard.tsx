import { GrainData } from "@/lib/types";

interface GrainCardProps {
  data: GrainData;
}

export default function GrainCard({ data }: GrainCardProps) {
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
        />
        <div className="border-t border-slate-100 pt-2">
          <CommodityRow
            name="SOYBEANS"
            price={data.soybeans.price}
            change={data.soybeans.change}
            recommendation={data.soybeans.recommendation}
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
}

function CommodityRow({ name, price, change, recommendation }: CommodityRowProps) {
  const isUp = change > 0;
  const isDown = change < 0;
  const changeColor = isUp ? "text-green-500" : isDown ? "text-red-500" : "text-slate-500";
  const changeBg = isUp ? "bg-green-100" : isDown ? "bg-red-100" : "bg-slate-100";
  const formatChange = isUp ? `+${change.toFixed(2)}` : change.toFixed(2);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-700 text-base">{name}</span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${recommendation === "SELL" ? "bg-orange-500" : "bg-green-500"}`}>
          {recommendation}
        </span>
      </div>
      <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${changeBg}`}>
        <span className={`text-2xl font-bold ${changeColor}`}>
          {formatChange}
        </span>
        <span className="text-sm text-slate-500">
          ${price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
