// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOmpVibe } from "./use-omp-vibe";
import { useOmpVibeStore } from "./store";

const { client, sessionState } = vi.hoisted(() => ({
  client: {
    waitOmpVibeWorkers: vi.fn(),
    getOmpVibeState: vi.fn(),
  },
  // Mutable so a test can model the composer's real path: the Vibe segment
  // toggles through the agent feature list, not through `enter`.
  sessionState: {
    features: [] as Array<{ id: string; type: string; value: unknown }>,
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
    selector({
      sessions: {
        "server-1": {
          agents: new Map([["agent-1", { features: sessionState.features }]]),
        },
      },
    }),
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

describe("useOmpVibe hydration", () => {
  beforeEach(() => {
    useOmpVibeStore.getState().clearAgent("agent-1");
  });

  it("seeds the store from the nested payload.state when the omp_vibe feature flips on", async () => {
    // This is the composer's actual path: the Vibe segment calls
    // setFeature("omp_vibe"), which never goes through `enter`, so the
    // feature-watch effect is the only thing that can seed the store. The
    // response nests the state under `state`, so an unwrap that is wrong here
    // fails silently and the strip never appears.
    sessionState.features = [{ id: "omp_vibe", type: "toggle", value: true }];
    client.getOmpVibeState.mockResolvedValue({
      requestId: "req-1",
      state: { revision: 1, enabled: true, workers: [] },
    });

    renderHook(() => useOmpVibe("server-1", "agent-1"));

    await waitFor(() => {
      const seeded = useOmpVibeStore.getState().stateByAgent["agent-1"];
      expect(seeded, "store was never seeded from payload.state").toBeDefined();
      expect(seeded?.enabled).toBe(true);
      expect(seeded?.revision).toBe(1);
    });
  });
});
