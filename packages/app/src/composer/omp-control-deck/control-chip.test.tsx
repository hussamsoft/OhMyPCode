/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ControlChip } from "./control-chip";

beforeEach(() => {
  vi.stubGlobal("React", React);
});

afterEach(() => {
  cleanup();
});

function chip(props: Partial<Parameters<typeof ControlChip>[0]> = {}) {
  return render(
    <ControlChip
      icon={(() => null) as never}
      label="Tools"
      value="3/4"
      accessibilityLabel="Tools"
      onPress={() => {}}
      testID="chip"
      {...props}
    />,
  );
}

describe("ControlChip pending state", () => {
  it("marks itself busy for assistive tech while a write is in flight", () => {
    const view = chip({ pending: true });
    expect(view.container.querySelector("[data-testid=chip]")?.getAttribute("aria-busy")).toBe(
      "true",
    );
  });

  it("is not busy when idle", () => {
    const view = chip();
    expect(view.container.querySelector("[data-testid=chip]")?.getAttribute("aria-busy")).toBe(
      null,
    );
  });

  // The whole point of a separate pending style: a mid-write control and an
  // unavailable one must not look alike. `disabled` means "you cannot do this";
  // `pending` means "it is happening".
  it("stays distinguishable from a disabled control", () => {
    const pending = chip({ pending: true }).container.querySelector("[data-testid=chip]")!;
    const disabled = chip({ disabled: true }).container.querySelector("[data-testid=chip]")!;
    // Busy, and not disabled: the control is mid-write, not unavailable.
    expect(pending.getAttribute("aria-busy")).toBe("true");
    expect(pending.getAttribute("aria-disabled")).toBeNull();
    // The mirror image: unavailable, and not busy.
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    expect(disabled.getAttribute("aria-busy")).toBeNull();
  });
});
