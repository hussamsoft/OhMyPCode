import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Pause, Plus, Users, X } from "lucide-react-native";
import invariant from "tiny-invariant";
import { AdaptiveModalSheet, AdaptiveTextInput, type SheetHeader } from "@/components/adaptive-modal-sheet";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelDescriptor } from "@/panels/panel-registry";
import { useOmpVibe } from "@/omp-vibe/use-omp-vibe";
import { VibeWorkerDetail } from "@/omp-vibe/vibe-worker-detail";
import { VibeWorkerList } from "@/omp-vibe/vibe-worker-list";

function useOmpVibeDescriptor(
  target: { kind: "omp_vibe"; agentId: string; workerId: string | null },
  context: { serverId: string },
): PanelDescriptor {
  const { state } = useOmpVibe(context.serverId, target.agentId);
  const selected = state?.workers.find((worker) => worker.id === target.workerId);
  const running = state?.workers.filter((worker) => worker.state === "running").length ?? 0;
  return {
    label: selected ? selected.name : "Vibe team",
    subtitle: state ? `${running}/${state.workers.length} running` : "Loading",
    icon: Users,
    tooltip: selected ? selected.name : "Vibe team",
    titleState: state ? "ready" : "loading",
    statusBucket: null,
  };
}

function SpawnWorkerSheet({
  visible,
  pending,
  onClose,
  onSpawn,
}: {
  visible: boolean;
  pending: boolean;
  onClose: () => void;
  onSpawn: (input: { name: string; tier: "fast" | "good"; prompt: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [tier, setTier] = useState<"fast" | "good">("good");
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedBrief = brief.trim();
    if (!trimmedName || !trimmedBrief) {
      setError("Name and brief are required");
      return;
    }
    setError(null);
    try {
      await onSpawn({ name: trimmedName, tier, prompt: trimmedBrief });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to spawn worker");
    }
  }, [brief, name, onSpawn, tier]);
  const header: SheetHeader = { title: "Spawn worker" };
  return (
    <AdaptiveModalSheet visible={visible} onClose={onClose} header={header}>
      <View style={styles.sheetBody}>
        <Text style={styles.fieldLabel}>Name</Text>
        <AdaptiveTextInput
          accessibilityLabel="Worker name"
          maxLength={48}
          initialValue={name}
          resetKey={name}
          onChangeText={setName}
          placeholder="Worker name"
          testID="omp-vibe-worker-name"
        />
        <Text style={styles.fieldLabel}>Tier</Text>
        <SegmentedControl
          accessibilityLabel="Worker tier"
          value={tier}
          onValueChange={setTier}
          options={[{ value: "fast", label: "Fast" }, { value: "good", label: "Good" }]}
          testID="omp-vibe-worker-tier"
        />
        <Text style={styles.fieldLabel}>Brief</Text>
        <AdaptiveTextInput
          accessibilityLabel="Worker brief"
          initialValue={brief}
          resetKey={brief}
          onChangeText={setBrief}
          placeholder="What should this worker do?"
          style={styles.briefInput}
          testID="omp-vibe-worker-brief"
        />
        {error ? <Text style={styles.error} role="alert">{error}</Text> : null}
        <Button disabled={pending} onPress={() => void submit()} testID="omp-vibe-spawn-submit">
          {pending ? "Spawning..." : "Spawn worker"}
        </Button>
      </View>
    </AdaptiveModalSheet>
  );
}

function OmpVibePanel() {
  const { serverId, target, retargetCurrentTab } = usePaneContext();
  invariant(target.kind === "omp_vibe", "OmpVibePanel requires OMP Vibe target");
  const { state, pending, spawn, wait, exit, selectWorker } = useOmpVibe(serverId, target.agentId);
  const [spawnVisible, setSpawnVisible] = useState(false);
  const [spawnAttempted, setSpawnAttempted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const spawnFailedRef = useRef(false);
  const [spawnFailed, setSpawnFailed] = useState(false);
  const select = useCallback(
    (workerId: string | null) => {
      selectWorker(target.agentId, workerId);
      retargetCurrentTab({ kind: "omp_vibe", agentId: target.agentId, workerId });
    },
    [retargetCurrentTab, selectWorker, target.agentId],
  );
  useEffect(() => {
    selectWorker(target.agentId, target.workerId);
  }, [selectWorker, target.agentId, target.workerId]);
  const submitSpawn = useCallback(
    async (input: { name: string; tier: "fast" | "good"; prompt: string }) => {
      setSpawnAttempted(true);
      spawnFailedRef.current = false;
      setSpawnFailed(false);
      try {
        await spawn(input);
      } catch (error) {
        spawnFailedRef.current = true;
        setSpawnFailed(true);
        throw error;
      }
    },
    [spawn],
  );
  useEffect(() => {
    if (spawnAttempted && pending === null && !spawnFailedRef.current) {
      setSpawnVisible(false);
    }
  }, [pending, spawnAttempted, spawnFailed]);
  const selectedWorker = target.workerId
    ? state?.workers.find((worker) => worker.id === target.workerId) ?? null
    : null;
  const running = state?.workers.filter((worker) => worker.state === "running").length ?? 0;
  const handleWait = useCallback(async () => {
    setActionError(null);
    try {
      await wait();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to wait for Vibe workers");
    }
  }, [wait]);
  const handleExit = useCallback(async () => {
    setActionError(null);
    try {
      await exit();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to end Vibe");
    }
  }, [exit]);
  return (
    <View style={styles.container} testID="omp-vibe-panel">
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title}>Vibe team</Text>
          <Text style={styles.summary}>{state ? `${running}/${state.workers.length} running` : "Loading"}</Text>
        </View>
        <View style={styles.actions}>
          <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onPress={() => { spawnFailedRef.current = false; setSpawnAttempted(false); setSpawnFailed(false); setSpawnVisible(true); }} testID="omp-vibe-spawn-worker">Spawn</Button>
          <Button size="sm" variant="outline" leftIcon={<Pause size={14} />} disabled={pending !== null} onPress={() => void handleWait()} testID="omp-vibe-wait">Wait</Button>
          <Button size="sm" variant="outline" leftIcon={<X size={14} />} disabled={pending !== null} onPress={() => void handleExit()} testID="omp-vibe-end">{pending?.kind === "exit" ? "Ending..." : "End Vibe"}</Button>
        </View>
        {actionError ? <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text> : null}
      </View>
      {target.workerId && selectedWorker ? (
        <VibeWorkerDetail serverId={serverId} agentId={target.agentId} workerId={target.workerId} />
      ) : (
        <VibeWorkerList
          workers={state?.workers ?? []}
          selectedWorkerId={target.workerId}
          onSelect={select}
        />
      )}
      <SpawnWorkerSheet
        visible={spawnVisible}
        pending={pending?.kind === "spawn"}
        onClose={() => { if (pending === null) setSpawnVisible(false); }}
        onSpawn={submitSpawn}
      />
    </View>
  );
}

export const ompVibePanelRegistration = definePanel("omp_vibe", {
  component: OmpVibePanel,
  useDescriptor: useOmpVibeDescriptor,
});

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, minHeight: 0, width: "100%", maxWidth: 440, backgroundColor: theme.colors.surface1 },
  header: { padding: theme.spacing[3], borderBottomWidth: theme.borderWidth[1], borderBottomColor: theme.colors.border, gap: theme.spacing[2] },
  heading: { gap: theme.spacing[1] },
  title: { color: theme.colors.foreground, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.medium },
  summary: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  sheetBody: { gap: theme.spacing[2], padding: theme.spacing[4] },
  fieldLabel: { color: theme.colors.foreground, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
  briefInput: { minHeight: 100, color: theme.colors.foreground, borderWidth: theme.borderWidth[1], borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing[2] },
  error: { color: theme.colors.statusDanger, fontSize: theme.fontSize.sm },
}));
