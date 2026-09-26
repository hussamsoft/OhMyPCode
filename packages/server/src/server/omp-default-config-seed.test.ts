import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { createTestLogger } from "../test-utils/test-logger.js";
import { buildProviderRegistry } from "./agent/provider-registry.js";
import { resolveConfigFromPersisted } from "./config.js";
import { loadPersistedConfig, seedPersistedConfigIfAbsent } from "./persisted-config.js";

// packages/server/src/server/ -> repo root is 4 levels up.
const PACKAGED_DEFAULT_CONFIG_PATH = path.resolve(
  __dirname,
  "../../../..",
  "ohmypcode",
  "default-config.json",
);

function createTempHome(): string {
  return mkdtempSync(path.join(tmpdir(), "paseo-omp-seed-"));
}

/**
 * Regression coverage for the bug this pairs with: `omp` defaults to
 * disabled at the manifest level (provider-manifest.ts, matching every
 * other built-in provider), and the *only* thing that turns it on for a
 * fresh desktop install is this file, ohmypcode/default-config.json, being
 * seeded into a fresh <home>/config.json before the daemon first loads it.
 * Nothing here spanned manifest -> seeded config -> resolved provider
 * registry before, so a change to any one link (the manifest default
 * flipping, the seed silently not running, or the config -> providerOverrides
 * plumbing in config.ts changing shape) could regress to "omp is enabled
 * nowhere" without a single failing test.
 */
describe("packaged default config seeds the omp opt-in end to end", () => {
  test("a fresh home seeded from the packaged default enables omp in the resolved registry", () => {
    const home = createTempHome();
    try {
      const defaults = JSON.parse(readFileSync(PACKAGED_DEFAULT_CONFIG_PATH, "utf-8"));

      // Mirrors desktop's seedDaemonConfigFromPackagedDefault: only writes
      // when config.json is absent, same schema validation and atomic
      // private-file write loadPersistedConfig itself uses.
      seedPersistedConfigIfAbsent(home, defaults);

      const persisted = loadPersistedConfig(home);
      expect(persisted.agents?.providers?.omp).toMatchObject({ enabled: true });

      // Same path the daemon actually takes: persisted config -> resolved
      // PaseoDaemonConfig.providerOverrides -> buildProviderRegistry.
      const resolved = resolveConfigFromPersisted(home, persisted);
      expect(resolved.providerOverrides?.omp).toMatchObject({ enabled: true });

      const registry = buildProviderRegistry(createTestLogger(), {
        providerOverrides: resolved.providerOverrides,
      });
      expect(registry.omp.enabled).toBe(true);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  test("an existing config.json is never overwritten by the seed", () => {
    const home = createTempHome();
    try {
      // First write wins: omp stays off because that's what's already there.
      seedPersistedConfigIfAbsent(home, { agents: { providers: { omp: { enabled: false } } } });
      const defaults = JSON.parse(readFileSync(PACKAGED_DEFAULT_CONFIG_PATH, "utf-8"));
      seedPersistedConfigIfAbsent(home, defaults);

      const persisted = loadPersistedConfig(home);
      expect(persisted.agents?.providers?.omp?.enabled).toBe(false);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});
