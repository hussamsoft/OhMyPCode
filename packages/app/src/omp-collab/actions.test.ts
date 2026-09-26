import { describe, expect, it, vi } from "vitest";
import type { DaemonClient } from "@getpaseo/client/internal/daemon-client";
import type { Agent } from "@/stores/session-store";
import {
  createAndCopyOmpCollabLink,
  OmpCollabActionError,
  shareAndCopyOmpSession,
} from "./actions";
import { collectOmpSessionShareTargets, summarizeOmpCollabHosts } from "./model";

type ActionClient = Pick<DaemonClient, "createOmpCollabLink" | "shareOmpSession">;

function createClient(overrides: Partial<ActionClient> = {}): ActionClient {
  return {
    createOmpCollabLink: vi.fn(),
    shareOmpSession: vi.fn(),
    ...overrides,
  } as ActionClient;
}

function agent(input: Partial<Agent> & Pick<Agent, "id" | "provider">): Agent {
  return {
    serverId: "server-1",
    status: "idle",
    turn: { kind: "idle" },
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    lastUserMessageAt: null,
    lastActivityAt: new Date("2026-01-01T00:00:00Z"),
    capabilities: {},
    currentModeId: null,
    availableModes: [],
    pendingPermissions: [],
    persistence: null,
    title: null,
    cwd: "/repo",
    model: null,
    parentAgentId: null,
    labels: {},
    ...input,
  } as Agent;
}

describe("OMP collaboration share actions", () => {
  it.each([
    ["view", true],
    ["control", false],
  ] as const)("creates and copies a %s link only when invoked", async (access, viewOnly) => {
    const link = `https://collab.example/room#secret-${access}`;
    const createLink = vi.fn().mockResolvedValue({ requestId: "request-1", link });
    const writeClipboard = vi.fn().mockResolvedValue(undefined);
    const client = createClient({ createOmpCollabLink: createLink });

    const result = await createAndCopyOmpCollabLink({
      client,
      instanceId: "host-1",
      access,
      writeClipboard,
    });

    expect(createLink).toHaveBeenCalledOnce();
    expect(createLink).toHaveBeenCalledWith("host-1", { viewOnly });
    expect(writeClipboard).toHaveBeenCalledWith(link);
    expect(result).toBeUndefined();
  });

  it("creates an encrypted saved-session share from the supplied OMP session ID", async () => {
    const link = "https://share.example/session#encrypted-secret";
    const shareSession = vi.fn().mockResolvedValue({ requestId: "request-2", link });
    const writeClipboard = vi.fn().mockResolvedValue(undefined);

    await shareAndCopyOmpSession({
      client: createClient({ shareOmpSession: shareSession }),
      sessionId: "existing-omp-session",
      writeClipboard,
    });

    expect(shareSession).toHaveBeenCalledWith("existing-omp-session", { gist: false });
    expect(writeClipboard).toHaveBeenCalledWith(link);
  });

  it("rejects non-HTTPS links before they reach the clipboard", async () => {
    const writeClipboard = vi.fn();
    const client = createClient({
      createOmpCollabLink: vi.fn().mockResolvedValue({
        requestId: "request-3",
        link: "http://collab.example/room#secret",
      }),
    });

    await expect(
      createAndCopyOmpCollabLink({
        client,
        instanceId: "host-1",
        access: "view",
        writeClipboard,
      }),
    ).rejects.toBeInstanceOf(OmpCollabActionError);
    expect(writeClipboard).not.toHaveBeenCalled();
  });

  it("redacts daemon failures by replacing them with a secret-free error", async () => {
    const secretLink = "https://collab.example/room#must-not-escape";
    const client = createClient({
      createOmpCollabLink: vi.fn().mockRejectedValue(new Error(`failed for ${secretLink}`)),
    });

    const error = await createAndCopyOmpCollabLink({
      client,
      instanceId: "host-1",
      access: "control",
      writeClipboard: vi.fn(),
    }).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(OmpCollabActionError);
    expect(String(error)).not.toContain(secretLink);
    expect(String(error)).not.toContain("must-not-escape");
  });
});

describe("OMP collaboration settings models", () => {
  it("allowlists display metadata and never retains an unexpected secret link field", () => {
    const [summary] = summarizeOmpCollabHosts([
      {
        instanceId: "instance-1",
        sessionName: "Demo session",
        cwd: "/repo",
        model: { provider: "anthropic", id: "claude" },
        participants: 2,
        relayConnected: true,
        busy: false,
        inputRequired: true,
        access: "view",
        link: "https://collab.example/room#must-not-render",
      },
    ]);

    expect(summary).toEqual({
      instanceId: "instance-1",
      sessionName: "Demo session",
      cwd: "/repo",
      model: "anthropic/claude",
      pid: null,
      participants: 2,
      relayConnected: true,
      inputRequired: true,
      busy: false,
      access: "view",
    });
    expect(JSON.stringify(summary)).not.toContain("must-not-render");
  });

  it("collects only existing OMP session IDs and keeps the newest agent per session", () => {
    const targets = collectOmpSessionShareTargets([
      agent({
        id: "claude",
        provider: "claude",
        runtimeInfo: { provider: "claude", sessionId: "x" },
      }),
      agent({ id: "missing", provider: "omp" }),
      agent({
        id: "older",
        provider: "omp",
        title: "Old title",
        persistence: { provider: "omp", sessionId: "shared-session" },
        updatedAt: new Date("2026-01-02T00:00:00Z"),
      }),
      agent({
        id: "newer",
        provider: "omp",
        title: "New title",
        runtimeInfo: { provider: "omp", sessionId: "shared-session" },
        updatedAt: new Date("2026-01-03T00:00:00Z"),
      }),
    ]);

    expect(targets).toHaveLength(1);
    expect(targets[0]).toMatchObject({
      agentId: "newer",
      sessionId: "shared-session",
      title: "New title",
    });
  });
});
