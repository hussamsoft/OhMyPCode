import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type {
  OmpCommandRunPayload,
  OmpKeybindingsSetPayload,
  OmpModesGetPayload,
  OmpModesSetPayload,
  OmpGoalActionPayload,
  OmpSettingsSetPayload,
} from "@ohmypcode/client/internal/daemon-client";
import type { OmpAvailableAgent } from "@ohmypcode/protocol/messages";
import type {
  OmpKeybindingEntrySchema,
  OmpModesState,
  OmpSettingEntrySchema,
} from "@ohmypcode/protocol/messages";
import type { z } from "zod";
import { useFetchQuery } from "@/data/query";
import { useHostRuntimeClient, useHostRuntimeIsConnected } from "@/runtime/host-runtime";
import { useSessionStore } from "@/stores/session-store";

/**
 * App-level typed hooks over the OMP RPC methods that the composer control
 * deck consumes (`getOmpModes`/`setOmpMode`, `getOmpSettings`/`setOmpSetting`,
 * `runOmpSlashCommand`).
 *
 * These wrap the existing `DaemonClient` methods via the standard
 * `useFetchQuery` + `useMutation` pattern used elsewhere in the app
 * (see `use-omp-statistics.ts`, `use-providers-snapshot.ts`) so consumers
 * get loading/error state, query caching, and capability gating for free.
 *
 * Server plumbing note: `OmpModesState` is pushed to clients as a
 * `provider_state_updated` snapshot with `stateKey: "modes"` after every
 * `setOmpMode`/`goalAction` call, every `runSlashCommand` call, and every
 * agent turn (`agent.ts:refreshModes`/`refreshAfterTurn`) --
 * `AgentManager.dispatchProviderStateEvent` projects it onto
 * `runtimeInfo.extra.modes`. `useOmpModes` below watches that value and
 * invalidates its own query on change, so an agent-driven goal change
 * (tool-completed, budget-limited) isn't left stale behind this hook's
 * own mutation-triggered invalidations. The OMP runtime event
 * `settings_update` is accepted by `OmpRuntimeEventSchema` server-side but
 * the agent does not yet emit `provider_state_updated` with
 * `stateKey: "settings"` when one arrives, so the `useOmpSettingsUpdate`
 * subscription hook today receives no live pushes; it exists so consumers
 * can adopt it the moment the server side lands the wiring.
 */

export function ompModesQueryKey(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
) {
  return ["ompModes", serverId ?? "", agentId ?? ""] as const;
}

export function ompSettingsQueryKey(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
) {
  return ["ompSettings", serverId ?? "", agentId ?? ""] as const;
}

export interface UseOmpAgentScopeOptions {
  enabled?: boolean;
}

export type OmpSettingEntry = z.infer<typeof OmpSettingEntrySchema>;

/**
 * Shared scope (client + connection + capability + translation) for the
 * OMP-RPC hooks. Extracted because the four hooks below otherwise repeat
 * the same five lines of `useTranslation`/`useHostRuntimeClient`/`useSessionStore`
 * lookup and keeping them in lockstep avoids the capability-gating going
 * out of sync.
 */
function useOmpAgentScope(serverId: string | null | undefined) {
  const { t } = useTranslation();
  const client = useHostRuntimeClient(serverId ?? "");
  const isConnected = useHostRuntimeIsConnected(serverId ?? "");
  const supportsOmpModes = useSessionStore(
    (state) => state.sessions[serverId ?? ""]?.serverInfo?.features?.ompModes === true,
  );
  return {
    client,
    isConnected,
    supportsOmpModes,
    errorHostDisconnected: t("workspace.terminal.hostDisconnected"),
  };
}

function useOmpSupportsFeature(
  serverId: string | null | undefined,
  feature: "ompModes" | "ompSettings" | "ompSlashCommands" | "ompKeybindings" | "ompAgentCatalog",
): boolean {
  return useSessionStore(
    (state) => state.sessions[serverId ?? ""]?.serverInfo?.features?.[feature] === true,
  );
}

function readOmpModesState(payload: OmpModesGetPayload | undefined): OmpModesState | null {
  return payload?.state ?? null;
}

export interface UseOmpModesResult {
  modes: OmpModesState | null;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useOmpModes(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
  options: UseOmpAgentScopeOptions = {},
): UseOmpModesResult {
  const { client, isConnected, supportsOmpModes, errorHostDisconnected } =
    useOmpAgentScope(serverId);
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ompModesQueryKey(serverId, agentId), [serverId, agentId]);
  const enabled =
    (options.enabled ?? true) &&
    Boolean(serverId && agentId && client && isConnected && supportsOmpModes);
  const query = useFetchQuery({
    queryKey,
    enabled,
    dataShape: "value",
    staleTimeMs: 30_000,
    queryFn: async () => {
      if (!client || !agentId) {
        throw new Error(errorHostDisconnected);
      }
      return client.getOmpModes(agentId);
    },
  });
  const modes = readOmpModesState(query.data);
  const refresh = useCallback(async () => {
    if (!client || !agentId) return;
    await queryClient.fetchQuery({
      queryKey,
      queryFn: () => client.getOmpModes(agentId),
      staleTime: 0,
    });
  }, [agentId, client, queryClient, queryKey]);
  // `refreshModes()` (agent.ts) pushes a fresh `OmpModesResult` onto
  // `runtimeInfo.extra.modes` after every turn and every slash command, not
  // just after a mutation this hook itself triggered -- an agent-driven goal
  // change (tool-completed, budget-limited) would otherwise sit stale behind
  // this query's own 30s staleTime until something else happened to refetch
  // it. Re-validates through the typed RPC (`refresh`) rather than trusting
  // the raw pushed value directly, matching this hook's existing fetch path.
  const modesPushSignal = useSessionStore((state) => {
    const extra = agentId
      ? state.sessions[serverId ?? ""]?.agents.get(agentId)?.runtimeInfo?.extra
      : undefined;
    return extra && "modes" in extra ? extra.modes : undefined;
  });
  useEffect(() => {
    if (modesPushSignal === undefined) return;
    void refresh();
    // `refresh` intentionally excluded: it's derived from `client`/`agentId`/
    // `queryClient`/`queryKey`, all of which already gate this effect through
    // `modesPushSignal` (unreachable without a live session for this agent).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modesPushSignal]);
  return {
    modes,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    refresh,
  };
}

export interface UseOmpModeSetterInput {
  mode: "plan" | "goal" | "loop";
  paused?: boolean;
  /** Applied when entering goal mode. */
  objective?: string;
  /** Applied when entering goal mode. */
  tokenBudget?: number;
  /** Raw `/loop` argument string, applied when entering loop mode. */
  args?: string;
}

export interface UseOmpModeSetterResult {
  setMode: (input: UseOmpModeSetterInput) => Promise<OmpModesSetPayload>;
  isPending: boolean;
  error: Error | null;
  lastResult: OmpModesSetPayload | null;
}

export function useOmpModeSetter(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
): UseOmpModeSetterResult {
  const { client, isConnected, supportsOmpModes } = useOmpAgentScope(serverId);
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ompModesQueryKey(serverId, agentId), [serverId, agentId]);
  const mutation = useMutation({
    mutationFn: async (input: UseOmpModeSetterInput): Promise<OmpModesSetPayload> => {
      if (!client || !agentId) {
        throw new Error("OMP host client unavailable");
      }
      return await client.setOmpMode(agentId, input.mode, input.paused, {
        objective: input.objective,
        tokenBudget: input.tokenBudget,
        args: input.args,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
  const setMode = useCallback(
    async (input: UseOmpModeSetterInput): Promise<OmpModesSetPayload> => {
      if (!isConnected || !supportsOmpModes) {
        throw new Error("OMP modes capability unavailable on this server/agent");
      }
      return await mutation.mutateAsync(input);
    },
    [isConnected, mutation, supportsOmpModes],
  );
  return {
    setMode,
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
    lastResult: mutation.data ?? null,
  };
}

export interface UseOmpGoalActionResult {
  goalAction: (action: "pause" | "resume" | "drop") => Promise<OmpGoalActionPayload>;
  isPending: boolean;
  error: Error | null;
  lastResult: OmpGoalActionPayload | null;
}

/**
 * Pauses, resumes, or drops the active/paused goal directly. Distinct from
 * `useOmpModeSetter`'s `mode: "goal"` toggle: reactivating goal mode through
 * `setOmpMode` starts a *fresh* goal (OMP's own `set_mode` semantics), which
 * is right for the composer's plan/goal/loop toggle but wrong for a goal
 * screen's own pause/resume/drop actions, which mean "act on this goal".
 */
export function useOmpGoalAction(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
): UseOmpGoalActionResult {
  const { client, isConnected, supportsOmpModes } = useOmpAgentScope(serverId);
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ompModesQueryKey(serverId, agentId), [serverId, agentId]);
  const mutation = useMutation({
    mutationFn: async (action: "pause" | "resume" | "drop"): Promise<OmpGoalActionPayload> => {
      if (!client || !agentId) {
        throw new Error("OMP host client unavailable");
      }
      return await client.goalAction(agentId, action);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
  const goalAction = useCallback(
    async (action: "pause" | "resume" | "drop"): Promise<OmpGoalActionPayload> => {
      if (!isConnected || !supportsOmpModes) {
        throw new Error("OMP modes capability unavailable on this server/agent");
      }
      return await mutation.mutateAsync(action);
    },
    [isConnected, mutation, supportsOmpModes],
  );
  return {
    goalAction,
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
    lastResult: mutation.data ?? null,
  };
}

export interface UseOmpSettingsResult {
  settings: readonly OmpSettingEntry[];
  revision: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useOmpSettings(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
  options: UseOmpAgentScopeOptions = {},
): UseOmpSettingsResult {
  const { client, isConnected, errorHostDisconnected } = useOmpAgentScope(serverId);
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ompSettingsQueryKey(serverId, agentId), [serverId, agentId]);
  const supportsOmpSettings = useOmpSupportsFeature(serverId, "ompSettings");
  const enabled =
    (options.enabled ?? true) &&
    Boolean(serverId && agentId && client && isConnected && supportsOmpSettings);
  const query = useFetchQuery({
    queryKey,
    enabled,
    dataShape: "value",
    staleTimeMs: 60_000,
    queryFn: async () => {
      if (!client || !agentId) {
        throw new Error(errorHostDisconnected);
      }
      return client.getOmpSettings(agentId);
    },
  });
  const payload = query.data;
  const settings = (payload?.settings ?? []) as readonly OmpSettingEntry[];
  const revision = payload?.revision ?? 0;
  const refresh = useCallback(async () => {
    if (!client || !agentId) return;
    await queryClient.fetchQuery({
      queryKey,
      queryFn: () => client.getOmpSettings(agentId),
      staleTime: 0,
    });
  }, [agentId, client, queryClient, queryKey]);
  return {
    settings,
    revision,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    refresh,
  };
}

export interface UseOmpSettingSetterInput {
  path: string;
  value: unknown;
}

export interface UseOmpSettingSetterResult {
  setSetting: (input: UseOmpSettingSetterInput) => Promise<OmpSettingsSetPayload>;
  isPending: boolean;
  error: Error | null;
  lastResult: OmpSettingsSetPayload | null;
}

export function useOmpSettingSetter(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
): UseOmpSettingSetterResult {
  const { client, isConnected } = useOmpAgentScope(serverId);
  const queryClient = useQueryClient();
  const supportsOmpSettings = useOmpSupportsFeature(serverId, "ompSettings");
  const queryKey = useMemo(() => ompSettingsQueryKey(serverId, agentId), [serverId, agentId]);
  const mutation = useMutation({
    mutationFn: async (input: UseOmpSettingSetterInput): Promise<OmpSettingsSetPayload> => {
      if (!client || !agentId) {
        throw new Error("OMP host client unavailable");
      }
      return await client.setOmpSetting(agentId, input.path, input.value);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
  const setSetting = useCallback(
    async (input: UseOmpSettingSetterInput): Promise<OmpSettingsSetPayload> => {
      if (!isConnected || !supportsOmpSettings) {
        throw new Error("OMP settings capability unavailable on this server/agent");
      }
      return await mutation.mutateAsync(input);
    },
    [isConnected, mutation, supportsOmpSettings],
  );
  return {
    setSetting,
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
    lastResult: mutation.data ?? null,
  };
}

export interface UseOmpSlashCommandInput {
  name: string;
  args?: string;
}

export interface UseOmpSlashCommandResult {
  run: (input: UseOmpSlashCommandInput) => Promise<OmpCommandRunPayload>;
  /** Whether the connection + server capability allow calling `run` at all. */
  supported: boolean;
  isPending: boolean;
  error: Error | null;
  lastResult: OmpCommandRunPayload | null;
}

export function useOmpSlashCommand(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
): UseOmpSlashCommandResult {
  const { client, isConnected } = useOmpAgentScope(serverId);
  const queryClient = useQueryClient();
  const supportsOmpSlashCommands = useOmpSupportsFeature(serverId, "ompSlashCommands");
  const mutation = useMutation({
    mutationFn: async (input: UseOmpSlashCommandInput): Promise<OmpCommandRunPayload> => {
      if (!client || !agentId) {
        throw new Error("OMP host client unavailable");
      }
      return await client.runOmpSlashCommand(agentId, input.name, input.args);
    },
    onSuccess: () => {
      // Slash commands can change agent mode/settings; invalidate the
      // cached snapshots so the next read picks up the new server-side
      // state without a manual refresh.
      void queryClient.invalidateQueries({
        queryKey: ompModesQueryKey(serverId, agentId),
      });
      void queryClient.invalidateQueries({
        queryKey: ompSettingsQueryKey(serverId, agentId),
      });
    },
  });
  const run = useCallback(
    async (input: UseOmpSlashCommandInput): Promise<OmpCommandRunPayload> => {
      if (!isConnected || !supportsOmpSlashCommands) {
        throw new Error("OMP slash command capability unavailable on this server/agent");
      }
      return await mutation.mutateAsync(input);
    },
    [isConnected, mutation, supportsOmpSlashCommands],
  );
  return {
    run,
    supported: isConnected && supportsOmpSlashCommands,
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
    lastResult: mutation.data ?? null,
  };
}

/**
 * Live subscription to the `settings_update` push from the OMP runtime.
 *
 * The server already accepts `settings_update` events in
 * `OmpRuntimeEventSchema` and other `stateKey` values (`modes`, `vibe`,
 * `hookWidget`, ...) are projected onto `runtimeInfo.extra[stateKey]`
 * by `AgentManager.dispatchProviderStateEvent`. This hook reads
 * `runtimeInfo.extra.settings` so consumers can subscribe to live
 * settings pushes the moment the server side wires the agent handler
 * for `settings_update` (today it does not, so the value stays `null`
 * until that lands).
 */
export interface OmpSettingsUpdatePayload {
  revision: number;
  paths: string[];
}

export function useOmpSettingsUpdate(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
): OmpSettingsUpdatePayload | null {
  return useSessionStore((state) => {
    const session = state.sessions[serverId ?? ""];
    const agent = agentId ? session?.agents.get(agentId) : undefined;
    const extra = agent?.runtimeInfo?.extra;
    if (!extra || !("settings" in extra)) return null;
    const raw = (extra as Record<string, unknown>).settings;
    if (!raw || typeof raw !== "object") return null;
    const recordValue = raw as Record<string, unknown>;
    const revision = typeof recordValue.revision === "number" ? recordValue.revision : 0;
    const paths = Array.isArray(recordValue.paths)
      ? recordValue.paths.filter((path): path is string => typeof path === "string")
      : [];
    return { revision, paths };
  });
}

export function ompKeybindingsQueryKey(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
) {
  return ["ompKeybindings", serverId ?? "", agentId ?? ""] as const;
}

export type OmpKeybindingEntry = z.infer<typeof OmpKeybindingEntrySchema>;

export interface UseOmpKeybindingsResult {
  keybindings: readonly OmpKeybindingEntry[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useOmpKeybindings(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
  options: UseOmpAgentScopeOptions = {},
): UseOmpKeybindingsResult {
  const { client, isConnected, errorHostDisconnected } = useOmpAgentScope(serverId);
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ompKeybindingsQueryKey(serverId, agentId), [serverId, agentId]);
  const supportsOmpKeybindings = useOmpSupportsFeature(serverId, "ompKeybindings");
  const enabled =
    (options.enabled ?? true) &&
    Boolean(serverId && agentId && client && isConnected && supportsOmpKeybindings);
  const query = useFetchQuery({
    queryKey,
    enabled,
    dataShape: "value",
    staleTimeMs: 60_000,
    queryFn: async () => {
      if (!client || !agentId) {
        throw new Error(errorHostDisconnected);
      }
      return client.getOmpKeybindings(agentId);
    },
  });
  const keybindings = (query.data?.keybindings ?? []) as readonly OmpKeybindingEntry[];
  const refresh = useCallback(async () => {
    if (!client || !agentId) return;
    await queryClient.fetchQuery({
      queryKey,
      queryFn: () => client.getOmpKeybindings(agentId),
      staleTime: 0,
    });
  }, [agentId, client, queryClient, queryKey]);
  return {
    keybindings,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    refresh,
  };
}

export interface UseOmpKeybindingSetterInput {
  id: string;
  keys: string;
}

export interface UseOmpKeybindingSetterResult {
  setKeybinding: (input: UseOmpKeybindingSetterInput) => Promise<OmpKeybindingsSetPayload>;
  isPending: boolean;
  error: Error | null;
  lastResult: OmpKeybindingsSetPayload | null;
}

export function useOmpKeybindingSetter(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
): UseOmpKeybindingSetterResult {
  const { client, isConnected } = useOmpAgentScope(serverId);
  const queryClient = useQueryClient();
  const supportsOmpKeybindings = useOmpSupportsFeature(serverId, "ompKeybindings");
  const queryKey = useMemo(() => ompKeybindingsQueryKey(serverId, agentId), [serverId, agentId]);
  const mutation = useMutation({
    mutationFn: async (input: UseOmpKeybindingSetterInput): Promise<OmpKeybindingsSetPayload> => {
      if (!client || !agentId) {
        throw new Error("OMP host client unavailable");
      }
      return await client.setOmpKeybinding(agentId, input.id, input.keys);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
  const setKeybinding = useCallback(
    async (input: UseOmpKeybindingSetterInput): Promise<OmpKeybindingsSetPayload> => {
      if (!isConnected || !supportsOmpKeybindings) {
        throw new Error("OMP keybindings capability unavailable on this server/agent");
      }
      return await mutation.mutateAsync(input);
    },
    [isConnected, mutation, supportsOmpKeybindings],
  );
  return {
    setKeybinding,
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
    lastResult: mutation.data ?? null,
  };
}

export function ompAgentCatalogQueryKey(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
) {
  return ["ompAgentCatalog", serverId ?? "", agentId ?? ""] as const;
}

export interface UseOmpAgentCatalogResult {
  data: readonly OmpAvailableAgent[] | null;
  supported: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Read-only catalog of agents the host can render in a list cell. Capability
 * gate: returns `{ data: null, supported: false }` when the server has not
 * advertised `ompAgentCatalog` (mirrors `useOmpModes`'s `supported` field).
 * Spawn/execute is intentionally absent — the fork does not expose it over
 * RPC yet, so no setter is provided.
 */
export function useOmpAgentCatalog(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
  options: UseOmpAgentScopeOptions = {},
): UseOmpAgentCatalogResult {
  const { client, isConnected, errorHostDisconnected } = useOmpAgentScope(serverId);
  const queryClient = useQueryClient();
  const supportsOmpAgentCatalog = useOmpSupportsFeature(serverId, "ompAgentCatalog");
  const queryKey = useMemo(() => ompAgentCatalogQueryKey(serverId, agentId), [serverId, agentId]);
  const enabled =
    (options.enabled ?? true) &&
    Boolean(serverId && agentId && client && isConnected && supportsOmpAgentCatalog);
  const query = useFetchQuery({
    queryKey,
    enabled,
    dataShape: "value",
    staleTimeMs: 30_000,
    queryFn: async () => {
      if (!client || !agentId) {
        throw new Error(errorHostDisconnected);
      }
      return client.listOmpAgentCatalog(agentId);
    },
  });
  const data = query.data?.agents ?? null;
  const refetch = useCallback(async () => {
    if (!client || !agentId) return;
    await queryClient.fetchQuery({
      queryKey,
      queryFn: () => client.listOmpAgentCatalog(agentId),
      staleTime: 0,
    });
  }, [agentId, client, queryClient, queryKey]);
  return {
    data,
    supported: isConnected && supportsOmpAgentCatalog,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    refetch,
  };
}
