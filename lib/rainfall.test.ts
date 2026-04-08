/**
 * Regression test for rainfall.ts
 *
 * Bug: After filtering out future dates, rain1d was changed to use today's bucket
 * specifically, which can incorrectly become 0 if today is missing/lagging even when
 * the latest historical bucket has rain.
 *
 * This test simulates a breakdown like:
 *   { yesterday: 0.4, today missing, tomorrow: 0.2 }
 *
 * Expected behavior:
 * - rain1d should reflect the latest HISTORICAL bucket (0.4), not tomorrow (0.2)
 * - rain1d should NOT be forced to 0 if today is missing
 */

// Mock the fetch function to return controlled data
async function mockFetch(url: string): Promise<Response> {
  // Simulate a breakdown where yesterday has rain, today is missing, and tomorrow has forecast
  const mockData = {
    rainfall: 0.6,
    breakdown: {
      // Yesterday
      "2026-04-06": 0.4,
      // Today - MISSING (no data yet)
      // "2026-04-07": undefined,
      // Tomorrow - should be filtered out as future
      "2026-04-08": 0.2,
    },
  };

  return {
    ok: true,
    json: async () => mockData,
  } as Response;
}

async function testRain1dUsesLatestHistoricalBucket() {
  console.log("\n=== Regression Test: rain1d should use latest historical bucket ===\n");

  // Temporarily replace global fetch
  const originalFetch = global.fetch;
  global.fetch = mockFetch as any;

  try {
    // Import after mocking fetch
    const { fetchRainfall } = require("./rainfall.ts");

    // Mock config to use a fixed date for reproducibility
    const originalConfig = require("./config.ts").config;
    require("./config.ts").config = {
      ...originalConfig,
      weather: {
        ...originalConfig.weather,
        timezone: "America/Chicago",
      },
    };

    // Override Date to simulate being on 2026-04-07
    const fixedDate = new Date("2026-04-07T12:00:00Z");
    const originalDate = global.Date;
    // @ts-ignore
    global.Date = function () {
      if (arguments.length === 0) return new originalDate(fixedDate);
      // @ts-ignore
      return new originalDate(...arguments);
    };
    // @ts-ignore
    global.Date.now = () => fixedDate.getTime();
    // @ts-ignore
    global.Date.UTC = originalDate.UTC;
    // @ts-ignore
    global.Date.parse = originalDate.parse;
    // @ts-ignore
    global.Date.prototype = originalDate.prototype;

    const result = await fetchRainfall();

    console.log("Test data breakdown:");
    console.log("  2026-04-06 (yesterday): 0.4 inches");
    console.log("  2026-04-07 (today):    MISSING");
    console.log("  2026-04-08 (tomorrow):  0.2 inches (should be filtered)\n");

    console.log("Results:");
    console.log(`  rain1d: ${result.rain1d}`);
    console.log(`  rain3d: ${result.rain3d}`);
    console.log(`  rain7d: ${result.rain7d}`);

    // Assertions
    const errors: string[] = [];

    if (result.rain1d !== 0.4) {
      errors.push(`❌ FAIL: rain1d should be 0.4 (latest historical bucket), got ${result.rain1d}`);
    } else {
      console.log(`\n✅ PASS: rain1d correctly reflects latest historical bucket (${result.rain1d})`);
    }

    if (result.rain3d !== 0.4) {
      errors.push(`❌ FAIL: rain3d should be 0.4 (only yesterday in historical range), got ${result.rain3d}`);
    } else {
      console.log(`✅ PASS: rain3d correctly computed (${result.rain3d})`);
    }

    if (result.rain7d !== 0.4) {
      errors.push(`❌ FAIL: rain7d should be 0.4 (only yesterday in historical range), got ${result.rain7d}`);
    } else {
      console.log(`✅ PASS: rain7d correctly computed (${result.rain7d})`);
    }

    if (errors.length === 0) {
      console.log("\n🎉 All tests passed!");
      return true;
    } else {
      console.log("\n💥 Test failures:");
      errors.forEach((err) => console.log(`  ${err}`));
      return false;
    }
  } catch (error) {
    console.error("❌ Test execution error:", error);
    return false;
  } finally {
    // Restore original fetch and Date
    global.fetch = originalFetch;
  }
}

// Run the test
testRain1dUsesLatestHistoricalBucket()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error("Test harness error:", error);
    process.exit(1);
  });
