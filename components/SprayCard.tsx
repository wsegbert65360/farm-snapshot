import { SprayData } from "@/lib/types";
import { config } from "@/lib/config";

interface SprayCardProps {
  data: SprayData;
}

export default function SprayCard({ data }: SprayCardProps) {
  const isGo = data.status === "GO";
  const badgeClass = isGo ? "bg-green-500" : "bg-red-500";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-slate-900">Spray</h2>
        <span className="text-xs text-slate-400">
          {new Date(data.updatedAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: config.weather.timezone,
          })}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={`flex items-center justify-center w-14 h-14 rounded-full text-xl font-bold text-white ${badgeClass}`}
        >
          {data.status}
        </span>
        <div className="flex-1">
          <p className="text-base text-slate-900 font-medium">{data.reason}</p>
          <p className="text-sm text-slate-500">
            Wind: {data.windMph} mph {data.gustMph ? `| Gusts: ${data.gustMph} mph` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
