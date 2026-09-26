import { useCallback, useEffect } from "react";
import { useHostRuntimeClient } from "@/runtime/host-runtime";
import { useOmpCapabilities } from "@/hooks/use-omp-capabilities";
import { parseOmpVibeState, type OmpVibeState } from "@/omp-vibe/model";
import { shouldClearPendingOperation, seedOmpVibeState, useOmpVibeStore, type OmpVibePendingOperation } from "@/omp-vibe/store";
import { useSessionStore } from "@/stores/session-store";

export interface SpawnOmpVibeWorkerInput {
  tier: "fast" | "good";
  name?: string;
  prompt: string;
}

export function useOmpVibe(serverId: string, agentId: string) {
  const client = useHostRuntimeClient(serverId);
  const runtimeVibe = useSessionStore(
    (store) => store.sessions[serverId]?.agents.get(agentId)?.runtimeInfo?.extra?.vibe ?? null,
  );
  useEffect(() => {
    const hydratedState = parseOmpVibeState(runtimeVibe);
    if (hydratedState) seedOmpVibeState(agentId, hydratedState);
  }, [agentId, runtimeVibe]);
  const capabilities = useOmpCapabilities(serverId, agentId);
  const state = useOmpVibeStore((store) => store.stateByAgent[agentId] ?? null);
  const selectedWorkerId = useOmpVibeStore(
    (store) => store.selectedWorkerByAgent[agentId] ?? null,
  );
  const pending = useOmpVibeStore((store) => store.pendingByAgent[agentId] ?? null);
  const clearPending = useOmpVibeStore((store) => store.clearPending);
  const beginPending = useOmpVibeStore((store) => store.beginPending);
  const selectWorker = useOmpVibeStore((store) => store.selectWorker);

  useEffect(() => {
    if (!state) return;
    if (pending && shouldClearPendingOperation(pending, state.revision)) {
      clearPending(agentId);
    }
  }, [agentId, clearPending, pending, state]);

  const requireCapability = useCallback(
    (capability: "canUseVibe" | "canSelectTools") => {
      if (!client || !capabilities[capability]) {
        throw new Error("The requested OMP capability is unavailable");
      }
    },
    [capabilities, client],
  );

  const begin = useCallback(
    (operation: Omit<OmpVibePendingOperation, "startedRevision">) => {
      beginPending(agentId, { ...operation, startedRevision: state?.revision ?? -1 });
    },
    [agentId, beginPending, state?.revision],
  );

  const getState = useCallback(async () => {
    requireCapability("canUseVibe");
    return client!.getOmpVibeState(agentId);
  }, [agentId, client, requireCapability]);

  const enter = useCallback(
    (prompt?: string) => {
      requireCapability("canUseVibe");
      return client!.enterOmpVibe({ agentId, ...(prompt !== undefined ? { prompt } : {}) });
    },
    [agentId, client, requireCapability],
  );

  const exit = useCallback(async () => {
    requireCapability("canUseVibe");
    begin({ kind: "exit", workerId: null });
    try {
      return await client!.exitOmpVibe(agentId);
    } catch (error) {
      clearPending(agentId);
      throw error;
    }
  }, [agentId, begin, clearPending, client, requireCapability]);

  const spawn = useCallback(
    async (input: SpawnOmpVibeWorkerInput) => {
      requireCapability("canUseVibe");
      begin({ kind: "spawn", workerId: null });
      try {
        return await client!.spawnOmpVibeWorker({ agentId, ...input });
      } catch (error) {
        clearPending(agentId);
        throw error;
      }
    },
    [agentId, begin, clearPending, client, requireCapability],
  );

  const send = useCallback(
    async (workerId: string, message: string) => {
      requireCapability("canUseVibe");
      begin({ kind: "send", workerId });
      try {
        const response = await client!.sendOmpVibeWorker({ agentId, workerId, message });
        clearPending(agentId);
        return response;
      } catch (error) {
        clearPending(agentId);
        throw error;
      }
    },
    [agentId, begin, clearPending, client, requireCapability],
  );

  const wait = useCallback(
    async (input: { workerIds?: string[]; timeoutMs?: number } = {}) => {
      requireCapability("canUseVibe");
      begin({ kind: "wait", workerId: null });
      try {
        const response = await client!.waitOmpVibeWorkers({
          agentId,
          workerIds: input.workerIds,
          timeoutMs: input.timeoutMs ?? 30_000,
        });
        clearPending(agentId);
        return response;
      } catch (error) {
        clearPending(agentId);
        throw error;
      }
    },
    [agentId, begin, clearPending, client, requireCapability],
  );

  const kill = useCallback(
    async (workerId: string) => {
      requireCapability("canUseVibe");
      begin({ kind: "kill", workerId });
      try {
        return await client!.killOmpVibeWorker({ agentId, workerId });
      } catch (error) {
        clearPending(agentId);
        throw error;
      }
    },
    [agentId, begin, clearPending, client, requireCapability],
  );

  const listTools = useCallback(() => {
    requireCapability("canSelectTools");
    return client!.listAgentTools(agentId);
  }, [agentId, client, requireCapability]);

  const setTools = useCallback(
    (enabledTools: string[]) => {
      requireCapability("canSelectTools");
      return client!.setAgentTools(agentId, enabledTools);
    },
    [agentId, client, requireCapability],
  );

  return {
    state: state as OmpVibeState | null,
    selectedWorkerId,
    selectWorker,
    pending,
    ...capabilities,
    getState,
    enter,
    exit,
    spawn,
    send,
    wait,
    kill,
    listTools,
    setTools,
  };
}
