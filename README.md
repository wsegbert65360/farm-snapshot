# Farm Command

Daily farm snapshot with grain prices, weather/rainfall, and spray decisions.

## Features

- **Grain**: Corn and soybean prices with SELL/HOLD recommendations (Commodities-API.com)
- **Weather**: Current conditions from Open-Meteo API
- **Rainfall**: 1d/3d/7d totals from existing Rain API
- **Spray**: GO/WAIT decision based on wind, gusts, rain status, and rain forecast

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Open-Meteo API (weather)
- Commodities-API.com (grain prices)
- Rain API (rainfall totals)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and configure:
   ```bash
   cp .env.example .env.local
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `WEATHER_LAT` | Latitude for weather | 38.4626783 |
| `WEATHER_LON` | Longitude for weather | -93.5373719 |
| `WEATHER_LOCATION_LABEL` | Display name | "Windsor, MO" |
| `TIMEZONE` | Timezone for display and rainfall | America/Chicago |
| `MAX_SPRAY_WIND_MPH` | Max wind speed for spray GO | 10 |
| `MAX_SPRAY_GUST_MPH` | Max gust speed for spray GO | 15 |
| `RAIN_THRESHOLD` | Precipitation probability threshold (%) | 20 |
| `RAIN_FORECAST_HOURS` | Hours to check rain forecast | 3 |
| `GRAIN_PRICE_DROP_THRESHOLD` | Price drop threshold for SELL recommendation | -0.03 |
| `COMMODITIES_API_KEY` | API key for Commodities-API.com | (required for grain prices) |
| `RAINFALL_API_URL` | URL for rainfall API | https://rain-api.vercel.app |
| `FIELD_ID` | Field ID for rainfall API | (required for rainfall data) |

## Deployment to Vercel

1. Deploy via Vercel CLI:
   ```bash
   npm i -g vercel
   vercel
   ```

2. Or connect your GitHub repo to Vercel

3. Add environment variables in Vercel dashboard:
   - Copy `.env.example` values
   - Add `COMMODITIES_API_KEY` and `FIELD_ID`
   - Add `NEXT_PUBLIC_API_URL` = your-production-url

## API Endpoints

- `GET /api/grain` - Grain prices and recommendations
- `GET /api/weather` - Weather + rainfall data
- `GET /api/spray` - Spray GO/WAIT decision

## Data Sources

| Service | API | API Key Required? |
|---------|-----|------------------|
| Weather | Open-Meteo (api.open-meteo.com) | No |
| Rainfall | rain-api.vercel.app | Requires `FIELD_ID` |
| Grain | Commodities-API.com | Yes (`COMMODITIES_API_KEY`) |
