/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmpGoalForm } from "./omp-goal-form";

const mockSetMode = vi.hoisted(() => vi.fn(async () => ({ requestId: "req", state: {} })));
const mockGoalAction = vi.hoisted(() => vi.fn(async () => ({ requestId: "req", state: {} })));
const mockState = vi.hoisted(() => ({
  modes: null as { goal: unknown } | null,
  isLoading: false,
  setterError: null as Error | null,
  actionError: null as Error | null,
  isEntering: false,
  isActing: false,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: () => undefined } as never,
}));

vi.mock("@/composer/omp-control-deck/use-omp-rpc", () => ({
  useOmpModes: () => ({ modes: mockState.modes, isLoading: mockState.isLoading }),
  useOmpModeSetter: () => ({
    setMode: mockSetMode,
    isPending: mockState.isEntering,
    error: mockState.setterError,
    lastResult: null,
  }),
  useOmpGoalAction: () => ({
    goalAction: mockGoalAction,
    isPending: mockState.isActing,
    error: mockState.actionError,
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

describe("OmpGoalForm", () => {
  afterEach(() => {
    cleanup();
    mockSetMode.mockClear();
    mockGoalAction.mockClear();
    mockState.modes = null;
    mockState.isLoading = false;
    mockState.setterError = null;
    mockState.actionError = null;
    mockState.isEntering = false;
    mockState.isActing = false;
  });

  it("shows a placeholder when serverId or agentId is missing", () => {
    render(<OmpGoalForm serverId={null} agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-goal-form-placeholder")).toBeTruthy();
  });

  it("shows a loading state while modes are still being fetched", () => {
    mockState.isLoading = true;
    render(<OmpGoalForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-goal-form-loading")).toBeTruthy();
  });

  it("shows the objective and token budget inputs when no goal is active", () => {
    mockState.modes = { goal: null };
    render(<OmpGoalForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-goal-inactive")).toBeTruthy();
    expect(screen.getByTestId("omp-goal-start")).toHaveProperty("disabled", true);
  });

  it("starts a goal with the typed objective and token budget", () => {
    mockState.modes = { goal: null };
    render(<OmpGoalForm serverId="remote" agentId="agent-1" />, { wrapper });

    fireEvent.change(screen.getByTestId("omp-goal-objective-input"), {
      target: { value: "ship the thing" },
    });
    fireEvent.change(screen.getByTestId("omp-goal-token-budget-input"), {
      target: { value: "50000" },
    });
    fireEvent.click(screen.getByTestId("omp-goal-start"));

    expect(mockSetMode).toHaveBeenCalledWith({
      mode: "goal",
      objective: "ship the thing",
      tokenBudget: 50_000,
    });
  });

  it("does not start a goal with a blank objective", () => {
    mockState.modes = { goal: null };
    render(<OmpGoalForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-goal-start")).toHaveProperty("disabled", true);
    expect(mockSetMode).not.toHaveBeenCalled();
  });

  it("shows the active goal's objective, status, and stats with pause/drop actions", () => {
    mockState.modes = {
      goal: {
        id: "goal-1",
        objective: "ship the thing",
        status: "active",
        tokenBudget: 2000,
        tokensUsed: 345,
        timeUsedSeconds: 75,
      },
    };
    render(<OmpGoalForm serverId="remote" agentId="agent-1" />, { wrapper });

    expect(screen.getByTestId("omp-goal-objective").textContent).toBe("ship the thing");
    expect(screen.getByTestId("omp-goal-status").textContent).toBe("active");
    expect(screen.getByTestId("omp-goal-tokens-used").textContent).toBe("345 / 2000");
    expect(screen.getByTestId("omp-goal-pause")).toBeTruthy();
    expect(screen.getByTestId("omp-goal-drop")).toBeTruthy();
    expect(screen.queryByTestId("omp-goal-resume")).toBeNull();
  });

  it("shows resume instead of pause when the goal is paused", () => {
    mockState.modes = {
      goal: {
        id: "goal-1",
        objective: "ship the thing",
        status: "paused",
        tokensUsed: 10,
        timeUsedSeconds: 5,
      },
    };
    render(<OmpGoalForm serverId="remote" agentId="agent-1" />, { wrapper });

    expect(screen.getByTestId("omp-goal-resume")).toBeTruthy();
    expect(screen.queryByTestId("omp-goal-pause")).toBeNull();
  });

  it("calls goalAction with the matching verb for pause, resume, and drop", () => {
    mockState.modes = {
      goal: { id: "goal-1", objective: "x", status: "active", tokensUsed: 0, timeUsedSeconds: 0 },
    };
    const { rerender } = render(<OmpGoalForm serverId="remote" agentId="agent-1" />, { wrapper });

    fireEvent.click(screen.getByTestId("omp-goal-pause"));
    expect(mockGoalAction).toHaveBeenCalledWith("pause");

    fireEvent.click(screen.getByTestId("omp-goal-drop"));
    expect(mockGoalAction).toHaveBeenCalledWith("drop");

    mockState.modes = {
      goal: { id: "goal-1", objective: "x", status: "paused", tokensUsed: 0, timeUsedSeconds: 0 },
    };
    rerender(<OmpGoalForm serverId="remote" agentId="agent-1" />);
    fireEvent.click(screen.getByTestId("omp-goal-resume"));
    expect(mockGoalAction).toHaveBeenCalledWith("resume");
  });

  it("shows an inline error from either the setter or the action hook", () => {
    mockState.modes = { goal: null };
    mockState.setterError = new Error("boom");
    render(<OmpGoalForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-goal-form-error").textContent).toBe("boom");
  });
});
