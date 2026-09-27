/**
 * @vitest-environment jsdom
 */
import React, { type ReactElement, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmpAgentsHubForm } from "./omp-agents-hub-form";
import type { ProviderSubagentRow, PaseoSubagentRow } from "@/subagents/select";

const runtime = vi.hoisted(() => ({
  openTab: vi.fn(),
  rows: [] as Array<ProviderSubagentRow | PaseoSubagentRow>,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("lucide-react-native", () => ({
  Users: () => null,
}));

vi.mock("@/components/provider-icons", () => ({
  getProviderIcon: () => () => null,
}));

vi.mock("@/panels/pane-context", () => ({
  usePaneContext: () => ({ openTab: runtime.openTab }),
}));

vi.mock("@/subagents/select", () => ({
  useSubagentsForParent: () => runtime.rows,
}));

function wrapper({ children }: { children: ReactNode }) {
  return children as ReactElement;
}

function makeProviderRow(overrides: Partial<ProviderSubagentRow> = {}): ProviderSubagentRow {
  return {
    kind: "provider",
    id: overrides.id ?? "sub-1",
    parentAgentId: overrides.parentAgentId ?? "parent-1",
    provider: overrides.provider ?? "codex",
    title: overrides.title ?? null,
    description: overrides.description ?? null,
    subtitle: overrides.subtitle ?? null,
    status: overrides.status ?? "completed",
    requiresAttention: overrides.requiresAttention ?? false,
    createdAt: overrides.createdAt ?? new Date("2026-09-24T00:00:00.000Z"),
  };
}

describe("OmpAgentsHubForm", () => {
  afterEach(() => {
    cleanup();
    runtime.openTab.mockClear();
    runtime.rows = [];
  });

  it("renders a placeholder when serverId or agentId is missing", () => {
    render(<OmpAgentsHubForm serverId={null} agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-agents-hub-form-placeholder")).toBeTruthy();
    expect(screen.queryByTestId("omp-agents-hub-form-empty")).toBeNull();
  });

  it("renders the empty state when no provider subagents are returned", () => {
    runtime.rows = [];
    render(<OmpAgentsHubForm serverId="server-1" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-agents-hub-form-empty")).toBeTruthy();
    expect(screen.getByTestId("omp-agents-hub-form-empty").textContent).toBe(
      "panels.ompAgentsHub.empty",
    );
  });

  it("renders a row per provider subagent and surfaces the lifecycle status", () => {
    runtime.rows = [
      makeProviderRow({
        id: "sub-running",
        description: "Inspect the repository",
        status: "running",
        createdAt: new Date("2026-09-24T01:00:00.000Z"),
      }),
      makeProviderRow({
        id: "sub-failed",
        title: "Review",
        status: "failed",
        requiresAttention: true,
        createdAt: new Date("2026-09-24T00:00:00.000Z"),
      }),
    ];
    render(<OmpAgentsHubForm serverId="server-1" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-agents-hub-row-sub-running")).toBeTruthy();
    expect(screen.getByTestId("omp-agents-hub-row-sub-running-status").textContent).toBe(
      "panels.ompAgentsHub.running",
    );
    expect(screen.getByTestId("omp-agents-hub-row-sub-failed")).toBeTruthy();
    expect(screen.getByTestId("omp-agents-hub-row-sub-failed-status").textContent).toBe(
      "panels.ompAgentsHub.failed",
    );
  });

  it("calls openTab with the provider_subagent target when a row is tapped", () => {
    runtime.rows = [
      makeProviderRow({
        id: "sub-1",
        parentAgentId: "parent-1",
        description: "Inspect the repository",
      }),
    ];
    render(<OmpAgentsHubForm serverId="server-1" agentId="agent-1" />, { wrapper });
    fireEvent.click(screen.getByTestId("omp-agents-hub-row-sub-1"));
    expect(runtime.openTab).toHaveBeenCalledWith({
      kind: "provider_subagent",
      parentAgentId: "parent-1",
      subagentId: "sub-1",
    });
  });

  it("ignores paseo rows and only renders provider subagents", () => {
    runtime.rows = [
      {
        kind: "paseo",
        id: "paseo-1",
        provider: "codex",
        title: "Paseo child",
        description: null,
        subtitle: null,
        status: "idle",
        turn: { phase: "idle", cancellationRequestId: null },
        requiresAttention: false,
        createdAt: new Date("2026-09-24T00:00:00.000Z"),
      } satisfies PaseoSubagentRow,
      makeProviderRow({ id: "sub-1", description: "Provider child" }),
    ];
    render(<OmpAgentsHubForm serverId="server-1" agentId="agent-1" />, { wrapper });
    expect(screen.queryByTestId("omp-agents-hub-row-paseo-1")).toBeNull();
    expect(screen.getByTestId("omp-agents-hub-row-sub-1")).toBeTruthy();
  });
});
