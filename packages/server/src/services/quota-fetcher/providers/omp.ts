import { execCommand } from "../../../utils/spawn.js";
import type { Logger } from "pino";
import { z } from "zod";
import type {
  ProviderUsage,
  ProviderUsageBalance,
  ProviderUsageDetail,
  ProviderUsageTone,
  ProviderUsageWindow,
} from "../../../server/messages.js";
import type { ProviderUsageFetcher } from "../provider.js";
import { toneFromUsedPct, toIsoStringOrNull, unavailableUsage } from "../usage.js";
const OMP_USAGE_TIMEOUT_MS = 15_000;
const OMP_USAGE_MAX_BUFFER_BYTES = 16 * 1024 * 1024;

const OmpUsageLimitSchema = z.object({
  id: z.string(),
  label: z.string(),
  window: z
    .object({
      resetsAt: z.number().finite().optional(),
    })
    .passthrough(),
  amount: z
    .object({
      used: z.number().finite().optional(),
      limit: z.number().finite().optional(),
      remaining: z.number().finite().optional(),
      usedFraction: z.number().finite().optional(),
      remainingFraction: z.number().finite().optional(),
      unit: z.string(),
    })
    .passthrough(),
  status: z.string().optional(),
});

const OmpUsageReportSchema = z.object({
  provider: z.string().min(1),
  fetchedAt: z.number().finite(),
  limits: z.array(OmpUsageLimitSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const OmpUsageResponseSchema = z.object({
  reports: z.array(z.unknown()),
});

type OmpUsageReport = z.infer<typeof OmpUsageReportSchema>;
type OmpUsageLimit = z.infer<typeof OmpUsageLimitSchema>;
type OmpUsageRunner = () => Promise<string>;

interface OmpQuotaProviderOptions {
  logger: Logger;
  runUsage?: OmpUsageRunner;
}

function displayNameForProvider(provider: string): string {
  const knownNames: Record<string, string> = {
    anthropic: "Anthropic",
    cursor: "Cursor",
    "github-copilot": "GitHub Copilot",
    "google-antigravity": "Google Antigravity",
    "minimax-code": "MiniMax",
    "openai-codex": "OpenAI Codex",
    zai: "Z.ai",
  };
  return (
    knownNames[provider] ??
    provider
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function metadataString(report: OmpUsageReport, key: string): string | null {
  const value = report.metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function toneForLimit(limit: OmpUsageLimit, usedPct: number | null): ProviderUsageTone {
  if (limit.status === "exhausted") return "danger";
  if (limit.status === "warning") return "warning";
  if (limit.status === "ok") return "ok";
  return toneFromUsedPct(usedPct);
}

function percentageForLimit(limit: OmpUsageLimit): number | null {
  const { amount } = limit;
  if (typeof amount.usedFraction === "number") return amount.usedFraction * 100;
  if (typeof amount.remainingFraction === "number") return (1 - amount.remainingFraction) * 100;
  if (amount.unit === "percent" && typeof amount.used === "number") return amount.used;
  if (typeof amount.used === "number" && typeof amount.limit === "number" && amount.limit > 0) {
    return (amount.used / amount.limit) * 100;
  }
  return null;
}

function windowFromLimit(limit: OmpUsageLimit): ProviderUsageWindow | null {
  if (
    limit.amount.unit !== "percent" &&
    limit.amount.usedFraction === undefined &&
    limit.amount.remainingFraction === undefined
  ) {
    return null;
  }
  const usedPct = percentageForLimit(limit);
  return {
    id: limit.id,
    label: limit.label,
    usedPct,
    remainingPct: usedPct === null ? null : Math.max(0, 100 - usedPct),
    resetsAt: toIsoStringOrNull(limit.window.resetsAt ?? Number.NaN),
    tone: toneForLimit(limit, usedPct),
  };
}

function isBalanceUnit(unit: string): unit is ProviderUsageBalance["unit"] {
  return unit === "usd" || unit === "credits" || unit === "requests" || unit === "tokens";
}

function balanceFromLimit(limit: OmpUsageLimit): ProviderUsageBalance | null {
  if (!isBalanceUnit(limit.amount.unit)) return null;
  const usedPct = percentageForLimit(limit);
  return {
    id: limit.id,
    label: limit.label,
    used: limit.amount.used ?? null,
    remaining: limit.amount.remaining ?? null,
    limit: limit.amount.limit ?? null,
    unit: limit.amount.unit,
    resetsAt: toIsoStringOrNull(limit.window.resetsAt ?? Number.NaN),
    tone: toneForLimit(limit, usedPct),
  };
}

function detailsFromReport(report: OmpUsageReport): ProviderUsageDetail[] {
  const details: ProviderUsageDetail[] = [];
  const email = metadataString(report, "email");
  const organization = metadataString(report, "orgName");
  if (email) details.push({ id: "account", label: "Account", value: email });
  if (organization && organization !== email) {
    details.push({ id: "organization", label: "Organization", value: organization });
  }
  return details;
}

function usageFromReport(report: OmpUsageReport, index: number): ProviderUsage {
  const windows = report.limits
    .map(windowFromLimit)
    .filter((window): window is ProviderUsageWindow => window !== null);
  const balances = report.limits
    .map(balanceFromLimit)
    .filter((balance): balance is ProviderUsageBalance => balance !== null);
  return {
    providerId: `omp:${report.provider}:${index}`,
    displayName: displayNameForProvider(report.provider),
    status: "available",
    planLabel: metadataString(report, "planType") ?? metadataString(report, "plan"),
    sourceLabel: "OMP",
    fetchedAt: toIsoStringOrNull(report.fetchedAt),
    windows,
    balances,
    details: detailsFromReport(report),
    error: null,
  };
}

async function runOmpUsage(): Promise<string> {
  const result = await execCommand("omp", ["usage", "--json"], {
    timeout: OMP_USAGE_TIMEOUT_MS,
    maxBuffer: OMP_USAGE_MAX_BUFFER_BYTES,
  });
  return result.stdout;
}

export class OmpQuotaProvider implements ProviderUsageFetcher {
  readonly providerId = "omp";
  readonly displayName = "OMP";

  private readonly logger: Logger;
  private readonly runUsage: OmpUsageRunner;

  constructor(options: OmpQuotaProviderOptions) {
    this.logger = options.logger;
    this.runUsage = options.runUsage ?? runOmpUsage;
  }

  async fetchUsage(): Promise<ProviderUsage[]> {
    try {
      const raw = await this.runUsage();
      const root = OmpUsageResponseSchema.parse(JSON.parse(raw));
      const reports = root.reports.flatMap((value) => {
        const parsed = OmpUsageReportSchema.safeParse(value);
        return parsed.success ? [parsed.data] : [];
      });
      if (reports.length === 0) return [unavailableUsage(this)];
      return reports.map(usageFromReport);
    } catch (error) {
      this.logger.debug({ err: error }, "OMP usage fetch failed");
      return [unavailableUsage(this)];
    }
  }
}
