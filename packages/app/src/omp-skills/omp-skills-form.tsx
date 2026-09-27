/**
 * OMP skill-listing toggle screen for OhMyPCode.
 *
 * `/skillful` (NOT an alias of `/skills`) has a headless `handle: ...` in the fork's
 * `slash-commands/builtin-modes.ts` (~line 553), so — like `/mcp`, `/ssh`,
 * `/context`, and `/plugins` — it never goes through the
 * `ui.kind === "overlay"` contract; it's reachable through the plain
 * `omp.command.run` RPC today. The headless handle dispatches on
 * `args.trim().toLowerCase()`:
 *  - `status` outputs `"Skill listing: on|off (session override; default
 *    from the skillful setting)."`
 *  - `on` / `off` calls `session.setSkillful(true|false)`
 *  - anything else (including the empty string) calls
 *    `session.toggleSkillful()` and outputs `"Skill listing enabled|disabled
 *    for this session."`
 *
 * The empty-args branch is intentionally surfaced as an explicit "toggle"
 * button in this form (rather than as the default) so the verb the user
 * clicked is visible in the report header — matches how `mcp`/`ssh`/`plugins`
 * label their argument text.
 *
 * `/skills` (the registry install / list-installed slash command) is
 * `handleTui`-only in the fork (`slash-commands/builtin-skills.ts`) and is
 * NOT reachable headless through `omp.command.run`. The panel renders a
 * static notice explaining that fact instead of pretending to surface
 * install/update verbs that would only hang on an unhandled rejection.
 *
 * The persisted `skillful` setting default (`cfgSkillful` in the fork, path
 * `"skillful"`) is shown alongside the session toggle so users can tell at
 * a glance whether their current session override differs from the
 * persisted default — `useOmpSettings` is gated on `ompSettings` capability,
 * so the default line simply stays blank when that hook is unavailable.
 */
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Compass } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { useOmpSettings, useOmpSlashCommand } from "@/composer/omp-control-deck/use-omp-rpc";

const ThemedCompass = withUnistyles(Compass);
const SKILLS_TUI_ONLY_NOTICE = `Install/update of registry skills stays in the OMP TUI: /skills (registry) is not exposed through omp.command.run.`;
const SKILLFUL_SETTINGS_PATH = "skillful";

type TFunction = (key: string) => string;

function formatDefaultSkillfulLabel(value: boolean | null, t: TFunction): string {
  if (value === null) return t("agentControls.omp.skillsDefaultUnknown");
  if (value) return t("agentControls.omp.skillsDefaultOn");
  return t("agentControls.omp.skillsDefaultOff");
}

const QUICK_VERBS = ["status", "on", "off", "toggle"] as const;

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
      variant={verb === "status" ? "default" : "secondary"}
      disabled={disabled}
      onPress={onPress}
      testID={`omp-skills-quick-${verb}`}
    >
      {verb}
    </Button>
  );
}

export interface OmpSkillsFormProps {
  serverId?: string | null;
  agentId?: string | null;
}

export function OmpSkillsForm({ serverId, agentId }: OmpSkillsFormProps) {
  const { t } = useTranslation();
  const enabled = Boolean(serverId && agentId);
  const { run, supported, isPending, error, lastResult } = useOmpSlashCommand(serverId, agentId);
  const { settings } = useOmpSettings(serverId, agentId, { enabled });
  const canRun = enabled && supported;
  const [tuiNoticeDismissed, setTuiNoticeDismissed] = useState(false);
  const dismissTuiNotice = useCallback(() => setTuiNoticeDismissed(true), []);

  const runSkillful = useCallback(
    (args: string) => {
      if (!canRun) return;
      void run({ name: "skillful", args });
    },
    [canRun, run],
  );

  useEffect(() => {
    runSkillful("status");
    // Only re-run when the agent identity or capability actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, agentId, canRun]);

  const defaultSettingEntry = settings.find((entry) => entry.path === SKILLFUL_SETTINGS_PATH);
  const defaultSkillful: boolean | null =
    typeof defaultSettingEntry?.value === "boolean" ? defaultSettingEntry.value : null;

  const defaultSkillfulLabel = formatDefaultSkillfulLabel(defaultSkillful, t);

  if (!canRun) {
    return (
      <View style={styles.placeholder} testID="omp-skills-form-placeholder">
        <Text style={styles.message}>{t("agentControls.omp.skillsUnavailable")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.form} testID="omp-skills-form">
      <View style={styles.headerRow}>
        <ThemedCompass size={16} />
        <Text style={styles.headerText}>{t("panels.ompSkills.header")}</Text>
      </View>
      <View style={styles.defaultRow} testID="omp-skills-default-row">
        <Text style={styles.defaultLabel}>{t("agentControls.omp.skillsDefaultLabel")}</Text>
        <Text style={styles.defaultValue} testID="omp-skills-default-value">
          {defaultSkillfulLabel}
        </Text>
      </View>
      <View style={styles.toolbar}>
        {QUICK_VERBS.map((verb) => (
          <QuickVerbButton key={verb} verb={verb} disabled={isPending} onRun={runSkillful} />
        ))}
      </View>
      {error ? (
        <Text style={styles.error} testID="omp-skills-form-error">
          {error.message}
        </Text>
      ) : null}
      <ScrollView style={styles.body} testID="omp-skills-form-body">
        {isPending && !lastResult ? (
          <Text style={styles.message} testID="omp-skills-form-loading">
            {t("agentControls.omp.skillsLoading")}
          </Text>
        ) : (
          <Text style={styles.report} selectable testID="omp-skills-report">
            {lastResult?.output ?? ""}
          </Text>
        )}
      </ScrollView>
      {!tuiNoticeDismissed ? (
        <View style={styles.tuiNotice} testID="omp-skills-tui-notice">
          <Text style={styles.tuiNoticeText}>{SKILLS_TUI_ONLY_NOTICE}</Text>
          <Button
            size="sm"
            variant="ghost"
            onPress={dismissTuiNotice}
            testID="omp-skills-tui-notice-dismiss"
          >
            {t("agentControls.omp.skillsTuiNoticeDismiss")}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  form: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    padding: theme.spacing[3],
  },
  headerText: {
    fontSize: 14,
    color: theme.colors.foreground,
    fontWeight: "600",
  },
  defaultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing[3],
    paddingBottom: theme.spacing[2],
  },
  defaultLabel: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
  },
  defaultValue: {
    fontSize: 12,
    color: theme.colors.foreground,
    fontFamily: theme.fontFamily.mono,
  },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
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
  tuiNotice: {
    padding: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  tuiNoticeText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.foregroundMuted,
  },
}));
