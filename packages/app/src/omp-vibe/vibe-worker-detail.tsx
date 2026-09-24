import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Send, Square } from "lucide-react-native";
import { AdaptiveTextInput } from "@/components/adaptive-modal-sheet";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/utils/confirm-dialog";
import { useOmpVibe } from "@/omp-vibe/use-omp-vibe";
import { ompVibeWorkerStatusLabel, type OmpVibeWorker } from "@/omp-vibe/model";

export function VibeWorkerTranscript({ worker }: { worker: OmpVibeWorker }) {
  const outputRows = useMemo(() => {
    const occurrences = new Map<string, number>();
    return worker.outputTail.map((line) => {
      const occurrence = occurrences.get(line) ?? 0;
      occurrences.set(line, occurrence + 1);
      return { key: `${worker.id}-${line}-${occurrence}`, line };
    });
  }, [worker.id, worker.outputTail]);

  return (
    <View style={styles.transcript} testID="omp-vibe-worker-transcript">
      {outputRows.length > 0 ? (
        outputRows.map((row) => (
          <Text key={row.key} style={styles.transcriptLine}>
            {row.line}
          </Text>
        ))
      ) : (
        <Text style={styles.transcriptEmpty}>No worker output yet.</Text>
      )}
    </View>
  );
}

export function VibeWorkerDetail({
  serverId,
  agentId,
  workerId,
}: {
  serverId: string;
  agentId: string;
  workerId: string;
}) {
  const { state, pending, send, kill } = useOmpVibe(serverId, agentId);
  const worker = state?.workers.find((candidate) => candidate.id === workerId) ?? null;
  const [message, setMessage] = useState("");
  const [delivery, setDelivery] = useState<"steered" | "started" | "queued" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPending = pending !== null;
  const isTerminal = worker?.state === "dead";

  const submitMessage = useCallback(async () => {
    const text = message.trim();
    if (!text || !worker || isPending) return;
    setError(null);
    try {
      const response = await send(worker.id, text);
      setDelivery(response.delivery);
      setMessage("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send message");
    }
  }, [isPending, message, send, worker]);

  const confirmKill = useCallback(async () => {
    if (!worker || isPending || isTerminal) return;
    const confirmed = await confirmDialog({
      title: "Kill worker",
      message: `Kill ${worker.name}? Its current turn will be cancelled.`,
      confirmLabel: "Kill",
      destructive: true,
    });
    if (!confirmed) return;
    setError(null);
    try {
      await kill(worker.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to kill worker");
    }
  }, [isPending, isTerminal, kill, worker]);
  const submitMessagePress = useCallback(() => void submitMessage(), [submitMessage]);
  const confirmKillPress = useCallback(() => void confirmKill(), [confirmKill]);

  return (
    <View style={styles.container} testID="omp-vibe-worker-detail">
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{worker?.name ?? "Worker"}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {worker ? `${worker.cli === "fast" ? "Fast" : "Good"} · ${ompVibeWorkerStatusLabel(worker)}` : "Worker unavailable"}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            size="sm"
            variant="outline"
            disabled={!worker || isPending || isTerminal}
            leftIcon={Send}
            onPress={submitMessagePress}
            testID="omp-vibe-send-worker"
          >
            Send
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!worker || isPending || isTerminal}
            leftIcon={Square}
            onPress={confirmKillPress}
            testID="omp-vibe-kill-worker"
          >
            Kill
          </Button>
        </View>
      </View>
      {delivery ? <Text style={styles.delivery}>{delivery}</Text> : null}
      {error ? <Text style={styles.error} role="alert">{error}</Text> : null}
      {worker ? (
        <View style={styles.composer}>
          <AdaptiveTextInput
            accessibilityLabel="Message worker"
            multiline
            initialValue={message}
            resetKey={message}
            onChangeText={setMessage}
            testID="omp-vibe-worker-message"
          />
          <Button
            size="sm"
            disabled={!message.trim() || isPending}
            onPress={submitMessagePress}
            testID="omp-vibe-send-message"
          >
            Send
          </Button>
        </View>
      ) : null}
      {worker ? <VibeWorkerTranscript worker={worker} /> : (
        <View style={styles.transcript} testID="omp-vibe-worker-transcript">
          <Text style={styles.transcriptEmpty}>Worker is no longer available.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, minHeight: 0, backgroundColor: theme.colors.surface1 },
  header: {
    padding: theme.spacing[3],
    borderBottomWidth: theme.borderWidth[1],
    borderBottomColor: theme.colors.border,
    gap: theme.spacing[2],
  },
  headerText: { gap: theme.spacing[1] },
  title: { color: theme.colors.foreground, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.medium },
  subtitle: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
  actions: { flexDirection: "row", gap: theme.spacing[2] },
  delivery: { color: theme.colors.statusSuccess, fontSize: theme.fontSize.sm, paddingHorizontal: theme.spacing[3] },
  error: { color: theme.colors.statusDanger, fontSize: theme.fontSize.sm, paddingHorizontal: theme.spacing[3] },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: theme.spacing[2], padding: theme.spacing[3] },
  input: { flex: 1, minHeight: 40, color: theme.colors.foreground, borderWidth: theme.borderWidth[1], borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing[2] },
  transcriptLine: { color: theme.colors.foreground, fontSize: theme.fontSize.sm, lineHeight: 20 },
  transcriptEmpty: { color: theme.colors.foregroundMuted, fontSize: theme.fontSize.sm },
  transcript: { flex: 1, minHeight: 0 },
}));
