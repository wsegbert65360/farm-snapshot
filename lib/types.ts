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
  rain12h: number | null;
  rain24h: number | null;
  rain72h: number | null;
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

export interface RainfallResponse {
  location: {
    type: string;
    lat: number;
    lon: number;
  };
  periodEndUtc: string;
  units: string;
  rain: {
    "12h": number;
    "24h": number;
    "72h": number;
  };
}
