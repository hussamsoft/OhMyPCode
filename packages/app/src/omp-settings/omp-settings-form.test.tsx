/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OmpSettingsSetPayload } from "@ohmypcode/client/internal/daemon-client";
import type { OmpSettingEntry } from "@/composer/omp-control-deck/use-omp-rpc";
import { OmpSettingsForm } from "./omp-settings-form";
import { OMP_SETTINGS_TAB_ORDER } from "./registry";

interface MockClient {
  getOmpSettings: ReturnType<typeof vi.fn>;
  setOmpSetting: ReturnType<typeof vi.fn>;
}

const runtime = vi.hoisted(() => ({
  connected: true,
  supported: true,
  clients: new Map<string, MockClient>(),
}));

const mockSetSetting = vi.hoisted(() =>
  vi.fn(
    async (_agentId: string, _path: string, _value: unknown): Promise<OmpSettingsSetPayload> => ({
      requestId: "req-test",
      path: _path,
      value: _value,
      revision: 1,
    }),
  ),
);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params && params.label !== undefined ? `${key}:${String(params.label)}` : key,
  }),
  initReactI18next: { type: "3rdParty", init: () => undefined } as never,
}));

vi.mock("@/runtime/host-features", () => ({
  useHostFeature: (_serverId: string, feature: string) =>
    feature === "ompSettings" && runtime.supported,
}));
vi.mock("@/runtime/host-runtime", () => ({
  useHostRuntimeClient: (serverId: string) => runtime.clients.get(serverId) ?? null,
  useHostRuntimeIsConnected: (serverId: string) => runtime.connected && serverId === "remote",
}));
vi.mock("@/contexts/toast-context", () => ({
  useToast: () => ({ error: vi.fn() }),
}));

vi.mock("@/composer/omp-control-deck/use-omp-rpc", () => ({
  ompSettingsQueryKey: () => ["ompSettings", "", ""] as const,
  useOmpSettings: (_serverId: string | null | undefined, _agentId: string | null | undefined) => ({
    settings: [],
    revision: 0,
    isLoading: false,
    isFetching: false,
    error: null,
    refresh: vi.fn(),
  }),
  useOmpSettingSetter: () => ({
    setSetting: mockSetSetting,
    isPending: false,
    error: null,
    lastResult: null,
  }),
  useOmpSettingsUpdate: () => null,
}));

vi.mock("lucide-react-native", () => ({
  Lock: () => null,
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

function renderForm(props: {
  initialEntries?: readonly OmpSettingEntry[];
  serverId?: string | null;
  agentId?: string | null;
}) {
  return render(
    <OmpSettingsForm
      serverId={props.serverId ?? "remote"}
      agentId={props.agentId ?? "agent-1"}
      initialEntries={props.initialEntries}
    />,
    { wrapper },
  );
}

function buildSampleEntries(): OmpSettingEntry[] {
  return [
    {
      path: "model.default",
      type: "string",
      value: "claude-sonnet",
      enumValues: [],
      description: "Default model",
      credential: false,
      ui: { tab: "model", group: "Sampling", label: "Default model", description: "Default model" },
    },
    {
      path: "thinking.enabled",
      type: "boolean",
      value: true,
      defaultValue: true,
      enumValues: [],
      description: "Enable thinking",
      credential: false,
      ui: {
        tab: "model",
        group: "Thinking",
        label: "Enable thinking",
        description: "When on, the agent pauses to plan",
      },
    },
    {
      path: "model.approval",
      type: "enum",
      value: "auto",
      defaultValue: "auto",
      enumValues: ["auto", "manual"],
      description: "Approval mode",
      credential: false,
      ui: {
        tab: "interaction",
        group: "Approvals",
        label: "Approval",
        description: "How aggressively to auto-approve",
      },
    },
    {
      path: "providers.openai.apiKey",
      type: "string",
      value: "sk-live-secret",
      enumValues: [],
      description: "OpenAI key",
      credential: true,
      ui: {
        tab: "providers",
        group: "Services",
        label: "OpenAI API key",
        description: "Stored locally; never written to env",
      },
    },
    {
      path: "interaction.notify",
      type: "boolean",
      value: false,
      defaultValue: true,
      enumValues: [],
      description: "Notify on completion",
      credential: false,
      ui: {
        tab: "interaction",
        group: "Notifications",
        label: "Notify",
        description: "Desktop notification on completion",
      },
    },
  ];
}

describe("OmpSettingsForm generated rendering", () => {
  beforeEach(() => {
    mockSetSetting.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a tab chip for every declared registry tab, ordered correctly", () => {
    renderForm({ initialEntries: buildSampleEntries() });
    const expectedLabels = OMP_SETTINGS_TAB_ORDER.map(
      (id) => id.charAt(0).toUpperCase() + id.slice(1),
    );
    const chips = screen.getAllByTestId(/^omp-settings-tab-/);
    const chipLabels = chips.map((node) => node.textContent ?? "");
    for (const label of expectedLabels) {
      expect(chipLabels).toContain(label);
    }
    // Each consecutive pair in OMP_SETTINGS_TAB_ORDER must appear in the
    // same relative order on screen; i.e. nothing can reorder the chips.
    const indicesInDeclaredOrder = expectedLabels
      .map((label) => chipLabels.indexOf(label))
      .filter((idx) => idx >= 0);
    const sortedAscending = [...indicesInDeclaredOrder].sort((a, b) => a - b);
    expect(indicesInDeclaredOrder).toEqual(sortedAscending);
  });

  it("renders section headings and field rows grouped under their declared tab", () => {
    renderForm({ initialEntries: buildSampleEntries() });
    // Default tab is the first one in OMP_SETTINGS_TAB_ORDER, which is
    // "model". The Sampling + Thinking groups and their rows live there.
    expect(screen.getByText("Sampling")).toBeTruthy();
    expect(screen.getByText("Thinking")).toBeTruthy();
    expect(screen.getByTestId("omp-setting-row-model.default")).toBeTruthy();
    expect(screen.getByTestId("omp-setting-row-thinking.enabled")).toBeTruthy();

    // Switch to the interaction tab and verify its rows are now in the DOM.
    const interactionChips = screen.getAllByTestId("omp-settings-tab-interaction");
    fireEvent.click(interactionChips[0]);
    expect(screen.getByText("Approvals")).toBeTruthy();
    expect(screen.getByTestId("omp-setting-row-model.approval")).toBeTruthy();
    expect(screen.getByTestId("omp-setting-row-interaction.notify")).toBeTruthy();
  });

  it("renders boolean entries as interactive switches wired to the setter", () => {
    renderForm({ initialEntries: buildSampleEntries() });
    // The Switch component renders an <input type="checkbox" role="switch">.
    // Locate it by accessibility label (the t() mock prefixes with the
    // key, so it reads "agentControls.omp.booleanField:Enable thinking").
    const sw = screen.getByLabelText(
      "agentControls.omp.booleanField:Enable thinking",
    ) as HTMLInputElement;
    expect(sw).toBeTruthy();
    expect(sw.type).toBe("checkbox");
    fireEvent.click(sw);
    // The hook's setSetting takes the structured `{ path, value }` input —
    // confirm the form forwarded it unchanged.
    expect(mockSetSetting).toHaveBeenCalled();
    const lastCall = mockSetSetting.mock.calls[mockSetSetting.mock.calls.length - 1][0];
    expect(lastCall).toMatchObject({ path: "thinking.enabled", value: false });
  });

  it("renders enum entries as selectable chips with the current value preselected", () => {
    renderForm({ initialEntries: buildSampleEntries() });
    // The enum lives under the interaction tab; switch first.
    const interactionChips = screen.getAllByTestId("omp-settings-tab-interaction");
    fireEvent.click(interactionChips[0]);
    const autoBtn = screen.getByTestId("omp-setting-enum-model.approval-auto");
    const manualBtn = screen.getByTestId("omp-setting-enum-model.approval-manual");
    // Selection is rendered as the `enumOptionSelected` style (accent
    // background). Verify the active option has a different background
    // from the inactive one.
    const autoStyle = (autoBtn as HTMLElement).style;
    const manualStyle = (manualBtn as HTMLElement).style;
    expect(autoStyle.backgroundColor).not.toBe(manualStyle.backgroundColor);
    fireEvent.click(manualBtn);
    expect(mockSetSetting).toHaveBeenCalled();
    const lastCall = mockSetSetting.mock.calls[mockSetSetting.mock.calls.length - 1][0];
    expect(lastCall).toMatchObject({ path: "model.approval", value: "manual" });
  });

  it("masks credential entries and exposes them as read-only (security-relevant)", () => {
    renderForm({ initialEntries: buildSampleEntries() });
    // Switch to the providers tab where the credential lives.
    const providerChips = screen.getAllByTestId("omp-settings-tab-providers");
    fireEvent.click(providerChips[0]);
    const input = screen.getByTestId(
      "omp-setting-input-providers.openai.apiKey",
    ) as HTMLInputElement;
    // 1. The control is a read-only TextInput — `editable={false}` in
    //    react-native maps to `readOnly` on the underlying DOM <input>.
    expect(input.readOnly).toBe(true);
    // 2. The rendered value is masked (8 bullet glyphs), never the secret.
    expect(input.value).toBe("••••••••");
    expect(input.value).not.toContain("sk-live-secret");
    // 3. The control is rendered with secureTextEntry. react-native-web
    //    emits this as `type="password"` on the underlying <input>, but
    //    the authoritative proof is that the user-supplied secret string
    //    never appears anywhere in the DOM.
    expect(screen.queryByText("sk-live-secret")).toBeNull();
  });
});

describe("OmpSettingsForm empty / disabled cases", () => {
  it("renders an 'unavailable' state when no agent id is supplied", () => {
    render(<OmpSettingsForm serverId="remote" agentId={null} initialEntries={[]} />, { wrapper });
    expect(screen.getByTestId("omp-settings-form-placeholder")).toBeTruthy();
  });
});

describe("OMP settings registry", () => {
  it("uses OMP's canonical tab ids verbatim", () => {
    expect(OMP_SETTINGS_TAB_ORDER).toContain("appearance");
    expect(OMP_SETTINGS_TAB_ORDER).toContain("model");
    expect(OMP_SETTINGS_TAB_ORDER).toContain("interaction");
    expect(OMP_SETTINGS_TAB_ORDER).toContain("context");
    expect(OMP_SETTINGS_TAB_ORDER).toContain("memory");
    expect(OMP_SETTINGS_TAB_ORDER).toContain("files");
    expect(OMP_SETTINGS_TAB_ORDER).toContain("shell");
    expect(OMP_SETTINGS_TAB_ORDER).toContain("tools");
    expect(OMP_SETTINGS_TAB_ORDER).toContain("tasks");
    expect(OMP_SETTINGS_TAB_ORDER).toContain("providers");
  });

  it("does not contain invented tab ids", () => {
    for (const id of OMP_SETTINGS_TAB_ORDER) {
      expect([
        "appearance",
        "model",
        "interaction",
        "context",
        "memory",
        "files",
        "shell",
        "tools",
        "tasks",
        "providers",
      ]).toContain(id);
    }
  });
});
