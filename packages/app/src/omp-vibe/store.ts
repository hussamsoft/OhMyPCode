import { create } from "zustand";
import { ompVibeStateHasTerminalTransition, type OmpVibeState } from "@/omp-vibe/model";

export const OMP_VIBE_RENDER_INTERVAL_MS = 100;

type TimerHandle = Parameters<typeof clearTimeout>[0];
type Schedule = (callback: () => void, delayMs: number) => TimerHandle;
type Cancel = (handle: TimerHandle) => void;

export interface OmpVibeStateProjector {
  push(state: OmpVibeState): void;
  flush(): void;
  getLatestRevision(): number;
  dispose(): void;
}

export function createOmpVibeStateProjector({
  publish,
  schedule = setTimeout,
  cancel = clearTimeout,
}: {
  publish: (state: OmpVibeState) => void;
  schedule?: Schedule;
  cancel?: Cancel;
}): OmpVibeStateProjector {
  let latest: OmpVibeState | null = null;
  let published: OmpVibeState | null = null;
  let timer: TimerHandle | null = null;

  const clearTimer = () => {
    if (timer !== null) {
      cancel(timer);
      timer = null;
    }
  };
  const publishLatest = () => {
    clearTimer();
    if (!latest || latest.revision <= (published?.revision ?? -1)) return;
    published = latest;
    publish(latest);
  };

  return {
    push(state) {
      if (latest && state.revision <= latest.revision) return;
      const previous = latest;
      latest = state;
      if (previous === null || ompVibeStateHasTerminalTransition(previous, state)) {
        publishLatest();
        return;
      }
      if (timer === null) {
        timer = schedule(publishLatest, OMP_VIBE_RENDER_INTERVAL_MS);
      }
    },
    flush: publishLatest,
    getLatestRevision: () => latest?.revision ?? -1,
    dispose: clearTimer,
  };
}

export type OmpVibePendingKind = "spawn" | "send" | "wait" | "kill" | "exit";

export interface OmpVibePendingOperation {
  kind: OmpVibePendingKind;
  workerId: string | null;
  startedRevision: number;
}
export function shouldClearPendingOperation(
  operation: OmpVibePendingOperation,
  revision: number,
): boolean {
  return operation.startedRevision < revision;
}

export interface OmpVibeStoreState {
  stateByAgent: Record<string, OmpVibeState>;
  selectedWorkerByAgent: Record<string, string | null>;
  pendingByAgent: Record<string, OmpVibePendingOperation>;
  snapshotRevisionByAgent: Record<string, number>;
  publishState(agentId: string, state: OmpVibeState): void;
  selectWorker(agentId: string, workerId: string | null): void;
  beginPending(agentId: string, operation: OmpVibePendingOperation): void;
  clearPending(agentId: string): void;
  recordSnapshotRevision(agentId: string, revision: number): void;
  clearAgent(agentId: string): void;
}

export const useOmpVibeStore = create<OmpVibeStoreState>((set) => ({
  stateByAgent: {},
  selectedWorkerByAgent: {},
  pendingByAgent: {},
  snapshotRevisionByAgent: {},
  publishState: (agentId, state) =>
    set((current) => {
      if (state.revision <= (current.snapshotRevisionByAgent[agentId] ?? -1)) return current;
      return {
        stateByAgent: { ...current.stateByAgent, [agentId]: state },
        snapshotRevisionByAgent: {
          ...current.snapshotRevisionByAgent,
          [agentId]: state.revision,
        },
      };
    }),
  selectWorker: (agentId, workerId) =>
    set((state) => ({
      selectedWorkerByAgent: { ...state.selectedWorkerByAgent, [agentId]: workerId },
    })),
  beginPending: (agentId, operation) =>
    set((state) => ({
      pendingByAgent: { ...state.pendingByAgent, [agentId]: operation },
    })),
  clearPending: (agentId) =>
    set((state) => {
      if (!state.pendingByAgent[agentId]) return state;
      const pendingByAgent = { ...state.pendingByAgent };
      delete pendingByAgent[agentId];
      return { pendingByAgent };
    }),
  recordSnapshotRevision: (agentId, revision) =>
    set((state) => ({
      snapshotRevisionByAgent: { ...state.snapshotRevisionByAgent, [agentId]: revision },
    })),
  clearAgent: (agentId) =>
    set((state) => {
      const stateByAgent = { ...state.stateByAgent };
      const selectedWorkerByAgent = { ...state.selectedWorkerByAgent };
      const pendingByAgent = { ...state.pendingByAgent };
      const snapshotRevisionByAgent = { ...state.snapshotRevisionByAgent };
      delete stateByAgent[agentId];
      delete selectedWorkerByAgent[agentId];
      delete pendingByAgent[agentId];
      delete snapshotRevisionByAgent[agentId];
      return { stateByAgent, selectedWorkerByAgent, pendingByAgent, snapshotRevisionByAgent };
    }),
}));

const projectorsByAgent = new Map<string, OmpVibeStateProjector>();

export function projectOmpVibeState(agentId: string, state: OmpVibeState): void {
  let projector = projectorsByAgent.get(agentId);
  if (!projector) {
    projector = createOmpVibeStateProjector({
      publish: (next) => useOmpVibeStore.getState().publishState(agentId, next),
    });
    projectorsByAgent.set(agentId, projector);
  }
  projector.push(state);
}

export function seedOmpVibeState(agentId: string, state: OmpVibeState): void {
  const projectorRevision = projectorsByAgent.get(agentId)?.getLatestRevision() ?? -1;
  if (state.revision <= projectorRevision) return;
  useOmpVibeStore.getState().publishState(agentId, state);
}

export function flushOmpVibeState(agentId: string): void {
  projectorsByAgent.get(agentId)?.flush();
}

export function disposeOmpVibeStateProjector(agentId: string): void {
  const projector = projectorsByAgent.get(agentId);
  projector?.dispose();
  projectorsByAgent.delete(agentId);
}

export function disposeOmpVibeState(agentId: string): void {
  disposeOmpVibeStateProjector(agentId);
  useOmpVibeStore.getState().clearAgent(agentId);
}
