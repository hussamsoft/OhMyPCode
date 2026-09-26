import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOmpVibeStateProjector,
  disposeOmpVibeState,
  projectOmpVibeState,
  seedOmpVibeState,
  shouldClearPendingOperation,
  useOmpVibeStore,
} from "@/omp-vibe/store";
import type { OmpVibeState } from "@/omp-vibe/model";

afterEach(() => {
  vi.useRealTimers();
});

type ProjectorWorker = OmpVibeState["workers"][number];

function projectorTurnStatus(
  workerState: ProjectorWorker["state"],
): ProjectorWorker["lastTurnStatus"] {
  if (workerState === "dead") return "cancelled";
  if (workerState === "idle") return "completed";
  return "running";
}

function state(revision: number, workerState: ProjectorWorker["state"] = "running"): OmpVibeState {
  return {
    revision,
    enabled: true,
    workers: [
      {
        id: "worker-1",
        cli: "good",
        name: "Inspector",
        state: workerState,
        turnCount: revision,
        queuedMessages: 0,
        outputTail: [],
        lastTurnStatus: projectorTurnStatus(workerState),
        createdAt: 1,
        lastActivityAt: revision,
      },
    ],
  };
}

describe("OMP Vibe state projector", () => {
  it("publishes every 100ms update but terminal transitions immediately", () => {
    vi.useFakeTimers();
    const publish = vi.fn<(state: OmpVibeState) => void>();
    const projector = createOmpVibeStateProjector({ publish });

    projector.push(state(1));
    projector.push(state(2, "idle"));
    expect(publish.mock.calls.map(([snapshot]) => snapshot.revision)).toEqual([1]);

    vi.advanceTimersByTime(99);
    expect(publish.mock.calls.map(([snapshot]) => snapshot.revision)).toEqual([1]);
    vi.advanceTimersByTime(1);
    expect(publish.mock.calls.map(([snapshot]) => snapshot.revision)).toEqual([1, 2]);

    projector.push(state(3));
    projector.push(state(4, "dead"));
    expect(publish.mock.calls.map(([snapshot]) => snapshot.revision)).toEqual([1, 2, 4]);
    vi.advanceTimersByTime(100);
    expect(publish.mock.calls.map(([snapshot]) => snapshot.revision)).toEqual([1, 2, 4]);
  });
});

describe("OMP Vibe runtime hydration", () => {
  it("hydrates initial and reconnect snapshots without replacing a newer projector", () => {
    vi.useFakeTimers();
    const agentId = "hydration-agent";
    seedOmpVibeState(agentId, state(4));
    expect(useOmpVibeStore.getState().stateByAgent[agentId]?.revision).toBe(4);

    projectOmpVibeState(agentId, state(5));
    projectOmpVibeState(agentId, state(6));
    seedOmpVibeState(agentId, state(5));
    expect(useOmpVibeStore.getState().stateByAgent[agentId]?.revision).toBe(5);

    seedOmpVibeState(agentId, state(7));
    expect(useOmpVibeStore.getState().stateByAgent[agentId]?.revision).toBe(7);
    vi.runAllTimers();
    expect(useOmpVibeStore.getState().stateByAgent[agentId]?.revision).toBe(7);
    disposeOmpVibeState(agentId);
    seedOmpVibeState(agentId, state(8));
    expect(useOmpVibeStore.getState().stateByAgent[agentId]?.revision).toBe(8);
  });
});
describe("OMP Vibe UI state", () => {
  beforeEach(() => {
    useOmpVibeStore.setState({
      selectedWorkerByAgent: {},
      pendingByAgent: {},
      snapshotRevisionByAgent: {},
    });
  });

  it("keeps selection and pending operation scoped to the agent", () => {
    const store = useOmpVibeStore.getState();
    store.selectWorker("agent-1", "worker-1");
    store.beginPending("agent-1", { kind: "spawn", workerId: null, startedRevision: 7 });
    expect(useOmpVibeStore.getState().selectedWorkerByAgent["agent-1"]).toBe("worker-1");
    expect(useOmpVibeStore.getState().pendingByAgent["agent-1"]).toEqual({
      kind: "spawn",
      workerId: null,
      startedRevision: 7,
    });
    store.selectWorker("agent-2", "worker-2");
    expect(useOmpVibeStore.getState().selectedWorkerByAgent["agent-2"]).toBe("worker-2");
    expect(useOmpVibeStore.getState().pendingByAgent["agent-2"]).toBeUndefined();
  });

  it("clears only the completed agent operation", () => {
    const store = useOmpVibeStore.getState();
    store.beginPending("agent-1", { kind: "kill", workerId: "worker-1", startedRevision: 2 });
    store.beginPending("agent-2", { kind: "wait", workerId: null, startedRevision: 2 });
    store.clearPending("agent-1");
    expect(useOmpVibeStore.getState().pendingByAgent).toEqual({
      "agent-2": { kind: "wait", workerId: null, startedRevision: 2 },
    });
  });
  it("keeps spawn pending for a response-before-event and clears on event-before-response", () => {
    const operation = { kind: "spawn" as const, workerId: null, startedRevision: 4 };
    expect(shouldClearPendingOperation(operation, 4)).toBe(false);
    expect(shouldClearPendingOperation(operation, 5)).toBe(true);
  });

  it("tracks exit as a pending operation until a later revision", () => {
    const store = useOmpVibeStore.getState();
    store.beginPending("agent-1", { kind: "exit", workerId: null, startedRevision: 9 });
    expect(useOmpVibeStore.getState().pendingByAgent["agent-1"]).toEqual({
      kind: "exit",
      workerId: null,
      startedRevision: 9,
    });
    expect(
      shouldClearPendingOperation(useOmpVibeStore.getState().pendingByAgent["agent-1"], 9),
    ).toBe(false);
    expect(
      shouldClearPendingOperation(useOmpVibeStore.getState().pendingByAgent["agent-1"], 10),
    ).toBe(true);
  });
});
