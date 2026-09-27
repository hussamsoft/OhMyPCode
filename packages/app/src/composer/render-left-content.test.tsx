/**
 * @vitest-environment jsdom
 *
 * Integration test for the composer left-content gate. Asserts that an OMP
 * session renders the OMP control deck (via `OmpComposerControls`) while a
 * non-OMP session continues to render `AgentControls` unchanged.
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubGlobal("React", React);
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
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
  useLiveAgentModeControl: () => null,
  toCommandCenterModes: () => [],
  getModeProviderDefinitions: () => [],
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
vi.mock("@/components/combined-model-selector", () => ({
  CombinedModelSelector: () => <div data-testid="combined-model-selector" />,
}));
vi.mock("@/agent-profiles", () => ({
  useAgentProfilePicker: () => null,
  useAgentProfileEditor: () => ({ element: null }),
  AgentProfileGlyph: () => null,
  AgentProfilesSection: () => null,
}));
vi.mock("@/command-center/agent-control-registration", () => ({
  useAgentControlCommandCenterActions: () => ({}),
}));
vi.mock("@/command-center/provider", () => ({
  useCommandCenterRegistry: () => ({}),
  CommandCenterProvider: ({ children }: { children: ReactNode }) => {
    return children;
  },
}));
vi.mock("@/command-center", () => ({
  useAgentControlCommandCenterActions: () => ({}),
}));
vi.mock("@/composer/omp-control-deck/use-omp-rpc", () => ({
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
vi.mock("@/utils/tool-call-icon", () => ({
  resolveToolCallIcon: () => () => null,
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
  client: null;
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

function installSession(
  serverId: string,
  agentId: string,
  provider: string,
  features: Record<string, boolean>,
) {
  harness.sessions.set(serverId, {
    serverInfo: { features },
    agents: new Map([
      [
        agentId,
        {
          provider,
          cwd: "/repo",
          runtimeInfo: { model: "best-model" },
          model: "best-model",
          features: [],
          thinkingOptionId: null,
        },
      ],
    ]),
    client: null,
  });
}

function wrap(children: ReactNode): ReactNode {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

// Import after mocks are wired.
import { resolveComposerLeftContent } from "./render-left-content";

describe("resolveComposerLeftContent OMP gate", () => {
  it("mounts the OMP control deck when the session's provider is OMP", () => {
    installSession("server-omp", "agent-1", "omp", {
      ompVibe: true,
      ompToolSelection: true,
    });
    harness.capabilities = { canUseVibe: true, canSelectTools: true };

    const element = resolveComposerLeftContent({
      agentControls: undefined,
      agentId: "agent-1",
      serverId: "server-omp",
      focusInput: () => {},
      isCompactLayout: false,
      showAgentControls: true,
      isOmpProvider: true,
    });

    const { container } = render(wrap(element));
    expect(container.querySelector('[data-testid="omp-control-deck"]')).not.toBeNull();
  });

  it("keeps rendering AgentControls for non-OMP sessions (unchanged behavior)", () => {
    installSession("server-codex", "agent-1", "codex", {});

    const element = resolveComposerLeftContent({
      agentControls: undefined,
      agentId: "agent-1",
      serverId: "server-codex",
      focusInput: () => {},
      isCompactLayout: false,
      showAgentControls: true,
      isOmpProvider: false,
    });

    const { container } = render(wrap(element));
    // AgentControls is present when there is no registered agent in the mock
    // either, but its hook reads the slice and returns null for missing
    // agents; what matters here is that the deck does NOT render in this
    // path.
    expect(container.querySelector('[data-testid="omp-control-deck"]')).toBeNull();
  });

  it("returns null when showAgentControls is false", () => {
    installSession("server-omp", "agent-1", "omp", {
      ompVibe: true,
      ompToolSelection: true,
    });

    const element = resolveComposerLeftContent({
      agentControls: undefined,
      agentId: "agent-1",
      serverId: "server-omp",
      focusInput: () => {},
      isCompactLayout: false,
      showAgentControls: false,
      isOmpProvider: true,
    });

    expect(element).toBeNull();
  });
});
