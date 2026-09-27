/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmpPluginsForm } from "./omp-plugins-form";

const mockRun = vi.hoisted(() =>
  vi.fn(async () => ({
    requestId: "req",
    agentInvoked: false,
    output: "No plugins installed",
    stateChange: false,
  })),
);
const mockState = vi.hoisted(() => ({
  supported: true,
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
    supported: mockState.supported,
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

describe("OmpPluginsForm", () => {
  afterEach(() => {
    cleanup();
    mockRun.mockClear();
    mockState.supported = true;
    mockState.isPending = false;
    mockState.error = null;
    mockState.lastResult = null;
  });

  it("runs 'plugins list' on mount", () => {
    render(<OmpPluginsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(mockRun).toHaveBeenCalledWith({ name: "plugins", args: "list" });
  });

  it("shows the last result's output verbatim", () => {
    mockState.lastResult = { output: "plugin-a v1.0.0 [user]\nplugin-b v2.1.0 [project]" };
    render(<OmpPluginsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-plugins-report").textContent).toBe(
      "plugin-a v1.0.0 [user]\nplugin-b v2.1.0 [project]",
    );
  });

  it("runs each quick-action verb with no arguments", () => {
    render(<OmpPluginsForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.click(screen.getByTestId("omp-plugins-quick-help"));
    expect(mockRun).toHaveBeenCalledWith({ name: "plugins", args: "help" });
  });

  it("runs the typed argument string via the Run button", () => {
    render(<OmpPluginsForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.change(screen.getByTestId("omp-plugins-args-input"), {
      target: { value: "enable foo@bar --scope user" },
    });
    fireEvent.click(screen.getByTestId("omp-plugins-run"));

    expect(mockRun).toHaveBeenCalledWith({
      name: "plugins",
      args: "enable foo@bar --scope user",
    });
  });

  it("does not run an empty argument string", () => {
    render(<OmpPluginsForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.change(screen.getByTestId("omp-plugins-args-input"), { target: { value: "   " } });
    fireEvent.keyDown(screen.getByTestId("omp-plugins-args-input"), {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows a placeholder when serverId or agentId is missing and does not run the command", () => {
    render(<OmpPluginsForm serverId={null} agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-plugins-form-placeholder")).toBeTruthy();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows a placeholder and does not call run when the server lacks slash-command support, instead of hanging on an unhandled rejection", () => {
    mockState.supported = false;
    render(<OmpPluginsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-plugins-form-placeholder")).toBeTruthy();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows an inline error alongside the last successful output rather than replacing it", () => {
    mockState.lastResult = { output: "plugin-a v1.0.0 [user]" };
    mockState.error = new Error("boom");
    render(<OmpPluginsForm serverId="remote" agentId="agent-1" />, { wrapper });

    expect(screen.getByTestId("omp-plugins-form-error").textContent).toBe("boom");
    expect(screen.getByTestId("omp-plugins-report").textContent).toBe("plugin-a v1.0.0 [user]");
  });
});
