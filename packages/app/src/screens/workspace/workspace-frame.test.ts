import { describe, expect, it } from "vitest";
import {
  resolveWorkspaceFrameHeaderHeight,
  resolveWorkspaceFrameLayout,
} from "@/screens/workspace/workspace-frame-layout";

describe("resolveWorkspaceFrameLayout", () => {
  it("keeps the header and fallback tabs in the non-split desktop frame", () => {
    expect(
      resolveWorkspaceFrameLayout({
        isMobile: false,
        hasDesktopSplit: false,
        showHeader: true,
      }),
    ).toEqual({
      showHeader: true,
      showMobileTabs: false,
      showFallbackTabs: true,
    });
  });

  it("leaves the header inside a split and keeps compact tabs visible", () => {
    expect(
      resolveWorkspaceFrameLayout({
        isMobile: true,
        hasDesktopSplit: true,
        showHeader: true,
      }),
    ).toEqual({
      showHeader: false,
      showMobileTabs: true,
      showFallbackTabs: false,
    });
  });

  it("hides the global header when focus mode disables it", () => {
    expect(
      resolveWorkspaceFrameLayout({
        isMobile: false,
        hasDesktopSplit: false,
        showHeader: false,
      }),
    ).toEqual({
      showHeader: false,
      showMobileTabs: false,
      showFallbackTabs: true,
    });
  });
});

describe("resolveWorkspaceFrameHeaderHeight", () => {
  it("overrides only the desktop title row to the shell height", () => {
    expect(resolveWorkspaceFrameHeaderHeight({ isMobile: false, desktopTitleBarHeight: 44 })).toBe(
      44,
    );
    expect(resolveWorkspaceFrameHeaderHeight({ isMobile: true, desktopTitleBarHeight: 44 })).toBe(
      undefined,
    );
  });
});
