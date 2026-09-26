export interface WorkspaceFrameLayout {
  showHeader: boolean;
  showMobileTabs: boolean;
  showFallbackTabs: boolean;
}

export function resolveWorkspaceFrameLayout(input: {
  isMobile: boolean;
  hasDesktopSplit: boolean;
  showHeader: boolean;
}): WorkspaceFrameLayout {
  return {
    showHeader: input.showHeader && !input.hasDesktopSplit,
    showMobileTabs: input.isMobile,
    showFallbackTabs: !input.hasDesktopSplit,
  };
}

export function resolveWorkspaceFrameHeaderHeight(input: {
  isMobile: boolean;
  desktopTitleBarHeight: number;
}): number | undefined {
  return input.isMobile ? undefined : input.desktopTitleBarHeight;
}
