import { config } from "./config";
import { isValidNumber, isValidObject } from "./validation";

export interface CropStage {
  /** GDD threshold where this stage begins */
  gddStart: number;
  /** GDD threshold where this stage ends (next stage begins) */
  gddEnd: number;
  /** Short stage name */
  name: string;
  /** Description of what's happening */
  description: string;
  /** Emoji for visual display */
  emoji: string;
}

export interface CropProgress {
  /** Crop name */
  crop: string;
  /** Emoji */
  emoji: string;
  /** All growth stages for this crop */
  stages: CropStage[];
  /** Current stage index */
  currentStageIdx: number;
  /** Accumulated GDD for this crop */
  accumulatedGDD: number;
  /** Planting date (YYYY-MM-DD) */
  plantingDate: string;
  /** Days since planting */
  daysSincePlanting: number;
  /** GDD needed to reach maturity */
  gddToMaturity: number;
  /** GDD remaining until maturity */
  gddRemaining: number;
  /** Estimated days to maturity based on 7-day avg GDD */
  estDaysToMaturity: number | null;
  /** Percent progress toward maturity */
  progressPct: number;
}

export interface CropMaturityData {
  crops: CropProgress[];
  error?: string;
  updatedAt: string;
}

// Corn growth stages (based on Iowa State/extension GDD benchmarks)
const CORN_STAGES: CropStage[] = [
  { gddStart: 0,    gddEnd: 100,  name: "Emergence",     description: "Seedling emerging from soil",           emoji: "🌱" },
  { gddStart: 100,  gddEnd: 325,  name: "Vegetative",    description: "Leaf development (V1-V12)",            emoji: "🌿" },
  { gddStart: 325,  gddEnd: 700,  name: "Rapid Growth",  description: "Stalk elongation, rapid canopy",       emoji: "🪴" },
  { gddStart: 700,  gddEnd: 1100, name: "Tasseling",     description: "Tassel and silk emergence",            emoji: "🌽" },
  { gddStart: 1100, gddEnd: 1400, name: "Grain Fill",    description: "Kernel development (R1-R4)",           emoji: "🌽" },
  { gddStart: 1400, gddEnd: 1800, name: "Dent/Maturity", description: "Dent stage, black layer approaching",  emoji: "🌾" },
  { gddStart: 1800, gddEnd: 99999, name: "Mature",        description: "Physiological maturity — ready for harvest", emoji: "✅" },
];

// Soybean growth stages
const SOY_STAGES: CropStage[] = [
  { gddStart: 0,   gddEnd: 80,   name: "Emergence",     description: "Seedling emerging from soil",           emoji: "🌱" },
  { gddStart: 80,  gddEnd: 250,  name: "Vegetative",    description: "Leaf development (V1-V5)",             emoji: "🌿" },
  { gddStart: 250, gddEnd: 550,  name: "Flowering",     description: "R1-R2 blooming begins",                emoji: "🌸" },
  { gddStart: 550, gddEnd: 900,  name: "Pod Fill",      description: "R3-R5 pod development",                emoji: "🫛" },
  { gddStart: 900,  gddEnd: 1200, name: "Seed Fill",     description: "R5-R6 seed enlargement",               emoji: "🫘" },
  { gddStart: 1200, gddEnd: 1700, name: "Maturation",    description: "R7-R8 leaf drop, pod color change",   emoji: "🌾" },
  { gddStart: 1700, gddEnd: 99999, name: "Mature",        description: "Physiological maturity — ready for harvest", emoji: "✅" },
];

const CORN_GDD_TO_MATURE = 1800;
const SOY_GDD_TO_MATURE = 1700;

interface OpenMeteoDailyResponse {
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
  };
}

function toF(c: number): number {
  return (c * 9) / 5 + 32;
}

function calcGDD(maxF: number, minF: number, base: number): number {
  const cappedMax = Math.min(maxF, 86);
  const cappedMin = Math.max(minF, base);
  return Math.max(0, Math.round(((cappedMax + cappedMin) / 2 - base) * 10) / 10);
}

function findCurrentStage(gdd: number, stages: CropStage[]): number {
  for (let i = stages.length - 1; i >= 0; i--) {
    if (gdd >= stages[i].gddStart) return i;
  }
  return 0;
}

function buildCropProgress(
  crop: string,
  emoji: string,
  stages: CropStage[],
  gddToMature: number,
  accumulatedGDD: number,
  plantingDate: string,
  avgDailyGDD: number
): CropProgress {
  const currentStageIdx = findCurrentStage(accumulatedGDD, stages);
  const gddRemaining = Math.max(0, gddToMature - accumulatedGDD);
  const isMature = accumulatedGDD >= gddToMature;
  const progressPct = Math.min(100, Math.round((accumulatedGDD / gddToMature) * 100));
  const estDaysToMaturity = isMature ? 0 : (avgDailyGDD > 0 ? Math.ceil(gddRemaining / avgDailyGDD) : null);

  return {
    crop,
    emoji,
    stages,
    currentStageIdx,
    accumulatedGDD: Math.round(accumulatedGDD),
    plantingDate,
    daysSincePlanting: 0, // will be set later
    gddToMaturity: gddToMature,
    gddRemaining: Math.round(gddRemaining),
    estDaysToMaturity,
    progressPct,
  };
}

export async function fetchCropMaturity(): Promise<CropMaturityData> {
  const { lat, lon, timezone } = config.weather;

  const now = new Date();

  // Determine planting dates: Apr 15 for corn, May 10 for soybeans (central MO typical)
  const year = now.getFullYear();
  const cornPlantDate = `${year}-04-15`;
  const soyPlantDate = `${year}-05-10`;

  // Calculate how many past days to fetch (from April 1)
  const apr1 = new Date(`${year}-04-01T12:00:00`);
  const diffDays = Math.max(1, Math.ceil((now.getTime() - apr1.getTime()) / (1000 * 60 * 60 * 24)));
  const pastDays = diffDays + 1;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(timezone)}&forecast_days=1&past_days=${pastDays}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Farm-Command/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { crops: [], error: "API unavailable", updatedAt: new Date().toISOString() };
    }

    const rawData: Record<string, unknown> = await response.json();
    const daily = rawData.daily as OpenMeteoDailyResponse["daily"] | undefined;

    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      return { crops: [], error: "Invalid response", updatedAt: new Date().toISOString() };
    }

    // Calculate GDD for every day since each planting date
    let cornGDD = 0;
    let soyGDD = 0;
    let weekGDDTotal = 0;
    const last7 = daily.time.slice(-7);

    for (let i = 0; i < daily.time.length; i++) {
      const maxC = daily.temperature_2m_max[i];
      const minC = daily.temperature_2m_min[i];
      if (!isValidNumber(maxC) || !isValidNumber(minC)) continue;

      const gdd = calcGDD(toF(maxC), toF(minC), 50);

      if (daily.time[i] >= cornPlantDate) cornGDD += gdd;
      if (daily.time[i] >= soyPlantDate) soyGDD += gdd;
    }

    // Calculate 7-day average daily GDD
    for (let i = 0; i < last7.length; i++) {
      const idx = daily.time.indexOf(last7[i]);
      if (idx >= 0 && isValidNumber(daily.temperature_2m_max[idx]) && isValidNumber(daily.temperature_2m_min[idx])) {
        weekGDDTotal += calcGDD(toF(daily.temperature_2m_max[idx]!), toF(daily.temperature_2m_min[idx]!), 50);
      }
    }
    const avgDailyGDD = weekGDDTotal / 7;

    const cornDays = Math.max(0, Math.ceil((now.getTime() - new Date(cornPlantDate + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24)));
    const soyDays = Math.max(0, Math.ceil((now.getTime() - new Date(soyPlantDate + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24)));

    const cornProgress = buildCropProgress("Corn", "🌽", CORN_STAGES, CORN_GDD_TO_MATURE, cornGDD, cornPlantDate, avgDailyGDD);
    cornProgress.daysSincePlanting = cornDays;

    const soyProgress = buildCropProgress("Soybeans", "🫘", SOY_STAGES, SOY_GDD_TO_MATURE, soyGDD, soyPlantDate, avgDailyGDD);
    soyProgress.daysSincePlanting = soyDays;

    return {
      crops: [cornProgress, soyProgress],
      updatedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.error("Crop maturity API error:", e);
    return { crops: [], error: "API unavailable", updatedAt: new Date().toISOString() };
  }
}
