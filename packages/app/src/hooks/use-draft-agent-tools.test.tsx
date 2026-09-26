// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentToolDefinition } from "@getpaseo/protocol/agent-types";
import type { FormPreferenceUpdate } from "@/create-agent-preferences/service";
import type { FormPreferences } from "@/create-agent-preferences/preferences";
import { mergeProviderPreferences } from "@/create-agent-preferences/preferences";
import { useDraftAgentTools } from "./use-draft-agent-tools";

const hostTools: AgentToolDefinition[] = [
  {
    name: "read",
    label: "Read",
    description: "Read files",
    source: "native",
    enabled: true,
    required: true,
  },
  {
    name: "bash",
    label: "Bash",
    description: "Run commands",
    source: "native",
    enabled: false,
    required: false,
  },
  {
    name: "write",
    label: "Write",
    description: "Write files",
    source: "native",
    enabled: false,
    required: false,
  },
];

const harness = vi.hoisted(() => ({
  features: { ompVibe: true, ompToolSelection: true } as Record<string, boolean>,
  preferences: {} as FormPreferences,
  isConnected: true,
  hasClient: true,
  listProviderTools: async () => ({ tools: [] as AgentToolDefinition[] }),
}));

vi.mock("@/runtime/host-runtime", () => ({
  useHostRuntimeClient: () =>
    harness.hasClient ? { listProviderTools: () => harness.listProviderTools() } : null,
  useHostRuntimeIsConnected: () => harness.isConnected,
}));

vi.mock("@/stores/session-store", () => ({
  useSessionStore: (
    selector: (state: {
      sessions: Record<string, { serverInfo: { features: Record<string, boolean> } | null }>;
    }) => unknown,
  ) => selector({ sessions: { host: { serverInfo: { features: harness.features } } } }),
}));

// The factory runs while `./use-form-preferences` is being resolved, before this
// module's own bindings are initialized, so the re-exported helper is pulled from
// its source module instead of the top-level import above.
vi.mock("./use-form-preferences", async () => {
  const actual = await import("@/create-agent-preferences/preferences");
  return {
    ...actual,
    useFormPreferences: () => ({
      preferences: harness.preferences,
      isLoading: false,
      updatePreferences: async (update: FormPreferenceUpdate) => {
        const next = typeof update === "function" ? update(harness.preferences) : update;
        harness.preferences = mergeProviderPreferences({
          preferences: harness.preferences,
          provider: "omp",
          updates: next as Parameters<typeof mergeProviderPreferences>[0]["updates"],
        });
        return harness.preferences;
      },
    }),
  };
});

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function renderDraftTools(input: { provider: "omp" | "codex"; cwd?: string | null }) {
  return renderHook(
    () =>
      useDraftAgentTools({
        serverId: "host",
        provider: input.provider,
        cwd: input.cwd === undefined ? "/repo" : input.cwd,
      }),
    { wrapper: createWrapper() },
  );
}

function saveTools(provider: "omp" | "codex", allowedTools: string[]) {
  harness.preferences = { providerPreferences: { [provider]: { allowedTools } } };
}

beforeEach(() => {
  harness.features = { ompVibe: true, ompToolSelection: true };
  saveTools("omp", ["read", "write"]);
  harness.isConnected = true;
  harness.hasClient = true;
  harness.listProviderTools = async () => ({ tools: hostTools });
});

describe("useDraftAgentTools", () => {
  it("preserves the saved selection and reports it as unavailable when the host cannot select tools", () => {
    harness.features = { ompVibe: false, ompToolSelection: false };
    saveTools("omp", ["write", "read", "write"]);

    const { result } = renderDraftTools({ provider: "omp" });

    expect(result.current.toolSelection).toEqual({
      status: "unavailable",
      reason: "server-capability-missing",
      savedAllowedTools: ["read", "write"],
    });
    // The saved selection survives verbatim instead of collapsing to undefined.
    expect(result.current.allowedTools).toEqual(["read", "write"]);
    // Nothing is sent to a host that cannot resolve tool names, and nothing is
    // dropped either: the launch payload simply carries no tool selection.
    expect(result.current.providerOptions).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("keeps the saved selection for a provider that does not offer tool selection", () => {
    saveTools("codex", ["read", "write"]);

    const { result } = renderDraftTools({ provider: "codex" });

    expect(result.current.toolSelection).toEqual({
      status: "unavailable",
      reason: "not-omp-provider",
      savedAllowedTools: ["read", "write"],
    });
    expect(result.current.allowedTools).toEqual(["read", "write"]);
    expect(result.current.providerOptions).toBeUndefined();
  });

  it("reapplies the preserved selection once the host advertises tool selection", async () => {
    harness.features = { ompVibe: false, ompToolSelection: false };
    const unavailable = renderDraftTools({ provider: "omp" });
    const preserved = unavailable.result.current.allowedTools;
    unavailable.unmount();

    harness.features = { ompVibe: true, ompToolSelection: true };
    const { result } = renderDraftTools({ provider: "omp" });

    await waitFor(() => expect(result.current.toolSelection.status).toBe("ready"));
    expect(result.current.tools).toEqual(hostTools);
    // "read" is required, "write" was saved, "bash" never was.
    expect(result.current.allowedTools).toEqual(["read", "write"]);
    expect(result.current.providerOptions).toEqual({ allowedTools: ["read", "write"] });
    expect(preserved).toEqual(["read", "write"]);
  });

  it("rejects writes while tool selection is unavailable instead of rewriting preferences", () => {
    harness.features = { ompVibe: true, ompToolSelection: false };

    const { result } = renderDraftTools({ provider: "omp" });

    expect(() => result.current.setAllowedTools(["bash"])).toThrow();
    expect(harness.preferences.providerPreferences?.omp?.allowedTools).toEqual([
      "read",
      "write",
    ]);
  });

  it("resolves draft tools rows where saved write enables write while bash stays off", async () => {
    saveTools("omp", ["write"]);
    const { result } = renderDraftTools({ provider: "omp" });

    await waitFor(() => expect(result.current.toolSelection.status).toBe("ready"));
    expect(result.current.rows).toEqual([
      expect.objectContaining({ name: "read", enabled: true, required: true }),
      expect.objectContaining({ name: "bash", enabled: false, required: false }),
      expect.objectContaining({ name: "write", enabled: true, required: false }),
    ]);
  });
});
