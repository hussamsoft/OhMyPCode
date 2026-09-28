import { useCallback, useEffect } from "react";
import { useHostRuntimeClient } from "@/runtime/host-runtime";
import { useOmpCapabilities } from "@/hooks/use-omp-capabilities";
import { parseOmpVibeState, type OmpVibeState } from "@/omp-vibe/model";
import {
  shouldClearPendingOperation,
  seedOmpVibeState,
  useOmpVibeStore,
  type OmpVibePendingOperation,
} from "@/omp-vibe/store";
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

  /**
   * The composer's Vibe segment toggles through the agent *feature* list
   * (`setFeature("omp_vibe")`), not through `enter` below, so refreshing only
   * inside `enter`/`exit` left the store untouched for that caller and the
   * strip stayed hidden while the segment showed checked. Watching the feature
   * flag covers every path that can change it.
   *
   * The `provider_state_updated` event would be the general answer, but the app
   * has no handler for it and `runtimeInfo.extra` is snapshot-only
   * (utils/agent-snapshots.ts), so a re-read through the typed RPC is the same
   * approach `useOmpModes` takes for exactly this reason.
   */
  const vibeFeatureEnabled = useSessionStore((store) => {
    const features = store.sessions[serverId]?.agents.get(agentId)?.features;
    const toggle = features?.find((feature) => feature.id === "omp_vibe");
    return toggle?.value === true;
  });
  useEffect(() => {
    if (!client || !capabilities.canUseVibe) return;
    if (!vibeFeatureEnabled) return;
    let cancelled = false;
    const hydrate = async () => {
      const next = await client.getOmpVibeState(agentId);
      if (cancelled) return;
      const parsed = parseOmpVibeState(next);
      if (parsed) seedOmpVibeState(agentId, parsed);
    };
    // Best-effort hydration. A failure here must not surface as an error: the
    // feature flag is already the source of truth for whether Vibe is on, and
    // the strip simply shows no workers until the next refresh.
    void hydrate().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [agentId, capabilities.canUseVibe, client, vibeFeatureEnabled]);

  const state = useOmpVibeStore((store) => store.stateByAgent[agentId] ?? null);
  const selectedWorkerId = useOmpVibeStore((store) => store.selectedWorkerByAgent[agentId] ?? null);
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

  /**
   * Re-read the state after a mutation and push it into the store.
   *
   * The server emits `provider_state_updated` with `stateKey: "vibe"`, but the
   * app has no handler for that event — `runtimeInfo.extra` is only ever
   * populated from the full agent snapshot (utils/agent-snapshots.ts), and the
   * store is seeded only by the effect keyed on it. So a vibe entered from the
   * composer never reached the store and the Vibe strip stayed hidden while
   * the mode segment, which reads the feature list, correctly showed checked.
   *
   * This mirrors what `useOmpModes` already does: re-validate through the
   * typed RPC rather than trusting a push nobody consumes.
   */
  const refreshFromDaemon = useCallback(async () => {
    const next = await client!.getOmpVibeState(agentId);
    const parsed = parseOmpVibeState(next);
    if (parsed) seedOmpVibeState(agentId, parsed);
    return next;
  }, [agentId, client]);

  const enter = useCallback(
    async (prompt?: string) => {
      requireCapability("canUseVibe");
      const result = await client!.enterOmpVibe({
        agentId,
        ...(prompt !== undefined ? { prompt } : {}),
      });
      // A failed enter throws, so the store is only refreshed on success --
      // which is what makes the composer roll the segment back.
      await refreshFromDaemon();
      return result;
    },
    [agentId, client, refreshFromDaemon, requireCapability],
  );

  const exit = useCallback(async () => {
    requireCapability("canUseVibe");
    begin({ kind: "exit", workerId: null });
    try {
      const result = await client!.exitOmpVibe(agentId);
      await refreshFromDaemon();
      return result;
    } catch (error) {
      clearPending(agentId);
      throw error;
    }
  }, [agentId, begin, clearPending, client, refreshFromDaemon, requireCapability]);

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
