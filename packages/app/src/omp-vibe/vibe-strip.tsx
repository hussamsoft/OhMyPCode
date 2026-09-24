import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View, type PressableStateCallbackType } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Check, Clock3, Sparkles, TriangleAlert, Users, X } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { useOmpVibe } from "@/omp-vibe/use-omp-vibe";
import { openOmpVibeTarget } from "@/workspace-tabs/open-omp-vibe-target";
import { useOmpVibeStore } from "@/omp-vibe/store";
import {
  buildOmpVibeStatusAnnouncement,
  type OmpVibeState,
  type OmpVibeWorker,
} from "@/omp-vibe/model";

function WorkerStatusMark({ worker }: { worker: OmpVibeWorker }) {
  if (worker.state === "running") return <View style={styles.runningMark} />;
  if (worker.state === "initializing") return <Clock3 size={13} />;
  if (worker.state === "dead") return worker.lastTurnStatus === "cancelled" ? <X size={13} /> : <TriangleAlert size={13} />;
  if (worker.lastTurnStatus === "completed") return <Check size={13} />;
  if (worker.lastTurnStatus === "failed") return <TriangleAlert size={13} />;
  return <Clock3 size={13} />;
}

export function VibeStrip({ serverId, agentId }: { serverId: string; agentId: string }) {
  const { state, pending, exit } = useOmpVibe(serverId, agentId);
  const selectedWorkerId = useOmpVibeStore((store) => store.selectedWorkerByAgent[agentId] ?? null);
  const selectedWorker = state?.workers.find((worker) => worker.id === selectedWorkerId);
  const previousState = useRef<OmpVibeState | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    const nextAnnouncement = buildOmpVibeStatusAnnouncement(previousState.current, state);
    previousState.current = state;
    if (nextAnnouncement) setAnnouncement(nextAnnouncement);
  }, [state]);

  const openTeam = useCallback(() => {
    openOmpVibeTarget({ agentId, workerId: null });
  }, [agentId]);
  const exitPress = useCallback(() => {
    setError(null);
    void exit().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "Unable to end Vibe");
    });
  }, [exit]);
  const summaryStyle = useCallback(
    ({ focused }: PressableStateCallbackType & { focused?: boolean }) => [
      styles.summary,
      focused && styles.summaryFocused,
    ],
    [],
  );
  if (!state?.enabled) return null;
  const running = state.workers.filter((worker) => worker.state === "running").length;
  const countLabel = `${running} of ${state.workers.length} Vibe workers running`;
  return (
    <View style={styles.strip} testID="omp-vibe-strip">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open Vibe team. ${countLabel}${selectedWorker ? `. Selected worker ${selectedWorker.name}` : ""}`}
        onPress={openTeam}
        style={summaryStyle}
      >
        <Sparkles size={14} />
        <Text style={styles.label}>Vibe</Text>
        <Text style={styles.count}>{running}/{state.workers.length}</Text>
        <View style={styles.marks}>
          {state.workers.slice(0, 3).map((worker) => <WorkerStatusMark key={worker.id} worker={worker} />)}
        </View>
        {selectedWorker ? <Text style={styles.selected} numberOfLines={1}>{selectedWorker.name}</Text> : null}
        <Users size={14} />
        <Text style={styles.action}>Open team</Text>
      </Pressable>
      <Button
        size="xs"
        variant="ghost"
        disabled={pending !== null}
        onPress={exitPress}
        testID="omp-vibe-strip-end"
      >
        {pending?.kind === "exit" ? "Ending..." : "End Vibe"}
      </Button>
      <Text
        accessibilityLiveRegion="polite"
        role="status"
        style={styles.announcement}
      >
        {announcement}
      </Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  strip: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: theme.spacing[2], paddingHorizontal: theme.spacing[3], borderTopWidth: theme.borderWidth[1], borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface1 },
  summary: { flex: 1, minWidth: 0, minHeight: 36, flexDirection: "row", alignItems: "center", gap: theme.spacing[2], borderWidth: 2, borderColor: "transparent", borderRadius: theme.borderRadius.md },
  label: { color: theme.colors.foreground, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
  count: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
  marks: { flexDirection: "row", alignItems: "center", gap: theme.spacing[1] },
  runningMark: { width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: theme.colors.statusWarning },
  selected: { flexShrink: 1, color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
  summaryFocused: { borderColor: theme.colors.ring },
  action: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
  announcement: { position: "absolute", width: 1, height: 1, opacity: 0 },
  error: { color: theme.colors.statusDanger, fontSize: theme.fontSize.sm, maxWidth: 240 },
}));
