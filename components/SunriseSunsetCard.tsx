import { config } from "@/lib/config";

interface SunriseSunsetCardProps {
  sunrise: string;
  sunset: string;
  daylightMinutes: number;
  error?: string;
}

export default function SunriseSunsetCard({ sunrise, sunset, daylightMinutes, error }: SunriseSunsetCardProps) {
  const hours = Math.floor(daylightMinutes / 60);
  const mins = daylightMinutes % 60;

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Daylight</h2>
        <p className="text-sm text-slate-400 text-center py-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Daylight</h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-amber-50 rounded-lg p-2">
          <p className="text-xs text-slate-500">RISE</p>
          <p className="text-lg font-bold text-amber-600">{sunrise}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-2">
          <p className="text-xs text-slate-500">SET</p>
          <p className="text-lg font-bold text-orange-600">{sunset}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-xs text-slate-500">DAY</p>
          <p className="text-lg font-bold text-slate-900">{hours}h {mins}m</p>
        </div>
      </div>
    </div>
  );
}
