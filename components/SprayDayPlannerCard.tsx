import { config } from "@/lib/config";
import type { SprayDay } from "@/lib/spray-day-planner";

interface SprayDayPlannerCardProps {
  days: SprayDay[];
  goodDaysCount: number;
  totalDays: number;
  error?: string;
}

function goBg(rating: string): string {
  return rating === "GO"
    ? "bg-green-50 border-green-200"
    : "bg-red-50 border-red-200";
}

function goBadge(rating: string): string {
  return rating === "GO"
    ? "bg-green-500"
    : "bg-red-500";
}

function goText(rating: string): string {
  return rating === "GO" ? "GO" : "WAIT";
}

export default function SprayDayPlannerCard({ days, goodDaysCount, totalDays, error }: SprayDayPlannerCardProps) {
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Spray Planner</h2>
        <p className="text-sm text-slate-400 text-center py-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-slate-900">Spray Planner</h2>
        <span className="text-xs font-medium text-slate-500">
          {goodDaysCount}/{totalDays} days good
        </span>
      </div>

      {/* Day list */}
      <div className="space-y-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${goBg(day.rating)}`}
          >
            {/* GO/WAIT badge */}
            <span className={`flex-shrink-0 w-9 h-5 rounded text-[10px] font-bold text-white flex items-center justify-center ${goBadge(day.rating)}`}>
              {goText(day.rating)}
            </span>

            {/* Day label */}
            <span className="flex-shrink-0 w-10 text-xs font-semibold text-slate-700">
              {day.dayLabel}
            </span>

            {/* Wind + rain stats */}
            <div className="flex-1 flex items-center gap-2 min-w-0 text-[10px] text-slate-500">
              <span title="Max wind">💨{day.windMph}</span>
              <span title="Max gust">🌬{day.gustMph}</span>
              <span title="Rain chance">🌧{day.rainChance}%</span>
            </div>

            {/* Reason — truncate if needed */}
            <p className="flex-shrink-0 text-[10px] text-slate-500 max-w-[100px] truncate" title={day.reason}>
              {day.reason}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 mt-1.5 text-center">
        Based on wind &gt;{config.spray.maxWindMph}mph, gusts &gt;{config.spray.maxGustMph}mph, rain &gt;{config.spray.rainThreshold}%
      </p>
    </div>
  );
}
