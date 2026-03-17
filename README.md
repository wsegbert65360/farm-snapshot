# Farm Command

Daily farm snapshot with grain prices, weather/rainfall, and spray decisions.

## Features

- **Grain**: Corn and soybean prices with SELL/HOLD recommendations (Yahoo Finance)
- **Weather**: Current conditions from US National Weather Service
- **Rainfall**: 12h/24h/72h totals from existing Rain API
- **Spray**: GO/WAIT decision based on wind and gust thresholds

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- US National Weather Service API (weather)
- Yahoo Finance API (grain)
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
| `WEATHER_LAT` | Latitude for weather | 38.53 |
| `WEATHER_LON` | Longitude for weather | -93.52 |
| `WEATHER_LOCATION_LABEL` | Display name | "Windsor, MO" |
| `TIMEZONE` | Timezone for rainfall | America/Chicago |
| `MAX_SPRAY_WIND_MPH` | Max wind for spray | 10 |
| `MAX_SPRAY_GUST_MPH` | Max gust for spray | 15 |
| `GRAIN_SELL_THRESHOLD` | Price drop threshold for SELL | -0.03 |
| `RAINFALL_API_URL` | URL for rainfall API | https://rain-api.vercel.app |

## Deployment to Vercel

1. Deploy via Vercel CLI:
   ```bash
   npm i -g vercel
   vercel
   ```

2. Or connect your GitHub repo to Vercel

3. Add environment variables in Vercel dashboard:
   - Copy `.env.example` values
   - Add `NEXT_PUBLIC_API_URL` = your-production-url

## API Endpoints

- `GET /api/grain` - Grain prices and recommendations
- `GET /api/weather` - Weather + rainfall data
- `GET /api/spray` - Spray GO/WAIT decision

## Data Sources

| Service | API | API Key Required? |
|---------|-----|------------------|
| Weather | US National Weather Service (api.weather.gov) | No |
| Rainfall | rain-api.vercel.app | No |
| Grain | Yahoo Finance | No |
