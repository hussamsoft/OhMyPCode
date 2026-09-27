/**
 * Goal mode screen for OMP.
 *
 * `/goal` is `handleTui`-only in the fork's `builtin-modes.ts` (no `handle`),
 * so unlike `/context`/`/mcp`/`/ssh` it is not reachable through the plain
 * `omp.command.run` RPC. This screen drives OMP's own goal runtime through
 * the dedicated `omp.modes.set.request` (objective/tokenBudget, for
 * entering) and `omp.goal.action.request` (pause/resume/drop, for acting on
 * an already-active or paused goal) messages instead.
 *
 * Reactivating goal mode through `omp.modes.set.request`'s `paused: false`
 * toggle starts a *fresh* goal rather than resuming the paused one (OMP's
 * own `set_mode` semantics — see `dispatchRpcModeCommand` in the fork), so
 * this screen never uses that toggle for pause/resume/drop; those always go
 * through `useOmpGoalAction`, which calls the goal runtime directly.
 */
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { EditingTextInput } from "@/components/ui/text-input";
import {
  useOmpGoalAction,
  useOmpModeSetter,
  useOmpModes,
} from "@/composer/omp-control-deck/use-omp-rpc";

export interface OmpGoalFormProps {
  serverId?: string | null;
  agentId?: string | null;
}

function formatTimeUsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainderSeconds = Math.floor(seconds % 60);
  return minutes > 0 ? `${minutes}m ${remainderSeconds}s` : `${remainderSeconds}s`;
}

export function OmpGoalForm({ serverId, agentId }: OmpGoalFormProps) {
  const { t } = useTranslation();
  const enabled = Boolean(serverId && agentId);
  const { modes, isLoading } = useOmpModes(serverId, agentId, { enabled });
  const { setMode, isPending: isEntering, error: enterError } = useOmpModeSetter(serverId, agentId);
  const {
    goalAction,
    isPending: isActing,
    error: actionError,
  } = useOmpGoalAction(serverId, agentId);
  const [objectiveDraft, setObjectiveDraft] = useState("");
  const [tokenBudgetDraft, setTokenBudgetDraft] = useState("");

  const goal = modes?.goal ?? null;
  const parsedTokenBudget = useMemo(() => {
    const trimmed = tokenBudgetDraft.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
  }, [tokenBudgetDraft]);

  const startGoal = useCallback(() => {
    const objective = objectiveDraft.trim();
    if (!objective) return;
    void setMode({ mode: "goal", objective, tokenBudget: parsedTokenBudget });
  }, [objectiveDraft, parsedTokenBudget, setMode]);

  const pauseGoal = useCallback(() => void goalAction("pause"), [goalAction]);
  const resumeGoal = useCallback(() => void goalAction("resume"), [goalAction]);
  const dropGoal = useCallback(() => void goalAction("drop"), [goalAction]);

  if (!enabled) {
    return (
      <View style={styles.placeholder} testID="omp-goal-form-placeholder">
        <Text style={styles.message}>{t("agentControls.omp.goalUnavailable")}</Text>
      </View>
    );
  }

  if (isLoading && !modes) {
    return (
      <View style={styles.placeholder} testID="omp-goal-form-loading">
        <Text style={styles.message}>{t("agentControls.omp.goalLoading")}</Text>
      </View>
    );
  }

  const error = enterError ?? actionError;

  return (
    <View style={styles.form} testID="omp-goal-form">
      {error ? (
        <Text style={styles.error} testID="omp-goal-form-error">
          {error.message}
        </Text>
      ) : null}
      {goal ? (
        <View style={styles.body} testID="omp-goal-active">
          <Text style={styles.objective} selectable testID="omp-goal-objective">
            {goal.objective}
          </Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("agentControls.omp.goalStatusLabel")}</Text>
            <Text style={styles.statValue} testID="omp-goal-status">
              {goal.status}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("agentControls.omp.goalTokensUsedLabel")}</Text>
            <Text style={styles.statValue} testID="omp-goal-tokens-used">
              {goal.tokenBudget ? `${goal.tokensUsed} / ${goal.tokenBudget}` : goal.tokensUsed}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t("agentControls.omp.goalTimeUsedLabel")}</Text>
            <Text style={styles.statValue}>{formatTimeUsed(goal.timeUsedSeconds)}</Text>
          </View>
          <View style={styles.actionRow}>
            {goal.status === "paused" ? (
              <Button size="sm" disabled={isActing} onPress={resumeGoal} testID="omp-goal-resume">
                {t("agentControls.omp.goalResume")}
              </Button>
            ) : (
              <Button size="sm" disabled={isActing} onPress={pauseGoal} testID="omp-goal-pause">
                {t("agentControls.omp.goalPause")}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              disabled={isActing}
              onPress={dropGoal}
              testID="omp-goal-drop"
            >
              {t("agentControls.omp.goalDrop")}
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.body} testID="omp-goal-inactive">
          <Text style={styles.message}>{t("agentControls.omp.goalNoActiveGoal")}</Text>
          <EditingTextInput
            accessibilityLabel={t("agentControls.omp.goalObjectiveLabel")}
            placeholder={t("agentControls.omp.goalObjectivePlaceholder")}
            initialValue={objectiveDraft}
            onChangeText={setObjectiveDraft}
            onSubmitEditing={startGoal}
            style={styles.input}
            testID="omp-goal-objective-input"
          />
          <EditingTextInput
            accessibilityLabel={t("agentControls.omp.goalTokenBudgetLabel")}
            placeholder={t("agentControls.omp.goalTokenBudgetPlaceholder")}
            initialValue={tokenBudgetDraft}
            onChangeText={setTokenBudgetDraft}
            onSubmitEditing={startGoal}
            keyboardType="numeric"
            style={styles.input}
            testID="omp-goal-token-budget-input"
          />
          <Button
            size="sm"
            disabled={isEntering || !objectiveDraft.trim()}
            onPress={startGoal}
            testID="omp-goal-start"
          >
            {t("agentControls.omp.goalStart")}
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
  objective: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.foreground,
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
  actionRow: {
    flexDirection: "row",
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
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
