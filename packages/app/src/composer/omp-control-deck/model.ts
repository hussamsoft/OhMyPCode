import type { AgentFeature, AgentToolDefinition } from "@ohmypcode/protocol/agent-types";

export const OMP_VIBE_FEATURE_ID = "omp_vibe";
export const OMP_APPROVAL_MODE_PATH = "tools.approvalMode";

/**
 * Five-segment OMP mode taxonomy rendered by the composer control deck:
 * Build is the implicit "no plan/goal/loop/vibe" baseline, the other four
 * are explicit selections via the OMP `setOmpMode` RPC (plan/goal/loop)
 * or the `omp_vibe` feature flag (vibe).
 */
export type OmpMode = "build" | "plan" | "vibe" | "goal" | "loop";

/**
 * `tools.approvalMode` setting enum. Mirrors `cfgToolsApprovalMode` in
 * `vendor/oh-my-pi/packages/coding-agent/src/tools/settings.ts`. Only the
 * three values listed here are accepted by `set_setting`.
 */
export type OmpApprovalMode = "always-ask" | "write" | "yolo";

export interface OmpApprovalModeOption {
  id: OmpApprovalMode;
  /** Translation key for the user-facing label (i18n namespace `agentControls.omp`). */
  labelKey: string;
  /** Translation key for the description rendered in the access dropdown. */
  descriptionKey: string;
}

export const OMP_APPROVAL_MODE_OPTIONS: readonly OmpApprovalModeOption[] = [
  {
    id: "always-ask",
    labelKey: "agentControls.omp.accessAlwaysAsk",
    descriptionKey: "agentControls.omp.accessAlwaysAskDescription",
  },
  {
    id: "write",
    labelKey: "agentControls.omp.accessWrite",
    descriptionKey: "agentControls.omp.accessWriteDescription",
  },
  {
    id: "yolo",
    labelKey: "agentControls.omp.accessYolo",
    descriptionKey: "agentControls.omp.accessYoloDescription",
  },
];

export function isOmpApprovalMode(value: unknown): value is OmpApprovalMode {
  return value === "always-ask" || value === "write" || value === "yolo";
}

export function resolveOmpApprovalModeId(value: unknown): OmpApprovalMode {
  return isOmpApprovalMode(value) ? value : "yolo";
}

/**
 * MCP tool names minted by OMP follow the convention
 * `mcp__<sanitized_server>_<sanitized_tool>`. The runtime strips the explicit
 * `mcpServerName` field before the catalog crosses the wire, so the UI derives
 * a stable per-server grouping key from the wire-visible fields instead.
 *
 * Precedence:
 *   1. `tool.label`'s `<server>/<tool>` prefix (the raw `connection.name` OMP
 *      actually ships — see `tool-bridge.ts`).
 *   2. The sanitized prefix after `mcp__` in `tool.name` (best-effort, lossy
 *      for overlong hashed names).
 *   3. `undefined` for non-MCP tools.
 */
export function resolveMcpServerName(tool: AgentToolDefinition): string | undefined {
  if (tool.source !== "mcp") return undefined;
  // OMP labels MCP tools as `<connection.name>/<tool.name>` (see tool-bridge.ts),
  // so the `<server>/<tool>` shape is the wire-stable grouping signal.
  const slash = tool.label.indexOf("/");
  if (slash > 0) {
    const labelPrefix = tool.label.slice(0, slash).trim();
    if (labelPrefix) return labelPrefix;
  }
  if (tool.name.startsWith("mcp__")) {
    const suffix = tool.name.slice("mcp__".length);
    const underscore = suffix.indexOf("_");
    return underscore > 0 ? suffix.slice(0, underscore) : suffix;
  }
  return tool.label || undefined;
}

export interface OmpMcpServerGroup {
  serverName: string;
  rows: AgentToolDefinition[];
}

export interface OmpToolGrouping {
  nonMcp: AgentToolDefinition[];
  mcp: OmpMcpServerGroup[];
}

/**
 * Splits a tool catalog into built-in/paseo entries (rendered flat) and
 * MCP-origin entries (rendered as one grouped switch per server). The
 * resulting ordering preserves first-seen order so a stable catalog renders
 * deterministically across reloads.
 */
export function groupOmpToolsByServer(
  rows: readonly AgentToolDefinition[],
): OmpToolGrouping {
  const nonMcp: AgentToolDefinition[] = [];
  const mcp: OmpMcpServerGroup[] = [];
  const indexByServer = new Map<string, number>();
  for (const tool of rows) {
    const serverName = resolveMcpServerName(tool);
    if (serverName === undefined) {
      nonMcp.push(tool);
      continue;
    }
    const existing = indexByServer.get(serverName);
    if (existing === undefined) {
      indexByServer.set(serverName, mcp.length);
      mcp.push({ serverName, rows: [tool] });
    } else {
      mcp[existing]!.rows.push(tool);
    }
  }
  return { nonMcp, mcp };
}

/**
 * Returns `true` iff every tool in the group is marked required by the
 * catalog. The grouped switch is disabled only in that case so the existing
 * required-tool lock invariant still wins — partial groups stay toggleable.
 */
export function isOmpMcpServerGroupRequired(group: OmpMcpServerGroup): boolean {
  return group.rows.every((tool) => tool.required);
}

/**
 * The grouped switch reflects `enabled` only when every tool in the group
 * shares the same enabled state. Mixed-state groups show as off so users get
 * a single tap to fully enable, which matches "select the whole server".
 */
export function resolveOmpMcpServerGroupState(group: OmpMcpServerGroup): boolean {
  if (group.rows.length === 0) return false;
  const first = group.rows[0]!.enabled;
  return group.rows.every((tool) => tool.enabled === first) && first;
}

export interface OmpLabelVisibility {
  settings: boolean;
  thinking: boolean;
  access: boolean;
  tools: boolean;
}

const OMP_FEATURE_ORDER = {
  behavior: [
    "fast_mode",
    "omp_advisor",
    "omp_skillful",
    "omp_extended_context",
    "omp_computer_use",
  ],
  startup: ["omp_plan_yolo", "omp_prewalk", "omp_smol_model", "omp_slow_model", "omp_plan_model"],
} as const;

function getCollapseLevel(width: number): number {
  if (width >= 720) return 0;
  if (width >= 620) return 1;
  if (width >= 520) return 2;
  if (width >= 420) return 3;
  return 4;
}

export function resolveOmpLabelVisibility(availableWidth: number): OmpLabelVisibility {
  const width = Number.isFinite(availableWidth) ? Math.max(0, availableWidth) : 0;
  const collapsed = getCollapseLevel(width);
  return {
    settings: collapsed < 1,
    thinking: collapsed < 2,
    access: collapsed < 3,
    tools: collapsed < 4,
  };
}

export function resolveOmpEnabledTools(
  rows: readonly AgentToolDefinition[],
  enabledTools: readonly string[],
): string[] {
  const selected = new Set(enabledTools);
  return rows.filter((tool) => tool.required || selected.has(tool.name)).map((tool) => tool.name);
}

export function applyOmpToolSelection(input: {
  rows: readonly AgentToolDefinition[];
  name: string | readonly string[];
  enabled: boolean;
  set(enabledTools: string[]): Promise<AgentToolDefinition[]>;
}): Promise<
  | { ok: true; rows: AgentToolDefinition[] }
  | { ok: false; rows: readonly AgentToolDefinition[]; error: string }
> {
  const current = input.rows.filter((tool) => tool.enabled).map((tool) => tool.name);
  const next = new Set(resolveOmpEnabledTools(input.rows, current));
  const targets = typeof input.name === "string" ? [input.name] : input.name;
  for (const target of targets) {
    if (input.enabled) next.add(target);
    else next.delete(target);
  }
  const nextNames = resolveOmpEnabledTools(input.rows, [...next]);
  return Promise.resolve()
    .then(() => input.set(nextNames))
    .then(
      (rows) => ({ ok: true, rows }),
      (error: unknown) => ({
        ok: false,
        rows: input.rows,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
}

export function buildOmpSettingsGroups(features: readonly AgentFeature[] | undefined): {
  behavior: AgentFeature[];
  startup: AgentFeature[];
} {
  const byId = new Map((features ?? []).map((feature) => [feature.id, feature]));
  const pick = (ids: readonly string[]) =>
    ids.flatMap((id) => {
      const feature = byId.get(id);
      return feature ? [feature] : [];
    });
  return {
    behavior: pick(OMP_FEATURE_ORDER.behavior),
    startup: pick(OMP_FEATURE_ORDER.startup),
  };
}
