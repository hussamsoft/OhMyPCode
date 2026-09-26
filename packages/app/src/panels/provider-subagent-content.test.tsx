/**
 * @vitest-environment jsdom
 */
import React, { act, useCallback } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StreamItem } from "@/types/stream";

const runtime = vi.hoisted(() => ({
  session: null as unknown,
  childRows: [] as Array<{
    kind: "provider";
    id: string;
    parentAgentId: string;
    provider: string;
    title: string | null;
    description: string | null;
    subtitle: string | null;
    status: "running" | "completed" | "failed" | "cancelled";
    requiresAttention: boolean;
    createdAt: string;
  }>,
  client: null as unknown,
  refreshProviderSubagents: vi.fn(async () => undefined),
  observeProviderSubagentTimeline: vi.fn(() => () => undefined),
  openTab: vi.fn(),
  openFileInWorkspace: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/agent-stream/view", () => ({
  AgentStreamView: ({
    streamItems,
    streamHead,
    historyPagination,
  }: {
    streamItems: StreamItem[];
    streamHead: StreamItem[];
    historyPagination: {
      hasOlder: boolean;
      isLoadingOlder: boolean;
      onLoadOlder: () => boolean;
    };
  }) => {
    const text = [...streamItems, ...streamHead]
      .map((item) => (item.kind === "assistant_message" ? item.text : ""))
      .join("");
    return (
      <div data-testid="provider-subagent-transcript">
        <span>{text}</span>
        {historyPagination.isLoadingOlder ? <span>Loading older messages</span> : null}
        {historyPagination.hasOlder ? (
          <button type="button" onClick={historyPagination.onLoadOlder}>
            Load older
          </button>
        ) : null}
      </div>
    );
  },
}));

vi.mock("@/composer/tracks", () => ({
  ComposerTrackBar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/constants/layout", () => ({
  useIsCompactFormFactor: () => false,
}));

vi.mock("@/panels/pane-context", () => ({
  usePaneContext: () => ({
    openTab: runtime.openTab,
    openFileInWorkspace: runtime.openFileInWorkspace,
  }),
}));

vi.mock("@/stores/session-store", () => ({
  useSessionStore: (selector: (state: unknown) => unknown) => selector(runtime.session),
}));

vi.mock("@/subagents/select", () => ({
  useSubagentsForParent: () => runtime.childRows,
}));

vi.mock("@/subagents/track", () => ({
  SubagentsTrack: ({
    rows,
    onOpenProviderSubagent,
  }: {
    rows: typeof runtime.childRows;
    onOpenProviderSubagent: (parentAgentId: string, subagentId: string) => void;
  }) => {
    const openChild = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onOpenProviderSubagent(
          event.currentTarget.dataset.parentAgentId!,
          event.currentTarget.dataset.subagentId!,
        );
      },
      [onOpenProviderSubagent],
    );

    return (
      <div data-testid="provider-subagent-children">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            data-parent-agent-id={row.parentAgentId}
            data-subagent-id={row.id}
            onClick={openChild}
          >
            {row.description}
          </button>
        ))}
      </div>
    );
  },
}));

vi.mock("@/subagents/provider-store", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    refreshProviderSubagents: runtime.refreshProviderSubagents,
    observeProviderSubagentTimeline: runtime.observeProviderSubagentTimeline,
  };
});

import { ProviderSubagentContent } from "./provider-subagent-content";
import { useProviderSubagentStore } from "@/subagents/provider-store";

const SERVER_ID = "server-1";
const PARENT_ID = "parent-1";
const SUBAGENT_ID = "child-1";
const TIMESTAMP = "2026-09-24T00:00:00.000Z";

function assistant(text: string, messageId: string) {
  return { type: "assistant_message" as const, text, messageId };
}

describe("ProviderSubagentContent", () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    vi.stubGlobal("React", React);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    useProviderSubagentStore.setState({
      descriptors: new Map(),
      timelines: new Map(),
      hiddenFromTrack: new Set(),
    });
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    container?.remove();
    container = null;
    runtime.session = null;
    runtime.client = null;
    runtime.childRows = [];
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders projected transcript history and opens provider child tracks", async () => {
    runtime.client = {};
    runtime.session = {
      sessions: {
        [SERVER_ID]: {
          agents: new Map([
            [
              PARENT_ID,
              {
                id: PARENT_ID,
                provider: "codex",
                status: "running",
                cwd: "C:\\repo",
                workspaceId: "workspace-1",
              },
            ],
          ]),
          agentDetails: new Map(),
          client: runtime.client,
          serverInfo: { features: { projectedSubagentTimeline: true } },
        },
      },
    };
    runtime.childRows = [
      {
        kind: "provider",
        id: "grandchild-1",
        parentAgentId: SUBAGENT_ID,
        provider: "codex",
        title: "Review",
        description: "Review the release diff",
        subtitle: null,
        status: "running",
        requiresAttention: false,
        createdAt: TIMESTAMP,
      },
    ];

    const store = useProviderSubagentStore.getState();
    store.applyUpdate(SERVER_ID, {
      kind: "upsert",
      subagent: {
        id: SUBAGENT_ID,
        parentAgentId: PARENT_ID,
        provider: "codex",
        title: "Explore",
        description: "Inspect the repository",
        status: "running",
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
        toolCallId: "call-1",
      },
    });
    store.replaceTimeline(SERVER_ID, {
      requestId: "history-1",
      parentAgentId: PARENT_ID,
      subagentId: SUBAGENT_ID,
      provider: "codex",
      direction: "tail",
      projection: "projected",
      epoch: "epoch-1",
      reset: false,
      staleCursor: false,
      gap: false,
      window: { minSeq: 5, maxSeq: 5, nextSeq: 6 },
      startCursor: { epoch: "epoch-1", seq: 5 },
      endCursor: { epoch: "epoch-1", seq: 5 },
      hasOlder: true,
      hasNewer: true,
      rows: [
        {
          seq: 5,
          seqStart: 5,
          seqEnd: 5,
          sourceSeqRanges: [{ startSeq: 5, endSeq: 5 }],
          timestamp: TIMESTAMP,
          item: assistant("Current answer.", "message-5"),
        },
      ],
      error: null,
    });

    await act(async () => {
      root?.render(
        <ProviderSubagentContent
          serverId={SERVER_ID}
          parentAgentId={PARENT_ID}
          subagentId={SUBAGENT_ID}
        />,
      );
    });

    expect(container?.textContent).toContain("Review the release diff");
    expect(
      container?.querySelector('[data-testid="provider-subagent-transcript"]')?.textContent,
    ).toBe("Current answer.Load older");
    const child = container
      ?.querySelector('[data-testid="provider-subagent-children"]')
      ?.querySelector("button");
    await act(async () => {
      child?.click();
    });
    expect(runtime.openTab).toHaveBeenCalledWith({
      kind: "provider_subagent",
      parentAgentId: SUBAGENT_ID,
      subagentId: "grandchild-1",
    });
  });
});
