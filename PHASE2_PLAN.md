# Farm Command - Phase 2 Planning

## Current State (Phase 1 Complete ✓)
- Single-page dashboard with Grain, Weather, Spray cards
- Weather from NWS API (no API key)
- Rainfall from existing rain-api.vercel.app
- Mock grain data
- Spray GO/WAIT based on wind thresholds

---

## Phase 2 Suggestions

### 1. Real Grain Data
**Priority: High**

Options:
- **Yahoo Finance API** - Free, no key, futures data
- **Tiingo** - Free tier with API key
- **Alpha Vantage** - Free tier available

Files to modify:
- `lib/grain.ts` - Replace mock with real API
- Add API key to `.env`

### 2. Per-Field Rainfall
**Priority: Medium**

The rainfall API already supports polygon queries. Need:
- Field locations/polygons stored in config or database
- UI to display multiple field rainfall totals
- Modified `lib/rainfall.ts` to accept field parameters

### 3. Advanced Spray Logic
**Priority: Medium**

Current: Simple wind/gust thresholds

Enhancements:
- Temperature-based rules (too cold/hot)
- Humidity considerations
- Rain forecast windows (when will rain return?)
- Multiple spray windows (24h, 48h forecast)

Files to modify:
- `lib/spray.ts` - Expand decision engine
- `lib/types.ts` - Add forecast data types

### 4. Bushels Sold Tracking
**Priority: Medium**

- Simple database (SQLite/PostgreSQL) to track:
  - Total bushels sold
  - Average price
  - Contracts vs spot
- Add UI to input sales

### 5. Historical Data / Charts
**Priority: Low**

- Price history charts
- Rainfall history
- Spray decision history

Libraries to consider:
- `recharts` - React charts
- `chart.js`

### 6. Notifications
**Priority: Low**

- Price alerts (when grain hits target)
- Spray window alerts
- Daily summary email

Services:
- SendGrid (emails)
- Push notifications via Vercel Edge

---

## Technical Debt / Improvements

| Issue | Fix |
|-------|-----|
| No error boundaries in UI | Add error.tsx and loading.tsx |
| No TypeScript strict mode | Enable in tsconfig.json |
| No unit tests | Add Jest or Vitest |
| Hardcoded fallback values | Move to config |

---

## Suggested Phase 2 Order

1. Real grain data (high value, low effort)
2. Error/loading states (UX improvement)
3. Per-field rainfall (uses existing API)
4. Advanced spray logic
5. Bushels tracking (requires DB)

---

## Files to Review for Phase 2

| File | Purpose |
|------|---------|
| `lib/grain.ts` | Replace mock with real API |
| `lib/spray.ts` | Expand decision logic |
| `lib/rainfall.ts` | Add polygon support |
| `app/page.tsx` | Add loading/error states |
| `.env.example` | Add new config vars |

---

## Questions Before Phase 2

1. Which grain data source do you prefer?
2. Do you want per-field rainfall tracking?
3. What spray rules are most important to you?
4. Need bushels sold tracking?
