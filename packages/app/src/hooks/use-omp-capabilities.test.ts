import { describe, expect, it } from "vitest";
import { selectOmpCapabilityState } from "./use-omp-capabilities";

const supported = {
  provider: "omp",
  supportsOmpVibe: true,
  supportsOmpToolSelection: true,
  serverSupportsVibe: true,
  serverSupportsTools: true,
};

describe("selectOmpCapabilityState", () => {
  it("enables each action only when every provider, server, and agent gate matches", () => {
    expect(selectOmpCapabilityState(supported)).toEqual({
      canUseVibe: true,
      canSelectTools: true,
    });
  });

  it.each([
    [{ provider: "codex" }, { canUseVibe: false, canSelectTools: false }],
    [{ serverSupportsVibe: false }, { canUseVibe: false, canSelectTools: false }],
    [{ serverSupportsTools: false }, { canUseVibe: false, canSelectTools: false }],
    [{ supportsOmpVibe: false }, { canUseVibe: false, canSelectTools: true }],
    [
      { supportsOmpToolSelection: false },
      { canUseVibe: true, canSelectTools: false },
    ],
  ])("fails closed when a required gate is absent: %o", (override, expected) => {
    expect(selectOmpCapabilityState({ ...supported, ...override })).toEqual(expected);
  });
});
