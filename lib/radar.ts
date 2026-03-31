import { config } from "./config";

interface RainViewerFrame {
  time: number;
  path: string;
}

interface RainViewerResponse {
  host: string;
  radar: {
    past: RainViewerFrame[];
    nowcast: RainViewerFrame[];
  };
}

function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const latRad = lat * Math.PI / 180;
  const y = Math.floor(
    (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, zoom)
  );
  return { x, y };
}

export interface RadarData {
  tiles: string[];
  frameTime: number;
  /** Percentage (0-100) for marker left/top position within the 2x2 grid */
  markerX: number;
  markerY: number;
  error?: string;
}

export async function fetchRadar(): Promise<RadarData> {
  const { lat, lon } = config.weather;

  try {
    const response = await fetch("https://api.rainviewer.com/public/weather-maps.json", {
      headers: { "User-Agent": "Farm-Command/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { tiles: [], frameTime: 0, markerX: 50, markerY: 50, error: "Radar unavailable" };
    }

    const data: RainViewerResponse = await response.json();

    const pastFrames = data.radar?.past || [];
    if (pastFrames.length === 0) {
      return { tiles: [], frameTime: 0, markerX: 50, markerY: 50, error: "No radar data available" };
    }

    // Use the most recent past radar frame
    const latestFrame = pastFrames[pastFrames.length - 1];

    // Zoom 7 + 2x2 tile grid covers ~150 miles radius centered on the farm
    const zoom = 7;
    const center = latLonToTile(lat, lon, zoom);

    // Build the base path from the frame (remove trailing slash if any)
    const basePath = latestFrame.path.replace(/\/$/, "");
    const host = (data.host || "https://tilecache.rainviewer.com").replace(/\/$/, "");

    // 2x2 grid: top-left to bottom-right, ordered for CSS grid-cols-2
    const offsets = [
      { dx: -1, dy: -1 }, // top-left
      { dx: 0, dy: -1 },  // top-right
      { dx: -1, dy: 0 },  // bottom-left
      { dx: 0, dy: 0 },   // bottom-right
    ];

    // RainViewer tile URL: {host}/{path}/{size}/{z}/{x}/{y}/{color_scheme}/{smooth}_{snow}.png
    const tiles = offsets.map(({ dx, dy }) => {
      return `${host}${basePath}/256/${zoom}/${center.x + dx}/${center.y + dy}/6/1_1.png`;
    });

    // Calculate exact sub-tile position for the farm marker
    // The 2x2 grid covers tiles from (center.x-1, center.y-1) to (center.x, center.y)
    // Map the fractional tile position into a 0-100% range within the grid
    const latRad = lat * Math.PI / 180;
    const fracX = ((lon + 180) / 360 * Math.pow(2, zoom)) - (center.x - 1);
    const fracY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, zoom)) - (center.y - 1);
    const markerX = (fracX / 2) * 100; // divide by 2 because grid is 2 tiles wide
    const markerY = (fracY / 2) * 100;

    return { tiles, frameTime: latestFrame.time, markerX, markerY };
  } catch (e) {
    console.error("Radar API error:", e);
    return { tiles: [], frameTime: 0, markerX: 50, markerY: 50, error: "Radar unavailable" };
  }
}
