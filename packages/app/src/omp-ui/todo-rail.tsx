import { useMemo, type ReactElement } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

/**
 * Phase-keyed todos lifted from the agent timeline. The server-side mapper
 * (`packages/server/src/server/agent/providers/omp/todo-mapper.ts`) produces
 * these by prefixing each task's `content` with the phase name; we re-parse
 * the `[<phase>] <task>` prefix back into structured groups here so the rail
 * can render phase headers.
 *
 * Callers can also pass phase groups directly via `phases` when the upstream
 * producer (the agent) hasn't pre-prefixed items.
 */
export interface OmpTodoItem {
  text: string;
  /** Pulled from the timeline mapping; default `pending` keeps unknown states visible. */
  status: "pending" | "in_progress" | "completed";
}

export interface OmpTodoPhase {
  name: string;
  tasks: OmpTodoItem[];
}

export interface OmpTodoRailProps {
  /** Phase-keyed todos. Pass either `phases` (structured) or `items` (raw timeline data). */
  phases?: readonly OmpTodoPhase[];
  /** Raw timeline items. Items prefixed with `[name] task text` parse into a phase group. */
  items?: readonly OmpTodoItem[];
  /** Layout the rail on the right (default) or below the transcript. */
  position?: "right" | "bottom";
}

const PHASE_PREFIX = /^\[([^\]]+)\]\s+/;
const COMPLETED = "completed" as const;
const IN_PROGRESS = "in_progress" as const;
const PENDING = "pending" as const;

interface AggregatedCounts {
  inProgress: number;
  pending: number;
  completed: number;
}

const EMPTY_COUNTS: AggregatedCounts = {
  inProgress: 0,
  pending: 0,
  completed: 0,
};

function aggregate(tasks: readonly OmpTodoItem[]): AggregatedCounts {
  const counts: AggregatedCounts = { ...EMPTY_COUNTS };
  for (const task of tasks) {
    if (task.status === COMPLETED) counts.completed += 1;
    else if (task.status === IN_PROGRESS) counts.inProgress += 1;
    else counts.pending += 1;
  }
  return counts;
}

function parseItems(items: readonly OmpTodoItem[]): OmpTodoPhase[] {
  const buckets = new Map<string, OmpTodoItem[]>();
  for (const item of items) {
    const match = PHASE_PREFIX.exec(item.text);
    if (match) {
      const phaseName = match[1];
      const taskText = item.text.slice(match[0].length);
      const list = buckets.get(phaseName) ?? [];
      list.push({ text: taskText, status: item.status });
      buckets.set(phaseName, list);
    } else {
      const list = buckets.get("") ?? [];
      list.push({ text: item.text, status: item.status });
      buckets.set("", list);
    }
  }
  const out: OmpTodoPhase[] = [];
  for (const [name, tasks] of buckets) {
    out.push({ name, tasks });
  }
  return out;
}

interface PhaseRowProps {
  phase: OmpTodoPhase;
  index: number;
}

interface TaskRowProps {
  task: OmpTodoItem;
}

const TASK_STATE_CHECKED = { checked: true };
const TASK_STATE_UNCHECKED = { checked: false };

function TaskRow({ task }: TaskRowProps): ReactElement {
  return (
    <View
      style={styles.taskRow}
      accessibilityRole="text"
      accessibilityState={task.status === COMPLETED ? TASK_STATE_CHECKED : TASK_STATE_UNCHECKED}
    >
      <View
        style={[
          styles.bullet,
          task.status === COMPLETED && styles.bulletCompleted,
          task.status === IN_PROGRESS && styles.bulletActive,
        ]}
      />
      <Text
        style={[styles.taskText, task.status === COMPLETED && styles.taskTextCompleted]}
        numberOfLines={2}
      >
        {task.text}
      </Text>
    </View>
  );
}

function PhaseRow({ phase, index }: PhaseRowProps): ReactElement {
  const counts = useMemo(() => aggregate(phase.tasks), [phase.tasks]);
  const total = phase.tasks.length;
  const displayName = phase.name.length > 0 ? phase.name : "Unassigned";
  const progressLabel = `${counts.completed}/${total}`;
  return (
    <View
      style={styles.phaseRow}
      accessibilityRole="summary"
      accessibilityLabel={`${displayName}, ${progressLabel} done`}
      testID={`omp-todo-rail-phase-${index}`}
    >
      <View style={styles.phaseHeader}>
        <Text style={styles.phaseName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.phaseProgress}>{progressLabel}</Text>
      </View>
      <View style={styles.taskList}>
        {phase.tasks.map((task) => (
          <TaskRow key={task.text} task={task} />
        ))}
      </View>
    </View>
  );
}

function OmpTodoRailComponent({
  phases,
  items,
  position = "right",
}: OmpTodoRailProps): ReactElement | null {
  const { t } = useTranslation();
  const resolvedPhases = useMemo<readonly OmpTodoPhase[]>(() => {
    if (phases !== undefined) return phases;
    if (items !== undefined) return parseItems(items);
    return [];
  }, [phases, items]);
  const totalCounts = useMemo(() => {
    return resolvedPhases.reduce<AggregatedCounts>(
      (acc, phase) => {
        const c = aggregate(phase.tasks);
        acc.inProgress += c.inProgress;
        acc.pending += c.pending;
        acc.completed += c.completed;
        return acc;
      },
      { ...EMPTY_COUNTS },
    );
  }, [resolvedPhases]);

  if (resolvedPhases.length === 0) return null;

  return (
    <View
      style={[styles.root, position === "bottom" ? styles.rootBottom : styles.rootRight]}
      accessibilityRole="summary"
      accessibilityLabel={t("ompUi.todoRail.rootLabel", {
        completed: totalCounts.completed,
        total: totalCounts.completed + totalCounts.inProgress + totalCounts.pending,
      })}
      testID="omp-todo-rail"
    >
      <Text style={styles.heading} accessibilityRole="header">
        {t("ompUi.todoRail.heading", { completed: totalCounts.completed })}
      </Text>
      <View
        style={styles.counts}
        accessibilityRole="text"
        accessibilityLabel={t("ompUi.todoRail.counts", {
          inProgress: totalCounts.inProgress,
          pending: totalCounts.pending,
          completed: totalCounts.completed,
        })}
      >
        <Text style={styles.countInProgress}>
          {t("ompUi.todoRail.inProgress", { count: totalCounts.inProgress })}
        </Text>
        <Text style={styles.countPending}>
          {t("ompUi.todoRail.pending", { count: totalCounts.pending })}
        </Text>
        <Text style={styles.countCompleted}>
          {t("ompUi.todoRail.completed", { count: totalCounts.completed })}
        </Text>
      </View>
      <View style={styles.phases}>
        {resolvedPhases.map((phase, index) => (
          <PhaseRow key={phase.name} phase={phase} index={index} />
        ))}
      </View>
    </View>
  );
}

export const OmpTodoRail = OmpTodoRailComponent;

const styles = StyleSheet.create((theme) => ({
  root: {
    backgroundColor: theme.colors.surface1,
    borderColor: theme.colors.border,
    borderWidth: theme.borderWidth[1],
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[3],
    gap: theme.spacing[2],
  },
  rootRight: {
    width: 280,
    maxWidth: 320,
  },
  rootBottom: {
    width: "100%",
  },
  heading: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  counts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
  },
  countInProgress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.statusWarning,
    fontWeight: theme.fontWeight.medium,
  },
  countPending: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foregroundMuted,
    fontWeight: theme.fontWeight.medium,
  },
  countCompleted: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.statusSuccess,
    fontWeight: theme.fontWeight.medium,
  },
  phases: {
    gap: theme.spacing[2],
  },
  phaseRow: {
    gap: theme.spacing[1],
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  phaseName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    flexShrink: 1,
  },
  phaseProgress: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.mono,
    color: theme.colors.foregroundMuted,
  },
  taskList: {
    gap: theme.spacing[1],
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing[2],
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.border,
    marginTop: theme.spacing[1],
  },
  bulletActive: {
    borderColor: theme.colors.statusWarning,
    backgroundColor: theme.colors.statusWarning,
  },
  bulletCompleted: {
    borderColor: theme.colors.statusSuccess,
    backgroundColor: theme.colors.statusSuccess,
  },
  taskText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    flexShrink: 1,
  },
  taskTextCompleted: {
    color: theme.colors.foregroundMuted,
    textDecorationLine: "line-through",
  },
}));

export { COMPLETED, IN_PROGRESS, PENDING };
