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
import { useOmpAgentCatalog } from "@/composer/omp-control-deck/use-omp-rpc";
import type { OmpAvailableAgent } from "@ohmypcode/protocol/messages";
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

// Source-order priority for the available-agents catalog. Bundled first
// because those ship with the runtime and are always available; project and
// user roots come next because they describe agent local to the current
// work; unknown values (defensive — the protocol caps the enum) fall to the
// bottom rather than throwing so a future fork addition does not break the
// panel.
const CATALOG_SOURCE_ORDER: Record<OmpAvailableAgent["source"], number> = {
  bundled: 0,
  user: 1,
  project: 2,
};

function resolveCatalogSourceOrder(source: OmpAvailableAgent["source"]): number {
  if (source === "bundled" || source === "user" || source === "project") {
    return CATALOG_SOURCE_ORDER[source];
  }
  return 99;
}

function sortCatalog(agents: readonly OmpAvailableAgent[]): OmpAvailableAgent[] {
  return [...agents].sort((left, right) => {
    const order = resolveCatalogSourceOrder(left.source) - resolveCatalogSourceOrder(right.source);
    if (order !== 0) return order;
    return left.name.localeCompare(right.name);
  });
}

function resolveCatalogSourceLabelKey(
  source: OmpAvailableAgent["source"],
): "sourceBundled" | "sourceUser" | "sourceProject" {
  if (source === "user") return "sourceUser";
  if (source === "project") return "sourceProject";
  return "sourceBundled";
}

function resolveCatalogSpawnButtonStyle({ pressed }: { pressed: boolean }) {
  return pressed
    ? [styles.catalogSpawnButton, styles.catalogSpawnButtonPressed]
    : styles.catalogSpawnButton;
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
  const catalog = useOmpAgentCatalog(
    enabled ? (serverId as string) : null,
    enabled ? (agentId as string) : null,
  );
  const sortedCatalog = useMemo<OmpAvailableAgent[]>(
    () => (catalog.data ? sortCatalog(catalog.data) : []),
    [catalog.data],
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
        <CatalogSection
          supported={catalog.supported}
          isLoading={catalog.isLoading}
          error={catalog.error}
          agents={sortedCatalog}
          t={t}
        />
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

interface CatalogSectionProps {
  supported: boolean;
  isLoading: boolean;
  error: Error | null;
  agents: readonly OmpAvailableAgent[];
  t: (key: string) => string;
}

/**
 * Renders the read-only available-agents catalog. The section is rendered
 * even when the server has not advertised the capability so the panel can
 * surface a precise "unsupported" caption (rather than silently dropping it).
 * Spawn/execute is intentionally absent — the fork does not expose it over
 * RPC yet, so each row's "Spawn" button is rendered disabled with a tooltip.
 */
function CatalogSection({ supported, isLoading, error, agents, t }: CatalogSectionProps) {
  const body = resolveCatalogSectionBody({ supported, isLoading, error, agents, t });
  return (
    <View style={styles.catalogSection} testID="omp-agents-hub-catalog">
      <Text style={styles.catalogHeading}>{t("panels.ompAgentsHub.catalog.heading")}</Text>
      {body}
    </View>
  );
}

function resolveCatalogSectionBody({
  supported,
  isLoading,
  error,
  agents,
  t,
}: CatalogSectionProps): React.ReactNode {
  if (!supported) {
    return (
      <Text style={styles.catalogCaption} testID="omp-agents-hub-catalog-unsupported">
        {t("panels.ompAgentsHub.catalog.unsupportedCaption")}
      </Text>
    );
  }
  if (isLoading) {
    return (
      <Text style={styles.catalogCaption} testID="omp-agents-hub-catalog-loading">
        {t("panels.ompAgentsHub.catalog.loadingCatalog")}
      </Text>
    );
  }
  if (error) {
    return (
      <Text style={styles.catalogCaption} testID="omp-agents-hub-catalog-error">
        {t("panels.ompAgentsHub.catalog.errorCatalog")}
      </Text>
    );
  }
  if (agents.length === 0) {
    return (
      <Text style={styles.catalogCaption} testID="omp-agents-hub-catalog-empty">
        {t("panels.ompAgentsHub.catalog.emptyCatalog")}
      </Text>
    );
  }
  return (
    <View style={styles.catalogList}>
      {agents.map((agent) => (
        <CatalogRow key={`${agent.source}:${agent.name}`} agent={agent} t={t} />
      ))}
    </View>
  );
}

interface CatalogRowProps {
  agent: OmpAvailableAgent;
  t: (key: string) => string;
}

function CatalogRow({ agent, t }: CatalogRowProps) {
  const sourceKey = resolveCatalogSourceLabelKey(agent.source);
  const tools = agent.tools ?? [];
  const models = agent.model ?? [];
  return (
    <View
      style={styles.catalogRow}
      testID={`omp-agents-hub-catalog-row-${agent.source}-${agent.name}`}
    >
      <View style={styles.catalogRowHeader}>
        <Text style={styles.catalogRowName} numberOfLines={1}>
          {agent.name}
        </Text>
        <Text style={styles.catalogRowSource}>{t(`panels.ompAgentsHub.catalog.${sourceKey}`)}</Text>
      </View>
      {agent.description ? (
        <Text style={styles.catalogRowDescription} numberOfLines={2}>
          {agent.description}
        </Text>
      ) : null}
      <View style={styles.catalogRowMeta}>
        {tools.length > 0 ? (
          <Text style={styles.catalogRowMetaItem} numberOfLines={1}>
            {t("panels.ompAgentsHub.catalog.toolsLabel")}: {tools.join(", ")}
          </Text>
        ) : null}
        {models.length > 0 ? (
          <Text style={styles.catalogRowMetaItem} numberOfLines={1}>
            {t("panels.ompAgentsHub.catalog.modelsLabel")}: {models.join(", ")}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={DISABLED_PRESSABLE_STATE}
        accessibilityLabel={t("panels.ompAgentsHub.catalog.spawnDisabledTooltip")}
        testID={`omp-agents-hub-catalog-row-${agent.source}-${agent.name}-spawn`}
        // No spawn handler: the fork does not expose spawn/execute over RPC
        // yet. The button is rendered as an honest placeholder so the host
        // does not invent a fake action.
        disabled
        style={resolveCatalogSpawnButtonStyle}
      >
        <Text style={styles.catalogSpawnButtonText}>
          {t("panels.ompAgentsHub.catalog.spawnDisabledTooltip")}
        </Text>
      </Pressable>
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

// Hoisted out of the JSX so the prop stays referentially stable across
// re-renders (react-perf's jsx-no-new-object-as-prop).
const DISABLED_PRESSABLE_STATE = { disabled: true };

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
  catalogSection: {
    marginBottom: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface1,
  },
  catalogHeading: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.foreground,
    marginBottom: theme.spacing[2],
  },
  catalogCaption: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foregroundMuted,
  },
  catalogList: {
    gap: theme.spacing[2],
  },
  catalogRow: {
    paddingVertical: theme.spacing[2],
    borderBottomWidth: theme.borderWidth[1],
    borderBottomColor: theme.colors.border,
  },
  catalogRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[2],
  },
  catalogRowName: {
    flexShrink: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    fontWeight: "500",
  },
  catalogRowSource: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foregroundMuted,
    fontFamily: theme.fontFamily.mono,
  },
  catalogRowDescription: {
    marginTop: 2,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foregroundMuted,
  },
  catalogRowMeta: {
    marginTop: theme.spacing[2],
    gap: 2,
  },
  catalogRowMetaItem: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foregroundMuted,
    fontFamily: theme.fontFamily.mono,
  },
  catalogSpawnButton: {
    marginTop: theme.spacing[2],
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface2,
    opacity: 0.6,
  },
  catalogSpawnButtonPressed: {
    backgroundColor: theme.colors.surface1,
  },
  catalogSpawnButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foregroundMuted,
    textAlign: "center",
  },
}));
