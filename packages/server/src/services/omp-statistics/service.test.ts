import { describe, expect, test, vi } from "vitest";
import { OmpStatisticsService } from "./service.js";

function aggregate(overrides: Record<string, unknown> = {}) {
  return {
    totalRequests: 10,
    successfulRequests: 9,
    failedRequests: 1,
    errorRate: 0.1,
    totalInputTokens: 100,
    totalOutputTokens: 50,
    totalCacheReadTokens: 500,
    totalCacheWriteTokens: 25,
    cacheRate: 0.8,
    cacheSavings: 0.7,
    totalCost: 1.25,
    unpricedRequests: 0,
    totalPremiumRequests: 0,
    avgDuration: 1000,
    avgTtft: 250,
    avgTokensPerSecond: 20,
    firstTimestamp: 1_700_000_000_000,
    lastTimestamp: 1_700_000_001_000,
    ...overrides,
  };
}

function statsJson(requests = 10): string {
  return JSON.stringify({
    overall: aggregate({ totalRequests: requests }),
    byModel: [aggregate({ model: "gpt-test", provider: "openai-codex" })],
    byFolder: [{ folder: "/private/project", ...aggregate() }],
    byAgentType: [
      {
        agentType: "main",
        totalRequests: 5,
        totalInputTokens: 50,
        totalOutputTokens: 25,
        totalCacheReadTokens: 250,
        totalCacheWriteTokens: 10,
        totalCost: 0.75,
      },
    ],
    timeSeries: [
      { timestamp: 1_700_000_000_000, requests: 10, errors: 1, tokens: 675, cost: 1.25 },
    ],
  });
}

function createLogger() {
  const logger = { debug: vi.fn(), child: () => logger };
  return logger as never;
}

describe("OmpStatisticsService", () => {
  test("normalizes official stats output after OMP status text and omits private folder paths", async () => {
    const service = new OmpStatisticsService({
      logger: createLogger(),
      now: () => Date.parse("2026-06-19T00:00:00.000Z"),
      runStats: async () => `Synced current statistics\n${statsJson()}`,
    });

    const result = await service.getStatistics();

    expect(result.fetchedAt).toBe("2026-06-19T00:00:00.000Z");
    expect(result.statistics.overall.totalRequests).toBe(10);
    expect(result.statistics.byModel[0]).toMatchObject({
      model: "gpt-test",
      provider: "openai-codex",
    });
    expect(result.statistics).not.toHaveProperty("byFolder");
  });

  test("caches statistics until a forced refresh", async () => {
    let calls = 0;
    const runStats = vi.fn(async () => statsJson(++calls));
    const service = new OmpStatisticsService({
      logger: createLogger(),
      runStats,
    });

    const first = await service.getStatistics();
    const cached = await service.getStatistics();
    const refreshed = await service.getStatistics({ forceRefresh: true });

    expect(cached).toBe(first);
    expect(refreshed.statistics.overall.totalRequests).toBe(2);
    expect(runStats).toHaveBeenCalledTimes(2);
  });

  test("returns a stable error for malformed or failed command output", async () => {
    const service = new OmpStatisticsService({
      logger: createLogger(),
      runStats: async () => {
        throw new Error("private stderr");
      },
    });

    await expect(service.getStatistics()).rejects.toThrow("OMP statistics are unavailable");
  });
});
