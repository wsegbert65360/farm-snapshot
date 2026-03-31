import { config } from "@/lib/config";

interface RadarCardProps {
  mapTiles: string[];
  radarTiles: string[];
  frameTime: number;
  markerX: number;
  markerY: number;
  error?: string;
}

function CompassRose() {
  return (
    <div className="absolute top-1.5 left-1.5 z-20">
      <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
        <div className="relative w-full h-full">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white leading-none">N</span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[7px] text-white/60 leading-none">S</span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[7px] text-white/60 leading-none">W</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[7px] text-white/60 leading-none">E</span>
          {/* North arrow */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-red-400" />
        </div>
      </div>
    </div>
  );
}

function ScaleBar() {
  // At zoom 7, each tile covers ~55 miles. The 2x2 grid is ~110 miles across.
  // A 25% width bar ≈ 27.5 miles. Show as ~25 mile scale.
  return (
    <div className="absolute bottom-1.5 left-1.5 z-20 flex flex-col items-start">
      <div className="w-12 h-[2px] bg-white/80 border-t border-b border-white/40 relative">
        <div className="absolute left-0 top-[-3px] w-[2px] h-2 bg-white/80" />
        <div className="absolute right-0 top-[-3px] w-[2px] h-2 bg-white/80" />
      </div>
      <span className="text-[8px] text-white/90 font-medium mt-0.5 drop-shadow">~25 mi</span>
    </div>
  );
}

function RadarLegend() {
  return (
    <div className="absolute bottom-1.5 right-1.5 z-20">
      <div className="bg-black/40 backdrop-blur-sm rounded px-1.5 py-1 border border-white/10">
        <div className="flex gap-0.5 items-center">
          <div className="flex gap-[1px]">
            <div className="w-2.5 h-2 rounded-sm" style={{ backgroundColor: "#00e600" }} title="Light" />
            <div className="w-2.5 h-2 rounded-sm" style={{ backgroundColor: "#009900" }} title="Moderate" />
            <div className="w-2.5 h-2 rounded-sm" style={{ backgroundColor: "#ffff00" }} title="Heavy" />
            <div className="w-2.5 h-2 rounded-sm" style={{ backgroundColor: "#cc0000" }} title="Very Heavy" />
            <div className="w-2.5 h-2 rounded-sm" style={{ backgroundColor: "#660099" }} title="Extreme" />
          </div>
        </div>
        <p className="text-[7px] text-white/70 mt-0.5 text-center">Rain</p>
      </div>
    </div>
  );
}

export default function RadarCard({ mapTiles, radarTiles, frameTime, markerX, markerY, error }: RadarCardProps) {
  if (error || mapTiles.length === 0) {
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
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-slate-200">
        {/* Layer 1: Map base (CartoDB Positron — roads, state lines, cities) */}
        <div className="absolute inset-0 grid grid-cols-2">
          {mapTiles.map((url, i) => (
            <img
              key={`map-${i}`}
              src={url}
              alt=""
              className="w-full h-full block"
              loading="eager"
            />
          ))}
        </div>

        {/* Layer 2: Radar overlay (transparent, shows precipitation) */}
        <div className="absolute inset-0 grid grid-cols-2">
          {radarTiles.map((url, i) => (
            <img
              key={`radar-${i}`}
              src={url}
              alt={`Radar tile ${i + 1}`}
              className="w-full h-full block"
              loading="eager"
            />
          ))}
        </div>

        {/* Compass rose */}
        <CompassRose />

        {/* Scale bar */}
        <ScaleBar />

        {/* Radar color legend */}
        <RadarLegend />

        {/* Farm center marker */}
        <div
          className="absolute z-10"
          style={{ left: `${markerX}%`, top: `${markerY}%`, transform: "translate(-50%, -50%)" }}
        >
          {/* Outer pulse ring */}
          <div className="absolute -top-[6px] -left-[6px] w-5 h-5 rounded-full bg-red-500/25 animate-ping" />
          {/* Shadow ring */}
          <div className="absolute -top-[2px] -left-[2px] w-3 h-3 rounded-full bg-black/30" />
          {/* Inner solid dot */}
          <div className="relative w-2.5 h-2.5 rounded-full bg-red-500 border-[1.5px] border-white" />
          {/* Farm label */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 whitespace-nowrap">
            <span className="text-[9px] font-bold text-white bg-black/65 px-1.5 py-[1px] rounded leading-none shadow">
              FARM
            </span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 text-center">
        ~150 mi radius &middot; CartoDB + RainViewer
      </p>
    </div>
  );
}
