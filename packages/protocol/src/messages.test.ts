import { describe, expect, test } from "vitest";
import { z } from "zod";
import {
  AgentSnapshotPayloadSchema,
  AgentStreamMessageSchema,
  FileExplorerRequestSchema,
  PaseoWorktreeArchiveRequestSchema,
  parseServerInfoStatusPayload,
  SessionInboundMessageSchema,
  SessionOutboundMessageSchema,
  WorkspaceProjectDescriptorPayloadSchema,
} from "./messages.js";

function workspaceDescriptor(overrides: Record<string, unknown> = {}) {
  return {
    id: "ws-1",
    projectId: "remote:github.com/acme/app",
    projectDisplayName: "acme/app",
    projectRootPath: "/repo/app",
    workspaceDirectory: "/repo/app",
    projectKind: "git",
    workspaceKind: "local_checkout",
    name: "app",
    status: "done",
    activityAt: null,
    diffStat: null,
    scripts: [],
    ...overrides,
  };
}

function fetchWorkspacesResponse(workspace: Record<string, unknown>) {
  return {
    type: "fetch_workspaces_response",
    payload: {
      requestId: "req-1",
      entries: [workspace],
      pageInfo: {
        nextCursor: null,
        prevCursor: null,
        hasMore: false,
      },
    },
  };
}

describe("project icon message security", () => {
  test("rejects URL sources at the daemon boundary", () => {
    const parsed = SessionInboundMessageSchema.safeParse({
      type: "project.icon.set.request",
      projectId: "project-1",
      source: { type: "url", url: "http://127.0.0.1/private" },
      requestId: "request-1",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("project icon revision compatibility", () => {
  const project = {
    projectId: "project-1",
    projectDisplayName: "Project",
    projectRootPath: "/repo/project",
    projectKind: "git" as const,
  };

  test("accepts an old project snapshot without an effective icon revision", () => {
    expect(WorkspaceProjectDescriptorPayloadSchema.parse(project)).toEqual(project);
  });

  test("accepts an effective icon revision on a new project snapshot", () => {
    expect(
      WorkspaceProjectDescriptorPayloadSchema.parse({
        ...project,
        projectIconRevision: "automatic:none:v1",
      }),
    ).toEqual({ ...project, projectIconRevision: "automatic:none:v1" });
  });
});

describe("workspace descriptor message compatibility", () => {
  test("old-shaped fetch_workspaces_response without project still parses", () => {
    const parsed = SessionOutboundMessageSchema.parse(
      fetchWorkspacesResponse(workspaceDescriptor()),
    );

    expect(parsed.type).toBe("fetch_workspaces_response");
    if (parsed.type !== "fetch_workspaces_response") {
      throw new Error("Expected fetch_workspaces_response");
    }
    expect(parsed.payload.entries[0]?.project).toBeUndefined();
  });

  test("new-shaped fetch_workspaces_response with project placement parses", () => {
    const parsed = SessionOutboundMessageSchema.parse(
      fetchWorkspacesResponse(
        workspaceDescriptor({
          project: {
            projectKey: "remote:github.com/acme/app",
            projectName: "acme/app",
            checkout: {
              cwd: "/repo/app",
              isGit: true,
              currentBranch: "main",
              remoteUrl: "https://github.com/acme/app.git",
              worktreeRoot: "/repo/app",
              isPaseoOwnedWorktree: false,
              mainRepoRoot: null,
            },
          },
        }),
      ),
    );

    expect(parsed.type).toBe("fetch_workspaces_response");
    if (parsed.type !== "fetch_workspaces_response") {
      throw new Error("Expected fetch_workspaces_response");
    }
    expect(parsed.payload.entries[0]?.project).toEqual({
      projectKey: "remote:github.com/acme/app",
      projectName: "acme/app",
      checkout: {
        cwd: "/repo/app",
        isGit: true,
        currentBranch: "main",
        remoteUrl: "https://github.com/acme/app.git",
        worktreeRoot: "/repo/app",
        isPaseoOwnedWorktree: false,
        mainRepoRoot: null,
      },
    });
  });

  test("adding project does not narrow existing descriptor fields", () => {
    const parsed = SessionOutboundMessageSchema.parse(
      fetchWorkspacesResponse(
        workspaceDescriptor({
          workspaceDirectory: undefined,
          projectKind: "non_git",
          workspaceKind: "directory",
          gitRuntime: null,
          githubRuntime: null,
          project: {
            projectKey: "/repo/local",
            projectName: "local",
            checkout: {
              cwd: "/repo/local",
              isGit: false,
              currentBranch: null,
              remoteUrl: null,
              worktreeRoot: null,
              isPaseoOwnedWorktree: false,
              mainRepoRoot: null,
            },
          },
        }),
      ),
    );

    expect(parsed.type).toBe("fetch_workspaces_response");
    if (parsed.type !== "fetch_workspaces_response") {
      throw new Error("Expected fetch_workspaces_response");
    }
    expect(parsed.payload.entries[0]).toMatchObject({
      projectKind: "non_git",
      workspaceKind: "directory",
      workspaceDirectory: "/repo/app",
      gitRuntime: null,
      githubRuntime: null,
    });
  });
});

describe("provider usage list message contract", () => {
  test("accepts the usage list request as a namespaced correlated RPC", () => {
    const parsed = SessionInboundMessageSchema.parse({
      type: "provider.usage.list.request",
      requestId: "usage-1",
    });

    expect(parsed).toEqual({
      type: "provider.usage.list.request",
      requestId: "usage-1",
    });
  });

  test("accepts new providers and new usage windows as normalized data", () => {
    const parsed = SessionOutboundMessageSchema.parse({
      type: "provider.usage.list.response",
      payload: {
        requestId: "usage-2",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        providers: [
          {
            providerId: "glm",
            displayName: "GLM coding plan",
            status: "available",
            planLabel: "GLM coding plan",
            fetchedAt: "2026-06-19T00:00:00.000Z",
            windows: [
              {
                id: "biweekly",
                label: "Biweekly",
                usedPct: 23,
                remainingPct: 77,
                resetsAt: "2026-07-03T00:00:00.000Z",
                tone: "ok",
              },
            ],
            balances: [
              {
                id: "credits",
                label: "Credits",
                remaining: 120,
                unit: "credits",
              },
            ],
            details: [{ id: "region", label: "Region", value: "US" }],
            error: null,
          },
        ],
      },
    });

    expect(parsed.type).toBe("provider.usage.list.response");
    if (parsed.type !== "provider.usage.list.response") {
      throw new Error("Expected provider.usage.list.response");
    }
    expect(parsed.payload.providers[0]?.providerId).toBe("glm");
    expect(parsed.payload.providers[0]?.windows[0]?.label).toBe("Biweekly");
  });

  test("keeps protocol numbers strict after API boundary normalization", () => {
    const parsed = SessionOutboundMessageSchema.safeParse({
      type: "provider.usage.list.response",
      payload: {
        requestId: "usage-3",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        providers: [
          {
            providerId: "claude",
            displayName: "Claude",
            status: "available",
            planLabel: "Max 20x",
            windows: [
              {
                id: "session",
                label: "Session",
                usedPct: "7",
              },
            ],
          },
        ],
      },
    });

    expect(parsed.success).toBe(false);
  });
});

describe("OMP statistics message contract", () => {
  test("accepts correlated statistics requests and responses", () => {
    expect(
      SessionInboundMessageSchema.parse({
        type: "omp.statistics.request",
        requestId: "stats-1",
        forceRefresh: true,
      }),
    ).toEqual({
      type: "omp.statistics.request",
      requestId: "stats-1",
      forceRefresh: true,
    });

    const aggregate = {
      totalRequests: 1,
      successfulRequests: 1,
      failedRequests: 0,
      errorRate: 0,
      totalInputTokens: 10,
      totalOutputTokens: 5,
      totalCacheReadTokens: 20,
      totalCacheWriteTokens: 0,
      cacheRate: 0.5,
      cacheSavings: 0.25,
      totalCost: 0.01,
      unpricedRequests: 0,
      totalPremiumRequests: 0,
      avgDuration: 100,
      avgTtft: 25,
      avgTokensPerSecond: 10,
      firstTimestamp: 1,
      lastTimestamp: 2,
    };
    const parsed = SessionOutboundMessageSchema.parse({
      type: "omp.statistics.response",
      payload: {
        requestId: "stats-1",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        statistics: {
          overall: aggregate,
          byModel: [{ ...aggregate, model: "gpt-test", provider: "openai-codex" }],
          byAgentType: [
            {
              agentType: "main",
              totalRequests: 1,
              totalInputTokens: 10,
              totalOutputTokens: 5,
              totalCacheReadTokens: 20,
              totalCacheWriteTokens: 0,
              totalCost: 0.01,
            },
          ],
          timeSeries: [{ timestamp: 1, requests: 1, errors: 0, tokens: 35, cost: 0.01 }],
        },
      },
    });

    expect(parsed.type).toBe("omp.statistics.response");
  });
});

describe("OMP provider message contract", () => {
  test("round-trips provider requests and responses", () => {
    const requests = [
      { type: "omp.providers.list.request", requestId: "list-1" },
      {
        type: "omp.providers.login.start.request",
        requestId: "start-1",
        providerId: "deepseek",
      },
      {
        type: "omp.providers.login.respond.request",
        requestId: "respond-1",
        loginId: "login-1",
        uiRequestId: "request-1",
        value: "choice",
      },
      { type: "omp.providers.login.cancel.request", requestId: "cancel-1", loginId: "login-1" },
      { type: "omp.providers.logout.request", requestId: "logout-1", providerId: "deepseek" },
    ];
    for (const request of requests) {
      expect(SessionInboundMessageSchema.parse(request)).toEqual(request);
    }

    const responses = [
      {
        type: "omp.providers.list.response",
        payload: {
          requestId: "list-1",
          providers: [{ id: "deepseek", name: "DeepSeek", authenticated: true, available: true }],
        },
      },
      {
        type: "omp.providers.login.start.response",
        payload: { requestId: "start-1", loginId: "login-1" },
      },
      {
        type: "omp.providers.login.progress",
        payload: {
          requestId: "start-1",
          loginId: "login-1",
          event: { kind: "input", uiRequestId: "request-1", title: "Paste key", secret: true },
        },
      },
      { type: "omp.providers.login.respond.response", payload: { requestId: "respond-1" } },
      { type: "omp.providers.login.cancel.response", payload: { requestId: "cancel-1" } },
      { type: "omp.providers.logout.response", payload: { requestId: "logout-1" } },
    ];
    for (const response of responses) {
      expect(SessionOutboundMessageSchema.parse(response)).toEqual(response);
    }
  });

  test("rejects unknown provider login events", () => {
    expect(
      SessionOutboundMessageSchema.safeParse({
        type: "omp.providers.login.progress",
        payload: {
          requestId: "start-1",
          loginId: "login-1",
          event: { kind: "unsupported" },
        },
      }).success,
    ).toBe(false);
  });
});

describe("diagnostics message contract", () => {
  test("accepts the diagnostics request as a simple namespaced RPC", () => {
    const parsed = SessionInboundMessageSchema.parse({
      type: "diagnostics.request",
      requestId: "diag-1",
    });

    expect(parsed).toEqual({
      type: "diagnostics.request",
      requestId: "diag-1",
    });
  });

  test("accepts a copyable diagnostics response", () => {
    const parsed = SessionOutboundMessageSchema.parse({
      type: "diagnostics.response",
      payload: {
        requestId: "diag-2",
        diagnostic: "Paseo diagnostics\n  Status: ok",
      },
    });

    expect(parsed.type).toBe("diagnostics.response");
    if (parsed.type !== "diagnostics.response") {
      throw new Error("Expected diagnostics.response");
    }
    expect(parsed.payload.diagnostic).toContain("Status: ok");
  });
});

describe("agent detach RPC", () => {
  test("parses the namespaced detach request", () => {
    const parsed = SessionInboundMessageSchema.parse({
      type: "agent.detach.request",
      agentId: "child-agent",
      requestId: "req-detach",
    });

    expect(parsed).toEqual({
      type: "agent.detach.request",
      agentId: "child-agent",
      requestId: "req-detach",
    });
  });

  test("parses the namespaced detach response", () => {
    const parsed = SessionOutboundMessageSchema.parse({
      type: "agent.detach.response",
      payload: {
        requestId: "req-detach",
        agentId: "child-agent",
        accepted: true,
        error: null,
      },
    });

    expect(parsed.type).toBe("agent.detach.response");
  });

  test("parses the agentDetach server feature gate", () => {
    const parsed = parseServerInfoStatusPayload({
      status: "server_info",
      serverId: "srv-test",
      features: {
        agentDetach: true,
      },
    });

    if (!parsed) {
      throw new Error("Expected server info payload to parse");
    }
    expect(parsed.features?.agentDetach).toBe(true);
  });

  test("parses the workspace-targeted session import feature gate", () => {
    const parsed = parseServerInfoStatusPayload({
      status: "server_info",
      serverId: "srv-test",
      features: {
        importSessionWorkspaceTarget: true,
      },
    });

    if (!parsed) {
      throw new Error("Expected server info payload to parse");
    }
    expect(parsed.features?.importSessionWorkspaceTarget).toBe(true);
  });

  test("parses the session import search feature gate", () => {
    const parsed = parseServerInfoStatusPayload({
      status: "server_info",
      serverId: "srv-test",
      features: {
        importSessionSearch: true,
      },
    });

    if (!parsed) {
      throw new Error("Expected server info payload to parse");
    }
    expect(parsed.features?.importSessionSearch).toBe(true);
  });
});

describe("agent setting action responses", () => {
  test("parses optional provider notices on mode and thinking responses", () => {
    const mode = SessionOutboundMessageSchema.parse({
      type: "set_agent_mode_response",
      payload: {
        requestId: "req-mode",
        agentId: "agent-1",
        accepted: true,
        error: null,
        notice: {
          type: "info",
          message: "This change applies next turn.",
        },
      },
    });
    const thinking = SessionOutboundMessageSchema.parse({
      type: "set_agent_thinking_response",
      payload: {
        requestId: "req-thinking",
        agentId: "agent-1",
        accepted: true,
        error: null,
      },
    });

    expect(mode.type).toBe("set_agent_mode_response");
    if (mode.type !== "set_agent_mode_response") {
      throw new Error("Expected set_agent_mode_response");
    }
    expect(mode.payload.notice).toEqual({
      type: "info",
      message: "This change applies next turn.",
    });
    expect(thinking.type).toBe("set_agent_thinking_response");
    if (thinking.type !== "set_agent_thinking_response") {
      throw new Error("Expected set_agent_thinking_response");
    }
    expect(thinking.payload.notice).toBeUndefined();
  });
});

describe("file explorer request compatibility", () => {
  test("acceptBinary is optional for old clients and accepted for new clients", () => {
    expect(
      FileExplorerRequestSchema.parse({
        type: "file_explorer_request",
        cwd: "/repo/app",
        path: "image.png",
        mode: "file",
        requestId: "req-old",
      }),
    ).toEqual({
      type: "file_explorer_request",
      cwd: "/repo/app",
      path: "image.png",
      mode: "file",
      requestId: "req-old",
    });

    expect(
      FileExplorerRequestSchema.parse({
        type: "file_explorer_request",
        cwd: "/repo/app",
        path: "image.png",
        mode: "file",
        requestId: "req-new",
        acceptBinary: true,
      }),
    ).toMatchObject({
      type: "file_explorer_request",
      requestId: "req-new",
      acceptBinary: true,
    });
  });
});

describe("paseo worktree archive request compatibility", () => {
  test("omitted scope defaults to workspace", () => {
    const parsed = PaseoWorktreeArchiveRequestSchema.parse({
      type: "paseo_worktree_archive_request",
      worktreePath: "/repo/app",
      requestId: "req-old-scope",
    });
    expect(parsed.scope).toBe("workspace");
  });

  test("scope worktree parses", () => {
    const parsed = PaseoWorktreeArchiveRequestSchema.parse({
      type: "paseo_worktree_archive_request",
      worktreePath: "/repo/app",
      scope: "worktree",
      requestId: "req-worktree-scope",
    });
    expect(parsed.scope).toBe("worktree");
  });

  test("unknown extra field is still accepted", () => {
    const parsed = PaseoWorktreeArchiveRequestSchema.parse({
      type: "paseo_worktree_archive_request",
      worktreePath: "/repo/app",
      requestId: "req-extra",
      extraField: "ignored",
    });
    expect(parsed).not.toHaveProperty("extraField");
    expect(parsed.scope).toBe("workspace");
  });
});

describe("daemon update messages", () => {
  test("daemon update progress is a scoped outbound message", () => {
    const parsed = SessionOutboundMessageSchema.parse({
      type: "daemon.update.progress",
      payload: {
        requestId: "update-1",
        phase: "installing",
      },
    });

    expect(parsed).toEqual({
      type: "daemon.update.progress",
      payload: {
        requestId: "update-1",
        phase: "installing",
      },
    });
  });
});

describe("viewed timeline subscription messages", () => {
  test("parses a complete viewed-agent set and its acknowledgement", () => {
    const request = SessionInboundMessageSchema.parse({
      type: "agent.timeline.set_subscription.request",
      agentIds: ["agent-a", "agent-b"],
      requestId: "timeline-subscription-1",
    });
    const response = SessionOutboundMessageSchema.parse({
      type: "agent.timeline.set_subscription.response",
      payload: {
        agentIds: ["agent-a", "agent-b"],
        requestId: "timeline-subscription-1",
      },
    });

    expect({ request, response }).toEqual({
      request: {
        type: "agent.timeline.set_subscription.request",
        agentIds: ["agent-a", "agent-b"],
        requestId: "timeline-subscription-1",
      },
      response: {
        type: "agent.timeline.set_subscription.response",
        payload: {
          agentIds: ["agent-a", "agent-b"],
          requestId: "timeline-subscription-1",
        },
      },
    });
  });
});

const agentTool = {
  name: "read",
  label: "Read",
  description: "Read a file",
  source: "native" as const,
  enabled: true,
  required: true,
};

const vibeWorker = {
  id: "worker-1",
  cli: "fast" as const,
  name: "Inspect",
  state: "running" as const,
  turnCount: 1,
  queuedMessages: 0,
  resolvedModel: "smol",
  lastActivity: "Reading",
  currentTool: "read",
  outputTail: ["Found package scripts"],
  lastTurnStatus: "running" as const,
  createdAt: 1,
  lastActivityAt: 2,
};

const vibeState = {
  revision: 3,
  enabled: true,
  workers: [vibeWorker],
};

describe("agent tool selection message contract", () => {
  test("round-trips provider and live tool requests with correlated responses", () => {
    const requests = [
      {
        type: "list_provider_tools_request",
        provider: "omp",
        cwd: "C:/repo",
        requestId: "provider-tools",
      },
      { type: "list_agent_tools_request", agentId: "agent-1", requestId: "agent-tools" },
      {
        type: "set_agent_tools_request",
        agentId: "agent-1",
        enabledTools: ["read", "todo"],
        requestId: "set-tools",
      },
    ];
    for (const request of requests) {
      expect(SessionInboundMessageSchema.parse(request)).toEqual(request);
    }

    const responses = [
      { type: "list_provider_tools_response", requestId: "provider-tools" },
      { type: "list_agent_tools_response", requestId: "agent-tools" },
      { type: "set_agent_tools_response", requestId: "set-tools" },
    ].map((response) => ({
      type: response.type,
      payload: { requestId: response.requestId, tools: [agentTool] },
    }));
    for (const response of responses) {
      expect(SessionOutboundMessageSchema.parse(response)).toEqual(response);
    }
  });

  test("publishes tool catalogs through snapshots and agent stream events", () => {
    const stream = SessionOutboundMessageSchema.parse({
      type: "agent_stream",
      payload: {
        agentId: "agent-1",
        timestamp: "2026-09-23T00:00:00.000Z",
        event: { type: "tools_updated", provider: "omp", tools: [agentTool] },
      },
    });
    expect(stream.type).toBe("agent_stream");
    if (stream.type !== "agent_stream") {
      throw new Error("Expected agent_stream");
    }
    expect(stream.payload.event).toEqual({
      type: "tools_updated",
      provider: "omp",
      tools: [agentTool],
    });

    const stateStream = AgentStreamMessageSchema.parse({
      type: "agent_stream",
      payload: {
        agentId: "agent-1",
        timestamp: "2026-09-23T00:00:00.000Z",
        event: {
          type: "provider_state_updated",
          provider: "omp",
          stateKey: "vibe",
          state: vibeState,
        },
      },
    });
    expect(stateStream.payload.event).toMatchObject({
      type: "provider_state_updated",
      stateKey: "vibe",
      state: vibeState,
    });
  });
});

describe("OMP Vibe message contract", () => {
  test("round-trips all seven correlated Vibe operations", () => {
    const requests = [
      { type: "omp.vibe.status.request", agentId: "agent-1", requestId: "status" },
      {
        type: "omp.vibe.enter.request",
        agentId: "agent-1",
        prompt: "Coordinate the work",
        requestId: "enter",
      },
      { type: "omp.vibe.exit.request", agentId: "agent-1", requestId: "exit" },
      {
        type: "omp.vibe.spawn.request",
        agentId: "agent-1",
        tier: "fast",
        name: "Inspect",
        prompt: "Inspect package scripts",
        requestId: "spawn",
      },
      {
        type: "omp.vibe.send.request",
        agentId: "agent-1",
        workerId: "worker-1",
        message: "Continue",
        requestId: "send",
      },
      {
        type: "omp.vibe.wait.request",
        agentId: "agent-1",
        workerIds: ["worker-1"],
        timeoutMs: 5_000,
        requestId: "wait",
      },
      {
        type: "omp.vibe.kill.request",
        agentId: "agent-1",
        workerId: "worker-1",
        requestId: "kill",
      },
    ];
    for (const request of requests) {
      expect(SessionInboundMessageSchema.parse(request)).toEqual(request);
    }

    const stateOnlyResponses = ["status", "enter", "exit"].map((requestId) => ({
      type: `${requestId === "status" ? "omp.vibe.status" : `omp.vibe.${requestId}`}.response`,
      payload: { requestId, state: vibeState },
    }));
    const responses = [
      ...stateOnlyResponses,
      {
        type: "omp.vibe.spawn.response",
        payload: { requestId: "spawn", worker: vibeWorker, state: vibeState },
      },
      {
        type: "omp.vibe.send.response",
        payload: { requestId: "send", delivery: "steered", state: vibeState },
      },
      {
        type: "omp.vibe.wait.response",
        payload: {
          requestId: "wait",
          settled: [],
          stillRunning: ["worker-1"],
          timedOut: false,
          state: vibeState,
        },
      },
      {
        type: "omp.vibe.kill.response",
        payload: { requestId: "kill", worker: vibeWorker, state: vibeState },
      },
    ];
    for (const response of responses) {
      expect(SessionOutboundMessageSchema.parse(response)).toEqual(response);
    }
  });

  test("rejects zero Vibe wait timeouts at the wire boundary", () => {
    expect(
      SessionInboundMessageSchema.safeParse({
        type: "omp.vibe.wait.request",
        agentId: "agent-1",
        timeoutMs: 0,
        requestId: "wait-zero",
      }).success,
    ).toBe(false);
    expect(
      SessionInboundMessageSchema.parse({
        type: "omp.vibe.wait.request",
        agentId: "agent-1",
        timeoutMs: 1,
        requestId: "wait-one",
      }),
    ).toMatchObject({ timeoutMs: 1 });
  });
});

describe("OMP tool and Vibe capability flags", () => {
  test("accepts host and agent flags while legacy payloads remain parseable", () => {
    expect(
      parseServerInfoStatusPayload({
        status: "server_info",
        serverId: "server-1",
        features: { ompVibe: true, ompToolSelection: true },
      }),
    ).toMatchObject({
      features: { ompVibe: true, ompToolSelection: true },
    });

    const baseSnapshot = {
      id: "agent-1",
      provider: "omp",
      cwd: "C:/repo",
      model: null,
      createdAt: "2026-09-23T00:00:00.000Z",
      updatedAt: "2026-09-23T00:00:00.000Z",
      lastUserMessageAt: null,
      status: "idle",
      currentModeId: null,
      availableModes: [],
      pendingPermissions: [],
      title: null,
      labels: {},
      persistence: null,
      capabilities: {
        supportsStreaming: true,
        supportsSessionPersistence: true,
        supportsDynamicModes: true,
        supportsMcpServers: true,
        supportsReasoningStream: true,
        supportsToolInvocations: true,
      },
    };
    const legacy = AgentSnapshotPayloadSchema.parse(baseSnapshot);
    expect(legacy.capabilities).not.toHaveProperty("supportsOmpVibe");
    expect(legacy.capabilities).not.toHaveProperty("supportsOmpToolSelection");
    expect(
      AgentSnapshotPayloadSchema.parse({
        ...baseSnapshot,
        tools: [agentTool],
        capabilities: {
          ...baseSnapshot.capabilities,
          supportsOmpVibe: true,
          supportsOmpToolSelection: true,
        },
      }),
    ).toMatchObject({
      tools: [agentTool],
      capabilities: {
        supportsOmpVibe: true,
        supportsOmpToolSelection: true,
      },
    });
  });
});

describe("legacy agent stream envelope compatibility", () => {
  test("keeps frozen legacy event unions unaware of newer OMP events", () => {
    const frozenLegacyAgentStreamEventSchema = z.discriminatedUnion("type", [
      z.object({ type: z.literal("turn_started"), provider: z.string() }),
      z.object({ type: z.literal("timeline"), provider: z.string(), item: z.unknown() }),
    ]);

    expect(
      frozenLegacyAgentStreamEventSchema.safeParse({
        type: "provider_state_updated",
        provider: "omp",
        stateKey: "vibe",
        state: { revision: 1, enabled: true, workers: [] },
      }).success,
    ).toBe(false);
    expect(
      frozenLegacyAgentStreamEventSchema.safeParse({
        type: "timeline",
        provider: "omp",
        item: { type: "assistant_message", text: "legacy" },
      }).success,
    ).toBe(true);
  });
});
