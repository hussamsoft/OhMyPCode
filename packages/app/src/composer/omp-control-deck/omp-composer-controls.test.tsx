/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentToolDefinition } from "@ohmypcode/protocol/agent-types";

beforeEach(() => {
  vi.stubGlobal("React", React);
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params && params.count !== undefined ? `${key}(${params.count})` : key,
  }),
  initReactI18next: { type: "3rdParty", init: () => undefined } as never,
}));
vi.mock("@/components/adaptive-modal-sheet", () => ({
  AdaptiveModalSheet: () => null,
}));
vi.mock("@/components/ui/combobox", () => ({
  Combobox: () => null,
  ComboboxItem: () => null,
}));
vi.mock("@/composer/agent-controls/mode-control", () => ({
  AgentModeControl: () => null,
}));
vi.mock("@/composer/agent-controls/control", () => ({
  AgentControlTrigger: () => null,
}));
vi.mock("@/composer/agent-controls/glyph", () => ({
  ComposerToolbarGlyph: () => null,
}));
vi.mock("@/composer/agent-controls/layout-context", () => ({
  ComposerControlLayoutProvider: ({ children }: { children: ReactNode }) => {
    return children;
  },
  useComposerControlLayout: () => ({
    glyphSize: 16,
    presentation: { showCarets: true },
  }),
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
    setMode: vi.fn(),
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
    setSetting: vi.fn(),
    isPending: false,
    error: null,
    lastResult: null,
  }),
}));
vi.mock("lucide-react-native", () => {
  const MockIcon = () => null;
  const mock: Record<string, unknown> = {};
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
    "Bug",
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
    "Code",
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
    "Star",
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

vi.mock("@/components/combined-model-selector", () => ({
  CombinedModelSelector: () => <div data-testid="combined-model-selector" />,
}));

vi.mock("@/agent-profiles", () => ({
  useAgentProfilePicker: () => null,
  useAgentProfileEditor: () => ({ element: null }),
  AgentProfileGlyph: () => null,
  AgentProfilesSection: () => null,
}));

interface SessionEntry {
  serverInfo: {
    features: Record<string, boolean>;
  };
  agents: Map<
    string,
    {
      provider: string;
      cwd: string | null;
      runtimeInfo?: { model: string | null } | null;
      model: string | null;
      features: Array<{
        type: "toggle" | "select";
        id: string;
        label: string;
        value: unknown;
        options?: Array<{ id: string; label: string }>;
      }>;
      thinkingOptionId: string | null;
    }
  >;
  client: {
    listAgentTools: () => Promise<unknown>;
    setAgentTools: (enabledTools: readonly string[]) => Promise<unknown>;
  } | null;
}

const harness = vi.hoisted(() => ({
  sessions: new Map<string, SessionEntry>(),
  snapshotEntries: undefined as
    | Array<{ provider: string; status: string; models?: unknown[] }>
    | undefined,
  capabilities: { canUseVibe: false, canSelectTools: false },
}));

vi.mock("@/stores/session-store", () => ({
  useSessionStore: (selector: (state: { sessions: Record<string, SessionEntry> }) => unknown) =>
    selector({ sessions: Object.fromEntries(harness.sessions) }),
}));

vi.mock("@/runtime/host-runtime", () => ({
  useHostRuntimeClient: () => null,
  useHostRuntimeIsConnected: () => true,
}));

vi.mock("@/hooks/use-providers-snapshot", () => ({
  useProvidersSnapshot: () => ({
    entries: harness.snapshotEntries,
    isLoading: false,
    isFetching: false,
    isRefreshing: false,
    error: null,
    supportsSnapshot: true,
    refresh: vi.fn(),
    refetchIfStale: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-omp-capabilities", () => ({
  useOmpCapabilities: () => harness.capabilities,
}));

vi.mock("@/contexts/toast-context", () => ({
  useToast: () => ({
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock("@/utils/provider-notice-toast", () => ({
  showProviderNoticeToast: vi.fn(),
}));

import { OmpComposerControls } from "./omp-composer-controls";

function wrap(children: ReactNode): ReactNode {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

function installOmpSession(serverId: string, agentId: string) {
  const entry: SessionEntry = {
    serverInfo: { features: { ompVibe: true, ompToolSelection: true } },
    agents: new Map([
      [
        agentId,
        {
          provider: "omp",
          cwd: "/repo",
          runtimeInfo: { model: "best-model" },
          model: "best-model",
          features: [
            { type: "toggle", id: "omp_vibe", label: "Vibe", value: false },
            { type: "toggle", id: "fast_mode", label: "Fast", value: true },
          ],
          thinkingOptionId: null,
        },
      ],
    ]),
    client: {
      listAgentTools: async () => ({
        tools: [
          {
            name: "read",
            label: "Read",
            description: "Read files",
            source: "native",
            enabled: true,
            required: true,
          },
        ] as AgentToolDefinition[],
      }),
      setAgentTools: async (enabledTools: readonly string[]) => ({
        tools: enabledTools.map((name) => ({
          name,
          label: name,
          description: "",
          source: "native" as const,
          enabled: true,
          required: false,
        })),
      }),
    },
  };
  harness.sessions.set(serverId, entry);
}

describe("OmpComposerControls", () => {
  it("renders the live OMP control deck for an OMP provider session", () => {
    installOmpSession("server-1", "agent-1");
    harness.capabilities = { canUseVibe: true, canSelectTools: true };

    const { container } = render(
      wrap(<OmpComposerControls serverId="server-1" agentId="agent-1" />),
    );

    const deck = container.querySelector('[data-testid="omp-control-deck"]');
    expect(deck).not.toBeNull();
    expect(container.querySelector('[data-testid="omp-mode-build"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="omp-tools-control"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="omp-settings-control"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="omp-access-control"]')).not.toBeNull();
  });

  it("renders the model selector and combined-model-selector inside the deck", () => {
    installOmpSession("server-1", "agent-2");
    harness.capabilities = { canUseVibe: true, canSelectTools: true };

    const { container } = render(
      wrap(<OmpComposerControls serverId="server-1" agentId="agent-2" />),
    );

    const modelSelector = container.querySelector('[data-testid="combined-model-selector"]');
    expect(modelSelector).not.toBeNull();
    // The deck wraps the model selector in a modelSlot so it lives inside the
    // omp-control-deck view (not as a sibling).
    const deck = container.querySelector('[data-testid="omp-control-deck"]');
    expect(deck?.contains(modelSelector)).toBe(true);
  });

  it("returns null when the session has no registered agent", () => {
    harness.sessions.clear();
    harness.capabilities = { canUseVibe: false, canSelectTools: false };

    const { container } = render(
      wrap(<OmpComposerControls serverId="missing" agentId="missing" />),
    );

    expect(container.firstChild).toBeNull();
  });
});
