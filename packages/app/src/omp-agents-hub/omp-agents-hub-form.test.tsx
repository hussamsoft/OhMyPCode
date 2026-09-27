/**
 * @vitest-environment jsdom
 */
import React, { type ReactElement, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmpAgentsHubForm } from "./omp-agents-hub-form";
import type { ProviderSubagentRow, PaseoSubagentRow } from "@/subagents/select";
import type { OmpAvailableAgent } from "@ohmypcode/protocol/messages";

const runtime = vi.hoisted(() => ({
  openTab: vi.fn(),
  rows: [] as Array<ProviderSubagentRow | PaseoSubagentRow>,
  catalog: {
    data: null as readonly OmpAvailableAgent[] | null,
    supported: true,
    isLoading: false,
    isFetching: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
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

vi.mock("@/composer/omp-control-deck/use-omp-rpc", () => ({
  useOmpAgentCatalog: () => runtime.catalog,
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
    runtime.catalog = {
      data: null,
      supported: true,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    };
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

  it("renders the catalog unsupported caption when the capability is not advertised", () => {
    runtime.catalog = {
      data: null,
      supported: false,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    };
    render(<OmpAgentsHubForm serverId="server-1" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-agents-hub-catalog-unsupported").textContent).toBe(
      "panels.ompAgentsHub.catalog.unsupportedCaption",
    );
  });

  it("renders the catalog loading caption while a query is in flight", () => {
    runtime.catalog = {
      data: null,
      supported: true,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: vi.fn(),
    };
    render(<OmpAgentsHubForm serverId="server-1" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-agents-hub-catalog-loading").textContent).toBe(
      "panels.ompAgentsHub.catalog.loadingCatalog",
    );
  });

  it("renders the catalog error caption when the RPC fails", () => {
    runtime.catalog = {
      data: null,
      supported: true,
      isLoading: false,
      isFetching: false,
      error: new Error("RPC failed"),
      refetch: vi.fn(),
    };
    render(<OmpAgentsHubForm serverId="server-1" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-agents-hub-catalog-error").textContent).toBe(
      "panels.ompAgentsHub.catalog.errorCatalog",
    );
  });

  it("renders the catalog empty caption when the catalog is supported but empty", () => {
    runtime.catalog = {
      data: [],
      supported: true,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    };
    render(<OmpAgentsHubForm serverId="server-1" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-agents-hub-catalog-empty").textContent).toBe(
      "panels.ompAgentsHub.catalog.emptyCatalog",
    );
  });

  it("renders bundled + user rows sorted by source then name with a disabled spawn button", () => {
    runtime.catalog = {
      data: [
        {
          name: "zeta",
          description: "Project custom agent",
          source: "project",
        },
        {
          name: "alpha",
          description: "Bundled customizer",
          source: "bundled",
          tools: ["read", "edit"],
        },
        {
          name: "beta",
          description: "User-defined researcher",
          source: "user",
          model: ["opus"],
        },
      ],
      supported: true,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    };
    render(<OmpAgentsHubForm serverId="server-1" agentId="agent-1" />, { wrapper });
    const alphaRow = screen.getByTestId("omp-agents-hub-catalog-row-bundled-alpha");
    const betaRow = screen.getByTestId("omp-agents-hub-catalog-row-user-beta");
    const zetaRow = screen.getByTestId("omp-agents-hub-catalog-row-project-zeta");
    expect(alphaRow).toBeTruthy();
    expect(betaRow).toBeTruthy();
    expect(zetaRow).toBeTruthy();
    // Source-priority ordering: bundled first, user, then project. Document
    // order in the rendered tree gives us a clean sibling-order assertion;
    // the row testids end at the agent name, so filter by exact id.
    const catalogRoot = screen.getByTestId("omp-agents-hub-catalog");
    expect(
      catalogRoot.querySelector("[data-testid='omp-agents-hub-catalog-row-bundled-alpha']"),
    ).toBeTruthy();
    expect(
      catalogRoot.querySelector("[data-testid='omp-agents-hub-catalog-row-user-beta']"),
    ).toBeTruthy();
    expect(
      catalogRoot.querySelector("[data-testid='omp-agents-hub-catalog-row-project-zeta']"),
    ).toBeTruthy();
    // Sibling order: bundled row appears before user, user before project.
    const rowOrder = Array.from(
      catalogRoot.querySelectorAll(
        "[data-testid='omp-agents-hub-catalog-row-bundled-alpha'],[data-testid='omp-agents-hub-catalog-row-user-beta'],[data-testid='omp-agents-hub-catalog-row-project-zeta']",
      ),
    );
    expect(rowOrder[0]?.getAttribute("data-testid")).toBe(
      "omp-agents-hub-catalog-row-bundled-alpha",
    );
    expect(rowOrder[1]?.getAttribute("data-testid")).toBe("omp-agents-hub-catalog-row-user-beta");
    expect(rowOrder[2]?.getAttribute("data-testid")).toBe(
      "omp-agents-hub-catalog-row-project-zeta",
    );
    // Spawn button is rendered but disabled.
    const spawnButton = screen.getByTestId("omp-agents-hub-catalog-row-bundled-alpha-spawn");
    expect(spawnButton).toBeTruthy();
    // Disabled in the DOM: clicking it does not enqueue a tab or runtime
    // call. The catalog refetch mock is also untouched, so the host cannot
    // pretend to spawn one. Honesty over fake.
    fireEvent.click(spawnButton);
    expect(runtime.openTab).not.toHaveBeenCalled();
    expect(runtime.catalog.refetch).not.toHaveBeenCalled();
  });
});
