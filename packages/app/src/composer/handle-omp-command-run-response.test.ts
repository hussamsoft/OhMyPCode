import { describe, expect, it, vi } from "vitest";
import type { OmpCommandRunPayload } from "@ohmypcode/client/internal/daemon-client";
import {
  handleOmpCommandRunResponse,
  type OmpOverlayOpeners,
} from "./handle-omp-command-run-response";

function buildOpeners(overrides: Partial<OmpOverlayOpeners> = {}): OmpOverlayOpeners {
  return {
    openOmpVibeTarget: vi.fn(() => "tab-vibe"),
    openOmpSettingsTarget: vi.fn(() => "tab-settings"),
    openOmpKeybindingsTarget: vi.fn(() => "tab-keybindings"),
    openOmpContextTarget: vi.fn(() => "tab-context"),
    ...overrides,
  };
}

function buildResponse(overrides: Partial<OmpCommandRunPayload> = {}): OmpCommandRunPayload {
  return {
    requestId: "req-1",
    agentInvoked: false,
    output: "",
    stateChange: false,
    ...overrides,
  };
}

describe("handleOmpCommandRunResponse", () => {
  it("opens the vibe panel for a vibe overlay and does not toast unless output is present", () => {
    const openers = buildOpeners();
    const showToast = vi.fn();
    handleOmpCommandRunResponse({
      response: buildResponse({ ui: { kind: "overlay", name: "vibe" } }),
      commandName: "vibe",
      agentId: "agent-1",
      showToast,
      setSendError: vi.fn(),
      openers,
    });

    expect(openers.openOmpVibeTarget).toHaveBeenCalledWith({
      kind: "omp_vibe",
      agentId: "agent-1",
      workerId: null,
    });
    expect(showToast).not.toHaveBeenCalled();
  });

  it("toasts the output alongside opening the panel when both are present", () => {
    const openers = buildOpeners();
    const showToast = vi.fn();
    handleOmpCommandRunResponse({
      response: buildResponse({
        ui: { kind: "overlay", name: "settings" },
        output: "Opened settings",
      }),
      commandName: "settings",
      agentId: "agent-1",
      showToast,
      setSendError: vi.fn(),
      openers,
    });

    expect(openers.openOmpSettingsTarget).toHaveBeenCalledWith({
      kind: "omp_settings",
      agentId: "agent-1",
    });
    expect(showToast).toHaveBeenCalledWith("Opened settings");
  });

  it("opens the keybindings panel for a hotkeys overlay", () => {
    const openers = buildOpeners();
    handleOmpCommandRunResponse({
      response: buildResponse({ ui: { kind: "overlay", name: "hotkeys" } }),
      commandName: "hotkeys",
      agentId: "agent-1",
      showToast: vi.fn(),
      setSendError: vi.fn(),
      openers,
    });

    expect(openers.openOmpKeybindingsTarget).toHaveBeenCalledWith({
      kind: "omp_keybindings",
      agentId: "agent-1",
    });
  });

  it("reports and falls back to toast for an overlay name with no registered panel", () => {
    const openers = buildOpeners();
    const showToast = vi.fn();
    const reportUnknownOverlay = vi.fn();
    handleOmpCommandRunResponse({
      response: buildResponse({ ui: { kind: "overlay", name: "git" }, output: "git output" }),
      commandName: "git",
      agentId: "agent-1",
      showToast,
      setSendError: vi.fn(),
      reportUnknownOverlay,
      openers,
    });

    expect(reportUnknownOverlay).toHaveBeenCalledWith("git");
    expect(showToast).toHaveBeenCalledWith("git output");
  });

  it("falls back to toast when the layout store refuses to open the overlay target", () => {
    const openers = buildOpeners({ openOmpVibeTarget: vi.fn(() => null) });
    const showToast = vi.fn();
    handleOmpCommandRunResponse({
      response: buildResponse({ ui: { kind: "overlay", name: "vibe" }, output: "fallback text" }),
      commandName: "vibe",
      agentId: "agent-1",
      showToast,
      setSendError: vi.fn(),
      openers,
    });

    expect(showToast).toHaveBeenCalledWith("fallback text");
  });

  it("opens the context panel for a non-overlay context response instead of toasting", () => {
    const openers = buildOpeners();
    const showToast = vi.fn();
    handleOmpCommandRunResponse({
      response: buildResponse({ output: "Context window: 100000 tokens (10% used)" }),
      commandName: "context",
      agentId: "agent-1",
      showToast,
      setSendError: vi.fn(),
      openers,
    });

    expect(openers.openOmpContextTarget).toHaveBeenCalledWith({ agentId: "agent-1" });
    expect(showToast).not.toHaveBeenCalled();
  });

  it("falls back to toast for context when the layout store refuses to open the panel", () => {
    const openers = buildOpeners({ openOmpContextTarget: vi.fn(() => null) });
    const showToast = vi.fn();
    handleOmpCommandRunResponse({
      response: buildResponse({ output: "Context window: 100000 tokens" }),
      commandName: "context",
      agentId: "agent-1",
      showToast,
      setSendError: vi.fn(),
      openers,
    });

    expect(showToast).toHaveBeenCalledWith("Context window: 100000 tokens");
  });

  it("toasts plain output for a non-overlay, non-panel command", () => {
    const openers = buildOpeners();
    const showToast = vi.fn();
    handleOmpCommandRunResponse({
      response: buildResponse({ output: "Fast mode: on" }),
      commandName: "fast",
      agentId: "agent-1",
      showToast,
      setSendError: vi.fn(),
      openers,
    });

    expect(openers.openOmpVibeTarget).not.toHaveBeenCalled();
    expect(openers.openOmpContextTarget).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Fast mode: on");
  });

  it("clears the send error for a silent, non-invoking, non-state-changing response", () => {
    const setSendError = vi.fn();
    handleOmpCommandRunResponse({
      response: buildResponse({ output: "", agentInvoked: false, stateChange: false }),
      commandName: "noop",
      agentId: "agent-1",
      showToast: vi.fn(),
      setSendError,
      openers: buildOpeners(),
    });

    expect(setSendError).toHaveBeenCalledWith(null);
  });
});
