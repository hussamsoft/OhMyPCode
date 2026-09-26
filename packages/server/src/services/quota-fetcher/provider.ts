import type { Logger } from "pino";
import type { ProviderUsage } from "../../server/messages.js";

export type ProviderApiFetch = typeof fetch;

export interface ProviderUsageFetcher {
  readonly providerId: string;
  readonly displayName: string;
  /**
   * A single usage row, or several when the provider reports per-account
   * breakdowns — OMP's `stats` returns one report per account, so a single
   * `ProviderUsage` cannot express it. Callers normalise the array form.
   */
  fetchUsage(): Promise<ProviderUsage | ProviderUsage[]>;
}

export interface ProviderUsageFetcherFactoryOptions {
  logger: Logger;
  fetch?: ProviderApiFetch;
}

export interface ProviderUsageFetcherManifestEntry {
  readonly providerId: string;
  create(options: ProviderUsageFetcherFactoryOptions): ProviderUsageFetcher;
}
