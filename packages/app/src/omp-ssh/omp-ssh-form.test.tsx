/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmpSshForm } from "./omp-ssh-form";

const mockRun = vi.hoisted(() =>
  vi.fn(async () => ({
    requestId: "req",
    agentInvoked: false,
    output: "No SSH hosts configured.",
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

describe("OmpSshForm", () => {
  afterEach(() => {
    cleanup();
    mockRun.mockClear();
    mockState.supported = true;
    mockState.isPending = false;
    mockState.error = null;
    mockState.lastResult = null;
  });

  it("runs 'ssh list' on mount", () => {
    render(<OmpSshForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(mockRun).toHaveBeenCalledWith({ name: "ssh", args: "list" });
  });

  it("shows the last result's output verbatim", () => {
    mockState.lastResult = { output: "host-a\nhost-b" };
    render(<OmpSshForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-ssh-report").textContent).toBe("host-a\nhost-b");
  });

  it("runs the help quick verb with no arguments", () => {
    render(<OmpSshForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.click(screen.getByTestId("omp-ssh-quick-help"));
    expect(mockRun).toHaveBeenCalledWith({ name: "ssh", args: "help" });
  });

  it("runs the typed argument string via the Run button", () => {
    render(<OmpSshForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.change(screen.getByTestId("omp-ssh-args-input"), {
      target: { value: "add my-host --host example.com" },
    });
    fireEvent.click(screen.getByTestId("omp-ssh-run"));

    expect(mockRun).toHaveBeenCalledWith({ name: "ssh", args: "add my-host --host example.com" });
  });

  it("does not run an empty argument string", () => {
    render(<OmpSshForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.change(screen.getByTestId("omp-ssh-args-input"), { target: { value: "   " } });
    fireEvent.keyDown(screen.getByTestId("omp-ssh-args-input"), {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows a placeholder when serverId or agentId is missing and does not run the command", () => {
    render(<OmpSshForm serverId={null} agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-ssh-form-placeholder")).toBeTruthy();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows a placeholder and does not call run when the server lacks slash-command support", () => {
    mockState.supported = false;
    render(<OmpSshForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-ssh-form-placeholder")).toBeTruthy();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows an inline error alongside the last successful output rather than replacing it", () => {
    mockState.lastResult = { output: "host-a" };
    mockState.error = new Error("boom");
    render(<OmpSshForm serverId="remote" agentId="agent-1" />, { wrapper });

    expect(screen.getByTestId("omp-ssh-form-error").textContent).toBe("boom");
    expect(screen.getByTestId("omp-ssh-report").textContent).toBe("host-a");
  });
});
