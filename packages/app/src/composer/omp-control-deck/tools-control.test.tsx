/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AgentToolDefinition } from "@ohmypcode/protocol/agent-types";
import { OmpControlDeck, type OmpToolControls } from "./index";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params && params.count !== undefined ? `${key}(${params.count})` : key,
  }),
  initReactI18next: { type: "3rdParty", init: () => undefined } as never,
}));
vi.mock("@/components/adaptive-modal-sheet", () => ({
  AdaptiveModalSheet: ({
    visible,
    children,
    testID,
  }: {
    visible?: boolean;
    children?: React.ReactNode;
    testID?: string;
  }) => (visible ? <div data-testid={testID}>{children}</div> : null),
}));
vi.mock("@/components/ui/combobox", () => ({
  Combobox: () => null,
  ComboboxItem: () => null,
}));
vi.mock("@/composer/agent-controls/mode-control", () => ({
  AgentModeControl: () => null,
}));
vi.mock("./use-omp-rpc", () => ({
  useOmpModes: () => ({
    modes: {
      mode: "none",
      planModeEnabled: false,
      planModePaused: false,
      goalModeEnabled: false,
      goalModePaused: false,
      loopModeEnabled: false,
      loopModePaused: false,
      canEnter: true,
    },
    isLoading: false,
    isFetching: false,
    error: null,
    refresh: async () => {},
  }),
  useOmpModeSetter: () => ({
    setMode: async () => {
      throw new Error("not used in this test");
    },
    isPending: false,
    error: null,
    lastResult: null,
  }),
  useOmpSettings: () => ({
    settings: [],
    revision: 0,
    isLoading: false,
    isFetching: false,
    error: null,
    refresh: async () => {},
  }),
  useOmpSettingSetter: () => ({
    setSetting: async () => {
      throw new Error("not used in this test");
    },
    isPending: false,
    error: null,
    lastResult: null,
  }),
}));
vi.mock("lucide-react-native", () => {
  const MockIcon = () => null;
  const mock: Record<string, unknown> = {};
  // Cover every icon name the deck (and any transitive icon import the
  // sibling controls add in the future) consumes. The lucide-react-native
  // package exports hundreds of icons, so we stub them all as the same
  // no-op component.
  for (const key of [
    "Activity",
    "AlertCircle",
    "AlertTriangle",
    "Archive",
    "ArrowDown",
    "ArrowLeft",
    "ArrowLeftToLine",
    "ArrowUp",
    "ArrowUpRight",
    "BarChart3",
    "Blocks",
    "BookOpen",
    "Bot",
    "Brain",
    "CalendarClock",
    "Check",
    "CheckCircle",
    "CheckCircle2",
    "ChevronDown",
    "ChevronLeft",
    "ChevronRight",
    "ChevronUp",
    "Circle",
    "CircleAlert",
    "CircleHelp",
    "Clock3",
    "Compass",
    "Copy",
    "CornerDownLeft",
    "Eye",
    "EyeOff",
    "Expand",
    "Feather",
    "File",
    "FilePlus",
    "FileText",
    "Folder",
    "FolderPlus",
    "Footprints",
    "Gift",
    "GitBranch",
    "History",
    "Info",
    "Keyboard",
    "Link2",
    "ListTodo",
    "Map",
    "MessageSquarePlus",
    "Mic",
    "MicOff",
    "Monitor",
    "MoreHorizontal",
    "MoreVertical",
    "Network",
    "PackagePlus",
    "Pencil",
    "Plus",
    "RotateCw",
    "Search",
    "Settings",
    "Settings2",
    "Shield",
    "ShieldAlert",
    "ShieldCheck",
    "ShieldEllipsis",
    "ShieldOff",
    "ShieldPlus",
    "ShieldQuestionMark",
    "Sparkles",
    "Square",
    "SquareTerminal",
    "Terminal",
    "Trash2",
    "TriangleAlert",
    "Turtle",
    "Unlink",
    "UserCheck",
    "Users",
    "Wrench",
    "X",
    "XCircle",
    "Zap",
  ]) {
    mock[key] = MockIcon;
  }
  return mock;
});
vi.mock("@/utils/tool-call-icon", () => ({
  resolveToolCallIcon: () => () => null,
}));

const tools: AgentToolDefinition[] = [
  {
    name: "read",
    label: "Read",
    description: "Read files",
    source: "native",
    enabled: true,
    required: true,
  },
];

const MODEL_SELECTOR = <span>model</span>;
const EMPTY_THINKING_OPTIONS: readonly { id: string; label: string }[] = [];
const NOOP_THINKING = () => {};
const VIBE_PROPS = {
  enabled: true,
  canUse: true,
  setEnabled: () => {},
};

function renderDeck(controls: OmpToolControls) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrap = (children: ReactNode) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(
    wrap(
      <OmpControlDeck
        source="draft"
        serverId="srv-1"
        agentId="agent-1"
        modelSelector={MODEL_SELECTOR}
        thinkingOptions={EMPTY_THINKING_OPTIONS}
        onSelectThinking={NOOP_THINKING}
        vibe={VIBE_PROPS}
        tools={controls}
      />,
    ),
  );
}

function toolsControl(container: HTMLElement): HTMLElement {
  const control = container.querySelector<HTMLElement>('[data-testid="omp-tools-control"]');
  if (!control) {
    throw new Error("tools control not rendered");
  }
  return control;
}

describe("OMP control deck tools control", () => {
  it("reports a live tool count while the host can resolve tools", () => {
    const { container } = renderDeck({
      rows: tools,
      canUse: true,
      list: async () => tools,
      set: async () => tools,
    });

    const control = toolsControl(container);
    expect(control.getAttribute("aria-disabled")).not.toBe("true");
    expect(control.getAttribute("aria-label")).toContain("agentControls.omp.toolCount");
    expect(container.textContent).toContain("agentControls.omp.toolCount");
  });

  it("disables the control and explains itself instead of silently no-opping", () => {
    const { container } = renderDeck({
      rows: [],
      canUse: false,
      savedSelection: [],
      list: async () => [],
      set: async () => [],
    });

    const control = toolsControl(container);
    expect(control.getAttribute("aria-disabled")).toBe("true");
    expect(control.getAttribute("aria-label")).toContain("agentControls.omp.toolsUnavailable");
    expect(container.textContent).toContain("agentControls.omp.toolsUnavailable");
    // No tool count is claimed while the host cannot resolve the tool list.
    expect(container.textContent).not.toContain("agentControls.omp.toolCount");
  });

  it("names the preserved selection so a saved choice never reads as lost", () => {
    const { container } = renderDeck({
      rows: [],
      canUse: false,
      savedSelection: ["read", "write"],
      list: async () => [],
      set: async () => [],
    });

    const control = toolsControl(container);
    expect(control.getAttribute("aria-label")).toContain(
      "agentControls.omp.toolsUnavailableSaved(2)",
    );
    expect(container.textContent).toContain("agentControls.omp.toolsUnavailableSaved(2)");
  });

  it("does not open the tool sheet from a disabled control", () => {
    const { container, queryByTestId } = renderDeck({
      rows: [],
      canUse: false,
      savedSelection: ["read"],
      list: async () => [],
      set: async () => [],
    });

    fireEvent.click(toolsControl(container));

    expect(queryByTestId("omp-tools-sheet")).toBeNull();
  });
});

describe("OMP control deck MCP server grouping", () => {
  const nativeTool: AgentToolDefinition = {
    name: "read",
    label: "Read",
    description: "Read files",
    source: "native",
    enabled: true,
    required: false,
  };
  const fsRead: AgentToolDefinition = {
    name: "mcp__fs_read",
    label: "fs/read",
    description: "Read via fs server",
    source: "mcp",
    enabled: true,
    required: false,
  };
  const fsWrite: AgentToolDefinition = {
    name: "mcp__fs_write",
    label: "fs/write",
    description: "Write via fs server",
    source: "mcp",
    enabled: false,
    required: false,
  };
  const githubList: AgentToolDefinition = {
    name: "mcp__github_list_prs",
    label: "github/list_prs",
    description: "List PRs via github",
    source: "mcp",
    enabled: true,
    required: false,
  };
  const requiredMcpTool: AgentToolDefinition = {
    name: "mcp__fs_required",
    label: "fs/required",
    description: "Required fs tool",
    source: "mcp",
    enabled: true,
    required: true,
  };

  function openSheet(container: HTMLElement): HTMLElement {
    fireEvent.click(toolsControl(container));
    const sheet = container.querySelector<HTMLElement>('[data-testid="omp-tools-sheet"]');
    if (!sheet) throw new Error("tools sheet did not open");
    return sheet;
  }

  it("renders one grouped switch per MCP server while leaving native tools flat", () => {
    const rows: AgentToolDefinition[] = [nativeTool, fsRead, fsWrite, githubList];
    const { container } = renderDeck({
      rows,
      canUse: true,
      list: async () => rows,
      set: async () => rows,
    });

    const sheet = openSheet(container);
    expect(sheet.querySelector('[data-testid="omp-mcp-server-fs"]')).not.toBeNull();
    expect(sheet.querySelector('[data-testid="omp-mcp-server-github"]')).not.toBeNull();
    expect(sheet.querySelector('[data-testid="omp-mcp-group-fs"]')).not.toBeNull();
    expect(sheet.querySelector('[data-testid="omp-mcp-group-github"]')).not.toBeNull();
    // Native row still renders without an MCP wrapper.
    expect(container.textContent).toContain("Read");
  });

  it("toggles every tool in the server group via a single authoritative commit", async () => {
    const initialRows: AgentToolDefinition[] = [fsRead, fsWrite];
    const setCalls: string[][] = [];
    const { container } = renderDeck({
      rows: initialRows,
      canUse: true,
      list: async () => initialRows,
      set: async (next) => {
        setCalls.push(next);
        return initialRows.map((tool) => ({
          ...tool,
          enabled: next.includes(tool.name),
        }));
      },
    });

    const sheet = openSheet(container);
    const serverRow = sheet.querySelector<HTMLElement>('[data-testid="omp-mcp-server-fs"]');
    if (!serverRow) throw new Error("fs server row missing");

    fireEvent.click(serverRow);

    const { promise, resolve } = Promise.withResolvers<void>();
    setImmediate(resolve);
    await promise;
    expect(setCalls).toHaveLength(1);
    // The single commit must include every tool from the group.
    expect(setCalls[0]?.sort()).toEqual(["mcp__fs_read", "mcp__fs_write"]);
  });

  it("disables the grouped switch when every tool in the server is required", () => {
    const rows: AgentToolDefinition[] = [requiredMcpTool];
    const { container } = renderDeck({
      rows,
      canUse: true,
      list: async () => rows,
      set: async () => rows,
    });

    const sheet = openSheet(container);
    const serverRow = sheet.querySelector<HTMLElement>('[data-testid="omp-mcp-server-fs"]');
    if (!serverRow) throw new Error("fs server row missing");
    expect(serverRow.getAttribute("aria-disabled")).toBe("true");
    // The required tool's individual row is also locked, so the existing
    // required-entry behavior is preserved.
    expect(sheet.textContent).toContain("agentControls.omp.required");
  });

  it("leaves the grouped switch interactive when only some tools in the server are required", () => {
    const rows: AgentToolDefinition[] = [fsRead, requiredMcpTool];
    const { container } = renderDeck({
      rows,
      canUse: true,
      list: async () => rows,
      set: async () => rows,
    });

    const sheet = openSheet(container);
    const serverRow = sheet.querySelector<HTMLElement>('[data-testid="omp-mcp-server-fs"]');
    if (!serverRow) throw new Error("fs server row missing");
    expect(serverRow.getAttribute("aria-disabled")).not.toBe("true");
  });
});
