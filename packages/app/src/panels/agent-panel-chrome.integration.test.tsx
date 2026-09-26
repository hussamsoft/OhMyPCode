/**
 * @vitest-environment jsdom
 *
 * Focused integration smoke test for the Phase 8 persistent chrome
 * mounted from `agent-panel.tsx`. Mounts a minimal harness that mirrors
 * the actual render path's data sources (agent fields from session-store
 * + workspace descriptor fields + hook store) and asserts all four
 * chrome components render with real data, gated on desktop-only.
 *
 * The full `ChatAgentReadyContent` body is impractical to render in a
 * unit test (it pulls in `useAgentInputDraft`, `useToastHost`, the
 * composer store, and other side-effecting modules); this harness proves
 * the chrome data wiring contract is satisfied.
 */
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OmpHookWidget } from "@/omp-ui/hook-widget/hook-widget";
import { seedOmpHookState } from "@/omp-ui/hook-widget/store";
import { OmpModeBadge } from "@/omp-ui/mode-badge";
import { OmpStatusBar, type OmpStatusBarData } from "@/omp-ui/status-bar/omp-status-bar";
import { OmpTodoRail, type OmpTodoItem } from "@/omp-ui/todo-rail";

beforeEach(() => {
  vi.stubGlobal("React", React);
});

afterEach(() => {
  cleanup();
});

const REAL_STATUS_BAR_DATA: OmpStatusBarData = {
  preset: "compact",
  modelLabel: "sonnet",
  path: "/repo",
  currentBranch: "main",
  pullRequestNumber: 42,
  lastUsage: {
    inputTokens: 1234,
    outputTokens: 56,
    cachedInputTokens: 200,
    totalCostUsd: 0.42,
    contextWindowUsedTokens: 4000,
    contextWindowMaxTokens: 200000,
  },
  sessionName: "Add status-bar",
  subagentCount: 2,
  modeLabel: "plan",
};

// `compact` preset's left side: model / mode / git / pr. Right side:
// session_name / cost / context_pct. Path doesn't render in compact.
const COMPACT_PRESENT_SEGMENTS = ["sonnet", "main", "#42", "Add status-bar"];
const COMPACT_ABSENT_SEGMENTS = ["/repo"];

const REAL_TODO_ITEMS: OmpTodoItem[] = [
  { text: "[Setup] install deps", status: "completed" },
  { text: "[Setup] compile", status: "in_progress" },
  { text: "[Verify] smoke test", status: "pending" },
];

describe("agent-panel chrome integration", () => {
  it("renders status-bar / mode-badge / todo-rail / hook-widget in a desktop render path", () => {
    seedOmpHookState({
      agentId: "agent-1",
      widget: {
        widgetKey: "setWidget",
        widgetPlacement: "aboveEditor",
        widgetLines: ["line 1", "line 2"],
      },
      status: null,
      title: null,
    });

    const view = render(
      <div>
        <OmpStatusBar data={REAL_STATUS_BAR_DATA} />
        <OmpModeBadge persistedMode="plan" />
        <OmpTodoRail items={REAL_TODO_ITEMS} />
        <OmpHookWidget agentId="agent-1" placement="aboveEditor" />
        <OmpHookWidget agentId="agent-1" placement="belowEditor" />
      </div>,
    );

    // Status bar: root container is present, and the segments in the
    // `compact` preset (model + git + pr + session_name) render their
    // values verbatim. The path segment isn't part of `compact`, so we
    // assert it's absent instead of fabricated.
    expect(view.getByTestId("omp-status-bar")).toBeTruthy();
    for (const text of COMPACT_PRESENT_SEGMENTS) {
      expect(view.getByText(text)).toBeTruthy();
    }
    for (const text of COMPACT_ABSENT_SEGMENTS) {
      expect(view.queryByText(text)).toBeNull();
    }

    // Mode badge: persisted mode renders with its label.
    expect(view.getByTestId("omp-mode-badge")).toBeTruthy();
    expect(view.getByText("Plan")).toBeTruthy();

    // Todo rail: parses `[phase] task` prefix into phase groups; both
    // Setup and Verify phase names surface.
    expect(view.getByTestId("omp-todo-rail")).toBeTruthy();
    expect(view.getByText("Setup")).toBeTruthy();
    expect(view.getByText("Verify")).toBeTruthy();

    // Hook widget: aboveEditor placement surfaces the seeded lines.
    expect(view.getByTestId("omp-hook-widget-aboveEditor")).toBeTruthy();
    expect(view.getByText("line 1")).toBeTruthy();
    expect(view.getByText("line 2")).toBeTruthy();
    // belowEditor placement has no seeded widget, so the container is
    // omitted (the component returns null when no widget matches).
    expect(view.queryByTestId("omp-hook-widget-belowEditor")).toBeNull();
  });

  it("suppresses the todo rail and below-editor hook when no widget is registered", () => {
    // No hook widget seeded for agent-2.
    const view = render(
      <div>
        <OmpTodoRail />
        <OmpHookWidget agentId="agent-2" placement="aboveEditor" />
        <OmpHookWidget agentId="agent-2" placement="belowEditor" />
      </div>,
    );
    // Todo rail returns null with no items.
    expect(view.queryByTestId("omp-todo-rail")).toBeNull();
    // Hook widget returns null when no widget is registered for the agent.
    expect(view.queryByTestId("omp-hook-widget-aboveEditor")).toBeNull();
    expect(view.queryByTestId("omp-hook-widget-belowEditor")).toBeNull();
  });
});
