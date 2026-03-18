import { SprayData } from "@/lib/types";

interface SprayCardProps {
  data: SprayData;
}

export default function SprayCard({ data }: SprayCardProps) {
  const isGo = data.status === "GO";
  const badgeClass = isGo ? "bg-green-500" : "bg-red-500";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Spray Decision</h2>
      <div className="flex items-center gap-4 mb-4">
        <span
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-3xl font-bold text-white ${badgeClass}`}
        >
          {data.status}
        </span>
        <div>
          <p className="text-slate-900 font-medium">{data.reason}</p>
          <p className="text-sm text-slate-500 mt-1">
            Wind: {data.windMph} mph {data.gustMph ? `| Gusts: ${data.gustMph} mph` : ""}
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-4 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>Max Wind: {data.thresholds.maxWindMph} mph</span>
          <span>Max Gust: {data.thresholds.maxGustMph} mph</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
        Data: {new Date(data.updatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })}
      </p>
    </div>
  );
}
