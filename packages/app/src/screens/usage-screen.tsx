import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import type { OmpStatistics } from "@getpaseo/protocol/messages";
import {
  Activity,
  BarChart3,
  Coins,
  Gauge,
  RefreshCw,
  Sparkles,
  type LucideProps,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { MenuHeader } from "@/components/headers/menu-header";
import { HostFilter } from "@/components/hosts/host-filter";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/segmented-control";
import { useActiveWorkspaceSelection } from "@/stores/navigation-active-workspace-store";
import { useHosts } from "@/runtime/host-runtime";
import { ProviderUsageList } from "@/provider-usage/list";
import { useProviderUsage } from "@/provider-usage/use-provider-usage";
import { useOmpStatistics } from "@/omp-statistics/use-omp-statistics";
import { ICON_SIZE, type Theme } from "@/styles/theme";

const DASHBOARD_TABS = ["overview", "models", "accounts"] as const;
type DashboardTab = (typeof DASHBOARD_TABS)[number];

interface MetricIconProps {
  icon: ComponentType<LucideProps>;
  size: number;
  color?: string;
}

function MetricIcon({ icon: Icon, size, color = "" }: MetricIconProps) {
  return <Icon size={size} color={color} />;
}

const ThemedMetricIcon = withUnistyles(MetricIcon);
const ThemedLoadingSpinner = withUnistyles(LoadingSpinner);
const metricIconMapping = (theme: Theme) => ({ color: theme.colors.accent });
const mutedColorMapping = (theme: Theme) => ({ color: theme.colors.foregroundMuted });

function usageHostOptionTestID(serverId: string): string {
  return `usage-host-${serverId}`;
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDuration(milliseconds: number | null): string {
  if (milliseconds === null) return "—";
  return milliseconds >= 1000
    ? `${(milliseconds / 1000).toFixed(1)}s`
    : `${Math.round(milliseconds)}ms`;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <ThemedMetricIcon icon={Icon} size={ICON_SIZE.md} uniProps={metricIconMapping} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function ActivityChart({ points }: { points: OmpStatistics["timeSeries"] }) {
  const { t } = useTranslation();
  const recent = points.slice(-24);
  const maxRequests = Math.max(1, ...recent.map((point) => point.requests));
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelEyebrow}>{t("usage.screen.requestVolume")}</Text>
          <Text style={styles.panelTitle}>{t("usage.screen.recentActivity")}</Text>
        </View>
        <Text style={styles.panelMeta}>
          {t("usage.screen.hourlyWindows", { count: recent.length })}
        </Text>
      </View>
      <View style={styles.chart} accessibilityLabel={t("usage.screen.recentActivityChart")}>
        {recent.map((point) => (
          <View key={point.timestamp} style={styles.chartColumn}>
            <View
              style={[
                styles.chartBar,
                { height: Math.max(4, Math.round((point.requests / maxRequests) * 112)) },
                point.errors > 0 && styles.chartBarWithErrors,
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.chartLegend}>
        <Text style={styles.panelMeta}>{t("usage.screen.earlier")}</Text>
        <Text style={styles.panelMeta}>{t("usage.screen.now")}</Text>
      </View>
    </View>
  );
}

function ModelsTable({ models }: { models: OmpStatistics["byModel"] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View>
          <Text style={styles.panelEyebrow}>{t("usage.screen.modelPerformance")}</Text>
          <Text style={styles.panelTitle}>{t("usage.screen.allRoutedModels")}</Text>
        </View>
        <Text style={styles.panelMeta}>
          {t("usage.screen.modelCount", { count: models.length })}
        </Text>
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.modelColumn]}>
          {t("usage.screen.columns.model")}
        </Text>
        <Text style={styles.tableHeaderText}>{t("usage.screen.columns.requests")}</Text>
        <Text style={styles.tableHeaderText}>{t("usage.screen.columns.output")}</Text>
        <Text style={styles.tableHeaderText}>TTFT</Text>
        <Text style={styles.tableHeaderText}>{t("usage.screen.columns.tokensPerSecond")}</Text>
        <Text style={styles.tableHeaderText}>{t("usage.screen.columns.errors")}</Text>
        <Text style={styles.tableHeaderText}>{t("usage.screen.columns.cost")}</Text>
      </View>
      {models.map((model) => (
        <View key={`${model.provider}/${model.model}`} style={styles.tableRow}>
          <View style={styles.modelColumn}>
            <Text style={styles.modelName} numberOfLines={1}>
              {model.model}
            </Text>
            <Text style={styles.modelProvider} numberOfLines={1}>
              {model.provider}
            </Text>
          </View>
          <Text style={styles.tableValue}>{formatCompact(model.totalRequests)}</Text>
          <Text style={styles.tableValue}>{formatCompact(model.totalOutputTokens)}</Text>
          <Text style={styles.tableValue}>{formatDuration(model.avgTtft)}</Text>
          <Text style={styles.tableValue}>
            {model.avgTokensPerSecond === null ? "—" : model.avgTokensPerSecond.toFixed(1)}
          </Text>
          <Text style={styles.tableValue}>{formatPercent(model.errorRate)}</Text>
          <Text style={styles.tableValue}>{formatCurrency(model.totalCost)}</Text>
        </View>
      ))}
    </View>
  );
}

export function UsageScreen() {
  const { t } = useTranslation();
  const hosts = useHosts();
  const activeWorkspace = useActiveWorkspaceSelection();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(
    activeWorkspace?.serverId ?? hosts[0]?.serverId ?? null,
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const statistics = useOmpStatistics(selectedServerId);
  const providerUsage = useProviderUsage(selectedServerId, { enabled: activeTab === "accounts" });

  useEffect(() => {
    if (selectedServerId && hosts.some((host) => host.serverId === selectedServerId)) return;
    setSelectedServerId(activeWorkspace?.serverId ?? hosts[0]?.serverId ?? null);
  }, [activeWorkspace?.serverId, hosts, selectedServerId]);

  const isRefreshing =
    (statistics.view.kind === "ready" && statistics.view.isRefreshing) ||
    (activeTab === "accounts" &&
      providerUsage.view.kind === "ready" &&
      providerUsage.view.isRefreshing);
  const refreshStatistics = statistics.refresh;
  const refreshProviderUsage = providerUsage.refresh;
  const handleRefresh = useCallback(() => {
    const refreshes = [refreshStatistics()];
    if (activeTab === "accounts") refreshes.push(refreshProviderUsage());
    void Promise.allSettled(refreshes);
  }, [activeTab, refreshProviderUsage, refreshStatistics]);
  const dashboardTabOptions = useMemo<SegmentedControlOption<DashboardTab>[]>(
    () => [
      { value: "overview", label: t("usage.screen.tabs.overview") },
      { value: "models", label: t("usage.screen.tabs.models") },
      { value: "accounts", label: t("usage.screen.tabs.accounts") },
    ],
    [t],
  );
  const rightContent = useMemo(
    () => (
      <View style={styles.headerActions}>
        {hosts.length > 1 && selectedServerId ? (
          <HostFilter
            hosts={hosts}
            selectedHost={selectedServerId}
            onSelectHost={setSelectedServerId}
            triggerTestID="usage-host-filter"
            hostOptionTestID={usageHostOptionTestID}
          />
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={RefreshCw}
          onPress={handleRefresh}
          disabled={!selectedServerId || isRefreshing}
          loading={isRefreshing}
        >
          {t("usage.screen.refresh")}
        </Button>
      </View>
    ),
    [handleRefresh, hosts, isRefreshing, selectedServerId, t],
  );

  let content;
  if (!selectedServerId) {
    content = (
      <Alert
        variant="info"
        title={t("usage.screen.noHost.title")}
        description={t("usage.screen.noHost.description")}
      />
    );
  } else if (statistics.view.kind === "loading") {
    content = (
      <View style={styles.loading}>
        <ThemedLoadingSpinner size="large" uniProps={mutedColorMapping} />
        <Text style={styles.loadingText}>{t("usage.screen.loadingStatistics")}</Text>
      </View>
    );
  } else if (statistics.view.kind === "error") {
    content = (
      <Alert
        variant="error"
        title={t("usage.screen.statisticsUnavailable")}
        description={statistics.view.message}
      >
        <Button variant="outline" size="sm" onPress={handleRefresh}>
          {t("usage.screen.tryAgain")}
        </Button>
      </Alert>
    );
  } else {
    const { overall, byModel, timeSeries } = statistics.view.payload.statistics;
    const totalTokens =
      overall.totalInputTokens +
      overall.totalOutputTokens +
      overall.totalCacheReadTokens +
      overall.totalCacheWriteTokens;
    if (activeTab === "overview") {
      content = (
        <View style={styles.contentStack}>
          <View style={styles.metricGrid}>
            <MetricCard
              icon={Activity}
              label={t("usage.screen.metrics.requests")}
              value={formatCompact(overall.totalRequests)}
              detail={t("usage.screen.details.failed", {
                value: formatCompact(overall.failedRequests),
              })}
            />
            <MetricCard
              icon={Sparkles}
              label={t("usage.screen.metrics.tokensRouted")}
              value={formatCompact(totalTokens)}
              detail={t("usage.screen.details.generated", {
                value: formatCompact(overall.totalOutputTokens),
              })}
            />
            <MetricCard
              icon={Coins}
              label={t("usage.screen.metrics.estimatedCost")}
              value={formatCurrency(overall.totalCost)}
              detail={t("usage.screen.details.unpricedRequests", {
                value: overall.unpricedRequests,
              })}
            />
            <MetricCard
              icon={Gauge}
              label={t("usage.screen.metrics.cacheHitRate")}
              value={formatPercent(overall.cacheRate)}
              detail={t("usage.screen.details.estimatedSavings", {
                value: formatPercent(overall.cacheSavings),
              })}
            />
            <MetricCard
              icon={BarChart3}
              label={t("usage.screen.metrics.generationSpeed")}
              value={
                overall.avgTokensPerSecond === null
                  ? "—"
                  : `${overall.avgTokensPerSecond.toFixed(1)} tok/s`
              }
              detail={t("usage.screen.details.averageTtft", {
                value: formatDuration(overall.avgTtft),
              })}
            />
          </View>
          <ActivityChart points={timeSeries} />
          <ModelsTable models={byModel.slice(0, 5)} />
        </View>
      );
    } else if (activeTab === "models") {
      content = <ModelsTable models={byModel} />;
    } else if (providerUsage.view.kind === "loading") {
      content = (
        <View style={styles.loading}>
          <ThemedLoadingSpinner size="large" uniProps={mutedColorMapping} />
          <Text style={styles.loadingText}>{t("usage.screen.loadingAccountLimits")}</Text>
        </View>
      );
    } else if (providerUsage.view.kind === "error") {
      content = (
        <Alert
          variant="error"
          title={t("usage.screen.accountLimitsUnavailable")}
          description={providerUsage.view.message}
        />
      );
    } else {
      const ompProviders = providerUsage.view.payload.providers.filter((usage) =>
        usage.providerId.startsWith("omp:"),
      );
      content =
        ompProviders.length > 0 ? (
          <ProviderUsageList providers={ompProviders} />
        ) : (
          <Alert
            variant="info"
            title={t("usage.screen.noAccountLimits.title")}
            description={t("usage.screen.noAccountLimits.description")}
          />
        );
    }
  }

  return (
    <View style={styles.container}>
      <MenuHeader title={t("usage.title")} rightContent={rightContent} />
      <SegmentedControl
        options={dashboardTabOptions}
        value={activeTab}
        onValueChange={setActiveTab}
        size="sm"
        style={styles.tabBar}
        testID="usage-tabs"
      />
      <ScrollView>
        <View style={styles.scrollContent}>{content}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface0,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  tabBar: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: theme.spacing[4],
    gap: theme.spacing[1],
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface1,
  },
  scrollContent: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[6],
  },
  contentStack: {
    gap: theme.spacing[4],
  },
  loading: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[3],
  },
  loadingText: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.base,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[3],
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 190,
    minWidth: 180,
    padding: theme.spacing[4],
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface1,
  },
  metricIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface3,
  },
  metricLabel: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing[1],
  },
  metricValue: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize["3xl"],
    fontWeight: theme.fontWeight.normal,
  },
  metricDetail: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing[2],
  },
  panel: {
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface1,
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: theme.spacing[4],
    borderBottomWidth: theme.borderWidth[1],
    borderBottomColor: theme.colors.border,
  },
  panelEyebrow: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing[1],
  },
  panelTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  panelMeta: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  chart: {
    height: 152,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
  },
  chartColumn: {
    flex: 1,
    height: 112,
    justifyContent: "flex-end",
  },
  chartBar: {
    minHeight: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.accent,
    opacity: 0.7,
  },
  chartBarWithErrors: {
    backgroundColor: theme.colors.statusWarning,
    opacity: 0.9,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[3],
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.surface2,
  },
  tableHeaderText: {
    flex: 1,
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "right",
  },
  tableRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderTopWidth: theme.borderWidth[1],
    borderTopColor: theme.colors.border,
  },
  modelColumn: {
    flex: 2,
    textAlign: "left",
  },
  modelName: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.normal,
  },
  modelProvider: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing[0.5],
  },
  tableValue: {
    flex: 1,
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
}));
