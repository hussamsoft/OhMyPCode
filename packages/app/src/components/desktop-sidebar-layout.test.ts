import { describe, expect, it } from "vitest";
import {
  canDesktopAppSidebarShare,
  DESKTOP_NAVIGATION_RAIL_WIDTH,
  resolveDesktopAppChromeLayout,
  resolveDesktopAppContentMinimum,
  resolveDesktopSidebarMode,
  resolveDesktopSidebarVisibility,
  resolveDesktopSidebarWidth,
} from "@/components/desktop-sidebar-layout";

describe("desktop sidebar layout", () => {
  it("keeps a retained sidebar hidden while app chrome is suppressed", () => {
    expect(
      resolveDesktopSidebarVisibility({
        chromeEnabled: false,
        isCompactLayout: false,
        isMounted: true,
        isOpen: true,
        canShare: true,
      }),
    ).toBe(false);
  });

  it("keeps the sidebar toggle window-owned beside left window controls", () => {
    expect(
      resolveDesktopAppChromeLayout({
        desktopSidebarRendered: true,
        hasTopLeftWindowControls: true,
        sidebarControlsEnabled: true,
      }),
    ).toEqual({
      sidebarCorners: "top-left",
      contentCorners: "top-right",
      sidebarToggleOwner: "window",
    });
    expect(
      resolveDesktopAppChromeLayout({
        desktopSidebarRendered: true,
        hasTopLeftWindowControls: false,
        sidebarControlsEnabled: true,
      }),
    ).toEqual({
      sidebarCorners: "none",
      contentCorners: "both",
      sidebarToggleOwner: "content",
    });
    expect(
      resolveDesktopAppChromeLayout({
        desktopSidebarRendered: false,
        hasTopLeftWindowControls: true,
        sidebarControlsEnabled: true,
      }),
    ).toEqual({
      sidebarCorners: "none",
      contentCorners: "both",
      sidebarToggleOwner: "window",
    });
  });

  it("hides the window-owned sidebar toggle when app chrome is suppressed", () => {
    expect(
      resolveDesktopAppChromeLayout({
        desktopSidebarRendered: false,
        hasTopLeftWindowControls: true,
        sidebarControlsEnabled: false,
      }).sidebarToggleOwner,
    ).toBe("none");
  });

  it("clamps a persisted wide sidebar to preserve the center pane", () => {
    const atHalfScreen = resolveDesktopSidebarWidth({ requestedWidth: 600, viewportWidth: 751 });
    expect(atHalfScreen).toBe(351);
    expect(751 - atHalfScreen).toBe(400);

    const atBreakpoint = resolveDesktopSidebarWidth({ requestedWidth: 600, viewportWidth: 720 });
    expect(atBreakpoint).toBe(320);
    expect(720 - atBreakpoint).toBe(400);

    expect(resolveDesktopSidebarWidth({ requestedWidth: 600, viewportWidth: 1440 })).toBe(600);
  });

  it("yields app navigation when settings needs the shell width", () => {
    const settingsMinimum = resolveDesktopAppContentMinimum({ isSettingsRoute: true });
    expect(settingsMinimum).toBe(720);
    expect(
      canDesktopAppSidebarShare({
        contentMinimumWidth: settingsMinimum,
        requestedSidebarWidth: 320,
        viewportWidth: 751,
      }),
    ).toBe(false);
  });

  it("imposes no content minimum outside settings", () => {
    expect(resolveDesktopAppContentMinimum({ isSettingsRoute: false })).toBe(0);
    expect(
      canDesktopAppSidebarShare({
        contentMinimumWidth: resolveDesktopAppContentMinimum({ isSettingsRoute: false }),
        requestedSidebarWidth: 320,
        viewportWidth: 751,
      }),
    ).toBe(true);
  });
});

describe("desktop sidebar mode", () => {
  it("hides the rail when chrome is suppressed or layout is compact", () => {
    expect(
      resolveDesktopSidebarMode({
        chromeEnabled: false,
        isCompactLayout: false,
        isMounted: true,
        isOpen: true,
        canShare: true,
        viewportWidth: 1440,
      }),
    ).toBe("hidden");
    expect(
      resolveDesktopSidebarMode({
        chromeEnabled: true,
        isCompactLayout: true,
        isMounted: true,
        isOpen: true,
        canShare: true,
        viewportWidth: 1440,
      }),
    ).toBe("hidden");
  });

  it("keeps the rail mounted even when the context column cannot share the shell", () => {
    // 900px cannot host rail(56) + 200 min sidebar + 400 center. falls back to rail-only.
    expect(
      resolveDesktopSidebarMode({
        chromeEnabled: true,
        isCompactLayout: false,
        isMounted: true,
        isOpen: true,
        canShare: false,
        viewportWidth: 900,
      }),
    ).toBe("rail-only");
  });

  it("hides the rail when the viewport is too narrow even for the rail alone", () => {
    expect(
      resolveDesktopSidebarMode({
        chromeEnabled: true,
        isCompactLayout: false,
        isMounted: true,
        isOpen: true,
        canShare: false,
        viewportWidth: 480,
      }),
    ).toBe("hidden");
  });

  it("collapses to rail-only when the user closes the context column", () => {
    expect(
      resolveDesktopSidebarMode({
        chromeEnabled: true,
        isCompactLayout: false,
        isMounted: true,
        isOpen: false,
        canShare: true,
        viewportWidth: 1440,
      }),
    ).toBe("rail-only");
  });

  it("renders rail+context when chrome, viewport, and open state all agree", () => {
    expect(
      resolveDesktopSidebarMode({
        chromeEnabled: true,
        isCompactLayout: false,
        isMounted: true,
        isOpen: true,
        canShare: true,
        viewportWidth: 1440,
      }),
    ).toBe("rail-context");
  });

  it("treats a rail-only or hidden sidebar as not visible for legacy callers", () => {
    expect(
      resolveDesktopSidebarVisibility({
        chromeEnabled: false,
        isCompactLayout: false,
        isMounted: true,
        isOpen: true,
        canShare: true,
      }),
    ).toBe(false);
    expect(
      resolveDesktopSidebarVisibility({
        chromeEnabled: true,
        isCompactLayout: false,
        isMounted: true,
        isOpen: false,
        canShare: true,
      }),
    ).toBe(true);
  });

  it("exposes a 56px rail width token so chrome can align to it", () => {
    expect(DESKTOP_NAVIGATION_RAIL_WIDTH).toBe(56);
  });
});
