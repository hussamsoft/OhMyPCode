/** @vitest-environment jsdom */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  ompModesQueryKey,
  ompSettingsQueryKey,
  useOmpGoalAction,
  useOmpModeSetter,
  useOmpModes,
  useOmpSettingSetter,
  useOmpSettings,
  useOmpSettingsUpdate,
  useOmpSlashCommand,
} from "./use-omp-rpc";

interface FakeRpcClient {
  getOmpModes?: Mock;
  setOmpMode?: Mock;
  goalAction?: Mock;
  getOmpSettings?: Mock;
  setOmpSetting?: Mock;
  runOmpSlashCommand?: Mock;
}

interface FakeRuntime {
  connected: boolean;
  sessions: Map<string, unknown>;
  clients: Map<string, FakeRpcClient>;
}

const runtime: FakeRuntime = vi.hoisted(() => ({
  connected: true,
  sessions: new Map<string, unknown>(),
  clients: new Map<string, FakeRpcClient>(),
}));

vi.mock("@/runtime/host-runtime", () => ({
  useHostRuntimeClient: (serverId: string) => runtime.clients.get(serverId) ?? null,
  useHostRuntimeIsConnected: () => runtime.connected,
}));

vi.mock("@/stores/session-store", () => ({
  useSessionStore: (selector: (state: { sessions: Record<string, unknown> }) => unknown) =>
    selector({ sessions: Object.fromEntries(runtime.sessions) }),
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

function installClient(serverId: string, methods: FakeRpcClient) {
  runtime.clients.set(serverId, methods);
}

function installSession(serverId: string, features: Record<string, boolean>) {
  runtime.sessions.set(serverId, {
    serverInfo: { features },
    agents: new Map(),
  });
}

beforeEach(() => {
  runtime.connected = true;
  runtime.sessions.clear();
  runtime.clients.clear();
});

describe("useOmpModes", () => {
  it("fetches modes from the daemon client when supported", async () => {
    installSession("server-1", { ompModes: true });
    installClient("server-1", {
      getOmpModes: vi.fn(async () => ({
        requestId: "req-1",
        state: {
          mode: "plan",
          planModeEnabled: true,
          planModePaused: false,
          goalModeEnabled: false,
          goalModePaused: false,
          loopModeEnabled: false,
          loopModePaused: false,
          canEnter: true,
        },
      })),
      setOmpMode: vi.fn(),
    });

    const { result } = renderHook(() => useOmpModes("server-1", "agent-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.modes?.mode).toBe("plan");
    expect(runtime.clients.get("server-1")!.getOmpModes).toHaveBeenCalledWith("agent-1");
  });

  it("stays loading when the OMP modes feature is not advertised", async () => {
    installSession("server-1", { ompModes: false });
    const getOmpModes = vi.fn();
    installClient("server-1", { getOmpModes, setOmpMode: vi.fn() });

    const { result } = renderHook(() => useOmpModes("server-1", "agent-1"), {
      wrapper,
    });

    expect(result.current.modes).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(getOmpModes).not.toHaveBeenCalled();
  });

  it("refetches when runtimeInfo.extra.modes changes independently of this hook's own mutations", async () => {
    installSession("server-1", { ompModes: true });
    const session = runtime.sessions.get("server-1") as { agents: Map<string, unknown> };
    session.agents.set("agent-1", { runtimeInfo: { extra: {} } });
    const getOmpModes = vi.fn(async () => ({
      requestId: "req-1",
      state: {
        mode: "goal",
        planModeEnabled: false,
        planModePaused: false,
        goalModeEnabled: true,
        goalModePaused: false,
        loopModeEnabled: false,
        loopModePaused: false,
        canEnter: true,
      },
    }));
    installClient("server-1", { getOmpModes, setOmpMode: vi.fn() });

    const { result, rerender } = renderHook(() => useOmpModes("server-1", "agent-1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getOmpModes).toHaveBeenCalledTimes(1);

    // Simulate an agent-driven push (tool-completed, budget-limited) landing
    // on runtimeInfo.extra.modes without this hook's own mutation hooks
    // ever running -- the invalidation must come from the push itself.
    session.agents.set("agent-1", {
      runtimeInfo: { extra: { modes: { mode: "goal_paused", goalModePaused: true } } },
    });
    rerender();

    await waitFor(() => expect(getOmpModes).toHaveBeenCalledTimes(2));
  });
});

describe("useOmpModeSetter", () => {
  it("calls setOmpMode and invalidates the modes query", async () => {
    installSession("server-1", { ompModes: true });
    const setOmpMode = vi.fn(async () => ({
      requestId: "req-2",
      state: {
        mode: "goal",
        planModeEnabled: false,
        planModePaused: false,
        goalModeEnabled: true,
        goalModePaused: false,
        loopModeEnabled: false,
        loopModePaused: false,
        canEnter: true,
      },
      changed: true,
    }));
    installClient("server-1", {
      getOmpModes: vi.fn(async () => ({
        requestId: "req-1",
        state: {
          mode: "plan",
          planModeEnabled: true,
          planModePaused: false,
          goalModeEnabled: false,
          goalModePaused: false,
          loopModeEnabled: false,
          loopModePaused: false,
          canEnter: true,
        },
      })),
      setOmpMode,
    });

    const { result } = renderHook(
      () => ({
        setter: useOmpModeSetter("server-1", "agent-1"),
        query: useOmpModes("server-1", "agent-1"),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.query.modes?.mode).toBe("plan"));

    await act(async () => {
      const response = await result.current.setter.setMode({ mode: "goal" });
      expect(response.state.mode).toBe("goal");
    });

    expect(setOmpMode).toHaveBeenCalledWith("agent-1", "goal", undefined, {
      objective: undefined,
      tokenBudget: undefined,
      args: undefined,
    });
    expect(result.current.setter.error).toBeNull();
    expect(result.current.setter.isPending).toBe(false);
  });

  it("refuses to call when the OMP modes feature is not advertised", async () => {
    installSession("server-1", { ompModes: false });
    const setOmpMode = vi.fn();
    installClient("server-1", { getOmpModes: vi.fn(), setOmpMode });

    const { result } = renderHook(() => useOmpModeSetter("server-1", "agent-1"), { wrapper });

    await expect(result.current.setMode({ mode: "loop" })).rejects.toThrow(
      /omp modes capability unavailable/i,
    );
    expect(setOmpMode).not.toHaveBeenCalled();
  });

  it("passes objective, tokenBudget, and args through to setOmpMode", async () => {
    installSession("server-1", { ompModes: true });
    const setOmpMode = vi.fn(async () => ({
      requestId: "req-3",
      state: {
        mode: "goal",
        planModeEnabled: false,
        planModePaused: false,
        goalModeEnabled: true,
        goalModePaused: false,
        loopModeEnabled: false,
        loopModePaused: false,
        canEnter: true,
      },
      changed: true,
    }));
    installClient("server-1", { getOmpModes: vi.fn(), setOmpMode });

    const { result } = renderHook(() => useOmpModeSetter("server-1", "agent-1"), { wrapper });

    await act(async () => {
      await result.current.setMode({ mode: "goal", objective: "ship it", tokenBudget: 50_000 });
    });

    expect(setOmpMode).toHaveBeenCalledWith("agent-1", "goal", undefined, {
      objective: "ship it",
      tokenBudget: 50_000,
      args: undefined,
    });
  });
});

describe("useOmpGoalAction", () => {
  it("calls goalAction and invalidates the modes query", async () => {
    installSession("server-1", { ompModes: true });
    const goalAction = vi.fn(async () => ({
      requestId: "req-4",
      state: {
        mode: "goal_paused",
        planModeEnabled: false,
        planModePaused: false,
        goalModeEnabled: false,
        goalModePaused: true,
        loopModeEnabled: false,
        loopModePaused: false,
        canEnter: true,
      },
    }));
    installClient("server-1", { getOmpModes: vi.fn(), goalAction });

    const { result } = renderHook(() => useOmpGoalAction("server-1", "agent-1"), { wrapper });

    let response: Awaited<ReturnType<typeof result.current.goalAction>> | undefined;
    await act(async () => {
      response = await result.current.goalAction("pause");
    });

    expect(goalAction).toHaveBeenCalledWith("agent-1", "pause");
    expect(response?.state.mode).toBe("goal_paused");
    expect(result.current.error).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  it("refuses to call when the OMP modes feature is not advertised", async () => {
    installSession("server-1", { ompModes: false });
    const goalAction = vi.fn();
    installClient("server-1", { getOmpModes: vi.fn(), goalAction });

    const { result } = renderHook(() => useOmpGoalAction("server-1", "agent-1"), { wrapper });

    await expect(result.current.goalAction("drop")).rejects.toThrow(
      /omp modes capability unavailable/i,
    );
    expect(goalAction).not.toHaveBeenCalled();
  });
});

describe("useOmpSettings + useOmpSettingSetter", () => {
  it("loads settings and exposes them as the canonical entry list", async () => {
    installSession("server-1", { ompSettings: true });
    installClient("server-1", {
      getOmpSettings: vi.fn(async () => ({
        requestId: "req-3",
        revision: 7,
        settings: [
          {
            path: "tools.approvalMode",
            type: "string",
            credential: false,
            value: "always-ask",
            enumValues: ["always-ask", "write", "yolo"],
            ui: { tab: "tools", group: "approval", label: "Approval mode" },
          },
        ],
      })),
      setOmpSetting: vi.fn(async () => ({
        requestId: "req-4",
        path: "tools.approvalMode",
        value: "write",
        revision: 8,
      })),
    });

    const { result } = renderHook(() => useOmpSettings("server-1", "agent-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.settings).toHaveLength(1));
    expect(result.current.revision).toBe(7);
    expect(result.current.settings[0].path).toBe("tools.approvalMode");
  });

  it("setSetting forwards path/value and invalidates the settings query", async () => {
    installSession("server-1", { ompSettings: true });
    const setOmpSetting = vi.fn(async () => ({
      requestId: "req-5",
      path: "tools.approvalMode",
      value: "write",
      revision: 9,
    }));
    installClient("server-1", {
      getOmpSettings: vi.fn(async () => ({
        requestId: "req-3",
        revision: 7,
        settings: [],
      })),
      setOmpSetting,
    });

    const { result } = renderHook(
      () => ({
        settings: useOmpSettings("server-1", "agent-1"),
        setter: useOmpSettingSetter("server-1", "agent-1"),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.settings.isLoading).toBe(false));

    await act(async () => {
      const response = await result.current.setter.setSetting({
        path: "tools.approvalMode",
        value: "write",
      });
      expect(response.value).toBe("write");
    });

    expect(setOmpSetting).toHaveBeenCalledWith("agent-1", "tools.approvalMode", "write");
  });
});

describe("useOmpSlashCommand", () => {
  it("runs a slash command and exposes the canonical cache keys", async () => {
    installSession("server-1", {
      ompSlashCommands: true,
      ompModes: true,
      ompSettings: true,
    });
    const runOmpSlashCommand = vi.fn(async () => ({
      requestId: "req-6",
      agentInvoked: false,
      output: "ok",
      stateChange: false,
    }));
    installClient("server-1", {
      runOmpSlashCommand,
      getOmpModes: vi.fn(),
      getOmpSettings: vi.fn(),
    });

    const { result } = renderHook(() => useOmpSlashCommand("server-1", "agent-1"), { wrapper });

    await act(async () => {
      const response = await result.current.run({
        name: "compact",
        args: "--force",
      });
      expect(response.output).toBe("ok");
    });

    expect(runOmpSlashCommand).toHaveBeenCalledWith("agent-1", "compact", "--force");
    expect(result.current.supported).toBe(true);
    // Query keys used for invalidation must match the exported shape.
    expect(ompModesQueryKey("server-1", "agent-1")).toEqual(["ompModes", "server-1", "agent-1"]);
    expect(ompSettingsQueryKey("server-1", "agent-1")).toEqual([
      "ompSettings",
      "server-1",
      "agent-1",
    ]);
  });

  it("reports supported: false when the server does not advertise slash-command support, so callers can gate before calling run", () => {
    installSession("server-1", { ompSlashCommands: false });
    installClient("server-1", { runOmpSlashCommand: vi.fn() });

    const { result } = renderHook(() => useOmpSlashCommand("server-1", "agent-1"), { wrapper });

    expect(result.current.supported).toBe(false);
  });
});

describe("useOmpSettingsUpdate subscription", () => {
  it("returns null when no settings payload has been projected into runtime info", () => {
    runtime.sessions.set("server-1", {
      serverInfo: { features: {} },
      agents: new Map([
        [
          "agent-1",
          {
            provider: "omp",
            runtimeInfo: { provider: "omp", sessionId: null, extra: {} },
          },
        ],
      ]),
    });

    const { result } = renderHook(() => useOmpSettingsUpdate("server-1", "agent-1"), { wrapper });
    expect(result.current).toBeNull();
  });

  it("returns the projected payload once the agent surfaces settings", () => {
    runtime.sessions.set("server-1", {
      serverInfo: { features: {} },
      agents: new Map([
        [
          "agent-1",
          {
            provider: "omp",
            runtimeInfo: {
              provider: "omp",
              sessionId: null,
              extra: {
                settings: { revision: 3, paths: ["tools.approvalMode"] },
              },
            },
          },
        ],
      ]),
    });

    const { result } = renderHook(() => useOmpSettingsUpdate("server-1", "agent-1"), { wrapper });
    expect(result.current).toEqual({
      revision: 3,
      paths: ["tools.approvalMode"],
    });
  });
});
