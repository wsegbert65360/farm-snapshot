import { config } from "./config";

export async function fetchRainfall(): Promise<{
  rain1d: number | null;
  rain3d: number | null;
  rain7d: number | null;
  error?: string;
}> {
  const { apiUrl } = config.rainfall;
  const { lat, lon, timezone } = config.weather;

  if (!lat || !lon) {
    return { rain1d: null, rain3d: null, rain7d: null };
  }

  const baseUrl = apiUrl.replace(/\/+$/, "").replace(/[\r\n]/g, "");

  try {
    // Single API call: GET /rain?lat=X&lon=Y&days=7
    // Returns { rainfall, breakdown: { "YYYY-MM-DD": inches }, ... }
    const response = await fetch(
      `${baseUrl}/rain?lat=${lat}&lon=${lon}&days=7`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      console.error(`Rain API error: ${response.status}`);
      return { rain1d: null, rain3d: null, rain7d: null, error: "Rainfall service error" };
    }

    const data = await response.json();
    const breakdown: Record<string, number> = data.breakdown || {};
    const dates = Object.keys(breakdown).sort();

    if (dates.length === 0) {
      return { rain1d: 0, rain3d: 0, rain7d: 0 };
    }

    // Get today's date in the farm's timezone to exclude future forecast dates
    const todayStr = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    // Format from MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = todayStr.split("/");
    const todayYMD = `${year}-${month}-${day}`;

    // Filter to only include historical data (dates <= today)
    const historicalDates = dates.filter((d) => d <= todayYMD);

    // Aggregate from historical dates
    const rain1d = breakdown[todayYMD] ? Number(breakdown[todayYMD]) : 0;
    const rain3d = historicalDates.slice(-3).reduce((s, d) => s + (Number(breakdown[d]) || 0), 0);
    const rain7d = historicalDates.reduce((s, d) => s + (Number(breakdown[d]) || 0), 0);

    return {
      rain1d: Math.round(rain1d * 1000) / 1000,
      rain3d: Math.round(rain3d * 1000) / 1000,
      rain7d: Math.round(rain7d * 1000) / 1000,
    };
  } catch (error) {
    console.error("Rainfall integration error:", error);
    return {
      rain1d: null,
      rain3d: null,
      rain7d: null,
      error: "Rainfall service error",
    };
  }
}
