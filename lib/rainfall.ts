import { config } from "./config";
import { parseNumeric } from "./validation";

export async function fetchRainfall(): Promise<{
  rain1d: number | null;
  rain3d: number | null;
  rain7d: number | null;
  error?: string;
}> {
  const { apiUrl, fieldId } = config.rainfall;
  const { timezone } = config.weather;

  if (!fieldId) {
    // Rainfall field tracking is optional — return nulls without an error
    return {
      rain1d: null,
      rain3d: null,
      rain7d: null,
    };
  }

  const baseUrl = apiUrl.replace(/\/+$/, "");

  // Helper to format date in YYYY-MM-DD for the target timezone
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const today = new Date();
  const dateStr = formatDate(today);

  // Helper to get past date
  const getPastDateStr = (daysBack: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysBack);
    return formatDate(d);
  };

  const fetchRange = async (start: string, end?: string): Promise<number | null> => {
    const url = end 
      ? `${baseUrl}/rain?field_id=${fieldId}&start_date=${start}&end_date=${end}`
      : `${baseUrl}/rain?field_id=${fieldId}&date=${start}`;

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return null;
      const data = await response.json();
      return parseNumeric(data.rainfall);
    } catch (e) {
      console.error(`Error fetching rainfall for ${start}${end ? "-" + end : ""}:`, e);
      return null;
    }
  };

  try {
    const [rain1d, rain3d, rain7d] = await Promise.all([
      fetchRange(dateStr),
      fetchRange(getPastDateStr(2), dateStr),
      fetchRange(getPastDateStr(6), dateStr),
    ]);

    return { rain1d, rain3d, rain7d };
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
