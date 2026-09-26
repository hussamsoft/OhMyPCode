import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type {
  OmpCommandRunPayload,
  OmpModesGetPayload,
  OmpModesSetPayload,
  OmpSettingsSetPayload,
} from "@ohmypcode/client/internal/daemon-client";
import type { OmpModesState, OmpSettingEntrySchema } from "@ohmypcode/protocol/messages";
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
 * `setOmpMode` call (`agent-manager.ts:dispatchProviderStateEvent`), so
 * the modes query is invalidated via the `modes` query-key when the
 * session-store state updates. The OMP runtime event `settings_update`
 * is accepted by `OmpRuntimeEventSchema` server-side but the agent does
 * not yet emit `provider_state_updated` with `stateKey: "settings"` when
 * one arrives, so the `useOmpSettingsUpdate` subscription hook today
 * receives no live pushes; it exists so consumers can adopt it the moment
 * the server side lands the wiring.
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

export type UseOmpAgentScopeOptions = {
  enabled?: boolean;
};

export type OmpSettingEntry = z.infer<typeof OmpSettingEntrySchema>;

/**
 * Shared scope (client + connection + capability + translation) for the
 * OMP-RPC hooks. Extracted because the four hooks below otherwise repeat
 * the same five lines of `useTranslation`/`useHostRuntimeClient`/`useSessionStore`
 * lookup and keeping them in lockstep avoids the capability-gating going
 * out of sync.
 */
function useOmpAgentScope(serverId: string | null | undefined, agentId: string | null | undefined) {
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
  feature: "ompModes" | "ompSettings" | "ompSlashCommands",
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
  const { client, isConnected, supportsOmpModes, errorHostDisconnected } = useOmpAgentScope(
    serverId,
    agentId,
  );
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ompModesQueryKey(serverId, agentId),
    [serverId, agentId],
  );
  const enabled =
    (options.enabled ?? true) && Boolean(serverId && agentId && client && isConnected && supportsOmpModes);
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
  const { client, isConnected, supportsOmpModes } = useOmpAgentScope(serverId, agentId);
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ompModesQueryKey(serverId, agentId),
    [serverId, agentId],
  );
  const mutation = useMutation({
    mutationFn: async (input: UseOmpModeSetterInput): Promise<OmpModesSetPayload> => {
      if (!client || !agentId) {
        throw new Error("OMP host client unavailable");
      }
      return await client.setOmpMode(agentId, input.mode, input.paused);
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
  const { client, isConnected, errorHostDisconnected } = useOmpAgentScope(serverId, agentId);
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ompSettingsQueryKey(serverId, agentId),
    [serverId, agentId],
  );
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
  const { client, isConnected } = useOmpAgentScope(serverId, agentId);
  const queryClient = useQueryClient();
  const supportsOmpSettings = useOmpSupportsFeature(serverId, "ompSettings");
  const queryKey = useMemo(
    () => ompSettingsQueryKey(serverId, agentId),
    [serverId, agentId],
  );
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
  isPending: boolean;
  error: Error | null;
  lastResult: OmpCommandRunPayload | null;
}

export function useOmpSlashCommand(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
): UseOmpSlashCommandResult {
  const { client, isConnected } = useOmpAgentScope(serverId, agentId);
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
      void queryClient.invalidateQueries({ queryKey: ompModesQueryKey(serverId, agentId) });
      void queryClient.invalidateQueries({ queryKey: ompSettingsQueryKey(serverId, agentId) });
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