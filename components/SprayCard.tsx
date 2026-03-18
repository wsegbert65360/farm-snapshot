import { SprayData } from "@/lib/types";

interface SprayCardProps {
  data: SprayData;
}

export default function SprayCard({ data }: SprayCardProps) {
  const isGo = data.status === "GO";
  const badgeClass = isGo ? "bg-green-500" : "bg-red-500";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Spray</h2>
        <span className="text-sm text-slate-400">
          {new Date(data.updatedAt).toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "numeric", day: "numeric" })}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={`flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold text-white ${badgeClass}`}
        >
          {data.status}
        </span>
        <div className="flex-1">
          <p className="text-base text-slate-900 font-medium">{data.reason}</p>
          <p className="text-sm text-slate-500">
            Wind: {data.windMph} mph {data.gustMph ? `| Gusts: ${data.gustMph}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
