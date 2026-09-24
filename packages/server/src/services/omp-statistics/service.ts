import type { Logger } from "pino";
import { OmpStatisticsSchema, type OmpStatistics } from "@getpaseo/protocol/messages";
import { execCommand } from "../../utils/spawn.js";
import { resolveOmpCommand } from "../omp-command.js";
const OMP_STATS_TIMEOUT_MS = 15_000;
const OMP_STATS_MAX_BUFFER_BYTES = 16 * 1024 * 1024;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

type OmpStatsRunner = () => Promise<string>;

export interface OmpStatisticsResult {
  fetchedAt: string;
  statistics: OmpStatistics;
}

export interface OmpStatisticsServiceOptions {
  logger: Logger;
  runStats?: OmpStatsRunner;
  cacheTtlMs?: number;
  now?: () => number;
}

async function runOmpStats(): Promise<string> {
  const result = await execCommand(resolveOmpCommand(), ["stats", "--json"], {
    timeout: OMP_STATS_TIMEOUT_MS,
    maxBuffer: OMP_STATS_MAX_BUFFER_BYTES,
  });
  return result.stdout;
}
function parseOmpStatisticsOutput(output: string): unknown {
  const jsonStart = output.indexOf("{");
  if (jsonStart === -1) throw new SyntaxError("OMP statistics output did not contain JSON");
  return JSON.parse(output.slice(jsonStart));
}

export class OmpStatisticsService {
  private readonly logger: Logger;
  private readonly runStats: OmpStatsRunner;
  private readonly cacheTtlMs: number;
  private readonly now: () => number;
  private cached: { fetchedAtMs: number; result: OmpStatisticsResult } | null = null;
  private inFlight: Promise<OmpStatisticsResult> | null = null;

  constructor(options: OmpStatisticsServiceOptions) {
    this.logger = options.logger.child({ module: "omp-statistics-service" });
    this.runStats = options.runStats ?? runOmpStats;
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.now = options.now ?? Date.now;
  }

  async getStatistics(options?: { forceRefresh?: boolean }): Promise<OmpStatisticsResult> {
    const nowMs = this.now();
    if (
      !options?.forceRefresh &&
      this.cached &&
      nowMs - this.cached.fetchedAtMs < this.cacheTtlMs
    ) {
      return this.cached.result;
    }
    if (this.inFlight) return await this.inFlight;

    const request = this.fetchStatistics(nowMs);
    this.inFlight = request;
    try {
      return await request;
    } finally {
      if (this.inFlight === request) this.inFlight = null;
    }
  }

  private async fetchStatistics(nowMs: number): Promise<OmpStatisticsResult> {
    try {
      const statistics = OmpStatisticsSchema.parse(parseOmpStatisticsOutput(await this.runStats()));
      const result = { fetchedAt: new Date(nowMs).toISOString(), statistics };
      this.cached = { fetchedAtMs: nowMs, result };
      return result;
    } catch (error) {
      this.logger.debug({ err: error }, "OMP statistics fetch failed");
      throw new Error("OMP statistics are unavailable", { cause: error });
    }
  }
}
