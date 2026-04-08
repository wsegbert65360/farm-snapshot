# Fix Summary: rain1d Off-by-One Bug

## Problem
After filtering out future dates, `rain1d` was incorrectly using `breakdown[todayYMD]` directly instead of using the latest date from the filtered `historicalDates` array. This caused `rain1d` to return 0 when today's bucket was missing or lagging, even when the latest historical bucket had rain data.

## Bug Scenario
Breakdown example:
```javascript
{
  "2026-04-06": 0.4,  // yesterday - has rain
  "2026-04-07": undefined,  // today - MISSING (no data yet)
  "2026-04-08": 0.2   // tomorrow - should be filtered as future
}
```

**Old buggy behavior:**
- `rain1d = breakdown["2026-04-07"]` → `undefined` → `0` ❌

**New correct behavior:**
- `historicalDates = ["2026-04-06"]` (future dates filtered out)
- `rain1d = breakdown[historicalDates[historicalDates.length - 1]]` → `breakdown["2026-04-06"]` → `0.4` ✅

## Changes Made

### 1. `lib/rainfall.ts` (lines 51-53)

**Before:**
```typescript
const rain1d = breakdown[todayYMD] ? Number(breakdown[todayYMD]) : 0;
```

**After:**
```typescript
const rain1d = historicalDates.length > 0
  ? Number(breakdown[historicalDates[historicalDates.length - 1]]) || 0
  : 0;
```

### 2. Added Regression Test
Created `lib/rainfall-verify.ts` - A standalone verification script that:
- Simulates the bug scenario (yesterday: 0.4, today missing, tomorrow: 0.2)
- Shows the old buggy behavior returning 0
- Shows the new fixed behavior returning 0.4
- Verifies all three values (rain1d, rain3d, rain7d) are computed correctly

## Verification Results
✅ TypeScript compilation successful
✅ Build process completed (unrelated env var warnings are expected)
✅ Verification script passed:
   - rain1d: 0.4 (correct - uses latest historical bucket)
   - rain3d: 0.4 (correct)
   - rain7d: 0.4 (correct)

## Impact
- **Minimal change**: Only the `rain1d` computation logic was changed
- **Consistent behavior**: Now `rain1d`, `rain3d`, and `rain7d` all compute from `historicalDates` consistently
- **No redesign**: The existing architecture and API remain unchanged
- **No breaking changes**: The function signature and return type are identical
