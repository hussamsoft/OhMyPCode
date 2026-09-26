/**
 * @vitest-environment jsdom
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Text } from "react-native";
import type { OmpHookWidgetState } from "@ohmypcode/protocol/messages";
import { OmpHookWidget } from "@/omp-ui/hook-widget/hook-widget";
import { disposeOmpHookState, seedOmpHookState, useOmpHookStore } from "@/omp-ui/hook-widget/store";

beforeEach(() => {
  // Stub `React` as a global so the classic JSX transform (`jsx: react-native`
  // in `tsconfig`) resolves without an explicit `import React` in component
  // files -- mirrors `mode-badge.test.tsx`.
  vi.stubGlobal("React", React);
  disposeOmpHookState("agent-1");
});

afterEach(() => {
  cleanup();
  disposeOmpHookState("agent-1");
  vi.unstubAllGlobals();
});

function seedWidget(widget: OmpHookWidgetState) {
  useOmpHookStore.getState().publishWidget("agent-1", widget);
}

describe("OmpHookWidget", () => {
  it("renders nothing when no widget is registered for the agent", () => {
    const { queryByTestId } = render(<OmpHookWidget agentId="agent-1" placement="aboveEditor" />);
    expect(queryByTestId("omp-hook-widget-aboveEditor")).toBeNull();
  });

  it("renders nothing for the opposite placement", () => {
    seedWidget({
      widgetKey: "plan-todos",
      widgetLines: ["- [ ] first"],
      widgetPlacement: "belowEditor",
    });
    const { queryByTestId } = render(<OmpHookWidget agentId="agent-1" placement="aboveEditor" />);
    expect(queryByTestId("omp-hook-widget-aboveEditor")).toBeNull();
  });

  it("renders the widget body when the placement matches", () => {
    seedWidget({
      widgetKey: "plan-todos",
      widgetLines: ["- [ ] first", "- [x] second"],
      widgetPlacement: "aboveEditor",
    });
    const { getByTestId, getByText } = render(
      <OmpHookWidget agentId="agent-1" placement="aboveEditor" />,
    );
    expect(getByTestId("omp-hook-widget-aboveEditor")).not.toBeNull();
    expect(getByText("- [ ] first")).not.toBeNull();
    expect(getByText("- [x] second")).not.toBeNull();
  });

  it("truncates beyond the vendor MAX_WIDGET_LINES=10 cap", () => {
    seedWidget({
      widgetKey: "plan-todos",
      widgetLines: Array.from({ length: 12 }, (_, i) => `line-${i + 1}`),
    });
    const { queryByText, getByText } = render(
      <OmpHookWidget agentId="agent-1" placement="aboveEditor" />,
    );
    // 10 cap surfaces as 9 visible lines + the truncation marker.
    expect(getByText("line-1")).not.toBeNull();
    expect(getByText("line-9")).not.toBeNull();
    expect(queryByText("line-10")).toBeNull();
    expect(getByText("... (widget truncated)")).not.toBeNull();
  });

  it("renders nothing when widgetLines is empty (cleared)", () => {
    seedWidget({ widgetKey: "plan-todos", widgetLines: [] });
    const { queryByTestId } = render(<OmpHookWidget agentId="agent-1" placement="aboveEditor" />);
    expect(queryByTestId("omp-hook-widget-aboveEditor")).toBeNull();
  });

  it("bare mode renders lines without chrome", () => {
    seedWidget({
      widgetKey: "plan-todos",
      widgetLines: ["- [ ] first"],
      widgetPlacement: "aboveEditor",
    });
    const { getByText, getByTestId } = render(
      <Text>
        <OmpHookWidget agentId="agent-1" placement="aboveEditor" bare />
      </Text>,
    );
    // Still finds the testID and the line content even in bare mode.
    expect(getByTestId("omp-hook-widget-aboveEditor")).not.toBeNull();
    expect(getByText("- [ ] first")).not.toBeNull();
  });

  it("hydrates from a snapshot via seedOmpHookState", () => {
    seedOmpHookState({
      agentId: "agent-1",
      widget: {
        widgetKey: "plan-todos",
        widgetLines: ["hydrated"],
        widgetPlacement: "aboveEditor",
      },
    });
    const { getByText } = render(<OmpHookWidget agentId="agent-1" placement="aboveEditor" />);
    expect(getByText("hydrated")).not.toBeNull();
  });
});
