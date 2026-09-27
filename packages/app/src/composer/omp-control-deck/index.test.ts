import { describe, expect, it } from "vitest";
import type { AgentFeature, AgentToolDefinition } from "@ohmypcode/protocol/agent-types";
import {
  applyOmpToolSelection,
  buildOmpSettingsGroups,
  groupOmpToolsByServer,
  resolveMcpServerName,
  resolveOmpLabelVisibility,
} from "./model";

const tools: AgentToolDefinition[] = [
  {
    name: "read",
    label: "Read",
    description: "Read files",
    source: "native",
    enabled: true,
    required: true,
  },
  {
    name: "write",
    label: "Write",
    description: "Write files",
    source: "paseo",
    enabled: false,
    required: false,
  },
];

describe("OMP desktop control model", () => {
  it("collapses labels in the required order while retaining values", () => {
    expect(resolveOmpLabelVisibility(800)).toEqual({
      settings: true,
      thinking: true,
      access: true,
      tools: true,
    });
    expect(resolveOmpLabelVisibility(600)).toEqual({
      settings: false,
      thinking: false,
      access: true,
      tools: true,
    });
    expect(resolveOmpLabelVisibility(400)).toEqual({
      settings: false,
      thinking: false,
      access: false,
      tools: false,
    });
    expect(resolveOmpLabelVisibility(300)).toEqual({
      settings: false,
      thinking: false,
      access: false,
      tools: false,
    });
  });

  it("keeps required tools selected and commits one authoritative result", async () => {
    const calls: string[][] = [];
    const result = await applyOmpToolSelection({
      rows: tools,
      name: "write",
      enabled: true,
      set: async (enabledTools) => {
        calls.push(enabledTools);
        return tools.map((tool) => ({
          ...tool,
          enabled: tool.required || enabledTools.includes(tool.name),
        }));
      },
    });

    expect(calls).toEqual([["read", "write"]]);
    expect(result).toEqual({
      ok: true,
      rows: expect.arrayContaining([
        expect.objectContaining({ name: "read", enabled: true }),
        expect.objectContaining({ name: "write", enabled: true }),
      ]),
    });
  });

  it("disables an enabled optional tool without re-enabling disabled siblings", async () => {
    const rows: AgentToolDefinition[] = [
      { ...tools[0]!, enabled: true },
      { ...tools[1]!, enabled: true },
      {
        name: "bash",
        label: "Shell",
        description: "Run shell commands",
        source: "native",
        enabled: false,
        required: false,
      },
    ];
    const calls: string[][] = [];
    const result = await applyOmpToolSelection({
      rows,
      name: "write",
      enabled: false,
      set: async (enabledTools) => {
        calls.push(enabledTools);
        return rows.map((tool) =>
          Object.assign({}, tool, {
            enabled: tool.required || enabledTools.includes(tool.name),
          }),
        );
      },
    });

    expect(calls).toEqual([["read"]]);
    expect(result).toEqual({
      ok: true,
      rows: expect.arrayContaining([
        expect.objectContaining({ name: "read", enabled: true }),
        expect.objectContaining({ name: "write", enabled: false }),
        expect.objectContaining({ name: "bash", enabled: false }),
      ]),
    });
  });

  it("preserves prior rows when the authoritative tool request fails", async () => {
    const result = await applyOmpToolSelection({
      rows: tools,
      name: "write",
      enabled: true,
      set: async () => {
        throw new Error("tool selection unavailable");
      },
    });

    expect(result).toEqual({
      ok: false,
      rows: tools,
      error: "tool selection unavailable",
    });
  });

  it("toggles every named tool in a single authoritative commit", async () => {
    const mcpTools: AgentToolDefinition[] = [
      {
        name: "mcp__fs_read",
        label: "fs/read",
        description: "Read via filesystem server",
        source: "mcp",
        enabled: false,
        required: false,
      },
      {
        name: "mcp__fs_write",
        label: "fs/write",
        description: "Write via filesystem server",
        source: "mcp",
        enabled: false,
        required: false,
      },
      {
        name: "mcp__fs_list",
        label: "fs/list",
        description: "List via filesystem server",
        source: "mcp",
        enabled: true,
        required: false,
      },
    ];
    const calls: string[][] = [];
    const result = await applyOmpToolSelection({
      rows: mcpTools,
      name: ["mcp__fs_read", "mcp__fs_write", "mcp__fs_list"],
      enabled: true,
      set: async (enabledTools) => {
        calls.push(enabledTools);
        return mcpTools.map((tool) =>
          Object.assign({}, tool, { enabled: enabledTools.includes(tool.name) }),
        );
      },
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual(["mcp__fs_read", "mcp__fs_write", "mcp__fs_list"]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.rows.every((tool) => tool.enabled)).toBe(true);
  });

  it("disables every named tool in a single authoritative commit", async () => {
    const mcpTools: AgentToolDefinition[] = [
      {
        name: "mcp__fs_read",
        label: "fs/read",
        description: "Read",
        source: "mcp",
        enabled: true,
        required: false,
      },
      {
        name: "mcp__fs_write",
        label: "fs/write",
        description: "Write",
        source: "mcp",
        enabled: true,
        required: false,
      },
    ];
    const calls: string[][] = [];
    await applyOmpToolSelection({
      rows: mcpTools,
      name: ["mcp__fs_read", "mcp__fs_write"],
      enabled: false,
      set: async (enabledTools) => {
        calls.push(enabledTools);
        return mcpTools.map((tool) =>
          Object.assign({}, tool, { enabled: enabledTools.includes(tool.name) }),
        );
      },
    });

    expect(calls).toEqual([[]]);
  });

  it("groups MCP tools by raw server label while leaving native/paseo flat", () => {
    const rows: AgentToolDefinition[] = [
      {
        name: "read",
        label: "Read",
        description: "Read files",
        source: "native",
        enabled: true,
        required: false,
      },
      {
        name: "create_agent",
        label: "Create agent",
        description: "Create collaborating agent",
        source: "paseo",
        enabled: true,
        required: true,
      },
      {
        name: "mcp__fs_read",
        label: "fs/read",
        description: "Read via fs",
        source: "mcp",
        enabled: true,
        required: false,
      },
      {
        name: "mcp__fs_write",
        label: "fs/write",
        description: "Write via fs",
        source: "mcp",
        enabled: false,
        required: false,
      },
      {
        name: "mcp__github_list_prs",
        label: "github/list_prs",
        description: "List PRs via github",
        source: "mcp",
        enabled: true,
        required: false,
      },
    ];

    const grouped = groupOmpToolsByServer(rows);

    expect(grouped.nonMcp.map((tool) => tool.name)).toEqual(["read", "create_agent"]);
    expect(grouped.mcp).toHaveLength(2);
    expect(grouped.mcp[0]?.serverName).toBe("fs");
    expect(grouped.mcp[0]?.rows.map((tool) => tool.name)).toEqual([
      "mcp__fs_read",
      "mcp__fs_write",
    ]);
    expect(grouped.mcp[1]?.serverName).toBe("github");
    expect(grouped.mcp[1]?.rows.map((tool) => tool.name)).toEqual(["mcp__github_list_prs"]);
  });

  it("falls back to the sanitized name prefix when an MCP label omits the server", () => {
    expect(
      resolveMcpServerName({
        name: "mcp__context7_query_docs",
        label: "query_docs",
        description: "Docs lookup",
        source: "mcp",
        enabled: true,
        required: false,
      }),
    ).toBe("context7");
  });

  it("orders settings into behavior and startup groups", () => {
    const features: AgentFeature[] = [
      { type: "toggle", id: "omp_plan_yolo", label: "Plan first", value: false },
      { type: "toggle", id: "fast_mode", label: "Fast", value: true },
      { type: "select", id: "omp_prewalk", label: "Prewalk", value: "default", options: [] },
    ];
    expect(buildOmpSettingsGroups(features)).toEqual({
      behavior: [features[1]],
      startup: [features[0], features[2]],
    });
  });
});
