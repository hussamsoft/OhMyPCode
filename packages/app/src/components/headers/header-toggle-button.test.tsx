/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Text } from "react-native";
import { HeaderToggleButton } from "./header-toggle-button";

vi.mock("@/constants/platform", () => ({
  isWeb: true,
  isNative: false,
}));

vi.mock("@/constants/layout", () => ({
  useIsCompactFormFactor: () => false,
  getIsElectronRuntimeMac: () => false,
}));
vi.mock("@gorhom/portal", () => ({
  Portal: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@gorhom/bottom-sheet", () => ({
  useBottomSheetModalInternal: () => null,
}));

vi.mock("react-native-reanimated", () => {
  const chainable = {
    duration: () => chainable,
  };
  return {
    default: {
      View: "div",
    },
    FadeIn: chainable,
    FadeOut: chainable,
  };
});

vi.mock("react-native-unistyles", () => ({
  StyleSheet: {
    create: (styles: unknown) => styles,
  },
}));

let root: Root | null = null;
let container: HTMLElement | null = null;

beforeEach(() => {
  vi.stubGlobal("React", React);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount();
    });
  }
  container?.remove();
  root = null;
  container = null;
  vi.clearAllMocks();
});

describe("HeaderToggleButton", () => {
  it("calls onPress when interactive and not disabled", () => {
    const onPress = vi.fn();
    act(() => {
      root?.render(
        <HeaderToggleButton
          testID="test-button"
          onPress={onPress}
          tooltipLabel="Enabled action"
          tooltipKeys={[]}
          tooltipSide="top"
        >
          <Text>Icon</Text>
        </HeaderToggleButton>,
      );
    });

    const button = container?.querySelector<HTMLElement>('[data-testid="test-button"]');
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-disabled")).toBeNull();

    act(() => {
      button?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("blocks clicks when disabled but opens tooltip with reason on hover", async () => {
    const onPress = vi.fn();
    act(() => {
      root?.render(
        <HeaderToggleButton
          testID="disabled-button"
          disabled={true}
          onPress={onPress}
          tooltipLabel="OMP runtime unavailable"
          tooltipKeys={[]}
          tooltipSide="top"
          tooltipDelayDuration={0}
        >
          <Text>Icon</Text>
        </HeaderToggleButton>,
      );
    });

    const button = container?.querySelector<HTMLElement>('[data-testid="disabled-button"]');
    expect(button).not.toBeNull();

    // Before hover, the tooltip text is not mounted
    expect(document.body.textContent).not.toContain("OMP runtime unavailable");

    // Clicking does not invoke onPress
    act(() => {
      button?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    });
    expect(onPress).not.toHaveBeenCalled();

    // Hovering opens the tooltip and renders the reason label
    act(() => {
      fireEvent.mouseEnter(button!);
    });

    await waitFor(() => {
      expect(document.body.textContent).toContain("OMP runtime unavailable");
    });
  });
});
