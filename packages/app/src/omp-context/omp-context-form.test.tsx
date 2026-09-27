/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmpContextForm } from "./omp-context-form";

const mockRun = vi.hoisted(() =>
  vi.fn(async () => ({
    requestId: "req",
    agentInvoked: false,
    output: "Context window: 100000 tokens (10% used)",
    stateChange: false,
  })),
);
const mockState = vi.hoisted(() => ({
  isPending: false,
  error: null as Error | null,
  lastResult: null as { output: string } | null,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: () => undefined } as never,
}));

vi.mock("lucide-react-native", () => ({
  RefreshCw: () => null,
}));

vi.mock("@/composer/omp-control-deck/use-omp-rpc", () => ({
  useOmpSlashCommand: () => ({
    run: mockRun,
    isPending: mockState.isPending,
    error: mockState.error,
    lastResult: mockState.lastResult,
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

describe("OmpContextForm", () => {
  afterEach(() => {
    cleanup();
    mockRun.mockClear();
    mockState.isPending = false;
    mockState.error = null;
    mockState.lastResult = null;
  });

  it("runs the context command on mount and shows the report text verbatim", async () => {
    render(<OmpContextForm serverId="remote" agentId="agent-1" />, { wrapper });

    expect(mockRun).toHaveBeenCalledWith({ name: "context" });
  });

  it("shows the last result's output in a report block", () => {
    mockState.lastResult = { output: "Context window: 50000 tokens (5% used)" };
    render(<OmpContextForm serverId="remote" agentId="agent-1" />, { wrapper });

    expect(screen.getByTestId("omp-context-report").textContent).toBe(
      "Context window: 50000 tokens (5% used)",
    );
  });

  it("re-runs the command when the refresh button is pressed", () => {
    mockState.lastResult = { output: "Context window: 50000 tokens" };
    render(<OmpContextForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.click(screen.getByTestId("omp-context-refresh"));
    expect(mockRun).toHaveBeenCalledWith({ name: "context" });
  });

  it("shows a placeholder when serverId or agentId is missing and does not run the command", () => {
    render(<OmpContextForm serverId={null} agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-context-form-placeholder")).toBeTruthy();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows a loading state before the first result arrives", () => {
    mockState.isPending = true;
    render(<OmpContextForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-context-form-loading")).toBeTruthy();
  });

  it("shows a retryable error state when the fetch fails with no cached result", () => {
    mockState.error = new Error("boom");
    render(<OmpContextForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-context-form-error")).toBeTruthy();
    expect(screen.getByText("boom")).toBeTruthy();
  });
});
