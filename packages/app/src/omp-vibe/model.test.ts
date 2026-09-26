import { describe, expect, it } from "vitest";
import {
  buildOmpVibeStatusAnnouncement,
  ompVibeStateSchema,
  ompVibeWorkerStatusLabel,
  parseOmpVibeState,
} from "@/omp-vibe/model";
import type { OmpVibeState } from "@/omp-vibe/model";

const worker = {
  id: "worker-1",
  cli: "good" as const,
  name: "Inspector",
  state: "running" as const,
  turnCount: 2,
  queuedMessages: 1,
  outputTail: [],
  lastTurnStatus: "running" as const,
  createdAt: 1,
  lastActivityAt: 2,
};

function vibeState(revision: number, workers: OmpVibeState["workers"]) {
  return { revision, enabled: true, workers };
}

describe("OMP Vibe model", () => {
  it("parses revisioned state and preserves worker identity", () => {
    const state = parseOmpVibeState({ revision: 4, enabled: true, workers: [worker] });
    expect(state).toEqual({ revision: 4, enabled: true, workers: [worker] });
    expect(ompVibeStateSchema.safeParse(state).success).toBe(true);
  });

  it("rejects malformed worker state", () => {
    expect(parseOmpVibeState({ revision: -1, enabled: true, workers: [] })).toBeNull();
    expect(parseOmpVibeState({ revision: 1, enabled: true, workers: [{ ...worker, state: "busy" }] })).toBeNull();
  });

  it("gives terminal status a spoken label", () => {
    expect(ompVibeWorkerStatusLabel(worker)).toBe("Running");
    expect(ompVibeWorkerStatusLabel({ ...worker, state: "dead", lastTurnStatus: "cancelled" })).toBe("Killed");
  });

  it("builds one atomic count and worker-status announcement", () => {
    const previous = vibeState(1, [worker]);
    const next = vibeState(2, [
      { ...worker, state: "idle", lastTurnStatus: "completed" },
      { ...worker, id: "worker-2", name: "Reviewer", state: "initializing" },
    ]);

    expect(buildOmpVibeStatusAnnouncement(previous, next)).toBe(
      "0 of 2 Vibe workers running. Vibe worker Inspector Completed. Vibe worker Reviewer Initializing",
    );
    expect(buildOmpVibeStatusAnnouncement(next, next)).toBeNull();
  });
});
