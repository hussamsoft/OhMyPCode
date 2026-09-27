/**
 * SSH host management screen for OMP.
 *
 * This is OMP's own internal SSH-remote-host list (used by its own
 * remote-exec tooling), unrelated to OhMyPCode's own SSH host
 * pairing/connectivity feature — a different concept with the same name.
 * `/ssh` has a headless `handle: handleSshAcp` in the fork's
 * `slash-commands/helpers/ssh.ts`, so — like `/context` and `/mcp` — it
 * never goes through the `ui.kind === "overlay"` contract; it's reachable
 * through the plain `omp.command.run` RPC today.
 *
 * Same reasoning as `omp-mcp-form.tsx` for not building a structured
 * add-host form: the real subcommand grammar (`--host`, `--user`,
 * `--port`, `--key`, `--scope project|user`) isn't exposed as anything
 * richer than a flag string server-side, so a bespoke form would either
 * re-invent CLI argument parsing or silently drop flags.
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
      testID={`omp-ssh-quick-${verb}`}
    >
      {verb}
    </Button>
  );
}

export interface OmpSshFormProps {
  serverId?: string | null;
  agentId?: string | null;
}

export function OmpSshForm({ serverId, agentId }: OmpSshFormProps) {
  const { t } = useTranslation();
  const enabled = Boolean(serverId && agentId);
  const { run, supported, isPending, error, lastResult } = useOmpSlashCommand(serverId, agentId);
  const canRun = enabled && supported;
  const [argsDraft, setArgsDraft] = useState("");

  const runSsh = useCallback(
    (args: string) => {
      if (!canRun) return;
      void run({ name: "ssh", args });
    },
    [canRun, run],
  );

  useEffect(() => {
    runSsh("list");
    // Only re-run when the agent identity or capability actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, agentId, canRun]);

  const runArgsDraft = useCallback(() => {
    const trimmed = argsDraft.trim();
    if (trimmed) runSsh(trimmed);
  }, [argsDraft, runSsh]);

  const runListAgain = useCallback(() => runSsh("list"), [runSsh]);

  if (!canRun) {
    return (
      <View style={styles.placeholder} testID="omp-ssh-form-placeholder">
        <Text style={styles.message}>{t("agentControls.omp.sshUnavailable")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.form} testID="omp-ssh-form">
      <View style={styles.toolbar}>
        {QUICK_VERBS.map((verb) => (
          <QuickVerbButton key={verb} verb={verb} disabled={isPending} onRun={runSsh} />
        ))}
        <Button
          size="sm"
          variant="ghost"
          leftIcon={REFRESH_ICON}
          disabled={isPending}
          onPress={runListAgain}
          testID="omp-ssh-refresh"
        >
          {t("agentControls.omp.sshRefresh")}
        </Button>
      </View>
      <View style={styles.commandBar}>
        <EditingTextInput
          accessibilityLabel={t("agentControls.omp.sshArgsLabel")}
          placeholder={t("agentControls.omp.sshArgsPlaceholder")}
          initialValue={argsDraft}
          onChangeText={setArgsDraft}
          onSubmitEditing={runArgsDraft}
          style={styles.commandInput}
          testID="omp-ssh-args-input"
        />
        <Button
          size="sm"
          disabled={isPending || !argsDraft.trim()}
          onPress={runArgsDraft}
          testID="omp-ssh-run"
        >
          {t("agentControls.omp.sshRun")}
        </Button>
      </View>
      {error ? (
        <Text style={styles.error} testID="omp-ssh-form-error">
          {error.message}
        </Text>
      ) : null}
      <ScrollView style={styles.body} testID="omp-ssh-form-body">
        {isPending && !lastResult ? (
          <Text style={styles.message} testID="omp-ssh-form-loading">
            {t("agentControls.omp.sshLoading")}
          </Text>
        ) : (
          <Text style={styles.report} selectable testID="omp-ssh-report">
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
