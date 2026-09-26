import { describe, expect, it, vi } from "vitest";
import { openOmpVibeTarget } from "@/workspace-tabs/open-omp-vibe-target";

const mocks = vi.hoisted(() => ({
  agents: new Map<string, { serverId: string; id: string; workspaceId: string }>(),
  ensureSidePane: vi.fn(() => "side-pane"),
  openTab: vi.fn(() => "vibe-tab"),
}));

vi.mock("@/stores/session-store", () => ({
  useSessionStore: {
    getState: () => ({
      sessions: {
        "server-1": { agents: mocks.agents },
      },
    }),
  },
}));

vi.mock("@/stores/workspace-layout-store", () => ({
  useWorkspaceLayoutStore: {
    getState: () => ({
      ensureSidePane: mocks.ensureSidePane,
      openTab: mocks.openTab,
    }),
  },
}));

describe("openOmpVibeTarget", () => {
  it("focuses the normal side pane before revealing the target", () => {
    mocks.agents.set("agent-1", {
      serverId: "server-1",
      id: "agent-1",
      workspaceId: "workspace-1",
    });

    const tabId = openOmpVibeTarget({ agentId: "agent-1", workerId: "worker-1" });

    expect(tabId).toBe("vibe-tab");
    expect(mocks.ensureSidePane).toHaveBeenCalledWith("server-1:workspace-1", { focus: true });
    expect(mocks.openTab).toHaveBeenCalledWith({
      workspaceKey: "server-1:workspace-1",
      target: { kind: "omp_vibe", agentId: "agent-1", workerId: "worker-1" },
      intent: "reveal",
    });
    expect(mocks.ensureSidePane.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.openTab.mock.invocationCallOrder[0],
    );
  });

  it("keeps the compact target on the same normal reveal path", () => {
    mocks.agents.set("agent-1", {
      serverId: "server-1",
      id: "agent-1",
      workspaceId: "workspace-1",
    });
    mocks.ensureSidePane.mockClear();
    mocks.openTab.mockClear();

    openOmpVibeTarget({ agentId: "agent-1", workerId: null });

    expect(mocks.openTab).toHaveBeenCalledWith({
      workspaceKey: "server-1:workspace-1",
      target: { kind: "omp_vibe", agentId: "agent-1", workerId: null },
      intent: "reveal",
    });
  });
});
