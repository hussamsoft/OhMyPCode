/**
 * OMP plugin management screen for OhMyPCode.
 *
 * `/plugins` (alias `/plugin`) has a headless `handle: ...` in the fork's
 * `slash-commands/builtin-marketplace.ts`, so — like `/mcp`, `/ssh`, and
 * `/context` — it never goes through the `ui.kind === "overlay"` contract;
 * it's reachable through the plain `omp.command.run` RPC today. The headless
 * handle dispatches on the first word of its args: `list` (default,
 * enumerates installed npm + marketplace plugins with their scope and
 * enabled status), `enable <name@marketplace> [--scope user|project]`, and
 * `disable <name@marketplace> [--scope user|project]`; unknown verbs are
 * surfaced verbatim via `usage(...)` rather than silently rewritten.
 *
 * Structured enable/disable forms aren't built here — the real subcommand
 * grammar (`--scope project|user`, `<name@marketplace>` selector) isn't
 * exposed as anything richer than a flag string server-side, so a bespoke
 * form would either re-invent CLI argument parsing or silently drop flags a
 * user typed. A single argument field that passes the user's text straight
 * through to the same parser the TUI uses stays honest about what the RPC
 * actually validates.
 */
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { EditingTextInput } from "@/components/ui/text-input";
import { useOmpSlashCommand } from "@/composer/omp-control-deck/use-omp-rpc";

const ThemedRefreshCw = withUnistyles(RefreshCw);
// Hoisted so the quick-action buttons pass a stable element rather than
// building a new one on every render.
const REFRESH_ICON = <ThemedRefreshCw size={14} />;

const QUICK_VERBS = ["list", "help"] as const;

function QuickVerbButton({
  verb,
  disabled,
  onRun,
}: {
  verb: (typeof QUICK_VERBS)[number];
  disabled: boolean;
  onRun: (verb: string) => void;
}) {
  const onPress = useCallback(() => onRun(verb), [onRun, verb]);
  return (
    <Button
      size="sm"
      variant={verb === "list" ? "default" : "secondary"}
      disabled={disabled}
      onPress={onPress}
      testID={`omp-plugins-quick-${verb}`}
    >
      {verb}
    </Button>
  );
}

export interface OmpPluginsFormProps {
  serverId?: string | null;
  agentId?: string | null;
}

export function OmpPluginsForm({ serverId, agentId }: OmpPluginsFormProps) {
  const { t } = useTranslation();
  const enabled = Boolean(serverId && agentId);
  const { run, supported, isPending, error, lastResult } = useOmpSlashCommand(serverId, agentId);
  const canRun = enabled && supported;
  const [argsDraft, setArgsDraft] = useState("");

  const runPlugins = useCallback(
    (args: string) => {
      if (!canRun) return;
      void run({ name: "plugins", args });
    },
    [canRun, run],
  );

  useEffect(() => {
    runPlugins("list");
    // Only re-run when the agent identity or capability actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, agentId, canRun]);

  const runArgsDraft = useCallback(() => {
    const trimmed = argsDraft.trim();
    if (trimmed) runPlugins(trimmed);
  }, [argsDraft, runPlugins]);

  const runListAgain = useCallback(() => runPlugins("list"), [runPlugins]);

  if (!canRun) {
    return (
      <View style={styles.placeholder} testID="omp-plugins-form-placeholder">
        <Text style={styles.message}>{t("agentControls.omp.pluginsUnavailable")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.form} testID="omp-plugins-form">
      <View style={styles.toolbar}>
        {QUICK_VERBS.map((verb) => (
          <QuickVerbButton key={verb} verb={verb} disabled={isPending} onRun={runPlugins} />
        ))}
        <Button
          size="sm"
          variant="ghost"
          leftIcon={REFRESH_ICON}
          disabled={isPending}
          onPress={runListAgain}
          testID="omp-plugins-refresh"
        >
          {t("agentControls.omp.pluginsRefresh")}
        </Button>
      </View>
      <View style={styles.commandBar}>
        <EditingTextInput
          accessibilityLabel={t("agentControls.omp.pluginsArgsLabel")}
          placeholder={t("agentControls.omp.pluginsArgsPlaceholder")}
          initialValue={argsDraft}
          onChangeText={setArgsDraft}
          onSubmitEditing={runArgsDraft}
          style={styles.commandInput}
          testID="omp-plugins-args-input"
        />
        <Button
          size="sm"
          disabled={isPending || !argsDraft.trim()}
          onPress={runArgsDraft}
          testID="omp-plugins-run"
        >
          {t("agentControls.omp.pluginsRun")}
        </Button>
      </View>
      {error ? (
        <Text style={styles.error} testID="omp-plugins-form-error">
          {error.message}
        </Text>
      ) : null}
      <ScrollView style={styles.body} testID="omp-plugins-form-body">
        {isPending && !lastResult ? (
          <Text style={styles.message} testID="omp-plugins-form-loading">
            {t("agentControls.omp.pluginsLoading")}
          </Text>
        ) : (
          <Text style={styles.report} selectable testID="omp-plugins-report">
            {lastResult?.output ?? ""}
          </Text>
        )}
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
    flexWrap: "wrap",
    gap: theme.spacing[2],
    padding: theme.spacing[3],
  },
  commandBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    paddingBottom: theme.spacing[3],
  },
  commandInput: {
    flex: 1,
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
  },
  message: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
    textAlign: "center",
    padding: theme.spacing[4],
  },
  error: {
    fontSize: 12,
    color: theme.colors.palette.red[500],
    paddingHorizontal: theme.spacing[3],
    paddingBottom: theme.spacing[2],
  },
}));
