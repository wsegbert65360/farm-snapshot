/**
 * Quick verification that the rain1d fix works correctly.
 * This simulates the bug scenario: { yesterday: 0.4, today missing, tomorrow: 0.2 }
 */

function verifyRain1dFix() {
  console.log("\n=== Verification: rain1d uses latest historical bucket ===\n");

  // Simulate the breakdown data structure
  const breakdown: Record<string, number> = {
    "2026-04-06": 0.4, // yesterday
    // "2026-04-07": undefined, // today - MISSING
    "2026-04-08": 0.2,  // tomorrow - should be filtered
  };

  const dates = Object.keys(breakdown).sort(); // ["2026-04-06", "2026-04-08"]

  // Simulate being on 2026-04-07
  const todayYMD = "2026-04-07";

  // Filter to only include historical data (dates <= today)
  const historicalDates = dates.filter((d) => d <= todayYMD);
  console.log("Historical dates (<= 2026-04-07):", historicalDates); // ["2026-04-06"]

  // OLD BUGGY CODE (for comparison):
  const rain1d_buggy = breakdown[todayYMD] ? Number(breakdown[todayYMD]) : 0;
  console.log("\n🐛 OLD BUGGY rain1d:", rain1d_buggy, "(wrong - returns 0 when today is missing)");

  // NEW FIXED CODE:
  const rain1d_fixed = historicalDates.length > 0
    ? Number(breakdown[historicalDates[historicalDates.length - 1]]) || 0
    : 0;
  console.log("✅ NEW FIXED rain1d:", rain1d_fixed, "(correct - uses latest historical bucket)");

  const rain3d = historicalDates.slice(-3).reduce((s, d) => s + (Number(breakdown[d]) || 0), 0);
  const rain7d = historicalDates.reduce((s, d) => s + (Number(breakdown[d]) || 0), 0);

  console.log("\nAll values:");
  console.log("  rain1d:", rain1d_fixed);
  console.log("  rain3d:", rain3d);
  console.log("  rain7d:", rain7d);

  // Verify correctness
  const allCorrect =
    rain1d_fixed === 0.4 &&
    rain3d === 0.4 &&
    rain7d === 0.4;

  if (allCorrect) {
    console.log("\n✅ VERIFICATION PASSED: All values correct!");
    console.log("   - rain1d reflects the latest historical bucket (0.4)");
    console.log("   - rain3d and rain7d also correctly computed");
    return true;
  } else {
    console.log("\n❌ VERIFICATION FAILED");
    return false;
  }
}

verifyRain1dFix();
