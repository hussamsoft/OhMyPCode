import type { ReactNode } from "react";
import { usePanelStore, type MobilePanelView } from "@/stores/panel-store";

/**
 * Web/Electron no-op provider. The mobile-panels gesture runtime (shared values,
 * gesture refs, animation transitions) is intentionally not part of the desktop
 * bundle — the compact-width range has no swipe-to-close affordance on these
 * platforms. State still flows through the panel store; only the runtime does
 * not exist here.
 */
export function MobilePanelsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * Mirror of the native `useIsMobilePanelActive` so call sites can read the active
 * panel across platforms. On web this is backed directly by the panel store —
 * no provider runtime is involved.
 */
export function useIsMobilePanelActive(panel: MobilePanelView): boolean {
  return usePanelStore((state) => state.mobilePanel.target) === panel;
}

/**
 * No-op on web: there is no swipe-to-open gesture to block.
 */
export function useBlockMobilePanelOpenGestures(_blocked: boolean): void {
  // intentionally empty on web/Electron
}
