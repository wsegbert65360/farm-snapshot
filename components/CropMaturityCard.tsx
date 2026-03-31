interface CropMaturityCardProps {
  crops: {
    crop: string;
    emoji: string;
    stages: {
      gddStart: number;
      gddEnd: number;
      name: string;
      description: string;
      emoji: string;
    }[];
    currentStageIdx: number;
    accumulatedGDD: number;
    plantingDate: string;
    daysSincePlanting: number;
    gddToMaturity: number;
    gddRemaining: number;
    estDaysToMaturity: number | null;
    progressPct: number;
  }[];
  error?: string;
}

function progressColor(pct: number): string {
  if (pct >= 100) return "bg-green-500";
  if (pct >= 80) return "bg-green-400";
  if (pct >= 60) return "bg-lime-400";
  if (pct >= 40) return "bg-amber-300";
  if (pct >= 20) return "bg-yellow-300";
  return "bg-orange-300";
}

function progressBarBg(pct: number): string {
  if (pct >= 100) return "bg-green-100";
  return "bg-slate-100";
}

export default function CropMaturityCard({ crops, error }: CropMaturityCardProps) {
  if (error && crops.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Crop Maturity</h2>
        <p className="text-sm text-slate-400 text-center py-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-slate-900">Crop Maturity</h2>
        <span className="text-[10px] font-medium text-slate-400">Planted Apr 15 / May 10</span>
      </div>

      {/* Pre-season state: before any planting */}
      {crops.length === 1 && crops[0].crop === "Pre-Season" ? (
        <div className="text-center py-4">
          <p className="text-lg">📅</p>
          <p className="text-sm font-semibold text-slate-600">Pre-Season</p>
          <p className="text-xs text-slate-400 mt-1">Corn planted ~Apr 15 · Soybeans ~May 10</p>
        </div>
      ) : (
      <>
      {crops.map((crop) => {
        const stage = crop.stages[crop.currentStageIdx];
        const isMature = crop.accumulatedGDD >= crop.gddToMaturity;

        return (
          <div key={crop.crop} className="mb-3 last:mb-0">
            {/* Crop header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{crop.emoji}</span>
                <span className="text-xs font-bold text-slate-800">{crop.crop}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{crop.daysSincePlanting}d</span>
                {isMature && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-green-500">
                    MATURE
                  </span>
                )}
              </div>
            </div>

            {/* Current stage */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">{stage.emoji}</span>
              <span className="text-xs font-semibold text-slate-700">{stage.name}</span>
              <span className="text-[10px] text-slate-400">— {stage.description}</span>
            </div>

            {/* Progress bar */}
            <div className={`w-full h-2.5 rounded-full ${progressBarBg(crop.progressPct)} overflow-hidden mb-1`}>
              <div
                className={`h-full rounded-full transition-all ${progressColor(crop.progressPct)}`}
                style={{ width: `${Math.min(100, crop.progressPct)}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-1">
              <div className="text-center">
                <p className="text-[9px] text-slate-400">GDD</p>
                <p className="text-[11px] font-bold text-slate-700">
                  {crop.accumulatedGDD}<span className="text-[9px] font-normal text-slate-400">/{crop.gddToMaturity}</span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-400">REMAINING</p>
                <p className="text-[11px] font-bold text-slate-700">
                  {isMature ? "0" : `${crop.gddRemaining}`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-400">EST. DAYS</p>
                <p className="text-[11px] font-bold text-slate-700">
                  {isMature ? "Ready" : crop.estDaysToMaturity !== null ? `~${crop.estDaysToMaturity}` : "—"}
                </p>
              </div>
            </div>

            {/* Stage timeline (mini) */}
            <div className="flex items-center gap-[1px] mt-1.5">
              {crop.stages.map((s, i) => {
                const isComplete = i < crop.currentStageIdx;
                const isCurrent = i === crop.currentStageIdx;
                const isFinal = i === crop.stages.length - 1;

                return (
                  <div
                    key={s.name}
                    className={`flex-1 h-1.5 rounded-full transition-colors ${
                      isFinal
                        ? isComplete ? "bg-green-400" : "bg-green-100"
                        : isCurrent
                          ? "bg-blue-400"
                          : isComplete
                            ? "bg-blue-200"
                            : "bg-slate-100"
                    }`}
                    title={`${s.name}: ${s.gddStart}–${s.gddEnd < 99999 ? s.gddEnd : "∞"} GDD`}
                  />
                );
              })}
            </div>

            {/* Divider between crops */}
            {crop.crop === "Corn" && crops.length > 1 && (
              <div className="border-t border-slate-100 mt-3 pt-2" />
            )}
          </div>
        );
      })}
      </>
      )}
    </div>
  );
}
