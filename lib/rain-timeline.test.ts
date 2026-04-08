/**
 * Tests for rain-timeline.ts caching and error handling
 */

async function testCachingBehavior() {
  console.log("\n=== Test 1: Cache reduces API calls ===\n");

  // Import the module fresh
  const { fetchRainTimeline } = require("./rain-timeline");

  // Mock console.log to capture output
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    if (args[0]?.includes?.("[RainTimeline]")) {
      logs.push(args.join(" "));
    }
    originalLog(...args);
  };

  try {
    // First call - should fetch from API
    const result1 = await fetchRainTimeline();
    const fetchLogs1 = logs.filter(l => l.includes("Fetching URL")).length;
    
    // Clear logs
    logs.length = 0;
    
    // Second immediate call - should use cache
    const result2 = await fetchRainTimeline();
    const fetchLogs2 = logs.filter(l => l.includes("Fetching URL")).length;
    const cacheLogs2 = logs.filter(l => l.includes("Using cached data")).length;
    
    // Restore console.log
    console.log = originalLog;
    
    console.log("Results:");
    console.log(`  First call - fetch requests: ${fetchLogs1}`);
    console.log(`  Second call - fetch requests: ${fetchLogs2}, cache hits: ${cacheLogs2}`);
    
    const errors: string[] = [];
    
    if (fetchLogs1 !== 1) {
      errors.push(`❌ FAIL: First call should make 1 fetch, got ${fetchLogs1}`);
    } else {
      console.log(`✅ PASS: First call made exactly 1 API fetch`);
    }
    
    if (fetchLogs2 !== 0) {
      errors.push(`❌ FAIL: Second call should make 0 fetches (use cache), got ${fetchLogs2}`);
    } else {
      console.log(`✅ PASS: Second call used cache (0 fetches)`);
    }
    
    if (cacheLogs2 !== 1) {
      errors.push(`❌ FAIL: Second call should hit cache once, got ${cacheLogs2}`);
    } else {
      console.log(`✅ PASS: Second call logged cache hit`);
    }
    
    // Data should be the same
    if (JSON.stringify(result1) !== JSON.stringify(result2)) {
      errors.push(`❌ FAIL: Cached data should match fresh data`);
    } else {
      console.log(`✅ PASS: Cached data matches fresh data`);
    }
    
    if (errors.length === 0) {
      console.log("\n🎉 Test 1 passed!");
      return true;
    } else {
      console.log("\n💥 Test 1 failures:");
      errors.forEach((err) => console.log(`  ${err}`));
      return false;
    }
  } catch (error) {
    console.log = originalLog;
    console.error("❌ Test execution error:", error);
    return false;
  }
}

async function test429ErrorHandling() {
  console.log("\n=== Test 2: 429 rate limit error distinguished ===\n");

  // Mock fetch to return 429
  async function mockFetch429(url: string): Promise<Response> {
    return {
      ok: false,
      status: 429,
      json: async () => ({}),
    } as Response;
  }

  const originalFetch = global.fetch;
  global.fetch = mockFetch429 as any;

  try {
    // Clear any existing cache by forcing module reload
    // (Node.js caches require() calls)
    delete require.cache[require.resolve("./rain-timeline")];
    const { fetchRainTimeline } = require("./rain-timeline");

    const result = await fetchRainTimeline();

    console.log("Results:");
    console.log(`  error: ${result.error}`);
    console.log(`  hours.length: ${result.hours.length}`);

    const errors: string[] = [];

    if (result.error !== "Rate limited - try again later") {
      errors.push(`❌ FAIL: error should be 'Rate limited - try again later', got '${result.error}'`);
    } else {
      console.log(`✅ PASS: Correctly identified rate limit error`);
    }

    if (result.hours.length !== 0) {
      errors.push(`❌ FAIL: hours should be empty array on 429`);
    } else {
      console.log(`✅ PASS: Empty hours array on 429`);
    }

    global.fetch = originalFetch;

    if (errors.length === 0) {
      console.log("\n🎉 Test 2 passed!");
      return true;
    } else {
      console.log("\n💥 Test 2 failures:");
      errors.forEach((err) => console.log(`  ${err}`));
      return false;
    }
  } catch (error) {
    global.fetch = originalFetch;
    console.error("❌ Test execution error:", error);
    return false;
  }
}

async function testRequestCoalescing() {
  console.log("\n=== Test 3: Simultaneous requests are coalesced ===\n");

  // Import the module fresh
  delete require.cache[require.resolve("./rain-timeline")];
  const { fetchRainTimeline } = require("./rain-timeline");

  // Mock console.log to capture output
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    if (args[0]?.includes?.("[RainTimeline]")) {
      logs.push(args.join(" "));
    }
    originalLog(...args);
  };

  try {
    // Clear cache by waiting (TTL is 5 minutes)
    // Actually, let's just simulate by checking the log behavior
    
    // Make 3 simultaneous calls
    const [result1, result2, result3] = await Promise.all([
      fetchRainTimeline(),
      fetchRainTimeline(),
      fetchRainTimeline(),
    ]);
    
    // Restore console.log
    console.log = originalLog;
    
    const fetchLogs = logs.filter(l => l.includes("Fetching URL")).length;
    const inFlightLogs = logs.filter(l => l.includes("Using in-flight request")).length;
    
    console.log("Results:");
    console.log(`  Total fetch requests: ${fetchLogs}`);
    console.log(`  In-flight request reuses: ${inFlightLogs}`);
    console.log(`  Total simultaneous calls: 3`);
    
    const errors: string[] = [];
    
    if (fetchLogs !== 1) {
      errors.push(`❌ FAIL: Should make exactly 1 fetch for 3 simultaneous calls, got ${fetchLogs}`);
    } else {
      console.log(`✅ PASS: Single fetch for multiple simultaneous calls`);
    }
    
    if (inFlightLogs !== 2) {
      errors.push(`❌ FAIL: Should reuse in-flight request 2 times, got ${inFlightLogs}`);
    } else {
      console.log(`✅ PASS: In-flight requests properly coalesced`);
    }
    
    // All results should be identical
    if (result1 !== result2 || result2 !== result3) {
      errors.push(`❌ FAIL: All simultaneous calls should return same result`);
    } else {
      console.log(`✅ PASS: All simultaneous calls returned identical result`);
    }
    
    if (errors.length === 0) {
      console.log("\n🎉 Test 3 passed!");
      return true;
    } else {
      console.log("\n💥 Test 3 failures:");
      errors.forEach((err) => console.log(`  ${err}`));
      return false;
    }
  } catch (error) {
    console.log = originalLog;
    console.error("❌ Test execution error:", error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("\n🧪 Running rain-timeline tests...\n");
  
  const test1 = await testCachingBehavior();
  const test2 = await test429ErrorHandling();
  const test3 = await testRequestCoalescing();
  
  console.log("\n" + "=".repeat(50));
  console.log("Summary:");
  console.log(`  Test 1 (Caching): ${test1 ? "✅" : "❌"}`);
  console.log(`  Test 2 (429 Errors): ${test2 ? "✅" : "❌"}`);
  console.log(`  Test 3 (Request Coalescing): ${test3 ? "✅" : "❌"}`);
  console.log("=".repeat(50) + "\n");
  
  const allPassed = test1 && test2 && test3;
  
  if (allPassed) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("💥 Some tests failed");
  }
  
  return allPassed;
}

runAllTests()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error("Test harness error:", error);
    process.exit(1);
  });
