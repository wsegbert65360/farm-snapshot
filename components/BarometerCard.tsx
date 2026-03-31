interface BarometerCardProps {
  pressureInHg: number | null;
  trend: string;
  changeHpa: number | null;
  forecast: string;
  error?: string;
}

function trendArrow(trend: string): string {
  switch (trend) {
    case "Rising Fast": return "⬆⬆";
    case "Rising": return "⬆";
    case "Steady": return "▶";
    case "Falling": return "⬇";
    case "Falling Fast": return "⬇⬇";
    default: return "▶";
  }
}

function trendColor(trend: string): string {
  switch (trend) {
    case "Rising Fast": return "text-blue-600";
    case "Rising": return "text-blue-500";
    case "Steady": return "text-slate-500";
    case "Falling": return "text-orange-500";
    case "Falling Fast": return "text-red-600";
    default: return "text-slate-400";
  }
}

function forecastColor(forecast: string): string {
  if (forecast.includes("Storm")) return "bg-red-50 text-red-700 border-red-100";
  if (forecast.includes("rain") || forecast.includes("change") || forecast.includes("Unsettled")) return "bg-amber-50 text-amber-700 border-amber-100";
  if (forecast.includes("Improving") || forecast.includes("clearing")) return "bg-sky-50 text-sky-700 border-sky-100";
  return "bg-green-50 text-green-700 border-green-100";
}

export default function BarometerCard({ pressureInHg, trend, changeHpa, forecast, error }: BarometerCardProps) {
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Barometer</h2>
        <p className="text-sm text-slate-400 text-center py-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-slate-900">Barometer</h2>
        <span className="text-[10px] text-slate-400">12-hr trend</span>
      </div>

      {/* Pressure reading + trend */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 bg-slate-50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-slate-500">PRESSURE</p>
          <p className="text-2xl font-bold text-slate-900">
            {pressureInHg !== null ? `${pressureInHg}` : "--"}
          </p>
          <p className="text-[10px] text-slate-400">inHg</p>
        </div>
        <div className="text-center flex-shrink-0 w-16">
          <p className={`text-2xl ${trendColor(trend)}`}>{trendArrow(trend)}</p>
          <p className={`text-xs font-semibold ${trendColor(trend)}`}>{trend}</p>
          {changeHpa !== null && (
            <p className="text-[10px] text-slate-400">
              {changeHpa > 0 ? "+" : ""}{changeHpa} hPa
            </p>
          )}
        </div>
      </div>

      {/* Forecast */}
      <div className={`rounded-lg px-3 py-2 border ${forecastColor(forecast)}`}>
        <p className="text-xs font-medium">{forecast}</p>
      </div>
    </div>
  );
}
