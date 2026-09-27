/**
 * @vitest-environment jsdom
 *
 * Tests for the `omp_sessions` panel body. Capability-gates the panel
 * against the `supportsOmpSessionSwitch` agent flag and exercises the
 * Resume-here wiring against the typed SDK call.
 */
import React, { type ReactElement, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OmpSessionsForm } from "./omp-sessions-form";

const runtime = vi.hoisted(() => ({
  client: null as unknown,
  switchSessionAgent: vi.fn(),
  fetchRecentProviderSessions: vi.fn(),
  isConnected: true,
  capabilitiesSupportsOmpSessionSwitch: false,
  agentCwd: "/tmp/cwd" as string | null,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("lucide-react-native", () => ({
  RefreshCw: () => null,
}));

vi.mock("@/runtime/host-runtime", () => ({
  useHostRuntimeClient: () => runtime.client,
  useHostRuntimeIsConnected: () => runtime.isConnected,
}));

vi.mock("@/stores/session-store", () => ({
  useSessionStore: (selector: (state: { sessions: Record<string, unknown> }) => unknown) => {
    const state = {
      sessions: {
        "server-1": {
          agents: new Map([
            [
              "agent-1",
              {
                capabilities: {
                  supportsOmpSessionSwitch: runtime.capabilitiesSupportsOmpSessionSwitch,
                },
                cwd: runtime.agentCwd,
              },
            ],
          ]),
        },
      },
    };
    return selector(state);
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  ) as ReactElement;
}

function setupClient(): void {
  runtime.client = {
    fetchRecentProviderSessions: runtime.fetchRecentProviderSessions,
    switchSessionAgent: runtime.switchSessionAgent,
  };
  runtime.switchSessionAgent.mockResolvedValue({ cancelled: false });
}

describe("OmpSessionsForm", () => {
  afterEach(() => {
    cleanup();
    runtime.client = null;
    runtime.switchSessionAgent.mockReset();
    runtime.fetchRecentProviderSessions.mockReset();
    runtime.isConnected = true;
    runtime.capabilitiesSupportsOmpSessionSwitch = false;
    runtime.agentCwd = "/tmp/cwd";
  });

  it("renders a placeholder when serverId or agentId is missing", () => {
    runtime.capabilitiesSupportsOmpSessionSwitch = true;
    setupClient();
    runtime.fetchRecentProviderSessions.mockResolvedValue({ entries: [] });
    render(<OmpSessionsForm serverId={null} agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-sessions-form-placeholder")).toBeTruthy();
  });

  it("renders a placeholder when the agent lacks supportsOmpSessionSwitch capability", () => {
    runtime.capabilitiesSupportsOmpSessionSwitch = false;
    setupClient();
    runtime.fetchRecentProviderSessions.mockResolvedValue({ entries: [] });
    render(<OmpSessionsForm serverId="server-1" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-sessions-form-placeholder")).toBeTruthy();
    expect(screen.getByTestId("omp-sessions-form-placeholder").textContent).toBe(
      "panels.ompSessions.placeholderCapabilityMissing",
    );
  });

  it("renders the empty state when no OMP sessions are returned", async () => {
    runtime.capabilitiesSupportsOmpSessionSwitch = true;
    setupClient();
    runtime.fetchRecentProviderSessions.mockResolvedValue({ entries: [] });
    render(<OmpSessionsForm serverId="server-1" agentId="agent-1" />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("omp-sessions-form-empty")).toBeTruthy();
    });
  });

  it("renders rows and surfaces the Resume-here action when filePath is present", async () => {
    runtime.capabilitiesSupportsOmpSessionSwitch = true;
    setupClient();
    runtime.fetchRecentProviderSessions.mockResolvedValue({
      entries: [
        {
          providerId: "omp",
          providerLabel: "OMP",
          providerHandleId: "/var/folders/abc.jsonl",
          filePath: "/var/folders/abc.jsonl",
          cwd: "/tmp/cwd",
          title: "audit run",
          firstPromptPreview: "audit",
          lastPromptPreview: "audit",
          lastActivityAt: new Date().toISOString(),
        },
      ],
    });
    render(<OmpSessionsForm serverId="server-1" agentId="agent-1" />, { wrapper });
    const row = await screen.findByTestId("omp-sessions-form-row-/var/folders/abc.jsonl");
    const resume = await screen.findByTestId("omp-sessions-form-row-/var/folders/abc.jsonl-resume");
    expect(row.textContent).toContain("audit run");
    fireEvent.click(resume);
    await waitFor(() => {
      expect(runtime.switchSessionAgent).toHaveBeenCalledWith("agent-1", "/var/folders/abc.jsonl");
    });
  });

  it("disables the Resume button when an entry lacks a filePath", async () => {
    runtime.capabilitiesSupportsOmpSessionSwitch = true;
    setupClient();
    runtime.fetchRecentProviderSessions.mockResolvedValue({
      entries: [
        {
          providerId: "codex",
          providerLabel: "Codex",
          providerHandleId: "thread-1",
          cwd: "/tmp/cwd",
          title: "Hosted thread",
          firstPromptPreview: "x",
          lastPromptPreview: "x",
          lastActivityAt: new Date().toISOString(),
        },
      ],
    });
    render(<OmpSessionsForm serverId="server-1" agentId="agent-1" />, { wrapper });
    const resume = await screen.findByTestId("omp-sessions-form-row-thread-1-resume");
    expect(resume).toBeTruthy();
    fireEvent.click(resume);
    await waitFor(() => {
      expect(runtime.switchSessionAgent).not.toHaveBeenCalled();
    });
  });

  it("surfaces the runtime's cancel verdict in the resume error line", async () => {
    runtime.capabilitiesSupportsOmpSessionSwitch = true;
    setupClient();
    runtime.switchSessionAgent.mockResolvedValue({ cancelled: true });
    runtime.fetchRecentProviderSessions.mockResolvedValue({
      entries: [
        {
          providerId: "omp",
          providerLabel: "OMP",
          providerHandleId: "/var/folders/cancel.jsonl",
          filePath: "/var/folders/cancel.jsonl",
          cwd: "/tmp/cwd",
          title: "needs approval",
          firstPromptPreview: "x",
          lastPromptPreview: "x",
          lastActivityAt: new Date().toISOString(),
        },
      ],
    });
    render(<OmpSessionsForm serverId="server-1" agentId="agent-1" />, { wrapper });
    const resume = await screen.findByTestId(
      "omp-sessions-form-row-/var/folders/cancel.jsonl-resume",
    );
    fireEvent.click(resume);
    await waitFor(() => {
      expect(runtime.switchSessionAgent).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId("omp-sessions-form-error").textContent).toBe(
        "panels.ompSessions.resumeCancelled",
      );
    });
  });
});
