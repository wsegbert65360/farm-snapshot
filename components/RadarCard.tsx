import { config } from "@/lib/config";

interface RadarCardProps {
  tiles: string[];
  frameTime: number;
  error?: string;
}

export default function RadarCard({ tiles, frameTime, error }: RadarCardProps) {
  if (error || tiles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Weather Radar</h2>
        <div className="flex items-center justify-center py-8 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-400">{error || "Radar unavailable"}</p>
        </div>
      </div>
    );
  }

  // Format radar frame time for display
  const frameDate = new Date(frameTime * 1000);
  const timeStr = frameDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: config.weather.timezone,
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-slate-900">Weather Radar</h2>
        <span className="text-xs text-slate-400">
          {timeStr}
        </span>
      </div>
      <div className="grid grid-cols-2 w-full aspect-square rounded-lg overflow-hidden border border-slate-100">
        {tiles.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Radar tile ${i + 1}`}
            className="w-full h-full block"
            loading="eager"
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 text-center">
        ~150 mi radius &middot; RainViewer
      </p>
    </div>
  );
}
