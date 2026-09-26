import { SETTINGS_DESKTOP_SPLIT_MIN_WIDTH } from "@/constants/layout";
import { MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH } from "@/stores/panel-store";

const MIN_DESKTOP_CENTER_WIDTH = 400;

/**
 * The desktop shell has three presentations:
 *
 * - `hidden` — chrome disabled, compact layout, route collapsed, or the
 *   workspace is sharing the shell with focus mode.
 * - `rail-only` — a fixed navigation rail is mounted but the wider
 *   project/workspace context column stays collapsed. The rail keeps
 *   host → project → workspace navigation reachable while the active
 *   thread owns the working surface.
 * - `rail-context` — both the rail and the resizable context column are
 *   mounted side by side.
 */
export type DesktopSidebarMode = "hidden" | "rail-only" | "rail-context";

const RAIL_WIDTH = 56;
export const DESKTOP_NAVIGATION_RAIL_WIDTH = RAIL_WIDTH;
export const DESKTOP_RAIL_CONTEXT_BREAKPOINT = 1100;
export const DESKTOP_RAIL_ONLY_BREAKPOINT = 720;

/** Rail-only when the viewport cannot host a resizable context column AND the user has not opted in. */
export function resolveDesktopSidebarMode(input: {
  chromeEnabled: boolean;
  isCompactLayout: boolean;
  isMounted: boolean;
  isOpen: boolean;
  canShare: boolean;
  viewportWidth: number;
}): DesktopSidebarMode {
  if (!input.chromeEnabled || input.isCompactLayout || !input.isMounted) {
    return "hidden";
  }
  if (!input.canShare) {
    // The viewport cannot host the full rail+context shell — fall back to the
    // fixed rail so navigation stays reachable.
    return input.viewportWidth >= DESKTOP_RAIL_ONLY_BREAKPOINT ? "rail-only" : "hidden";
  }
  if (!input.isOpen) {
    return "rail-only";
  }
  return "rail-context";
}

/**
 * Visible-state helper used by the existing chrome layout. A rail-only sidebar is still
 * considered "rendered" for window-chrome purposes (it owns the top-left corner), so callers
 * can keep the existing toggle/corner logic while the body now distinguishes rail vs context.
 */
export function resolveDesktopSidebarVisibility(input: {
  chromeEnabled: boolean;
  isCompactLayout: boolean;
  isMounted: boolean;
  isOpen: boolean;
  canShare: boolean;
}): boolean {
  const mode = resolveDesktopSidebarMode({
    chromeEnabled: input.chromeEnabled,
    isCompactLayout: input.isCompactLayout,
    isMounted: input.isMounted,
    isOpen: input.isOpen,
    canShare: input.canShare,
    viewportWidth: Number.POSITIVE_INFINITY,
  });
  return mode !== "hidden";
}

export function resolveDesktopAppChromeLayout(input: {
  desktopSidebarRendered: boolean;
  hasTopLeftWindowControls: boolean;
  sidebarControlsEnabled: boolean;
}) {
  const sidebarOwnsTopLeft = input.desktopSidebarRendered && input.hasTopLeftWindowControls;
  let sidebarToggleOwner: "none" | "window" | "content" = "none";
  if (input.sidebarControlsEnabled) {
    sidebarToggleOwner = input.hasTopLeftWindowControls ? "window" : "content";
  }
  return {
    sidebarCorners: sidebarOwnsTopLeft ? ("top-left" as const) : ("none" as const),
    contentCorners: sidebarOwnsTopLeft ? ("top-right" as const) : ("both" as const),
    sidebarToggleOwner,
  };
}

function resolveDesktopPanelWidth(input: {
  requestedWidth: number;
  viewportWidth: number;
  minimumWidth: number;
  maximumWidth: number;
}): number {
  "worklet";
  const maximumVisibleWidth = Math.max(
    input.minimumWidth,
    Math.min(input.maximumWidth, input.viewportWidth - MIN_DESKTOP_CENTER_WIDTH),
  );
  return Math.max(input.minimumWidth, Math.min(maximumVisibleWidth, input.requestedWidth));
}

export function resolveDesktopSidebarWidth(input: {
  requestedWidth: number;
  viewportWidth: number;
}): number {
  "worklet";
  return resolveDesktopPanelWidth({
    ...input,
    minimumWidth: MIN_SIDEBAR_WIDTH,
    maximumWidth: MAX_SIDEBAR_WIDTH,
  });
}

export function resolveDesktopAppContentMinimum(input: { isSettingsRoute: boolean }): number {
  return input.isSettingsRoute ? SETTINGS_DESKTOP_SPLIT_MIN_WIDTH : 0;
}

export function canDesktopAppSidebarShare(input: {
  contentMinimumWidth: number;
  requestedSidebarWidth: number;
  viewportWidth: number;
}): boolean {
  return (
    input.viewportWidth -
      resolveDesktopSidebarWidth({
        requestedWidth: input.requestedSidebarWidth,
        viewportWidth: input.viewportWidth,
      }) >=
    input.contentMinimumWidth
  );
}
