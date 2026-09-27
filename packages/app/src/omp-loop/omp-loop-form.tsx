/**
 * Loop mode screen for OMP.
 *
 * `/loop` is `handleTui`-only in the fork's `builtin-modes.ts` (no `handle`),
 * so unlike `/context`/`/mcp`/`/ssh` it is not reachable through the plain
 * `omp.command.run` RPC. This screen drives OMP's own loop mode through the
 * dedicated `omp.modes.set.request` message: entering passes the raw
 * `/loop` argument string (e.g. `10m --until 'bun test' fix the tests`)
 * through unparsed, letting the fork's own `parseLoopArgs` validate it
 * server-side, the same "raw args passthrough" pattern already used for
 * `/mcp` and `/ssh` — a bespoke structured form would either re-invent the
 * flag grammar or silently drop flags it doesn't know about. Stopping an
 * active loop reuses the same toggle: `set_mode({mode:"loop"})` with no args
 * disables it when it's already enabled (mirrors `/loop` with no args in
 * the TUI).
 */
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { EditingTextInput } from "@/components/ui/text-input";
import { useOmpModeSetter, useOmpModes } from "@/composer/omp-control-deck/use-omp-rpc";
import type { OmpLoopState } from "@ohmypcode/protocol/messages";

export interface OmpLoopFormProps {
  serverId?: string | null;
  agentId?: string | null;
}

function formatLoopLimit(limit: OmpLoopState["limit"]): string | null {
  if (!limit) return null;
  if (limit.kind === "iterations") {
    return `${limit.remaining} of ${limit.initial} iterations remaining`;
  }
  const remainingMs = Math.max(0, limit.deadlineMs - Date.now());
  return `${Math.ceil(remainingMs / 60_000)} min remaining of ${Math.round(limit.durationMs / 60_000)} min bound`;
}

function formatLoopCondition(condition: OmpLoopState["condition"]): string | null {
  if (!condition) return null;
  return `${condition.until ? "until" : "while"}: ${condition.command}`;
}

export function OmpLoopForm({ serverId, agentId }: OmpLoopFormProps) {
  const { t } = useTranslation();
  const enabled = Boolean(serverId && agentId);
  const { modes, isLoading } = useOmpModes(serverId, agentId, { enabled });
  const { setMode, isPending, error } = useOmpModeSetter(serverId, agentId);
  const [argsDraft, setArgsDraft] = useState("");

  const loop = modes?.loop ?? null;

  const startLoop = useCallback(() => {
    void setMode({ mode: "loop", args: argsDraft.trim() });
  }, [argsDraft, setMode]);

  const stopLoop = useCallback(() => {
    void setMode({ mode: "loop" });
  }, [setMode]);

  if (!enabled) {
    return (
      <View style={styles.placeholder} testID="omp-loop-form-placeholder">
        <Text style={styles.message}>{t("agentControls.omp.loopUnavailable")}</Text>
      </View>
    );
  }

  if (isLoading && !modes) {
    return (
      <View style={styles.placeholder} testID="omp-loop-form-loading">
        <Text style={styles.message}>{t("agentControls.omp.loopLoading")}</Text>
      </View>
    );
  }

  const limitText = formatLoopLimit(loop?.limit);
  const conditionText = formatLoopCondition(loop?.condition);

  return (
    <View style={styles.form} testID="omp-loop-form">
      {error ? (
        <Text style={styles.error} testID="omp-loop-form-error">
          {error.message}
        </Text>
      ) : null}
      {loop ? (
        <View style={styles.body} testID="omp-loop-active">
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("agentControls.omp.loopStatusLabel")}</Text>
            <Text style={styles.statValue} testID="omp-loop-status">
              {loop.state}
            </Text>
          </View>
          {limitText ? (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t("agentControls.omp.loopLimitLabel")}</Text>
              <Text style={styles.statValue} testID="omp-loop-limit">
                {limitText}
              </Text>
            </View>
          ) : null}
          {conditionText ? (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{t("agentControls.omp.loopConditionLabel")}</Text>
              <Text style={styles.statValue} testID="omp-loop-condition">
                {conditionText}
              </Text>
            </View>
          ) : null}
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onPress={stopLoop}
            testID="omp-loop-stop"
          >
            {t("agentControls.omp.loopStop")}
          </Button>
        </View>
      ) : (
        <View style={styles.body} testID="omp-loop-inactive">
          <Text style={styles.message}>{t("agentControls.omp.loopNoActiveLoop")}</Text>
          <EditingTextInput
            accessibilityLabel={t("agentControls.omp.loopArgsLabel")}
            placeholder={t("agentControls.omp.loopArgsPlaceholder")}
            initialValue={argsDraft}
            onChangeText={setArgsDraft}
            onSubmitEditing={startLoop}
            style={styles.input}
            testID="omp-loop-args-input"
          />
          <Button size="sm" disabled={isPending} onPress={startLoop} testID="omp-loop-start">
            {t("agentControls.omp.loopStart")}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  form: {
    flex: 1,
  },
  body: {
    flex: 1,
    padding: theme.spacing[3],
    gap: theme.spacing[2],
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
  },
  statValue: {
    fontSize: 12,
    color: theme.colors.foreground,
  },
  input: {
    width: "100%",
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
    padding: theme.spacing[2],
  },
  error: {
    fontSize: 12,
    color: theme.colors.palette.red[500],
    paddingHorizontal: theme.spacing[3],
    paddingTop: theme.spacing[2],
  },
}));
