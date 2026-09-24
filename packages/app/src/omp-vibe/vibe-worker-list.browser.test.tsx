import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OmpVibeWorker } from "@/omp-vibe/model";
import { VibeWorkerTranscript } from "@/omp-vibe/vibe-worker-detail";
import { VibeWorkerList } from "@/omp-vibe/vibe-worker-list";

vi.mock("react-native-reanimated", () => ({
  useReducedMotion: () => true,
}));

const mounted: Array<{ container: HTMLDivElement; root: Root }> = [];

function noop(): void {
  return undefined;
}

function lastTurnStatus(state: OmpVibeWorker["state"]): OmpVibeWorker["lastTurnStatus"] {
  if (state === "running") return "running";
  return "completed";
}

function worker(id: string, name: string, state: OmpVibeWorker["state"] = "idle"): OmpVibeWorker {
  return {
    id,
    cli: "good",
    name,
    state,
    turnCount: 1,
    queuedMessages: 0,
    outputTail: [],
    lastTurnStatus: lastTurnStatus(state),
    createdAt: 1,
    lastActivityAt: 2,
  };
}

function mountList(workers: OmpVibeWorker[]) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const render = (nextWorkers: OmpVibeWorker[]) => {
    act(() => {
      root.render(
        <VibeWorkerList
          workers={nextWorkers}
          selectedWorkerId={null}
          onSelect={noop}
        />,
      );
    });
  };
  render(workers);
  mounted.push({ container, root });
  return { container, render };
}

afterEach(() => {
  for (const { container, root } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

describe("VibeWorkerList accessibility and identity", () => {
  it("keeps the DOM row for each stable worker id when rows reorder", () => {
    const alpha = worker("alpha", "Alpha");
    const beta = worker("beta", "Beta");
    const { container, render } = mountList([alpha, beta]);
    const alphaRow = container.querySelector('[data-testid="omp-vibe-worker-alpha"]');
    const betaRow = container.querySelector('[data-testid="omp-vibe-worker-beta"]');
    expect(alphaRow).not.toBeNull();
    expect(betaRow).not.toBeNull();

    render([beta, alpha]);

    expect(container.querySelector('[data-testid="omp-vibe-worker-alpha"]')).toBe(alphaRow);
    expect(container.querySelector('[data-testid="omp-vibe-worker-beta"]')).toBe(betaRow);
  });

  it("uses a static Running badge when reduced motion is enabled", () => {
    const running = worker("running", "Inspector", "running");
    const { container } = mountList([running]);

    const row = container.querySelector('[data-testid="omp-vibe-worker-running"]');
    const badge = container.querySelector('[data-testid="omp-vibe-running-badge-running"]');
    expect(badge).not.toBeNull();
    expect(row?.getAttribute("aria-label")).toBe("Inspector, good, Running");
    expect(row?.getAttribute("aria-busy")).toBe("true");
    expect(badge?.textContent).toBe("Running");
  });

  it("renders Vibe output tail without querying provider subagent history", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const transcriptWorker = worker("transcript", "Inspector");
    transcriptWorker.outputTail.push("first", "first", "second");
    act(() => {
      root.render(<VibeWorkerTranscript worker={transcriptWorker} />);
    });
    mounted.push({ container, root });

    const transcript = container.querySelector('[data-testid="omp-vibe-worker-transcript"]');
    expect(transcript?.textContent).toBe("firstfirstsecond");
  });
});
