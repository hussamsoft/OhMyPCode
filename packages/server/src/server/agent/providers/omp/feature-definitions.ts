import type {
  AgentFeature,
  AgentFeatureSelect,
  AgentFeatureToggle,
} from "../../agent-sdk-types.js";
import type { OmpModesResult } from "./rpc-types.js";

export const OMP_FAST_MODE_FEATURE: Omit<AgentFeatureToggle, "value"> = {
  type: "toggle",
  id: "fast_mode",
  label: "Fast",
  description: "Use the provider's priority inference tier when supported",
  tooltip: "Toggle OMP fast mode",
  icon: "zap",
};

export interface OmpSlashToggle {
  featureId: string;
  command: string;
  label: string;
  description: string;
  icon: string;
}

export const OMP_SLASH_TOGGLES: readonly OmpSlashToggle[] = [
  {
    featureId: "omp_advisor",
    command: "advisor",
    label: "Advisor",
    description: "Passive reviewer that adds notes after each turn",
    icon: "user-check",
  },
  {
    featureId: "omp_skillful",
    command: "skillful",
    label: "Skill listing",
    description: "List installed skills to the model",
    icon: "book-open",
  },
  {
    featureId: "omp_extended_context",
    command: "extended-context",
    label: "Extended context",
    description: "Use the model's extended context window",
    icon: "expand",
  },
  {
    featureId: "omp_computer_use",
    command: "computer",
    label: "Computer use",
    description: "Let OMP capture and control this desktop",
    icon: "monitor",
  },
];

const OMP_DEFAULT_SELECT_OPTION = { id: "default", label: "OMP default" };
const OMP_TOGGLE_SELECT_OPTIONS = [
  OMP_DEFAULT_SELECT_OPTION,
  { id: "on", label: "On" },
  { id: "off", label: "Off" },
];

function buildToggleSelect(toggle: OmpSlashToggle, value: unknown): AgentFeatureSelect {
  return {
    type: "select",
    id: toggle.featureId,
    label: toggle.label,
    description: toggle.description,
    icon: toggle.icon,
    value: value === "on" || value === "off" ? value : "default",
    options: OMP_TOGGLE_SELECT_OPTIONS,
  };
}

export function parseOmpToggleStatus(text: string): boolean | null {
  const firstLine = (text.split(/\r?\n/, 1)[0] ?? "").toLowerCase();
  if (/\b(disabled|off)\b/.test(firstLine)) return false;
  if (/\b(enabled|on)\b/.test(firstLine)) return true;
  return null;
}

export function buildOmpDraftFeatures(
  featureValues: Record<string, unknown> | undefined,
  roleModelOptions: AgentFeatureSelect["options"],
): AgentFeature[] {
  const values = featureValues ?? {};
  const features: AgentFeature[] = [
    { ...OMP_FAST_MODE_FEATURE, value: values.fast_mode === true },
    ...OMP_SLASH_TOGGLES.map((toggle) => buildToggleSelect(toggle, values[toggle.featureId])),
    {
      type: "toggle",
      id: "omp_plan_yolo",
      label: "Plan first",
      description: "Start in read-only plan mode, then implement after approval (--plan-yolo)",
      icon: "map",
      value: values.omp_plan_yolo === true,
    },
    {
      type: "select",
      id: "omp_prewalk",
      label: "Prewalk",
      description: "Switch to the fast model once the plan's todo list exists",
      icon: "footprints",
      value:
        values.omp_prewalk === "on" || values.omp_prewalk === "off"
          ? values.omp_prewalk
          : "default",
      options: OMP_TOGGLE_SELECT_OPTIONS,
    },
  ];

  if (roleModelOptions.length > 0) {
    for (const [id, label, icon] of [
      ["omp_smol_model", "Smol model", "feather"],
      ["omp_slow_model", "Slow model", "turtle"],
      ["omp_plan_model", "Plan model", "compass"],
    ] as const) {
      features.push({
        type: "select",
        id,
        label,
        icon,
        value: typeof values[id] === "string" ? values[id] : "default",
        options: [OMP_DEFAULT_SELECT_OPTION, ...roleModelOptions],
      });
    }
  }

  return features;
}

export function buildOmpLiveFeatures(
  fastModeEnabled: boolean,
  toggleStates: ReadonlyMap<string, boolean>,
  modesState?: OmpModesResult | null,
): AgentFeature[] {
  const features: AgentFeature[] = [
    { ...OMP_FAST_MODE_FEATURE, value: fastModeEnabled },
    ...OMP_SLASH_TOGGLES.flatMap((toggle) => {
      const value = toggleStates.get(toggle.featureId);
      if (value === undefined) return [];
      return [
        {
          type: "toggle" as const,
          id: toggle.featureId,
          label: toggle.label,
          description: toggle.description,
          icon: toggle.icon,
          value,
        },
      ];
    }),
  ];

  if (modesState) {
    features.push(
      {
        type: "toggle" as const,
        id: "omp_plan",
        label: "Plan mode",
        description: "Agent creates a plan before executing",
        icon: "compass",
        value: modesState.planModeEnabled,
      },
      {
        type: "toggle" as const,
        id: "omp_goal",
        label: "Goal mode",
        description: "Agent works autonomously toward a stated objective",
        icon: "target",
        value: modesState.goalModeEnabled,
      },
      {
        type: "toggle" as const,
        id: "omp_loop",
        label: "Loop mode",
        description: "Agent continuously prompts itself until a condition is met",
        icon: "repeat",
        value: modesState.loopModeEnabled,
      },
    );
  }

  return features;
}
