/**
 * @vitest-environment jsdom
 */
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AgentToolDefinition } from "@getpaseo/protocol/agent-types";
import { OmpControlDeck, type OmpToolControls } from "./index";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params && params.count !== undefined ? `${key}(${params.count})` : key,
  }),
}));
vi.mock("@/components/adaptive-modal-sheet", () => ({
  AdaptiveModalSheet: ({
    visible,
    children,
    testID,
  }: {
    visible?: boolean;
    children?: React.ReactNode;
    testID?: string;
  }) => (visible ? <div data-testid={testID}>{children}</div> : null),
}));
vi.mock("@/components/ui/combobox", () => ({
  Combobox: () => null,
  ComboboxItem: () => null,
}));
vi.mock("@/composer/agent-controls/mode-control", () => ({
  AgentModeControl: () => null,
}));
vi.mock("lucide-react-native", () => {
  const MockIcon = () => null;
  return {
    BookOpen: MockIcon,
    Bot: MockIcon,
    Brain: MockIcon,
    ChevronDown: MockIcon,
    Compass: MockIcon,
    Expand: MockIcon,
    Feather: MockIcon,
    Footprints: MockIcon,
    ListTodo: MockIcon,
    Map: MockIcon,
    Monitor: MockIcon,
    Settings2: MockIcon,
    Shield: MockIcon,
    ShieldAlert: MockIcon,
    ShieldCheck: MockIcon,
    ShieldEllipsis: MockIcon,
    ShieldOff: MockIcon,
    ShieldPlus: MockIcon,
    ShieldQuestionMark: MockIcon,
    Sparkles: MockIcon,
    Turtle: MockIcon,
    UserCheck: MockIcon,
    Wrench: MockIcon,
    Zap: MockIcon,
  };
});
vi.mock("@/utils/tool-call-icon", () => ({
  resolveToolCallIcon: () => () => null,
}));

const tools: AgentToolDefinition[] = [
  {
    name: "read",
    label: "Read",
    description: "Read files",
    source: "native",
    enabled: true,
    required: true,
  },
];

const MODEL_SELECTOR = <span>model</span>;
const EMPTY_THINKING_OPTIONS: readonly { id: string; label: string }[] = [];
const NOOP_THINKING = () => {};
const ACCESS_PROPS = {
  provider: "omp" as const,
  providerDefinitions: [],
  modeOptions: [],
  selectedModeId: null,
  onSelectMode: () => {},
};
const VIBE_PROPS = {
  enabled: true,
  canUse: true,
  setEnabled: () => {},
};

function renderDeck(controls: OmpToolControls) {
  return render(
    <OmpControlDeck
      source="draft"
      modelSelector={MODEL_SELECTOR}
      thinkingOptions={EMPTY_THINKING_OPTIONS}
      onSelectThinking={NOOP_THINKING}
      access={ACCESS_PROPS}
      vibe={VIBE_PROPS}
      tools={controls}
    />,
  );
}

function toolsControl(container: HTMLElement): HTMLElement {
  const control = container.querySelector<HTMLElement>('[data-testid="omp-tools-control"]');
  if (!control) {
    throw new Error("tools control not rendered");
  }
  return control;
}

describe("OMP control deck tools control", () => {
  it("reports a live tool count while the host can resolve tools", () => {
    const { container } = renderDeck({
      rows: tools,
      canUse: true,
      list: async () => tools,
      set: async () => tools,
    });

    const control = toolsControl(container);
    expect(control.getAttribute("aria-disabled")).not.toBe("true");
    expect(control.getAttribute("aria-label")).toContain("agentControls.omp.toolCount");
    expect(container.textContent).toContain("agentControls.omp.toolCount");
  });

  it("disables the control and explains itself instead of silently no-opping", () => {
    const { container } = renderDeck({
      rows: [],
      canUse: false,
      savedSelection: [],
      list: async () => [],
      set: async () => [],
    });

    const control = toolsControl(container);
    expect(control.getAttribute("aria-disabled")).toBe("true");
    expect(control.getAttribute("aria-label")).toContain("agentControls.omp.toolsUnavailable");
    expect(container.textContent).toContain("agentControls.omp.toolsUnavailable");
    // No tool count is claimed while the host cannot resolve the tool list.
    expect(container.textContent).not.toContain("agentControls.omp.toolCount");
  });

  it("names the preserved selection so a saved choice never reads as lost", () => {
    const { container } = renderDeck({
      rows: [],
      canUse: false,
      savedSelection: ["read", "write"],
      list: async () => [],
      set: async () => [],
    });

    const control = toolsControl(container);
    expect(control.getAttribute("aria-label")).toContain(
      "agentControls.omp.toolsUnavailableSaved(2)",
    );
    expect(container.textContent).toContain("agentControls.omp.toolsUnavailableSaved(2)");
  });

  it("does not open the tool sheet from a disabled control", () => {
    const { container, queryByTestId } = renderDeck({
      rows: [],
      canUse: false,
      savedSelection: ["read"],
      list: async () => [],
      set: async () => [],
    });

    fireEvent.click(toolsControl(container));

    expect(queryByTestId("omp-tools-sheet")).toBeNull();
  });
});
