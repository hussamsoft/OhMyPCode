/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmpMcpForm } from "./omp-mcp-form";

const mockRun = vi.hoisted(() =>
  vi.fn(async () => ({
    requestId: "req",
    agentInvoked: false,
    output: "No MCP servers configured.",
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

describe("OmpMcpForm", () => {
  afterEach(() => {
    cleanup();
    mockRun.mockClear();
    mockState.isPending = false;
    mockState.error = null;
    mockState.lastResult = null;
  });

  it("runs 'mcp list' on mount", () => {
    render(<OmpMcpForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(mockRun).toHaveBeenCalledWith({ name: "mcp", args: "list" });
  });

  it("shows the last result's output verbatim", () => {
    mockState.lastResult = { output: "server-a: enabled\nserver-b: disabled" };
    render(<OmpMcpForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-mcp-report").textContent).toBe(
      "server-a: enabled\nserver-b: disabled",
    );
  });

  it("runs each quick-action verb with no arguments", () => {
    render(<OmpMcpForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.click(screen.getByTestId("omp-mcp-quick-reload"));
    expect(mockRun).toHaveBeenCalledWith({ name: "mcp", args: "reload" });

    fireEvent.click(screen.getByTestId("omp-mcp-quick-resources"));
    expect(mockRun).toHaveBeenCalledWith({ name: "mcp", args: "resources" });
  });

  it("runs the typed argument string via the Run button", () => {
    render(<OmpMcpForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.change(screen.getByTestId("omp-mcp-args-input"), {
      target: { value: "enable my-server" },
    });
    fireEvent.click(screen.getByTestId("omp-mcp-run"));

    expect(mockRun).toHaveBeenCalledWith({ name: "mcp", args: "enable my-server" });
  });

  it("does not run an empty argument string", () => {
    render(<OmpMcpForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.change(screen.getByTestId("omp-mcp-args-input"), { target: { value: "   " } });
    fireEvent.keyDown(screen.getByTestId("omp-mcp-args-input"), {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows a placeholder when serverId or agentId is missing and does not run the command", () => {
    render(<OmpMcpForm serverId={null} agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-mcp-form-placeholder")).toBeTruthy();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows an inline error alongside the last successful output rather than replacing it", () => {
    mockState.lastResult = { output: "server-a: enabled" };
    mockState.error = new Error("boom");
    render(<OmpMcpForm serverId="remote" agentId="agent-1" />, { wrapper });

    expect(screen.getByTestId("omp-mcp-form-error").textContent).toBe("boom");
    expect(screen.getByTestId("omp-mcp-report").textContent).toBe("server-a: enabled");
  });
});
