import type { ListTerminalsResponse } from "@ohmypcode/protocol/messages";
import { deriveTerminalActivityStatusBucket } from "@ohmypcode/protocol/terminal-activity";
import { Terminal } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View, type PressableStateCallbackType } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useWorkspaceTerminalList } from "@/screens/workspace/terminals/use-workspace-terminal-list";
import { useHostRuntimeClient, useHostRuntimeIsConnected } from "@/runtime/host-runtime";
import { useHostFeature } from "@/runtime/host-features";
import {
  navigateToWorkspace,
  useActiveWorkspaceSelection,
} from "@/stores/navigation-active-workspace-store";
import { useWorkspaceDirectory } from "@/stores/session-store-hooks";
import { isWeb } from "@/constants/platform";
import { getStatusDotColor } from "@/utils/status-dot-color";
import type { Theme } from "@/styles/theme";

type TerminalEntry = ListTerminalsResponse["payload"]["terminals"][number];

const ThemedTerminal = withUnistyles(Terminal);
const terminalIconColorMapping = (theme: Theme) => ({ color: theme.colors.foregroundMuted });

function terminalRowStyle(state: PressableStateCallbackType & { hovered?: boolean }) {
  return [styles.row, (state.hovered || state.pressed) && styles.rowHovered];
}

export function SidebarLiveTerminals() {
  const { t } = useTranslation();
  const selection = useActiveWorkspaceSelection();
  const serverId = selection?.serverId ?? "";
  const workspaceId = selection?.workspaceId ?? "";
  const workspaceDirectory = useWorkspaceDirectory(serverId || null, workspaceId || null);
  const client = useHostRuntimeClient(serverId);
  const isConnected = useHostRuntimeIsConnected(serverId);
  const supportsWorkspaceTerminals = useHostFeature(serverId, "workspaceTerminals");
  const enabled = Boolean(
    isWeb && selection && supportsWorkspaceTerminals && client && isConnected && workspaceDirectory,
  );
  const { terminals } = useWorkspaceTerminalList({
    client,
    enabled,
    serverId,
    workspaceDirectory,
    workspaceId,
  });

  if (!enabled || terminals.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} testID="sidebar-live-terminals">
      <View style={styles.header}>
        <Text style={styles.heading}>{t("sidebar.liveTerminals.title")}</Text>
        <Text style={styles.count}>{terminals.length}</Text>
      </View>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {terminals.map((terminal) => (
          <TerminalRow
            key={terminal.id}
            terminal={terminal}
            serverId={serverId}
            workspaceId={workspaceId}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function TerminalRow({
  terminal,
  serverId,
  workspaceId,
}: {
  terminal: TerminalEntry;
  serverId: string;
  workspaceId: string;
}) {
  const { t } = useTranslation();
  const label = terminal.title?.trim() || terminal.name.trim() || "Terminal";
  const statusBucket = deriveTerminalActivityStatusBucket(terminal.activity);
  let statusKey:
    | "sidebar.liveTerminals.status.working"
    | "sidebar.liveTerminals.status.needsInput"
    | "sidebar.liveTerminals.status.finished"
    | "sidebar.liveTerminals.status.idle" = "sidebar.liveTerminals.status.idle";
  if (statusBucket === "running") {
    statusKey = "sidebar.liveTerminals.status.working";
  } else if (statusBucket === "needs_input") {
    statusKey = "sidebar.liveTerminals.status.needsInput";
  } else if (statusBucket === "attention") {
    statusKey = "sidebar.liveTerminals.status.finished";
  }
  const statusLabel = t(statusKey);
  const statusDotStyle = useMemo(
    () => [
      styles.statusDot,
      statusBucket ? styles[`statusDot_${statusBucket}`] : styles.statusDotIdle,
    ],
    [statusBucket],
  );
  const handlePress = useCallback(() => {
    navigateToWorkspace({
      serverId,
      workspaceId,
      target: { kind: "terminal", terminalId: terminal.id },
    });
  }, [serverId, terminal.id, workspaceId]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("sidebar.liveTerminals.open", { name: label, status: statusLabel })}
      onPress={handlePress}
      style={terminalRowStyle}
      testID={`sidebar-live-terminal-${terminal.id}`}
    >
      <ThemedTerminal size={14} uniProps={terminalIconColorMapping} />
      <View style={styles.rowCopy}>
        <Text style={styles.name} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.status}>
          <View style={statusDotStyle} />
          <Text style={styles.statusLabel} numberOfLines={1}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing[2],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[1.5],
    gap: theme.spacing[1],
    flexShrink: 1,
  },
  header: {
    minHeight: 24,
    paddingHorizontal: theme.spacing[2],
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  heading: {
    color: theme.colors.foregroundExtraMuted,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  count: {
    color: theme.colors.foregroundExtraMuted,
    fontSize: theme.fontSize.sm,
    marginLeft: "auto",
    fontVariant: ["tabular-nums"],
  },
  list: {
    maxHeight: 190,
  },
  listContent: {
    gap: theme.spacing[0.5],
  },
  row: {
    minHeight: 42,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1.5],
    borderRadius: theme.borderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  rowHovered: {
    backgroundColor: theme.colors.surfaceSidebarHover,
  },
  rowCopy: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  name: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotIdle: {
    backgroundColor: theme.colors.foregroundExtraMuted,
  },
  statusDot_running: {
    backgroundColor:
      getStatusDotColor({ theme, bucket: "running" }) ?? theme.colors.foregroundExtraMuted,
  },
  statusDot_needs_input: {
    backgroundColor:
      getStatusDotColor({ theme, bucket: "needs_input" }) ?? theme.colors.foregroundExtraMuted,
  },
  statusDot_attention: {
    backgroundColor:
      getStatusDotColor({ theme, bucket: "attention" }) ?? theme.colors.foregroundExtraMuted,
  },
  statusLabel: {
    color: theme.colors.foregroundExtraMuted,
    fontSize: theme.fontSize.sm,
  },
}));
