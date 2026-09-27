/**
 * OMP agent-subagent hub for OhMyPCode.
 *
 * Lists every `ProviderSubagentDescriptor` for the current agent (the
 * `agent.provider_subagents.list` surface, refreshed on mount and kept
 * current by the existing `agent.provider_subagents.update` event stream).
 * Tapping a row reuses the existing `provider_subagent` tab opener so the
 * existing `provider-subagent-panel` timeline view opens for that child.
 *
 * The fork's RPC surface for these descriptors is read-only
 * (`vibe_spawn` / `vibe_kill` are a different subsystem already covered by
 * `omp_vibe`); no catalog, spawn, or kill verb is reachable here, so the
 * panel intentionally surfaces only the list + deep-link.
 */
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Users } from "lucide-react-native";
import { getProviderIcon } from "@/components/provider-icons";
import { usePaneContext } from "@/panels/pane-context";
import { useSubagentsForParent, type ProviderSubagentRow } from "@/subagents/select";
import { providerSubagentLifecycleStatus } from "@/subagents/provider-store";
import { deriveSidebarStateBucket } from "@/utils/sidebar-agent-state";
import type { Theme } from "@/styles/theme";

const ThemedUsers = withUnistyles(Users);
const foregroundColorMapping = (theme: Theme) => ({ color: theme.colors.foreground });

const ROW_ICON_SIZE = 14;

function resolveRowLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveStatusKey(
  status: ProviderSubagentRow["status"],
): "running" | "completed" | "failed" | "cancelled" {
  if (status === "running") return "running";
  if (status === "failed") return "failed";
  if (status === "canceled") return "cancelled";
  return "completed";
}

function buildProviderRowPresentation(row: ProviderSubagentRow) {
  const description = resolveRowLabel(row.description);
  const title = resolveRowLabel(row.title);
  // Task names a sibling in a fan-out when present; otherwise fall back to the
  // subagent type ("Explore", "general-purpose") so the row still has a label.
  const label = description ?? title ?? row.id;
  const subtitle = resolveRowLabel(row.subtitle);
  return { label, subtitle };
}

function sortProviderRows(rows: ProviderSubagentRow[]): ProviderSubagentRow[] {
  return [...rows].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

function resolveProviderRowStyle({ pressed }: { pressed: boolean }) {
  return pressed ? [styles.row, styles.rowPressed] : styles.row;
}

export interface OmpAgentsHubFormProps {
  serverId?: string | null;
  agentId?: string | null;
}

export function OmpAgentsHubForm({ serverId, agentId }: OmpAgentsHubFormProps) {
  const { t } = useTranslation();
  const { openTab } = usePaneContext();
  const enabled = Boolean(serverId && agentId);
  const rows = useSubagentsForParent(
    enabled
      ? { serverId: serverId as string, parentAgentId: agentId as string }
      : { serverId: "", parentAgentId: "" },
  );
  const providerRows = useMemo<ProviderSubagentRow[]>(
    () =>
      sortProviderRows(rows.filter((row): row is ProviderSubagentRow => row.kind === "provider")),
    [rows],
  );

  const openProviderChild = useCallback(
    (parentAgentId: string, subagentId: string) => {
      openTab({ kind: "provider_subagent", parentAgentId, subagentId });
    },
    [openTab],
  );

  if (!enabled) {
    return (
      <View style={styles.placeholder} testID="omp-agents-hub-form-placeholder">
        <Text style={styles.placeholderText}>
          {t("panels.ompAgentsHub.placeholderMissingServer")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="omp-agents-hub-form">
      <View style={styles.headerRow}>
        <ThemedUsers size={ROW_ICON_SIZE} uniProps={foregroundColorMapping} />
        <Text style={styles.headerText}>{t("panels.ompAgentsHub.header")}</Text>
      </View>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {providerRows.length === 0 ? (
          <View style={styles.emptyState} testID="omp-agents-hub-form-empty">
            <Text style={styles.emptyText}>{t("panels.ompAgentsHub.empty")}</Text>
          </View>
        ) : (
          providerRows.map((row) => (
            <ProviderRow
              key={row.id}
              serverId={serverId as string}
              row={row}
              onPress={openProviderChild}
              t={t}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

interface ProviderRowProps {
  serverId: string;
  row: ProviderSubagentRow;
  onPress: (parentAgentId: string, subagentId: string) => void;
  t: (key: string) => string;
}

function ProviderRow({ serverId, row, onPress, t }: ProviderRowProps) {
  const Icon = getProviderIcon(row.provider, serverId);
  const { label, subtitle } = buildProviderRowPresentation(row);
  const statusKey = resolveStatusKey(row.status);
  const lifecycle = providerSubagentLifecycleStatus(row.status);
  const bucket = deriveSidebarStateBucket({
    status: lifecycle,
    requiresAttention: row.requiresAttention,
  });
  const handlePress = useCallback(() => {
    onPress(row.parentAgentId, row.id);
  }, [onPress, row.id, row.parentAgentId]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`omp-agents-hub-row-${row.id}`}
      style={resolveProviderRowStyle}
    >
      <View style={styles.rowIcon}>
        <Icon size={ROW_ICON_SIZE} color={FOREGROUND_MUTED_COLOR} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowStatus} testID={`omp-agents-hub-row-${row.id}-status`}>
            {t(`panels.ompAgentsHub.${statusKey}`)}
          </Text>
          {subtitle ? (
            <Text style={styles.rowTrailing} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {/* Status bucket is only used to drive the row's optional accent; keep it
          derived from the same source every other surface uses. */}
      {bucket === "failed" ? <View style={styles.rowAccentFailed} /> : null}
    </Pressable>
  );
}

// Plain hex keeps the icon component prop types happy without dragging the
// theme into the row. Mirrors `foregroundMuted` semantic foreground.
const FOREGROUND_MUTED_COLOR = "#6b7280";

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
  },
  headerText: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing[3],
    paddingBottom: theme.spacing[3],
  },
  emptyState: {
    paddingVertical: theme.spacing[6],
    paddingHorizontal: theme.spacing[3],
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foregroundMuted,
    textAlign: "center",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing[4],
  },
  placeholderText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foregroundMuted,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface1,
    marginBottom: theme.spacing[2],
  },
  rowPressed: {
    backgroundColor: theme.colors.surface2,
  },
  rowIcon: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    fontWeight: "500",
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    marginTop: 2,
  },
  rowStatus: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foregroundMuted,
    fontFamily: theme.fontFamily.mono,
  },
  rowTrailing: {
    flexShrink: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foregroundMuted,
  },
  rowAccentFailed: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.palette.red[500],
  },
}));
