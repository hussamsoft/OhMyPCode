import { memo, useCallback, useMemo } from "react";
import { FlatList, Pressable, Text, View, type PressableStateCallbackType } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { Check, Circle, Clock3, TriangleAlert, X } from "lucide-react-native";
import { ompVibeWorkerStatusLabel, type OmpVibeWorker } from "@/omp-vibe/model";
import { StatusRing } from "@/components/status-ring";

const ROW_HEIGHT = 92;
const RUNNING_BADGE_WIDTH = 44;

function formatElapsed(createdAt: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
  return minutes < 1 ? "<1m" : `${minutes}m`;
}
function WorkerStatusIcon({ worker }: { worker: OmpVibeWorker }) {
  const reduceMotion = useReducedMotion();
  if (worker.state === "running") {
    return reduceMotion ? (
      <View style={styles.runningBadge} testID={`omp-vibe-running-badge-${worker.id}`}>
        <Text style={styles.runningBadgeText}>Running</Text>
      </View>
    ) : (
      <View testID={`omp-vibe-status-${worker.id}`}>
        <StatusRing />
      </View>
    );
  }
  if (worker.state === "initializing") {
    return <Circle size={16} />;
  }
  if (worker.state === "dead") {
    return worker.lastTurnStatus === "cancelled" ? <X size={16} /> : <TriangleAlert size={16} />;
  }
  if (worker.lastTurnStatus === "completed") return <Check size={16} />;
  if (worker.lastTurnStatus === "failed") return <TriangleAlert size={16} />;
  return <Clock3 size={16} />;
}

const WorkerRow = memo(function WorkerRow({
  worker,
  selected,
  onPress,
}: {
  worker: OmpVibeWorker;
  selected: boolean;
  onPress: (workerId: string) => void;
}) {
  const handlePress = useCallback(() => onPress(worker.id), [onPress, worker.id]);
  const statusLabel = ompVibeWorkerStatusLabel(worker);
  const accessibilityState = useMemo(
    () => ({ busy: worker.state === "running", disabled: false, selected }),
    [selected, worker.state],
  );
  const rowStyle = useCallback(
    ({ focused, pressed }: PressableStateCallbackType & { focused?: boolean }) => [
      styles.row,
      focused && styles.rowFocused,
      selected && styles.selectedRow,
      pressed && styles.pressedRow,
    ],
    [selected],
  );
  return (
    <Pressable
      testID={`omp-vibe-worker-${worker.id}`}
      accessibilityLabel={`${worker.name}, ${worker.cli}, ${statusLabel}`}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onPress={handlePress}
      style={rowStyle}
    >
      <View style={styles.rowHeader}>
        <View style={styles.statusIcon}>
          <WorkerStatusIcon worker={worker} />
        </View>
        <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
        <Text style={styles.tier}>{worker.cli === "fast" ? "Fast" : "Good"}</Text>
      </View>
      <Text style={styles.statusText} numberOfLines={1}>{statusLabel}</Text>
      <Text style={styles.meta} numberOfLines={1}>
        {worker.resolvedModel ?? "Model resolving"} · {worker.turnCount} turns · {worker.queuedMessages} queued · {formatElapsed(worker.createdAt)}
      </Text>
      <Text style={styles.activity} numberOfLines={1}>
        {worker.currentTool ?? worker.lastActivity ?? worker.outputTail.at(-1) ?? "Waiting for activity"}
      </Text>
    </Pressable>
  );
});

export function VibeWorkerList({
  workers,
  selectedWorkerId,
  onSelect,
}: {
  workers: OmpVibeWorker[];
  selectedWorkerId: string | null;
  onSelect: (workerId: string) => void;
}) {
  const renderItem = useCallback(
    ({ item }: { item: OmpVibeWorker }) => (
      <WorkerRow worker={item} selected={item.id === selectedWorkerId} onPress={onSelect} />
    ),
    [onSelect, selectedWorkerId],
  );
  const keyExtractor = useCallback((worker: OmpVibeWorker) => worker.id, []);
  const getItemLayout = useCallback(
    (_: ArrayLike<OmpVibeWorker> | null | undefined, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  );
  return (
    <FlatList
      data={workers}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      maxToRenderPerBatch={8}
      windowSize={5}
      removeClippedSubviews
      contentContainerStyle={styles.listContent}
      testID="omp-vibe-worker-list"
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  listContent: { padding: theme.spacing[2], gap: theme.spacing[1] },
  row: {
    minHeight: ROW_HEIGHT,
    padding: theme.spacing[2],
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface1,
    gap: theme.spacing[1],
  },
  selectedRow: { backgroundColor: theme.colors.surfaceSidebarHover },
  rowFocused: { borderColor: theme.colors.ring },
  pressedRow: { opacity: theme.opacity[50] },
  rowHeader: { flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  statusIcon: { width: RUNNING_BADGE_WIDTH, alignItems: "center", color: theme.colors.foregroundMuted },
  runningBadge: {
    minWidth: RUNNING_BADGE_WIDTH,
    height: 16,
    paddingHorizontal: theme.spacing[1],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface3,
  },
  runningBadgeText: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  name: { flex: 1, color: theme.colors.foreground, fontSize: theme.fontSize.base },
  tier: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
  statusText: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
  meta: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
  activity: { color: theme.colors.foregroundExtraMuted, fontSize: theme.fontSize.sm },
}));
