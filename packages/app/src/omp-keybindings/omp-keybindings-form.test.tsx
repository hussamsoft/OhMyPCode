/**
 * @vitest-environment jsdom
 */
import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OmpKeybindingEntry } from "@/composer/omp-control-deck/use-omp-rpc";
import { OmpKeybindingsForm } from "./omp-keybindings-form";

const mockSetKeybinding = vi.hoisted(() =>
  vi.fn(async () => ({ requestId: "req", keybindings: [] })),
);
const mockState = vi.hoisted(() => ({
  keybindings: [] as OmpKeybindingEntry[],
  isLoading: false,
  error: null as Error | null,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: () => undefined } as never,
}));

vi.mock("@/composer/omp-control-deck/use-omp-rpc", () => ({
  useOmpKeybindings: () => ({
    keybindings: mockState.keybindings,
    isLoading: mockState.isLoading,
    isFetching: false,
    error: mockState.error,
    refresh: vi.fn(),
  }),
  useOmpKeybindingSetter: () => ({
    setKeybinding: mockSetKeybinding,
    isPending: false,
    error: null,
    lastResult: null,
  }),
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

function sampleEntries(): OmpKeybindingEntry[] {
  return [
    {
      id: "app.interrupt",
      keys: "escape",
      description: "Interrupt the agent",
      action: "app.interrupt",
    },
    { id: "app.exit", keys: "ctrl+c ctrl+c", description: "Exit OMP", action: "app.exit" },
    {
      id: "tui.input.submit",
      keys: "enter",
      description: "Submit the prompt",
      action: "tui.input.submit",
    },
  ];
}

describe("OmpKeybindingsForm", () => {
  afterEach(() => {
    cleanup();
    mockSetKeybinding.mockClear();
    mockState.keybindings = [];
    mockState.isLoading = false;
    mockState.error = null;
  });

  it("renders every keybinding row with its id, description, and current keys", () => {
    mockState.keybindings = sampleEntries();
    render(<OmpKeybindingsForm serverId="remote" agentId="agent-1" />, { wrapper });

    expect(screen.getByTestId("omp-keybinding-row-app.interrupt")).toBeTruthy();
    expect(screen.getByTestId("omp-keybinding-row-app.exit")).toBeTruthy();
    expect(screen.getByTestId("omp-keybinding-row-tui.input.submit")).toBeTruthy();
    expect(screen.getByText("Interrupt the agent")).toBeTruthy();
  });

  it("filters rows by id, action, description, or keys", () => {
    mockState.keybindings = sampleEntries();
    render(<OmpKeybindingsForm serverId="remote" agentId="agent-1" />, { wrapper });

    fireEvent.change(screen.getByTestId("omp-keybindings-filter"), { target: { value: "exit" } });

    expect(screen.queryByTestId("omp-keybinding-row-app.exit")).toBeTruthy();
    expect(screen.queryByTestId("omp-keybinding-row-app.interrupt")).toBeNull();
    expect(screen.queryByTestId("omp-keybinding-row-tui.input.submit")).toBeNull();
  });

  it("commits an edited binding on submit, not on every keystroke", () => {
    mockState.keybindings = sampleEntries();
    render(<OmpKeybindingsForm serverId="remote" agentId="agent-1" />, { wrapper });

    const input = screen.getByTestId("omp-keybinding-input-app.interrupt");
    fireEvent.change(input, { target: { value: "ctrl+shift+x" } });
    expect(mockSetKeybinding).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });
    expect(mockSetKeybinding).toHaveBeenCalledWith({ id: "app.interrupt", keys: "ctrl+shift+x" });
  });

  it("does not commit when the edited value is unchanged or blank", () => {
    mockState.keybindings = sampleEntries();
    render(<OmpKeybindingsForm serverId="remote" agentId="agent-1" />, { wrapper });

    const input = screen.getByTestId("omp-keybinding-input-app.interrupt");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });
    expect(mockSetKeybinding).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });
    expect(mockSetKeybinding).not.toHaveBeenCalled();
  });

  it("shows a placeholder when serverId or agentId is missing", () => {
    render(<OmpKeybindingsForm serverId={null} agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-keybindings-form-placeholder")).toBeTruthy();
  });

  it("shows a loading state before the first successful fetch", () => {
    mockState.isLoading = true;
    render(<OmpKeybindingsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-keybindings-form-loading")).toBeTruthy();
  });

  it("shows an error state when the fetch fails with no cached data", () => {
    mockState.error = new Error("boom");
    render(<OmpKeybindingsForm serverId="remote" agentId="agent-1" />, { wrapper });
    expect(screen.getByTestId("omp-keybindings-form-error")).toBeTruthy();
  });
});
