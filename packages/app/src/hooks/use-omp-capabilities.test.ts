import { describe, expect, it } from "vitest";
import { selectOmpCapabilityState } from "./use-omp-capabilities";

const supported = {
  provider: "omp",
  supportsOmpVibe: true,
  supportsOmpToolSelection: true,
  serverSupportsVibe: true,
  serverSupportsTools: true,
  serverSupportsModes: true,
  serverSupportsSettings: true,
};

describe("selectOmpCapabilityState", () => {
  it("enables each action only when every provider, server, and agent gate matches", () => {
    expect(selectOmpCapabilityState(supported)).toEqual({
      canUseVibe: true,
      canSelectTools: true,
      canUseModes: true,
      canUseSettings: true,
    });
  });

  it.each([
    [
      { provider: "codex" },
      { canUseVibe: false, canSelectTools: false, canUseModes: false, canUseSettings: false },
    ],
    [
      { serverSupportsVibe: false },
      { canUseVibe: false, canSelectTools: false, canUseModes: true, canUseSettings: true },
    ],
    [
      { serverSupportsTools: false },
      { canUseVibe: false, canSelectTools: false, canUseModes: true, canUseSettings: true },
    ],
    [
      { supportsOmpVibe: false },
      { canUseVibe: false, canSelectTools: true, canUseModes: true, canUseSettings: true },
    ],
    [
      { supportsOmpToolSelection: false },
      { canUseVibe: true, canSelectTools: false, canUseModes: true, canUseSettings: true },
    ],
    [
      // Modes and settings are independent of the vibe/tools server-feature
      // pair -- an older runtime can advertise one without the other.
      { serverSupportsModes: false },
      { canUseVibe: true, canSelectTools: true, canUseModes: false, canUseSettings: true },
    ],
    [
      { serverSupportsSettings: false },
      { canUseVibe: true, canSelectTools: true, canUseModes: true, canUseSettings: false },
    ],
  ])("fails closed when a required gate is absent: %o", (override, expected) => {
    expect(selectOmpCapabilityState({ ...supported, ...override })).toEqual(expected);
  });
});
