import { WeatherData } from "@/lib/types";

interface WeatherCardProps {
  data: WeatherData;
}

export default function WeatherCard({ data }: WeatherCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Weather - {data.locationLabel}</h2>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <RainColumn label="12h" value={data.rain12h} />
        <RainColumn label="24h" value={data.rain24h} />
        <RainColumn label="72h" value={data.rain72h} />
      </div>
      <div className="border-t border-slate-100 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <WeatherRow label="Wind" value={data.windMph > 0 ? `${data.windMph} mph` : "--"} />
          <WeatherRow label="Gusts" value={data.gustMph ? `${data.gustMph} mph` : "--"} />
          <WeatherRow label="Temp" value={data.tempF ? `${data.tempF}°F` : "--"} />
          <WeatherRow
            label="Raining"
            value={data.isRainingNow ? "Yes" : "No"}
            valueClass={data.isRainingNow ? "text-blue-600 font-medium" : ""}
          />
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
        Data: {new Date(data.updatedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })}
      </p>
    </div>
  );
}

function RainColumn({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 uppercase">{label} Rain</p>
      <p className="text-xl font-bold text-slate-900">{value.toFixed(2)}</p>
      <p className="text-xs text-slate-400">inches</p>
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
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`text-slate-900 font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
