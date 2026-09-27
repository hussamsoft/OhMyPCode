import { resolveOmpCommandOverlayTarget } from "@/composer/resolve-omp-command-overlay-target";
import type { OmpCommandRunPayload } from "@ohmypcode/client/internal/daemon-client";

type OverlayTarget =
  | { kind: "omp_vibe"; agentId: string; workerId: string | null }
  | { kind: "omp_settings"; agentId: string }
  | { kind: "omp_keybindings"; agentId: string };

export interface OmpOverlayOpeners {
  openOmpVibeTarget: (target: {
    kind: "omp_vibe";
    agentId: string;
    workerId: string | null;
  }) => string | null;
  openOmpSettingsTarget: (target: { kind: "omp_settings"; agentId: string }) => string | null;
  openOmpKeybindingsTarget: (target: { kind: "omp_keybindings"; agentId: string }) => string | null;
  openOmpContextTarget: (target: { agentId: string }) => string | null;
  openOmpMcpTarget: (target: { agentId: string }) => string | null;
}

function openOmpOverlayTarget(target: OverlayTarget, openers: OmpOverlayOpeners): string | null {
  if (target.kind === "omp_vibe") {
    return openers.openOmpVibeTarget(target);
  }
  if (target.kind === "omp_settings") {
    return openers.openOmpSettingsTarget(target);
  }
  return openers.openOmpKeybindingsTarget(target);
}

/**
 * Commands whose data isn't reached through the `ui.kind === "overlay"`
 * contract at all — the fork gives them a headless `handle` (not just
 * `handleTui`), so they already return real `output` text over the plain
 * `omp.command.run` RPC. Long-form reports (context usage) read better in
 * a scrollable panel than a toast, so route them there instead; the panel
 * re-runs the command itself on mount, so no state needs threading through.
 *
 * Keyed by the command's own canonical name (same contract as the overlay
 * resolver — see `resolve-omp-command-overlay-target.ts`).
 */
function resolveNonOverlayPanelOpener(
  commandName: string,
  openers: OmpOverlayOpeners,
): ((input: { agentId: string }) => string | null) | null {
  if (commandName === "context") {
    return openers.openOmpContextTarget;
  }
  if (commandName === "mcp") {
    return openers.openOmpMcpTarget;
  }
  return null;
}

export interface HandleOmpCommandRunResponseArgs {
  response: OmpCommandRunPayload;
  commandName: string;
  agentId: string;
  showToast: (message: string) => void;
  setSendError: (error: string | null) => void;
  reportUnknownOverlay?: (name: string) => void;
  openers: OmpOverlayOpeners;
}

export function handleOmpCommandRunResponse(args: HandleOmpCommandRunResponseArgs): void {
  const { response, commandName, agentId, showToast, setSendError, reportUnknownOverlay, openers } =
    args;
  const ui = response.ui;
  if (ui?.kind === "overlay") {
    const target = resolveOmpCommandOverlayTarget({ name: ui.name, agentId });
    if (target) {
      const openedTabId = openOmpOverlayTarget(target, openers);
      if (openedTabId) {
        if (response.output) {
          showToast(response.output);
        }
        return;
      }
      // Layout store refused to open (no workspace owning this agent) — fall
      // back to surface output inline rather than swallow the result.
    } else {
      reportUnknownOverlay?.(ui.name);
    }
  } else {
    const openPanel = resolveNonOverlayPanelOpener(commandName, openers);
    if (openPanel?.({ agentId })) {
      return;
    }
  }

  if (response.output) {
    showToast(response.output);
    return;
  }
  if (!response.agentInvoked && !response.stateChange) {
    setSendError(null);
  }
}
