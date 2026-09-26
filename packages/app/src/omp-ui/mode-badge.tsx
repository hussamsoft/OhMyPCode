import { useMemo, type ReactElement } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

/**
 * Persisted agent modes. These are the long-lived modes the user toggles in
 * settings (plan / vibe / goal) -- a *paused* variant for plan and goal
 * exists, both surface as a warning-styled badge.
 */
export type OmpPersistedMode = "none" | "plan" | "plan_paused" | "vibe" | "goal" | "goal_paused";

/**
 * Session-only mode (not user-persisted between launches). Loop is purely a
 * per-session construct, so it is reported separately.
 */
export type OmpSessionMode = "loop" | "none";

/**
 * Toggleable launch flags the agent may run with. Each is a boolean; absent
 * means "off / default".
 */
export type OmpToggleFlag = "fast" | "advisor" | "prewalk";

export interface OmpModeBadgeProps {
  /** Persisted mode id; pass `null` to render the no-mode badge. */
  persistedMode?: OmpPersistedMode | string | null;
  /** Session mode id; pass `null` / `"none"` when no session mode is active. */
  sessionMode?: OmpSessionMode | string | null;
  /** Active toggles surfaced as small chips beside the primary badge. */
  toggles?: Partial<Record<OmpToggleFlag, boolean>>;
}

/**
 * Friendly human label for a known persisted mode id. Unknown ids are
 * rendered as the raw id by the caller, never hidden.
 */
const PERSISTED_LABELS: Record<OmpPersistedMode, string> = {
  none: "No mode",
  plan: "Plan",
  plan_paused: "Plan · paused",
  vibe: "Vibe",
  goal: "Goal",
  goal_paused: "Goal · paused",
};

const SESSION_LABELS: Record<OmpSessionMode, string> = {
  none: "Loop",
  loop: "Loop",
};

const TOGGLE_LABELS: Record<OmpToggleFlag, string> = {
  fast: "Fast",
  advisor: "Advisor",
  prewalk: "Prewalk",
};

function BadgePill({
  label,
  variant,
  accessibilityLabel,
}: {
  label: string;
  variant: "default" | "warning" | "muted" | "accent";
  accessibilityLabel?: string;
}): ReactElement {
  return (
    <View
      style={[styles.pill, styleForVariant(variant)]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.pillLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function OmpModeBadgeComponent({
  persistedMode,
  sessionMode,
  toggles,
}: OmpModeBadgeProps): ReactElement {
  const { t } = useTranslation();

  const persistedId = persistedMode ?? "none";
  const sessionId = sessionMode ?? "none";

  const persistedVariant: "default" | "warning" | "muted" | "accent" = useMemo(() => {
    if (typeof persistedId !== "string") return "muted";
    if (persistedId === "plan_paused" || persistedId === "goal_paused") return "warning";
    if (persistedId === "vibe") return "accent";
    if (persistedId === "none") return "muted";
    return "default";
  }, [persistedId]);

  const persistedLabel = useMemo(() => {
    if (typeof persistedId !== "string") return String(persistedId);
    if (persistedId in PERSISTED_LABELS) {
      return PERSISTED_LABELS[persistedId as OmpPersistedMode];
    }
    // Forward-compatibility: an OMP version that adds a new mode name
    // surfaces the raw id, never silently hidden.
    return persistedId;
  }, [persistedId]);

  const sessionLabel = useMemo(() => {
    if (typeof sessionId !== "string") return null;
    if (sessionId === "none") return null;
    if (sessionId in SESSION_LABELS) {
      return SESSION_LABELS[sessionId as OmpSessionMode];
    }
    // Forward-compatibility surface: an unknown session-mode id is rendered
    // verbatim, identical to the persisted-mode treatment.
    return sessionId;
  }, [sessionId]);

  const activeToggles = useMemo(
    () =>
      (Object.entries(toggles ?? {}) as [OmpToggleFlag, boolean][]).filter(
        ([, value]) => value === true,
      ),
    [toggles],
  );

  return (
    <View
      style={styles.root}
      accessibilityRole="summary"
      accessibilityLabel={t("ompUi.modeBadge.rootLabel", { defaultValue: "Active mode" })}
      testID="omp-mode-badge"
    >
      <BadgePill
        label={persistedLabel}
        variant={persistedVariant}
        accessibilityLabel={`Persisted mode: ${persistedLabel}`}
      />
      {sessionLabel ? (
        <BadgePill
          label={`· ${sessionLabel}`}
          variant="muted"
          accessibilityLabel={`Session mode: ${sessionLabel}`}
        />
      ) : null}
      {activeToggles.map(([flag]) => (
        <BadgePill
          key={flag}
          label={`· ${TOGGLE_LABELS[flag]}`}
          variant="muted"
          accessibilityLabel={`Toggle: ${TOGGLE_LABELS[flag]}`}
        />
      ))}
    </View>
  );
}

export const OmpModeBadge = OmpModeBadgeComponent;

const styles = StyleSheet.create((theme) => ({
  root: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing[1],
  },
  pill: {
    minHeight: 24,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth[1],
    alignItems: "center",
    justifyContent: "center",
  },
  pillDefault: {
    backgroundColor: theme.colors.surface3,
    borderColor: theme.colors.border,
  },
  pillWarning: {
    backgroundColor: theme.colors.surface3,
    borderColor: theme.colors.statusWarning,
  },
  pillMuted: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
  },
  pillAccent: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  pillLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
}));

function styleForVariant(
  variant: "default" | "warning" | "muted" | "accent",
):
  | typeof styles.pillDefault
  | typeof styles.pillWarning
  | typeof styles.pillMuted
  | typeof styles.pillAccent {
  switch (variant) {
    case "warning":
      return styles.pillWarning;
    case "muted":
      return styles.pillMuted;
    case "accent":
      return styles.pillAccent;
    default:
      return styles.pillDefault;
  }
}
