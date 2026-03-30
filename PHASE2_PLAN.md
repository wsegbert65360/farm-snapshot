# Farm Command - Phase 2 Planning

## Current State (Phase 1 Complete ✓)
- Single-page dashboard with Grain, Weather, Spray cards
- Weather from NWS API (no API key)
- Rainfall from existing rain-api.vercel.app
- Grain with fallback data (Yahoo Finance blocked by Vercel)
- Spray GO/WAIT based on wind thresholds

---

## Phase 2: Grain Data Research Results

### What Was Tested:
1. **Yahoo Finance** - ❌ Blocked by Vercel (rate limiting)
2. **USDA MyMarketNews** - Mostly PDF format, complex to parse
3. **Free APIs** - All require API keys

### USDA Findings:
- Report 2932: Missouri Daily Grain Bids (PDF only)
- Report 3420: Daily Market Rates (some TXT available)
- Most data is PDF format - requires parsing
- No simple JSON API without authentication

### Options for Future:
1. **DTN Test Key** - Free tier available (store in environment variable)
2. **PDF Parsing** - Parse USDA PDF reports
3. **Manual Updates** - Update fallback prices weekly

---

## Phase 2 Suggestions

### 1. Grain Data Solutions
**Priority: High**

Options:
- **Get API Key** - DTN, API Ninjas, or Commodities-API (free tiers available)
- **PDF Parsing** - Parse USDA reports with library like `pdf-parse`
- **Manual** - Accept static data, update periodically

### 2. Advanced Spray Logic
**Priority: Medium**

Add temperature/humidity rules and forecast windows

### 3. Error/Loading States
**Priority: Low**

Add loading.tsx and error.tsx for better UX

---

## Technical Debt

| Issue | Fix |
|-------|-----|
| No error boundaries | Add error.tsx and loading.tsx |
| Hardcoded fallback | Move to config |

---

## Files for Phase 2

| File | Purpose |
|------|---------|
| `lib/grain.ts` | Add real API or PDF parsing |
| `lib/spray.ts` | Expand decision logic |
| `app/page.tsx` | Add loading/error states |
