export interface GrainCommodity {
  price: number;
  change: number;
  changePercent: number;
  recommendation: "SELL" | "HOLD";
  reason: string;
}

export interface GrainData {
  corn: GrainCommodity;
  soybeans: GrainCommodity;
  updatedAt: string;
}

export interface WeatherData {
  locationLabel: string;
  rain1d: number | null;
  rain3d: number | null;
  rain7d: number | null;
  windMph: number | null;
  gustMph: number | null;
  tempF: number | null;
  isRainingNow: boolean;
  rainPredicted?: boolean;
  error?: string;
  updatedAt: string;
}

export interface SprayThresholds {
  maxWindMph: number;
  maxGustMph: number;
}

export interface SprayData {
  status: "GO" | "WAIT";
  reason: string;
  windMph: number;
  gustMph: number | null;
  thresholds: SprayThresholds;
  updatedAt: string;
}
