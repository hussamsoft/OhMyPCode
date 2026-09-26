import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useShallow } from "zustand/react/shallow";
import { AgentStreamView } from "@/agent-stream/view";
import {
  resolveComposerTrackControlClearance,
  resolveComposerTrackTailClearance,
} from "@/composer/pill-styles";
import { ComposerTrackBar } from "@/composer/tracks";
import { useIsCompactFormFactor } from "@/constants/layout";
import type { AgentScreenAgent } from "@/hooks/use-agent-screen-state-machine";
import { usePaneContext } from "@/panels/pane-context";
import { useSessionStore } from "@/stores/session-store";
import { useSubagentsForParent, type SubagentRow } from "@/subagents/select";
import { SubagentsTrack } from "@/subagents/track";
import {
  providerSubagentKey,
  providerSubagentLifecycleStatus,
  refreshProviderSubagents,
  observeProviderSubagentTimeline,
  useProviderSubagentStore,
} from "@/subagents/provider-store";
import { useTranslation } from "react-i18next";
import type { PendingPermission } from "@/types/shared";
import type { StreamItem } from "@/types/stream";
import { deriveSidebarStateBucket } from "@/utils/sidebar-agent-state";
import { TIMELINE_FETCH_PAGE_SIZE } from "@/timeline/timeline-fetch-policy";
import type { TurnPresentation } from "@/timeline/turn-liveness";

const EMPTY_PERMISSIONS = new Map<string, PendingPermission>();
const EMPTY_STREAM_ITEMS: StreamItem[] = [];
const NOOP_SUBAGENT = () => undefined;

function resolveChildTrackClearance(childCount: number, isCompact: boolean) {
  if (childCount === 0) return { tail: 0, controls: 0 };
  return {
    tail: resolveComposerTrackTailClearance(isCompact),
    controls: resolveComposerTrackControlClearance(isCompact),
  };
}

function ProviderSubagentChildTrack({
  serverId,
  rows,
  onOpenProviderSubagent,
}: {
  serverId: string;
  rows: SubagentRow[];
  onOpenProviderSubagent: (parentAgentId: string, subagentId: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <ComposerTrackBar>
      <SubagentsTrack
        serverId={serverId}
        rows={rows}
        onOpenSubagent={NOOP_SUBAGENT}
        onOpenProviderSubagent={onOpenProviderSubagent}
        onArchiveSubagent={NOOP_SUBAGENT}
      />
    </ComposerTrackBar>
  );
}

export function ProviderSubagentContent({
  serverId,
  parentAgentId,
  subagentId,
}: {
  serverId: string;
  parentAgentId: string;
  subagentId: string;
}) {
  const { t } = useTranslation();
  const { openFileInWorkspace, openTab } = usePaneContext();
  const key = providerSubagentKey(serverId, parentAgentId, subagentId);
  const streamId = `provider:${encodeURIComponent(parentAgentId)}:${encodeURIComponent(subagentId)}`;
  const { descriptor, timeline } = useProviderSubagentStore(
    useShallow((state) => ({
      descriptor: state.descriptors.get(key) ?? null,
      timeline: state.timelines.get(key) ?? null,
    })),
  );
  const parent = useSessionStore(
    (state) =>
      state.sessions[serverId]?.agents.get(parentAgentId) ??
      state.sessions[serverId]?.agentDetails.get(parentAgentId) ??
      null,
  );
  const client = useSessionStore((state) => state.sessions[serverId]?.client ?? null);
  const serverInfo = useSessionStore((state) => state.sessions[serverId]?.serverInfo ?? null);
  const supported = serverInfo?.features?.projectedSubagentTimeline === true;
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const isCompact = useIsCompactFormFactor();
  const childRows = useSubagentsForParent({
    serverId,
    parentAgentId,
    providerParentSubagentId: subagentId,
  });
  const childTrackClearance = resolveChildTrackClearance(childRows.length, isCompact);
  const openProviderChild = useCallback(
    (childParentId: string, childSubagentId: string) => {
      openTab({ kind: "provider_subagent", parentAgentId: childParentId, subagentId: childSubagentId });
    },
    [openTab],
  );

  useEffect(() => {
    if (!client || !supported) return;
    void refreshProviderSubagents(client, serverId, parentAgentId).catch(() => undefined);
  }, [client, parentAgentId, serverId, supported]);

  useEffect(() => {
    if (!client || !supported) return;
    return observeProviderSubagentTimeline({
      client,
      serverId,
      parentAgentId,
      subagentId,
      limit: TIMELINE_FETCH_PAGE_SIZE,
      reportError: (error) => {
        console.error("[ProviderSubagentTimeline] Failed to refresh child history", {
          error,
          serverId,
          parentAgentId,
          subagentId,
        });
      },
    });
  }, [client, parentAgentId, serverId, subagentId, supported]);

  const loadOlder = useCallback((): boolean => {
    if (!client || !supported || isLoadingOlder || !timeline?.hasOlder || !timeline.epoch) {
      return false;
    }
    const firstSeq = timeline.cursor?.startSeq ?? null;
    if (firstSeq === null) return false;
    setIsLoadingOlder(true);
    void client
      .fetchProviderSubagentTimeline(parentAgentId, subagentId, {
        direction: "before",
        cursor: { epoch: timeline.epoch, seq: firstSeq },
        limit: TIMELINE_FETCH_PAGE_SIZE,
      })
      .then((payload) => {
        useProviderSubagentStore.getState().replaceTimeline(serverId, payload);
        return undefined;
      })
      .catch(() => undefined)
      .finally(() => setIsLoadingOlder(false));
    return true;
  }, [client, isLoadingOlder, parentAgentId, serverId, subagentId, supported, timeline]);

  const firstTimelineSeq = timeline?.cursor?.startSeq ?? null;
  const progressKey =
    timeline?.epoch && firstTimelineSeq !== null ? `${timeline.epoch}:${firstTimelineSeq}` : null;
  const subtitle = descriptor?.subtitle?.trim();
  const streamContext = useMemo<AgentScreenAgent>(
    () => ({
      serverId,
      id: streamId,
      provider: descriptor?.provider ?? parent?.provider,
      status: descriptor ? providerSubagentLifecycleStatus(descriptor.status) : "initializing",
      cwd: descriptor?.cwd ?? parent?.cwd ?? "",
      workspaceId: parent?.workspaceId,
      projectPlacement: parent?.projectPlacement,
    }),
    [descriptor, parent, serverId, streamId],
  );
  const historyPagination = useMemo(
    () => ({
      hasOlder: timeline?.hasOlder === true,
      isLoadingOlder,
      progressKey,
      onLoadOlder: loadOlder,
    }),
    [isLoadingOlder, loadOlder, progressKey, timeline?.hasOlder],
  );
  const turnPresentation = useMemo<TurnPresentation>(
    () => ({
      isActive: descriptor?.status === "running",
      isCancelling: false,
      startedAt: null,
      turnId: null,
    }),
    [descriptor?.status],
  );

  if (serverInfo && !supported) {
    return (
      <View style={styles.unsupported} testID="provider-subagent-panel-unsupported">
        <Text style={styles.unsupportedText}>{t("message.actions.forkUnavailable")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="provider-subagent-panel">
      {subtitle ? (
        <View style={styles.subtitleHeader}>
          <Text style={styles.subtitleText} numberOfLines={1} testID="provider-subagent-pane-subtitle">
            {subtitle}
          </Text>
        </View>
      ) : null}
      <AgentStreamView
        agentId={streamId}
        serverId={serverId}
        context={streamContext}
        streamItems={timeline?.tail ?? EMPTY_STREAM_ITEMS}
        streamHead={timeline?.head ?? EMPTY_STREAM_ITEMS}
        turnPresentation={turnPresentation}
        pendingPermissions={EMPTY_PERMISSIONS}
        isAuthoritativeHistoryReady
        onOpenWorkspaceFile={openFileInWorkspace}
        readOnly
        historyPagination={historyPagination}
        bottomOverlayTailClearance={childTrackClearance.tail}
        bottomOverlayControlClearance={childTrackClearance.controls}
      />
      <ProviderSubagentChildTrack
        serverId={serverId}
        rows={childRows}
        onOpenProviderSubagent={openProviderChild}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, minHeight: 0 },
  subtitleHeader: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderBottomWidth: theme.borderWidth[1],
    borderBottomColor: theme.colors.border,
  },
  subtitleText: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
  unsupported: { flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing[6] },
  unsupportedText: { color: theme.colors.foregroundMuted, textAlign: "center" },
}));
