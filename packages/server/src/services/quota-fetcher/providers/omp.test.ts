import { describe, expect, test, vi } from "vitest";
import { OmpQuotaProvider } from "./omp.js";

function createLogger() {
  return { debug: vi.fn() } as never;
}

const fetchedAt = Date.parse("2026-06-19T00:00:00.000Z");
const resetsAt = Date.parse("2026-06-19T05:00:00.000Z");

function usageJson(): string {
  return JSON.stringify({
    generatedAt: fetchedAt,
    reports: [
      {
        provider: "openai-codex",
        fetchedAt,
        limits: [
          {
            id: "openai-codex:primary",
            label: "7 days",
            window: { id: "7d", label: "7 days", resetsAt },
            amount: {
              used: 92,
              limit: 100,
              remaining: 8,
              usedFraction: 0.92,
              remainingFraction: 0.08,
              unit: "percent",
            },
            status: "warning",
          },
        ],
        metadata: {
          planType: "pro",
          email: "developer@example.com",
        },
      },
      {
        provider: "github-copilot",
        fetchedAt,
        limits: [
          {
            id: "copilot:premium",
            label: "Premium Requests",
            window: { id: "monthly", label: "Monthly", resetsAt },
            amount: { used: 120, limit: 300, remaining: 180, unit: "requests" },
            status: "ok",
          },
        ],
        metadata: { plan: "individual" },
      },
    ],
  });
}

describe("OmpQuotaProvider", () => {
  test("normalizes each OMP account report without dropping its limit type", async () => {
    const provider = new OmpQuotaProvider({
      logger: createLogger(),
      runUsage: async () => usageJson(),
    });

    await expect(provider.fetchUsage()).resolves.toEqual([
      {
        providerId: "omp:openai-codex:0",
        displayName: "OpenAI Codex",
        status: "available",
        planLabel: "pro",
        sourceLabel: "OMP",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        windows: [
          {
            id: "openai-codex:primary",
            label: "7 days",
            usedPct: 92,
            remainingPct: 8,
            resetsAt: "2026-06-19T05:00:00.000Z",
            tone: "warning",
          },
        ],
        balances: [],
        details: [{ id: "account", label: "Account", value: "developer@example.com" }],
        error: null,
      },
      {
        providerId: "omp:github-copilot:1",
        displayName: "GitHub Copilot",
        status: "available",
        planLabel: "individual",
        sourceLabel: "OMP",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        windows: [],
        balances: [
          {
            id: "copilot:premium",
            label: "Premium Requests",
            used: 120,
            remaining: 180,
            limit: 300,
            unit: "requests",
            resetsAt: "2026-06-19T05:00:00.000Z",
            tone: "ok",
          },
        ],
        details: [],
        error: null,
      },
    ]);
  });

  test.each([
    ["malformed JSON", "not-json"],
    ["invalid reports", JSON.stringify({ reports: [{ provider: "broken" }] })],
  ])("returns unavailable for %s", async (_name, output) => {
    const provider = new OmpQuotaProvider({
      logger: createLogger(),
      runUsage: async () => output,
    });

    await expect(provider.fetchUsage()).resolves.toEqual([
      {
        providerId: "omp",
        displayName: "OMP",
        status: "unavailable",
        planLabel: null,
        windows: [],
        balances: [],
        details: [],
        error: null,
      },
    ]);
  });

  test("does not expose command errors to usage clients", async () => {
    const logger = createLogger();
    const provider = new OmpQuotaProvider({
      logger,
      runUsage: async () => {
        throw new Error("stderr may contain private account output");
      },
    });

    const [usage] = await provider.fetchUsage();

    expect(usage?.status).toBe("unavailable");
    expect(usage?.error).toBeNull();
  });
});
