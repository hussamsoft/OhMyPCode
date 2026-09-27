/**
 * Small gate function that the composer calls to decide which left-content
 * control to mount for a given (serverId, agentId) pair. Lives in its own
 * file so it can be unit-tested without dragging in the composer's full
 * import graph (icons, clipboard, voice, autocompletes, …).
 *
 * Behavior:
 *  - `showAgentControls` off → nothing rendered.
 *  - draft `agentControls` (a `DraftAgentControlsProps` is present) → render
 *    `DraftAgentControls` (draft mode wins regardless of provider).
 *  - live OMP session → render `OmpComposerControls` (the Phase 9 deck).
 *  - everything else (live, non-OMP) → render `AgentControls`.
 *
 * Re-ordering the branches would change user-visible behavior, so the
 * precedence (draft > OMP > legacy live) is intentionally explicit.
 */
import type { ReactElement } from "react";
import {
  AgentControls,
  DraftAgentControls,
  type DraftAgentControlsProps,
} from "@/composer/agent-controls";
import { resolveAgentControlsMode } from "@/composer/agent-controls/mode";
import { OmpComposerControls } from "@/composer/omp-control-deck/omp-composer-controls";

export interface ResolveComposerLeftContentArgs {
  agentControls: DraftAgentControlsProps | undefined;
  agentId: string;
  serverId: string;
  focusInput: () => void;
  isCompactLayout: boolean;
  showAgentControls: boolean;
  isOmpProvider: boolean;
}

export function resolveComposerLeftContent(
  args: ResolveComposerLeftContentArgs,
): ReactElement | null {
  const { agentControls, agentId, serverId, focusInput, isCompactLayout } = args;
  if (!args.showAgentControls) return null;
  if (resolveAgentControlsMode(agentControls) === "draft" && agentControls) {
    return <DraftAgentControls {...agentControls} isCompactLayout={isCompactLayout} />;
  }
  if (args.isOmpProvider) {
    return (
      <OmpComposerControls
        serverId={serverId}
        agentId={agentId}
        onDropdownClose={focusInput}
        isCompactLayout={isCompactLayout}
      />
    );
  }
  return (
    <AgentControls
      agentId={agentId}
      serverId={serverId}
      onDropdownClose={focusInput}
      isCompactLayout={isCompactLayout}
    />
  );
}
