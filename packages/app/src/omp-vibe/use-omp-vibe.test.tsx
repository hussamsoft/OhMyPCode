// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOmpVibe } from "./use-omp-vibe";
import { useOmpVibeStore } from "./store";

const { client } = vi.hoisted(() => ({
  client: {
    waitOmpVibeWorkers: vi.fn(),
  },
}));

vi.mock("@/runtime/host-runtime", () => ({
  useHostRuntimeClient: () => client,
}));

vi.mock("@/hooks/use-omp-capabilities", () => ({
  useOmpCapabilities: () => ({
    canUseVibe: true,
    canSelectTools: true,
  }),
}));

vi.mock("@/stores/session-store", () => ({
  useSessionStore: (selector: (state: { sessions: Record<string, unknown> }) => unknown) =>
    selector({ sessions: {} }),
}));


describe("useOmpVibe pending operations", () => {
  beforeEach(() => {
    useOmpVibeStore.getState().clearAgent("agent-1");
    client.waitOmpVibeWorkers.mockReset();
  });

  it("clears wait after a successful response without a state revision", async () => {
    client.waitOmpVibeWorkers.mockResolvedValue({ workers: [] });
    const { result } = renderHook(() => useOmpVibe("server-1", "agent-1"));

    await act(async () => {
      await result.current.wait();
    });

    expect(client.waitOmpVibeWorkers).toHaveBeenCalledWith({
      agentId: "agent-1",
      workerIds: undefined,
      timeoutMs: 30_000,
    });
    expect(useOmpVibeStore.getState().pendingByAgent["agent-1"]).toBeUndefined();
  });
});
