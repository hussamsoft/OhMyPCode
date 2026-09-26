import { useCallback, useMemo } from "react";
import { useFetchQuery } from "@/data/query";
import type { AgentProvider, AgentToolDefinition } from "@ohmypcode/protocol/agent-types";
import { useHostRuntimeClient, useHostRuntimeIsConnected } from "@/runtime/host-runtime";
import { useSessionStore } from "@/stores/session-store";
import { mergeProviderPreferences, useFormPreferences } from "./use-form-preferences";

/**
 * Why the draft cannot offer OMP tool selection right now. It is reported as a
 * state of its own — not as a slow or a failed request — so the control that
 * renders it can say "unavailable" instead of looking active and no-opping.
 */
export type DraftToolUnavailableReason =
  | "not-omp-provider"
  | "server-capability-missing"
  | "host-disconnected"
  | "missing-working-directory";

/**
 * `unavailable` carries the saved selection verbatim. The host never reports its
 * tool list in that state, so the stored names cannot be validated — but they
 * are preserved (never cleared, never rewritten) and re-applied automatically
 * once the capability comes back.
 */
export type DraftToolSelectionState =
  | { status: "ready" }
  | { status: "loading" }
  | { status: "error"; error: Error }
  | {
      status: "unavailable";
      reason: DraftToolUnavailableReason;
      savedAllowedTools: readonly string[];
    };
const EMPTY_TOOLS: readonly AgentToolDefinition[] = [];

function resolveUnavailableReason(params: {
  provider: AgentProvider | null;
  supportsVibe: boolean;
  supportsToolSelection: boolean;
  client: unknown;
  isConnected: boolean;
  normalizedCwd: string;
}): DraftToolUnavailableReason | undefined {
  if (params.provider !== "omp") return "not-omp-provider";
  if (!params.supportsVibe || !params.supportsToolSelection) return "server-capability-missing";
  if (!params.client || !params.isConnected) return "host-disconnected";
  if (params.normalizedCwd === "") return "missing-working-directory";
  return undefined;
}

function resolveToolSelectionState(params: {
  unavailableReason: DraftToolUnavailableReason | undefined;
  savedToolNames: readonly string[];
  isError: boolean;
  error: unknown;
  isLoading: boolean;
}): DraftToolSelectionState {
  if (params.unavailableReason) {
    return {
      status: "unavailable",
      reason: params.unavailableReason,
      savedAllowedTools: params.savedToolNames,
    };
  }
  if (params.isError) {
    return {
      status: "error",
      error: params.error instanceof Error ? params.error : new Error("Failed to load OMP tools"),
    };
  }
  if (params.isLoading) {
    return { status: "loading" };
  }
  return { status: "ready" };
}

export function resolveDraftAllowedTools(
  tools: readonly AgentToolDefinition[],
  savedAllowedTools: readonly string[] | undefined,
): string[] {
  const saved = savedAllowedTools === undefined ? null : new Set(savedAllowedTools);
  return tools
    .filter((tool) => tool.required || (saved === null ? tool.enabled : saved.has(tool.name)))
    .map((tool) => tool.name);
}

export function useDraftAgentTools(input: {
  serverId: string | null | undefined;
  provider: AgentProvider | null;
  cwd: string | null | undefined;
}) {
  const client = useHostRuntimeClient(input.serverId ?? "");
  const isConnected = useHostRuntimeIsConnected(input.serverId ?? "");
  const supportsToolSelection = useSessionStore(
    (state) =>
      state.sessions[input.serverId ?? ""]?.serverInfo?.features?.ompToolSelection === true,
  );
  const supportsVibe = useSessionStore(
    (state) => state.sessions[input.serverId ?? ""]?.serverInfo?.features?.ompVibe === true,
  );
  const provider = input.provider;
  const canUseTools = provider === "omp" && supportsVibe && supportsToolSelection;
  const { preferences, updatePreferences } = useFormPreferences();
  const normalizedCwd = input.cwd?.trim() ?? "";
  const savedAllowedTools = provider
    ? preferences.providerPreferences?.[provider]?.allowedTools
    : undefined;
  const toolsQuery = useFetchQuery({
    queryKey: ["providerTools", input.serverId ?? null, input.provider, normalizedCwd || null],
    dataShape: "list",
    staleTimeMs: 5 * 60 * 1000,
    enabled: Boolean(client && isConnected && canUseTools && normalizedCwd),
    queryFn: async () => {
      if (!client || !input.provider) {
        throw new Error("OMP provider is required");
      }
      const response = await client.listProviderTools(input.provider, normalizedCwd);
      return response.tools;
    },
  });
  const tools = toolsQuery.data ?? EMPTY_TOOLS;
  const savedToolNames = useMemo(
    () => (savedAllowedTools === undefined ? [] : [...new Set(savedAllowedTools)].sort()),
    [savedAllowedTools],
  );
  /**
   * Preserved, never discarded. While tool selection is unavailable the host
   * tool list is never fetched, so the saved selection is surfaced verbatim and
   * the stored preferences stay untouched for a later capability retry.
   */
  const allowedTools = useMemo(
    () =>
      toolsQuery.data === undefined
        ? savedToolNames
        : resolveDraftAllowedTools(tools, savedAllowedTools),
    [savedAllowedTools, savedToolNames, tools, toolsQuery.data],
  );
  const allowedSet = useMemo(() => new Set(allowedTools), [allowedTools]);
  const rows = useMemo(
    () =>
      tools.map((tool) => ({
        ...tool,
        enabled: tool.required || allowedSet.has(tool.name),
      })),
    [allowedSet, tools],
  );
  const unavailableReason = resolveUnavailableReason({
    provider,
    supportsVibe,
    supportsToolSelection,
    client,
    isConnected,
    normalizedCwd,
  });
  const toolSelection = resolveToolSelectionState({
    unavailableReason,
    savedToolNames,
    isError: toolsQuery.isError,
    error: toolsQuery.error,
    isLoading: toolsQuery.isLoading,
  });
  const setAllowedTools = useCallback(
    (next: readonly string[]) => {
      if (!provider || !canUseTools) {
        throw new Error("OMP tool selection is unavailable");
      }
      const allowed = new Set(next);
      const names = tools
        .filter((tool) => tool.required || allowed.has(tool.name))
        .map((tool) => tool.name);
      return updatePreferences((current) =>
        mergeProviderPreferences({
          preferences: current,
          provider,
          updates: { allowedTools: names },
        }),
      );
    },
    [canUseTools, provider, tools, updatePreferences],
  );
  /**
   * Launch payload. `allowedTools` rides along only while the host advertises
   * OMP tool selection: without that capability the server cannot resolve the
   * tool names, so shipping them would be unvalidated. The saved selection is
   * kept either way and is sent as soon as the capability is advertised.
   */
  const providerOptions = canUseTools ? { allowedTools } : undefined;

  return {
    tools,
    rows,
    allowedTools,
    toolSelection,
    providerOptions,
    canUseTools,
    canUseVibe: provider === "omp" && supportsVibe,
    isLoading: toolsQuery.isLoading,
    error: toolsQuery.error,
    setAllowedTools,
  };
}
