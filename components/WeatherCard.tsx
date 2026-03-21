import { WeatherData } from "@/lib/types";

interface WeatherCardProps {
  data: WeatherData;
}

export default function WeatherCard({ data }: WeatherCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-slate-900">Weather</h2>
        <span className="text-xs text-slate-400">
          {new Date(data.updatedAt).toLocaleDateString("en-US", { timeZone: "America/Chicago", month: "numeric", day: "numeric" })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="text-center bg-blue-50 rounded-lg p-2">
          <p className="text-xs text-slate-500">TEMP</p>
          <p className="text-3xl font-bold text-blue-600">{data.tempF ? `${data.tempF}°` : "--"}</p>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <RainColumn label="12h" value={data.rain12h} />
          <RainColumn label="24h" value={data.rain24h} />
          <RainColumn label="72h" value={data.rain72h} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 text-sm">
        <WeatherRow label="Wind" value={data.windMph !== null ? `${data.windMph} mph` : "--"} />
        <WeatherRow label="Gusts" value={data.gustMph ? `${data.gustMph}` : "--"} />
        <WeatherRow
          label="Rain"
          value={data.isRainingNow ? "Yes" : "No"}
          valueClass={data.isRainingNow ? "text-blue-600 font-medium" : ""}
        />
      </div>
    </div>
  );
}

function RainColumn({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-base font-bold text-slate-900">{value !== null ? `${value.toFixed(2)}"` : "--"}</p>
    </div>
  );
}

function WeatherRow({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="text-center">
      <span className="text-slate-400 text-xs">{label}</span>
      <p className={`text-slate-900 font-medium text-sm ${valueClass}`}>{value}</p>
    </div>
  );
}
