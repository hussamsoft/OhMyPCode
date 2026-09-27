import { describe, expect, it } from "vitest";
import { shouldSyncRenameToOmp } from "./use-workspace-tab-rename";

// `client.updateAgent` renames the app-level tab label; OMP tracks its own
// session title independently and needs a separate /rename RPC to stay in
// sync. This regression-covers the gate that decides when to fire it.
describe("shouldSyncRenameToOmp", () => {
  it("syncs when the agent is OMP-backed and the runtime supports slash commands", () => {
    expect(shouldSyncRenameToOmp({ provider: "omp", features: { ompSlashCommands: true } })).toBe(
      true,
    );
  });

  it("does not sync for a non-OMP provider even if the flag is set", () => {
    expect(
      shouldSyncRenameToOmp({ provider: "claude-code", features: { ompSlashCommands: true } }),
    ).toBe(false);
  });

  it("does not sync when the runtime does not advertise slash-command support", () => {
    expect(shouldSyncRenameToOmp({ provider: "omp", features: { ompSlashCommands: false } })).toBe(
      false,
    );
  });

  it("does not sync when features are missing entirely", () => {
    expect(shouldSyncRenameToOmp({ provider: "omp", features: null })).toBe(false);
    expect(shouldSyncRenameToOmp({ provider: "omp", features: undefined })).toBe(false);
    expect(shouldSyncRenameToOmp({ provider: "omp" })).toBe(false);
  });
});
