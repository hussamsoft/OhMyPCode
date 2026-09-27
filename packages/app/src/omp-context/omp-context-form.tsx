/**
 * Context usage screen for OMP.
 *
 * `/context` has a headless `handle` (not just `handleTui`) in the fork's
 * `builtin-session.ts`, so it is already reachable through the existing
 * `omp.command.run` RPC (`useOmpSlashCommand`) — no dedicated RPC type is
 * needed the way settings/keybindings required one. The server renders a
 * pre-formatted ASCII-bar report (`buildContextReportText` in
 * `context-report.ts`); this screen shows that text verbatim in a monospace
 * block rather than re-parsing it into custom bars, so it never drifts from
 * whatever the fork actually renders.
 */
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useOmpSlashCommand } from "@/composer/omp-control-deck/use-omp-rpc";

const ThemedRefreshCw = withUnistyles(RefreshCw);
// Hoisted so the refresh button passes a stable element rather than
// building a new one on every render.
const REFRESH_ICON = <ThemedRefreshCw size={14} />;

export interface OmpContextFormProps {
  serverId?: string | null;
  agentId?: string | null;
}

export function OmpContextForm({ serverId, agentId }: OmpContextFormProps) {
  const { t } = useTranslation();
  const enabled = Boolean(serverId && agentId);
  const { run, isPending, error, lastResult } = useOmpSlashCommand(serverId, agentId);

  const refresh = useCallback(() => {
    if (!enabled) return;
    void run({ name: "context" });
  }, [enabled, run]);

  useEffect(() => {
    refresh();
    // Only re-run when the agent identity actually changes, not on every
    // `run`/`refresh` identity churn from the underlying mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, agentId]);

  if (!enabled) {
    return (
      <View style={styles.placeholder} testID="omp-context-form-placeholder">
        <Text style={styles.message}>{t("agentControls.omp.contextUnavailable")}</Text>
      </View>
    );
  }

  if (isPending && !lastResult) {
    return (
      <View style={styles.placeholder} testID="omp-context-form-loading">
        <Text style={styles.message}>{t("agentControls.omp.contextLoading")}</Text>
      </View>
    );
  }

  if (error && !lastResult) {
    return (
      <View style={styles.placeholder} testID="omp-context-form-error">
        <Text style={styles.error}>{error.message}</Text>
        <Button onPress={refresh}>{t("agentControls.omp.contextRetry")}</Button>
      </View>
    );
  }

  return (
    <View style={styles.form} testID="omp-context-form">
      <View style={styles.toolbar}>
        <Button
          leftIcon={REFRESH_ICON}
          onPress={refresh}
          disabled={isPending}
          testID="omp-context-refresh"
        >
          {t("agentControls.omp.contextRefresh")}
        </Button>
      </View>
      <ScrollView style={styles.body} testID="omp-context-form-body">
        <Text style={styles.report} selectable testID="omp-context-report">
          {lastResult?.output ?? ""}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  form: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: theme.spacing[3],
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing[3],
  },
  report: {
    fontFamily: theme.fontFamily.mono,
    fontSize: 12,
    color: theme.colors.foreground,
    lineHeight: 18,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing[4],
    gap: theme.spacing[3],
  },
  message: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
    textAlign: "center",
    padding: theme.spacing[4],
  },
  error: {
    fontSize: 13,
    color: theme.colors.palette.red[500],
    textAlign: "center",
    padding: theme.spacing[4],
  },
}));
