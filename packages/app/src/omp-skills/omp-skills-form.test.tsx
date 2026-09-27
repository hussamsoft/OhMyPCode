/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmpSkillsForm } from "./omp-skills-form";

const mockRun = vi.hoisted(() =>
  vi.fn(async () => ({
    requestId: "req",
    agentInvoked: false,
    output: "Skill listing: on (session override; default from the skillful setting).",
    stateChange: false,
  })),
);
const mockSettings = vi.hoisted(() => ({
  settings: [] as Array<{ path: string; type: string; value?: unknown }>,
}));
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
  Compass: () => null,
}));

vi.mock("@/composer/omp-control-deck/use-omp-rpc", () => ({
  useOmpSlashCommand: () => ({
    run: mockRun,
    supported: mockState.supported,
    isPending: mockState.isPending,
    error: mockState.error,
    lastResult: mockState.lastResult,
  }),
  useOmpSettings: () => ({
    settings: mockSettings.settings,
    revision: 0,
    isLoading: false,
    isFetching: false,
    error: null,
    refresh: async () => undefined,
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

describe("OmpSkillsForm", () => {
  afterEach(() => {
    cleanup();
    mockRun.mockClear();
    mockSettings.settings = [];
    mockState.supported = true;
    mockState.isPending = false;
    mockState.error = null;
    mockState.lastResult = null;
  });

  it("runs 'skillful status' on mount", () => {
    render(<OmpSkillsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(mockRun).toHaveBeenCalledWith({ name: "skillful", args: "status" });
  });

  it("shows the last result's output verbatim", () => {
    mockState.lastResult = {
      output: "Skill listing: on (session override; default from the skillful setting).",
    };
    render(<OmpSkillsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-skills-report").textContent).toBe(
      "Skill listing: on (session override; default from the skillful setting).",
    );
  });

  it("runs each quick-action verb with the matching arg string", () => {
    render(<OmpSkillsForm serverId="remote" agentId="agent-1" />, { wrapper });
    mockRun.mockClear();

    fireEvent.click(screen.getByTestId("omp-skills-quick-on"));
    expect(mockRun).toHaveBeenLastCalledWith({ name: "skillful", args: "on" });

    fireEvent.click(screen.getByTestId("omp-skills-quick-off"));
    expect(mockRun).toHaveBeenLastCalledWith({ name: "skillful", args: "off" });

    fireEvent.click(screen.getByTestId("omp-skills-quick-toggle"));
    expect(mockRun).toHaveBeenLastCalledWith({ name: "skillful", args: "toggle" });
  });

  it("shows the persisted default when the skillful setting is returned", () => {
    mockSettings.settings = [
      { path: "skillful", type: "boolean", value: true },
      { path: "tools.approvalMode", type: "enum", value: "write" },
    ];
    render(<OmpSkillsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-skills-default-value").textContent).toBe(
      "agentControls.omp.skillsDefaultOn",
    );
  });

  it("falls back to 'unknown' when the skillful setting has not loaded", () => {
    render(<OmpSkillsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-skills-default-value").textContent).toBe(
      "agentControls.omp.skillsDefaultUnknown",
    );
  });

  it("shows a placeholder when serverId or agentId is missing and does not run the command", () => {
    render(<OmpSkillsForm serverId={null} agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-skills-form-placeholder")).toBeTruthy();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows a placeholder and does not call run when the server lacks slash-command support, instead of hanging on an unhandled rejection", () => {
    mockState.supported = false;
    render(<OmpSkillsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-skills-form-placeholder")).toBeTruthy();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("shows an inline error alongside the last successful output rather than replacing it", () => {
    mockState.lastResult = { output: "Skill listing: on (session override...)" };
    mockState.error = new Error("boom");
    render(<OmpSkillsForm serverId="remote" agentId="agent-1" />, { wrapper });

    expect(screen.getByTestId("omp-skills-form-error").textContent).toBe("boom");
    expect(screen.getByTestId("omp-skills-report").textContent).toBe(
      "Skill listing: on (session override...)",
    );
  });

  it("renders the TUI-only notice for /skills (registry) and can be dismissed", () => {
    render(<OmpSkillsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-skills-tui-notice")).toBeTruthy();
    fireEvent.click(screen.getByTestId("omp-skills-tui-notice-dismiss"));
    expect(screen.queryByTestId("omp-skills-tui-notice")).toBeNull();
  });
});
