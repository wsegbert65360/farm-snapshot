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

export interface ForecastDay {
  date: string;           // YYYY-MM-DD
  dayLabel: string;       // "Mon", "Tue", etc.
  highF: number;          // High temp in °F
  lowF: number;           // Low temp in °F
  rainChance: number;     // Max precipitation probability 0-100
  rainMm: number;         // Total precipitation in mm
  windMph: number;        // Max wind speed in mph
  weatherCode: number;    // WMO weather code
}

export interface ForecastData {
  days: ForecastDay[];
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

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  snippet: string;
}

export interface NewsData {
  articles: NewsArticle[];
  updatedAt: string;
}
