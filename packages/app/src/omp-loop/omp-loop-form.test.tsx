/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmpLoopForm } from "./omp-loop-form";

const mockSetMode = vi.hoisted(() => vi.fn(async () => ({ requestId: "req", state: {} })));
const mockState = vi.hoisted(() => ({
  modes: null as { loop: unknown } | null,
  isLoading: false,
  error: null as Error | null,
  isPending: false,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: () => undefined } as never,
}));

vi.mock("@/composer/omp-control-deck/use-omp-rpc", () => ({
  useOmpModes: () => ({ modes: mockState.modes, isLoading: mockState.isLoading }),
  useOmpModeSetter: () => ({
    setMode: mockSetMode,
    isPending: mockState.isPending,
    error: mockState.error,
    lastResult: null,
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

describe("OmpLoopForm", () => {
  afterEach(() => {
    cleanup();
    mockSetMode.mockClear();
    mockState.modes = null;
    mockState.isLoading = false;
    mockState.error = null;
    mockState.isPending = false;
  });

  it("shows a placeholder when serverId or agentId is missing", () => {
    render(<OmpLoopForm serverId={null} agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-loop-form-placeholder")).toBeTruthy();
  });

  it("shows a loading state while modes are still being fetched", () => {
    mockState.isLoading = true;
    render(<OmpLoopForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-loop-form-loading")).toBeTruthy();
  });

  it("shows the args input when no loop is active", () => {
    mockState.modes = { loop: null };
    render(<OmpLoopForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-loop-inactive")).toBeTruthy();
  });

  it("starts a loop with the raw typed argument string", () => {
    mockState.modes = { loop: null };
    render(<OmpLoopForm serverId="remote" agentId="agent-1" />, { wrapper });

    fireEvent.change(screen.getByTestId("omp-loop-args-input"), {
      target: { value: "10m --until 'bun test' fix the tests" },
    });
    fireEvent.click(screen.getByTestId("omp-loop-start"));

    expect(mockSetMode).toHaveBeenCalledWith({
      mode: "loop",
      args: "10m --until 'bun test' fix the tests",
    });
  });

  it("shows the running state, iteration limit, and condition", () => {
    mockState.modes = {
      loop: {
        state: "running",
        limit: { kind: "iterations", initial: 10, remaining: 7 },
        condition: { command: "bun test", until: true },
      },
    };
    render(<OmpLoopForm serverId="remote" agentId="agent-1" />, { wrapper });

    expect(screen.getByTestId("omp-loop-status").textContent).toBe("running");
    expect(screen.getByTestId("omp-loop-limit").textContent).toBe("7 of 10 iterations remaining");
    expect(screen.getByTestId("omp-loop-condition").textContent).toBe("until: bun test");
  });

  it("stops the loop by toggling set_mode with no args", () => {
    mockState.modes = { loop: { state: "running" } };
    render(<OmpLoopForm serverId="remote" agentId="agent-1" />, { wrapper });

    fireEvent.click(screen.getByTestId("omp-loop-stop"));

    expect(mockSetMode).toHaveBeenCalledWith({ mode: "loop" });
  });

  it("shows an inline error", () => {
    mockState.modes = { loop: null };
    mockState.error = new Error("boom");
    render(<OmpLoopForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-loop-form-error").textContent).toBe("boom");
  });
});
