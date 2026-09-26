import React, { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";

const mounted: Array<{ container: HTMLDivElement; root: Root }> = [];

function requireElement<T extends Element>(element: T | null, name: string): T {
  if (!element) throw new Error(`Expected ${name}`);
  return element;
}

function Harness() {
  const [value, setValue] = useState("build");
  return (
    <SegmentedControl
      accessibilityLabel="Worker tier"
      options={[
        { value: "build", label: "Build", testID: "segment-build" },
        { value: "disabled", label: "Disabled", disabled: true, testID: "segment-disabled" },
        { value: "vibe", label: "Vibe", testID: "segment-vibe" },
      ]}
      value={value}
      onValueChange={setValue}
    />
  );
}

function mountHarness(): HTMLDivElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<Harness />));
  mounted.push({ container, root });
  return container;
}

afterEach(() => {
  for (const { container, root } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

describe("SegmentedControl accessibility", () => {
  it("keeps one tabbable checked radio and supports keyboard activation",  () => {
    const container = mountHarness();
    const group = requireElement(container.querySelector('[role="radiogroup"]'), "radio group");
    const build = requireElement(
      container.querySelector<HTMLElement>('[data-testid="segment-build"]'),
      "Build segment",
    );
    const disabled = requireElement(
      container.querySelector<HTMLElement>('[data-testid="segment-disabled"]'),
      "disabled segment",
    );
    const vibe = requireElement(
      container.querySelector<HTMLElement>('[data-testid="segment-vibe"]'),
      "Vibe segment",
    );

    expect(group.getAttribute("aria-label")).toBe("Worker tier");
    expect(build.getAttribute("aria-checked")).toBe("true");
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    expect(vibe.getAttribute("aria-checked")).toBe("false");
    expect(build.tabIndex).toBe(0);
    expect(disabled.tabIndex).toBe(-1);
    expect(vibe.tabIndex).toBe(-1);
    act(() => {
      vibe.focus();
      vibe.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    });

    expect(vibe.getAttribute("aria-checked")).toBe("true");
    expect(vibe.tabIndex).toBe(0);
    expect(document.activeElement).toBe(vibe);
    expect(getComputedStyle(vibe).borderColor).toBe("rgb(37, 99, 235)");
    expect(getComputedStyle(vibe).borderWidth).toBe("2px");
  });

  it("gives switches a visible two-pixel focus ring", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<Switch value accessibilityLabel="Enable Vibe" />));
    mounted.push({ container, root });
    const control = requireElement(
      container.querySelector<HTMLElement>('[role="switch"]'),
      "switch control",
    );

    act(() => control.focus());

    expect(getComputedStyle(control).outlineColor).toBe("rgb(37, 99, 235)");
    expect(getComputedStyle(control).outlineWidth).toBe("2px");
  });
});
