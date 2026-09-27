/**
 * `omp_sessions` panel body.
 *
 * Lists OMP sessions for the agent's cwd (filtered server-side via
 * `fetchRecentProviderSessions({ providers: ["omp"], cwd })`) and lets
 * the user resume any one of them in-place -- the live agent's runtime
 * session gets re-bound to the selected `.jsonl` file via the
 * `omp.session.switch.request` RPC. Distinct from the import sheet,
 * which spawns a *new* agent over the same file.
 *
 * Capability-gating:
 *  - missing serverId/agentId -> placeholder
 *  - no `supportsOmpSessionSwitch` capability on the live agent
 *    -> placeholder with the same translation key
 *  - entry without `filePath` -> Resume button disabled with a tooltip
 *    explaining that the host's entry doesn't carry a switchable artifact
 *
 * Mirrors the structure of `omp-plugins-form.tsx` and `omp-skills-form.tsx`
 * (refresh button, row layout, capability-gate via host-runtime lookups)
 * so the panel stays consistent with the existing Phase 10 surfaces.
 */
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import type { FetchRecentProviderSessionEntry } from "@ohmypcode/client/internal/daemon-client";
import { useFetchQuery } from "@/data/query";
import { useHostRuntimeClient, useHostRuntimeIsConnected } from "@/runtime/host-runtime";
import { useSessionStore } from "@/stores/session-store";

const ThemedRefreshCw = withUnistyles(RefreshCw);
const REFRESH_ICON = <ThemedRefreshCw size={14} />;

const ROW_TITLE_MUTED = "#6b7280";
const RECENT_SESSIONS_LIMIT = 20;
const RECENT_SESSIONS_QUERY_STALE_MS = 30_000;

function buildSessionsQueryKey(input: {
  serverId: string;
  cwd: string | null;
}): readonly unknown[] {
  return ["ompSessions", input.serverId, input.cwd ?? ""] as const;
}

function formatRelativeActivity(iso: string, now: Date): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso;
  const deltaMs = now.getTime() - then.getTime();
  if (deltaMs < 0) return then.toLocaleString();
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return then.toLocaleDateString();
}

function resolveEntryLabel(entry: FetchRecentProviderSessionEntry): string {
  const title = entry.title?.trim();
  if (title) return title;
  const firstPrompt = entry.firstPromptPreview?.trim();
  if (firstPrompt) return firstPrompt;
  const lastPrompt = entry.lastPromptPreview?.trim();
  if (lastPrompt) return lastPrompt;
  return entry.providerHandleId;
}

function resolveEntrySubtitle(entry: FetchRecentProviderSessionEntry): string {
  return formatRelativeActivity(entry.lastActivityAt, new Date());
}

function buildStableRowKey(entry: FetchRecentProviderSessionEntry): string {
  return `${entry.providerId}::${entry.providerHandleId}`;
}

export interface OmpSessionsFormProps {
  serverId: string | null;
  agentId: string | null;
}

export function OmpSessionsForm({ serverId, agentId }: OmpSessionsFormProps) {
  const { t } = useTranslation();
  const client = useHostRuntimeClient(serverId ?? "");
  const isConnected = useHostRuntimeIsConnected(serverId ?? "");
  const supportsOmpSessionSwitch = useSessionStore(
    (state) =>
      state.sessions[serverId ?? ""]?.agents.get(agentId ?? "")?.capabilities
        ?.supportsOmpSessionSwitch === true,
  );
  const agentCwd = useSessionStore(
    (state) => state.sessions[serverId ?? ""]?.agents.get(agentId ?? "")?.cwd ?? null,
  );

  if (!serverId || !agentId) {
    return <Placeholder text={t("panels.ompSessions.placeholderMissingAgent")} />;
  }
  if (!supportsOmpSessionSwitch) {
    return <Placeholder text={t("panels.ompSessions.placeholderCapabilityMissing")} />;
  }
  return (
    <OmpSessionsBody
      serverId={serverId}
      agentId={agentId}
      cwd={agentCwd}
      client={client}
      isConnected={isConnected}
    />
  );
}

interface OmpSessionsBodyProps {
  serverId: string;
  agentId: string;
  cwd: string | null;
  client: ReturnType<typeof useHostRuntimeClient>;
  isConnected: boolean;
}

function OmpSessionsBody({ serverId, agentId, cwd, client, isConnected }: OmpSessionsBodyProps) {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const enabled = Boolean(client && isConnected && cwd);
  const queryKey = useMemo(() => buildSessionsQueryKey({ serverId, cwd }), [serverId, cwd]);
  const sessionsQuery = useFetchQuery<{ entries: FetchRecentProviderSessionEntry[] }, Error>({
    queryKey,
    enabled,
    dataShape: "value",
    staleTimeMs: RECENT_SESSIONS_QUERY_STALE_MS,
    queryFn: async () => {
      if (!client || !cwd) {
        throw new Error(t("workspace.terminal.hostDisconnected"));
      }
      return client.fetchRecentProviderSessions({
        cwd,
        providers: ["omp"],
        limit: RECENT_SESSIONS_LIMIT,
      });
    },
  });
  const entries = sessionsQuery.data?.entries ?? [];
  const isFetching = sessionsQuery.isFetching;

  const handleRefresh = useCallback(async () => {
    if (!enabled) return;
    setRefreshing(true);
    try {
      await sessionsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [enabled, sessionsQuery]);

  const handleResume = useCallback(
    async (filePath: string) => {
      if (!client) return;
      setResumeError(null);
      try {
        const result = await client.switchSessionAgent(agentId, filePath);
        if (result.cancelled) {
          setResumeError(t("panels.ompSessions.resumeCancelled"));
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t("panels.ompSessions.error");
        setResumeError(message);
      }
    },
    [agentId, client, t],
  );

  const renderErrorText = resumeError ?? undefined;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t("panels.ompSessions.header")}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("panels.ompSessions.refresh")}
          testID="omp-sessions-form-refresh"
          disabled={!enabled || refreshing || isFetching}
          onPress={handleRefresh}
        >
          {REFRESH_ICON}
        </Pressable>
      </View>
      {renderErrorText ? (
        <Text style={styles.errorText} testID="omp-sessions-form-error">
          {renderErrorText}
        </Text>
      ) : null}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SessionsStatus
          isLoading={sessionsQuery.isLoading}
          isError={sessionsQuery.isError}
          hasRows={entries.length > 0}
        />
        {entries.map((entry) => (
          <SessionRow
            key={buildStableRowKey(entry)}
            entry={entry}
            disabled={!enabled || isFetching}
            onResume={handleResume}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface PlaceholderProps {
  text: string;
}

function Placeholder({ text }: PlaceholderProps) {
  return (
    <View style={styles.placeholderContainer} testID="omp-sessions-form-placeholder">
      <Text style={styles.placeholderText}>{text}</Text>
    </View>
  );
}

interface SessionsStatusProps {
  isLoading: boolean;
  isError: boolean;
  hasRows: boolean;
}

function SessionsStatus({ isLoading, isError, hasRows }: SessionsStatusProps) {
  const { t } = useTranslation();
  if (isLoading && !hasRows) {
    return (
      <Text style={styles.statusText} testID="omp-sessions-form-loading">
        {t("panels.ompSessions.loading")}
      </Text>
    );
  }
  if (isError && !hasRows) {
    return (
      <Text style={styles.statusText} testID="omp-sessions-form-error">
        {t("panels.ompSessions.error")}
      </Text>
    );
  }
  if (!isLoading && !isError && !hasRows) {
    return (
      <Text style={styles.statusText} testID="omp-sessions-form-empty">
        {t("panels.ompSessions.empty")}
      </Text>
    );
  }
  return null;
}

interface SessionRowProps {
  entry: FetchRecentProviderSessionEntry;
  disabled: boolean;
  onResume: (filePath: string) => Promise<void>;
}

function SessionRow({ entry, disabled, onResume }: SessionRowProps) {
  const { t } = useTranslation();
  const label = resolveEntryLabel(entry);
  const subtitle = resolveEntrySubtitle(entry);
  const filePath = entry.filePath;
  const canResume = Boolean(filePath) && !disabled;

  const handlePress = useCallback(() => {
    if (!filePath) return;
    void onResume(filePath);
  }, [filePath, onResume]);

  return (
    <View style={styles.row} testID={`omp-sessions-form-row-${entry.providerHandleId}`}>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
        {entry.cwd ? (
          <Text style={styles.rowCwd} numberOfLines={1}>
            {entry.cwd}
          </Text>
        ) : null}
      </View>
      <Button
        testID={`omp-sessions-form-row-${entry.providerHandleId}-resume`}
        disabled={!canResume}
        accessibilityHint={
          filePath
            ? t("panels.ompSessions.resumeHint")
            : t("panels.ompSessions.resumeUnavailableHint")
        }
        onPress={canResume ? handlePress : undefined}
      >
        {t("panels.ompSessions.resume")}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing[3],
    paddingTop: theme.spacing[2],
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing[3],
  },
  placeholderText: {
    color: theme.colors.foregroundMuted,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: theme.spacing[2],
  },
  headerTitle: {
    color: theme.colors.foreground,
    fontWeight: "600",
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: theme.spacing[4],
  },
  statusText: {
    color: theme.colors.foregroundMuted,
    paddingVertical: theme.spacing[2],
  },
  errorText: {
    color: theme.colors.palette.red[500],
    paddingVertical: theme.spacing[2],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.foregroundMuted,
  },
  rowBody: {
    flex: 1,
    paddingRight: theme.spacing[3],
  },
  rowTitle: {
    color: theme.colors.foreground,
    fontWeight: "500",
  },
  rowSubtitle: {
    color: theme.colors.foregroundMuted,
    fontSize: 12,
    marginTop: 2,
  },
  rowCwd: {
    color: ROW_TITLE_MUTED,
    fontSize: 11,
    marginTop: 2,
  },
}));
