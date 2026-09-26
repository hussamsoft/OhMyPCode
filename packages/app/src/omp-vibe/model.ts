import { z } from "zod";

export const ompVibeWorkerSchema = z
  .object({
    id: z.string().min(1),
    cli: z.enum(["fast", "good"]),
    name: z.string(),
    state: z.enum(["initializing", "running", "idle", "dead"]),
    turnCount: z.number().int().nonnegative(),
    queuedMessages: z.number().int().nonnegative(),
    resolvedModel: z.string().optional(),
    lastActivity: z.string().optional(),
    currentTool: z.string().optional(),
    outputTail: z.array(z.string()),
    lastTurnStatus: z.enum(["running", "completed", "failed", "cancelled", "idle"]),
    createdAt: z.number(),
    lastActivityAt: z.number(),
  })
  .passthrough();

export const ompVibeStateSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    enabled: z.boolean(),
    workers: z.array(ompVibeWorkerSchema),
  })
  .passthrough();

export type OmpVibeWorker = z.infer<typeof ompVibeWorkerSchema>;
export type OmpVibeState = z.infer<typeof ompVibeStateSchema>;
export type OmpVibeWorkerTier = OmpVibeWorker["cli"];
export type OmpVibeWorkerStatus = OmpVibeWorker["state"];

export function parseOmpVibeState(value: unknown): OmpVibeState | null {
  const parsed = ompVibeStateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}


export function isOmpVibeState(value: unknown): value is OmpVibeState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as { revision?: unknown; enabled?: unknown; workers?: unknown };
  return (
    typeof state.revision === "number" &&
    Number.isSafeInteger(state.revision) &&
    state.revision >= 0 &&
    typeof state.enabled === "boolean" &&
    Array.isArray(state.workers)
  );
}
export function parseOmpVibeWorker(value: unknown): OmpVibeWorker | null {
  const parsed = ompVibeWorkerSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function ompVibeWorkerIsTerminal(worker: OmpVibeWorker): boolean {
  return worker.state === "dead";
}

export function ompVibeWorkerStatusLabel(worker: OmpVibeWorker): string {
  if (worker.state === "dead") {
    return worker.lastTurnStatus === "cancelled" ? "Killed" : "Dead";
  }
  if (worker.state === "idle" && worker.lastTurnStatus === "completed") return "Completed";
  if (worker.state === "idle" && worker.lastTurnStatus === "failed") return "Failed";
  return worker.state[0].toUpperCase() + worker.state.slice(1);
}

export function buildOmpVibeStatusAnnouncement(
  previous: OmpVibeState | null,
  next: OmpVibeState,
): string | null {
  if (!previous) return null;

  const previousStatuses = new Map(
    previous.workers.map((worker) => [worker.id, ompVibeWorkerStatusLabel(worker)]),
  );
  const previousRunning = previous.workers.filter((worker) => worker.state === "running").length;
  const running = next.workers.filter((worker) => worker.state === "running").length;
  const messages: string[] = [];

  if (running !== previousRunning || next.workers.length !== previous.workers.length) {
    messages.push(`${running} of ${next.workers.length} Vibe workers running`);
  }
  for (const worker of next.workers) {
    const status = ompVibeWorkerStatusLabel(worker);
    if (previousStatuses.get(worker.id) !== status) {
      messages.push(`Vibe worker ${worker.name} ${status}`);
    }
  }

  return messages.length > 0 ? messages.join(". ") : null;
}

export function ompVibeStateHasTerminalTransition(
  previous: OmpVibeState,
  next: OmpVibeState,
): boolean {
  if (previous.enabled && !next.enabled) return true;
  const previousWorkers = new Map(previous.workers.map((worker) => [worker.id, worker]));
  return next.workers.some(
    (worker) => ompVibeWorkerIsTerminal(worker) && previousWorkers.get(worker.id)?.state !== "dead",
  );
}
