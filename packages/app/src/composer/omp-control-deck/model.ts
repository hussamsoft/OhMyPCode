import type { AgentFeature, AgentToolDefinition } from "@getpaseo/protocol/agent-types";

export const OMP_VIBE_FEATURE_ID = "omp_vibe";
export type OmpMode = "build" | "vibe";

export interface OmpLabelVisibility {
  settings: boolean;
  thinking: boolean;
  access: boolean;
  tools: boolean;
}

const OMP_FEATURE_ORDER = {
  behavior: ["fast_mode", "omp_advisor", "omp_skillful", "omp_extended_context", "omp_computer_use"],
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
  name: string;
  enabled: boolean;
  set(enabledTools: string[]): Promise<AgentToolDefinition[]>;
}): Promise<
  | { ok: true; rows: AgentToolDefinition[] }
  | { ok: false; rows: readonly AgentToolDefinition[]; error: string }
> {
  const current = input.rows.filter((tool) => tool.enabled).map((tool) => tool.name);
  const next = new Set(resolveOmpEnabledTools(input.rows, current));
  if (input.enabled) next.add(input.name);
  else next.delete(input.name);
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

export function buildOmpSettingsGroups(
  features: readonly AgentFeature[] | undefined,
): { behavior: AgentFeature[]; startup: AgentFeature[] } {
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
