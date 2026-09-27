/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { OmpModesState } from "@ohmypcode/protocol/messages";
import {
  OMP_APPROVAL_MODE_PATH,
  OmpAccessControl,
  OmpModeControl,
  type OmpVibeControls,
} from "./index";

const OMP_TRANSLATION_OVERRIDES: Record<string, string> = {
  "agentControls.omp.build": "Build",
  "agentControls.omp.plan": "Plan",
  "agentControls.omp.vibe": "Vibe",
  "agentControls.omp.goal": "Goal",
  "agentControls.omp.loop": "Loop",
  "agentControls.omp.accessAlwaysAsk": "always-ask",
  "agentControls.omp.accessWrite": "write",
  "agentControls.omp.accessYolo": "yolo",
  "agentControls.omp.modeUnavailable": "OMP mode controls unavailable",
  "agentControls.omp.modeDisabledForAgent": "This mode is not available for the current agent",
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const override = OMP_TRANSLATION_OVERRIDES[key];
      const base = override ?? key;
      if (params && "value" in params) {
        return `${key}(${String(params.value)})`;
      }
      return base;
    },
  }),
}));

const MODE_STATE_BASE = vi.hoisted((): OmpModesState => ({
  mode: "none",
  planModeEnabled: false,
  planModePaused: false,
  goalModeEnabled: false,
  goalModePaused: false,
  loopModeEnabled: false,
  loopModePaused: false,
  canEnter: true,
}));

const hooks = vi.hoisted(() => {
  const modeHook: {
    modes: OmpModesState | null;
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
  } = {
    modes: MODE_STATE_BASE,
    isLoading: false,
    isFetching: false,
    error: null,
    refresh: () => Promise.resolve(),
  };
  const modeSetter: {
    setMode: Mock;
    isPending: boolean;
    error: Error | null;
    lastResult: unknown;
  } = {
    setMode: vi.fn(async () => ({ state: MODE_STATE_BASE, changed: true })),
    isPending: false,
    error: null,
    lastResult: null,
  };
  const settingsHook: {
    settings: {
      path: string;
      type: string;
      value: unknown;
      credential: boolean;
    }[];
    revision: number;
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
  } = {
    settings: [],
    revision: 0,
    isLoading: false,
    isFetching: false,
    error: null,
    refresh: () => Promise.resolve(),
  };
  const settingSetter: {
    setSetting: Mock;
    isPending: boolean;
    error: Error | null;
    lastResult: unknown;
  } = {
    setSetting: vi.fn(async () => ({
      requestId: "set-1",
      path: OMP_APPROVAL_MODE_PATH,
      value: "write",
      revision: 1,
    })),
    isPending: false,
    error: null,
    lastResult: null,
  };
  return { modeHook, modeSetter, settingsHook, settingSetter };
});

vi.mock("./use-omp-rpc", () => ({
  useOmpModes: () => hooks.modeHook,
  useOmpModeSetter: () => hooks.modeSetter,
  useOmpSettings: () => hooks.settingsHook,
  useOmpSettingSetter: () => hooks.settingSetter,
}));

const comboboxCapture: {
  onSelect?: (id: string) => void;
  options: { id: string; label: string }[];
} = { options: [] };

vi.mock("@/components/ui/combobox", () => ({
  Combobox: ({ onSelect, options }: { onSelect?: (id: string) => void; options: { id: string; label: string }[] }) => {
    comboboxCapture.onSelect = onSelect;
    comboboxCapture.options = options;
    return null;
  },
  ComboboxItem: () => null,
}));

vi.mock("@/utils/tool-call-icon", () => ({
  resolveToolCallIcon: () => () => null,
}));

vi.mock("lucide-react-native", () => {
  const MockIcon = () => null;
  const mock: Record<string, unknown> = {};
  for (const key of [
    "Activity", "AlertCircle", "AlertTriangle", "Archive", "ArrowDown", "ArrowLeft",
    "ArrowLeftToLine", "ArrowUp", "ArrowUpRight", "BarChart3", "Blocks", "BookOpen",
    "Bot", "Brain", "CalendarClock", "Check", "CheckCircle", "CheckCircle2", "ChevronDown",
    "ChevronLeft", "ChevronRight", "ChevronUp", "Circle", "CircleAlert", "CircleHelp",
    "Clock3", "Compass", "Copy", "CornerDownLeft", "Eye", "EyeOff", "Expand", "Feather",
    "File", "FilePlus", "FileText", "Folder", "FolderPlus", "Footprints", "Gift", "GitBranch",
    "History", "Info", "Keyboard", "Link2", "ListTodo", "Map", "MessageSquarePlus", "Mic",
    "MicOff", "Monitor", "MoreHorizontal", "MoreVertical", "Network", "PackagePlus",
    "Pencil", "Plus", "RotateCw", "Search", "Settings", "Settings2", "Shield", "ShieldAlert",
    "ShieldCheck", "ShieldEllipsis", "ShieldOff", "ShieldPlus", "ShieldQuestionMark",
    "Sparkles", "Square", "SquareTerminal", "Terminal", "Trash2", "TriangleAlert", "Turtle",
    "Unlink", "UserCheck", "Users", "Wrench", "X", "XCircle", "Zap",
  ]) {
    mock[key] = MockIcon;
  }
  return mock;
});

const VIBE_OFF: OmpVibeControls = {
  enabled: false,
  canUse: true,
  setEnabled: vi.fn(async () => {}),
};

function renderModeControl(props: { serverId?: string; agentId?: string; vibe?: OmpVibeControls }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrap = (children: ReactNode) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(
    wrap(
      <OmpModeControl
        serverId={props.serverId ?? "srv-1"}
        agentId={props.agentId ?? "agent-1"}
        vibe={props.vibe ?? VIBE_OFF}
      />,
    ),
  );
}

function renderAccessControl(props: {
  serverId?: string;
  agentId?: string;
  showLabel?: boolean;
}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrap = (children: ReactNode) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(
    wrap(
      <OmpAccessControl
        serverId={props.serverId ?? "srv-1"}
        agentId={props.agentId ?? "agent-1"}
        showLabel={props.showLabel ?? true}
      />,
    ),
  );
}

beforeEach(() => {
  hooks.modeHook.modes = MODE_STATE_BASE;
  hooks.modeHook.isLoading = false;
  hooks.modeHook.isFetching = false;
  hooks.modeHook.error = null;
  hooks.modeSetter.setMode = vi.fn(async () => ({ state: MODE_STATE_BASE, changed: true }));
  hooks.modeSetter.isPending = false;
  hooks.modeSetter.error = null;
  hooks.modeSetter.lastResult = null;
  hooks.settingsHook.settings = [];
  hooks.settingsHook.revision = 0;
  hooks.settingsHook.isLoading = false;
  hooks.settingsHook.isFetching = false;
  hooks.settingsHook.error = null;
  hooks.settingSetter.setSetting = vi.fn(async () => ({
    requestId: "set-1",
    path: OMP_APPROVAL_MODE_PATH,
    value: "write",
    revision: 1,
  }));
  hooks.settingSetter.isPending = false;
  hooks.settingSetter.error = null;
  hooks.settingSetter.lastResult = null;
});

describe("OmpModeControl segments", () => {
  it("renders all five segments with stable testIDs", () => {
    const { container } = renderModeControl({});
    expect(container.querySelector('[data-testid="omp-mode-build"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="omp-mode-plan"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="omp-mode-vibe"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="omp-mode-goal"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="omp-mode-loop"]')).not.toBeNull();
  });

  it("marks the active mode as selected based on the modes state", () => {
    hooks.modeHook.modes = { ...MODE_STATE_BASE, goalModeEnabled: true };
    const { container } = renderModeControl({});
    const goalChip = container.querySelector('[data-testid="omp-mode-goal"]');
    expect(goalChip?.getAttribute("aria-checked")).toBe("true");
    const buildChip = container.querySelector('[data-testid="omp-mode-build"]');
    expect(buildChip?.getAttribute("aria-checked")).toBe("false");
  });

  it("falls back to vibe.enabled when the modes query is unavailable", () => {
    hooks.modeHook.modes = null;
    const vibe: OmpVibeControls = { enabled: true, canUse: true, setEnabled: vi.fn() };
    const { container } = renderModeControl({ vibe });
    const vibeChip = container.querySelector('[data-testid="omp-mode-vibe"]');
    expect(vibeChip?.getAttribute("aria-checked")).toBe("true");
  });

  it("disables every segment with the OMP-supplied reason when canEnter is false", () => {
    hooks.modeHook.modes = {
      ...MODE_STATE_BASE,
      canEnter: false,
      blockedReason: "Agent is in a write-only subprocess",
    };
    const { container } = renderModeControl({});
    for (const id of ["build", "plan", "vibe", "goal", "loop"]) {
      const chip = container.querySelector(`[data-testid="omp-mode-${id}"]`);
      expect(chip?.getAttribute("aria-disabled")).toBe("true");
      expect(chip?.getAttribute("aria-label")).toContain("Agent is in a write-only subprocess");
    }
  });

  it("keeps every segment interactive when canEnter is true", () => {
    hooks.modeHook.modes = { ...MODE_STATE_BASE, canEnter: true };
    const { container } = renderModeControl({});
    for (const id of ["build", "plan", "vibe", "goal", "loop"]) {
      const chip = container.querySelector(`[data-testid="omp-mode-${id}"]`);
      expect(chip?.getAttribute("aria-disabled")).not.toBe("true");
    }
  });

  it("calls setOmpMode with the right mode and rolls back on failure", async () => {
    const setMode = vi
      .fn()
      .mockRejectedValueOnce(new Error("mode conflict: exit loop first"));
    hooks.modeSetter.setMode = setMode;
    hooks.modeHook.modes = { ...MODE_STATE_BASE, loopModeEnabled: true };
    const { container } = renderModeControl({});
    const planChip = container.querySelector('[data-testid="omp-mode-plan"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(planChip);
    });
    await waitFor(() => {
      expect(setMode).toHaveBeenCalledWith({ mode: "plan" });
    });
    await waitFor(() => {
      expect(container.textContent).toContain("mode conflict: exit loop first");
    });
    // Rollback: the loop segment is re-marked as selected.
    const loopChip = container.querySelector('[data-testid="omp-mode-loop"]');
    expect(loopChip?.getAttribute("aria-checked")).toBe("true");
  });

  it("toggles the vibe feature flag when the vibe segment is selected", async () => {
    const setEnabled = vi.fn(async () => {});
    const vibe: OmpVibeControls = { enabled: false, canUse: true, setEnabled };
    const { container } = renderModeControl({ vibe });
    const vibeChip = container.querySelector('[data-testid="omp-mode-vibe"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(vibeChip);
    });
    await waitFor(() => {
      expect(setEnabled).toHaveBeenCalledWith(true);
    });
  });

  it("disables other segments while a transition is pending", async () => {
    let resolveSetMode: (() => void) | null = null;
    hooks.modeSetter.setMode = vi.fn(
      () =>
        new Promise<unknown>((resolve) => {
          resolveSetMode = () => resolve({ state: MODE_STATE_BASE, changed: true });
        }),
    );
    const { container } = renderModeControl({});
    const planChip = container.querySelector('[data-testid="omp-mode-plan"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(planChip);
    });
    // While pending: only the plan segment is interactive.
    await waitFor(() => {
      const goal = container.querySelector('[data-testid="omp-mode-goal"]');
      expect(goal?.getAttribute("aria-disabled")).toBe("true");
    });
    await act(async () => {
      resolveSetMode?.();
    });
  });
});

describe("OmpAccessControl approval mode", () => {
  it("renders the chip with the current approval mode label", () => {
    hooks.settingsHook.settings = [
      { path: OMP_APPROVAL_MODE_PATH, type: "enum", value: "write", credential: false },
    ];
    const { container } = renderAccessControl({});
    const chip = container.querySelector('[data-testid="omp-access-control"]');
    expect(chip?.getAttribute("aria-label")).toBe(
      "agentControls.access.selectWithValue(write)",
    );
  });

  it("writes through set_setting with the correct path and each of the 3 approval values", async () => {
    for (const value of ["always-ask", "write", "yolo"] as const) {
      // Seed the live setting with a DIFFERENT mode so the onSelect path
      // actually executes the transition (early-return when id === currentMode).
      const initial: "always-ask" | "write" | "yolo" =
        value === "always-ask" ? "write" : "always-ask";
      hooks.settingsHook.settings = [
        {
          path: OMP_APPROVAL_MODE_PATH,
          type: "enum",
          value: initial,
          credential: false,
        },
      ];
      const setSetting = vi.fn(async () => ({
        requestId: `set-${value}`,
        path: OMP_APPROVAL_MODE_PATH,
        value,
        revision: 1,
      }));
      hooks.settingSetter.setSetting = setSetting;
      renderAccessControl({});
      expect(comboboxCapture.onSelect).toBeDefined();
      await act(async () => {
        comboboxCapture.onSelect?.(value);
      });
      await waitFor(() => {
        expect(setSetting).toHaveBeenCalledWith({
          path: OMP_APPROVAL_MODE_PATH,
          value,
        });
      });
    }
  });
});
