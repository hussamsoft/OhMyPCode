import { describe, expect, it } from "vitest";
import { resolveOmpCommandOverlayTarget } from "./resolve-omp-command-overlay-target";

// Regression coverage for a real bug: the server reports the overlay by the
// slash command's own canonical name (`spec.name` in the fork's
// `rpc-slash.ts`, passed through verbatim), e.g. `/vibe` -> "vibe",
// `/settings` -> "settings" -- NOT our `omp_*` panel-kind strings. An earlier
// version of this resolver checked for "omp_vibe" and so never matched any
// real overlay name the server actually sends, silently breaking the entire
// slash-command -> overlay -> panel routing flow.
describe("resolveOmpCommandOverlayTarget", () => {
  it("maps the vibe overlay to the omp_vibe panel target", () => {
    expect(resolveOmpCommandOverlayTarget({ name: "vibe", agentId: "agent-1" })).toEqual({
      kind: "omp_vibe",
      agentId: "agent-1",
      workerId: null,
    });
  });

  it("maps the settings overlay to the omp_settings panel target", () => {
    expect(resolveOmpCommandOverlayTarget({ name: "settings", agentId: "agent-1" })).toEqual({
      kind: "omp_settings",
      agentId: "agent-1",
    });
  });

  it("returns null for an overlay name with no registered panel yet", () => {
    expect(resolveOmpCommandOverlayTarget({ name: "git", agentId: "agent-1" })).toBeNull();
  });

  it("does not match our own omp_* panel-kind naming, only the server's canonical command name", () => {
    expect(resolveOmpCommandOverlayTarget({ name: "omp_vibe", agentId: "agent-1" })).toBeNull();
    expect(resolveOmpCommandOverlayTarget({ name: "omp_settings", agentId: "agent-1" })).toBeNull();
  });
});
