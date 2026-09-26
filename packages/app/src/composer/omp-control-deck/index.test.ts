import { describe, expect, it } from "vitest";
import type { AgentFeature, AgentToolDefinition } from "@ohmypcode/protocol/agent-types";
import { applyOmpToolSelection, buildOmpSettingsGroups, resolveOmpLabelVisibility } from "./model";

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
