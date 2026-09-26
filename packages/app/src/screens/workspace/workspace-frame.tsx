import { memo, useMemo, type ReactNode } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { DESKTOP_SHELL_METRICS } from "@/styles/theme";
import { SidebarMenuToggle } from "@/components/headers/menu-header";
import { ScreenHeader } from "@/components/headers/screen-header";
import { ScreenTitle } from "@/components/headers/screen-title";
import { HostBadge } from "@/hosts/host-badge";
import { useHostBadges } from "@/hosts/use-host-badges";
import { useIsCompactFormFactor } from "@/constants/layout";
import { WorkspaceScriptsButton } from "@/screens/workspace/workspace-scripts-button";
import {
  WorkspaceHeaderMenuDesktop,
  WorkspaceHeaderMenuMobile,
} from "@/screens/workspace/workspace-header-menu";
import type { WorkspaceDescriptor } from "@/stores/session-store";
import type { TerminalProfile } from "@getpaseo/protocol/messages";
import {
  resolveWorkspaceFrameHeaderHeight,
  resolveWorkspaceFrameLayout,
} from "@/screens/workspace/workspace-frame-layout";
import { NewTabLauncherProvider, type NewTabLauncher } from "@/workspace-tabs/launcher";

interface WorkspaceHeaderProjectRowProps {
  subtitle: string;
  isSubtitleDistinct: boolean;
  serverId: string;
}

function WorkspaceHeaderProjectRow({
  subtitle,
  isSubtitleDistinct,
  serverId,
}: WorkspaceHeaderProjectRowProps) {
  const isCompact = useIsCompactFormFactor();
  const hostBadge = useHostBadges({ enabled: isCompact }).get(serverId) ?? null;
  const showProject = isSubtitleDistinct || isCompact;
  if (!showProject && !hostBadge) {
    return null;
  }
  return (
    <View style={styles.headerProjectRow}>
      {showProject ? (
        <Text
          testID="workspace-header-subtitle"
          style={styles.headerProjectTitle}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
      {showProject && hostBadge ? <Text style={styles.headerProjectSeparator}>·</Text> : null}
      {hostBadge ? <HostBadge badge={hostBadge} /> : null}
    </View>
  );
}

export interface WorkspaceFrameHeaderProps {
  isLoading: boolean;
  title: string;
  subtitle: string;
  isSubtitleDistinct: boolean;
  currentBranchName: string | null;
  normalizedServerId: string;
  normalizedWorkspaceId: string;
  workspaceScripts: WorkspaceDescriptor["scripts"];
  liveTerminalIds: string[];
  showWorkspaceSetup: boolean;
  showCreateBrowserTab: boolean;
  isMobile: boolean;
  createTerminalDisabled: boolean;
  importAgentDisabled: boolean;
  copyPathDisabled: boolean;
  onCreateDraftTab: () => void;
  onCreateTerminal: () => void;
  onCreateTerminalWithProfile: (profile: TerminalProfile) => void;
  onCreateBrowser: () => void;
  onOpenImportSheet: () => void;
  onCopyWorkspacePath: () => void;
  onCopyBranchName: () => void;
  onOpenSetupTab: () => void;
  onScriptTerminalStarted: (terminalId: string) => void;
  onViewScriptTerminal: (terminalId: string) => void;
  onOpenUrlInBrowserTab: (url: string) => void;
  right?: ReactNode;
}

function WorkspaceHeaderTitleBar({
  isLoading,
  title,
  subtitle,
  isSubtitleDistinct,
  currentBranchName,
  normalizedServerId,
  normalizedWorkspaceId,
  workspaceScripts,
  liveTerminalIds,
  showWorkspaceSetup,
  showCreateBrowserTab,
  isMobile,
  createTerminalDisabled,
  importAgentDisabled,
  copyPathDisabled,
  onCreateDraftTab,
  onCreateTerminal,
  onCreateTerminalWithProfile,
  onCreateBrowser,
  onOpenImportSheet,
  onCopyWorkspacePath,
  onCopyBranchName,
  onOpenSetupTab,
  onScriptTerminalStarted,
  onViewScriptTerminal,
  onOpenUrlInBrowserTab,
}: WorkspaceFrameHeaderProps) {
  return (
    <View style={styles.headerTitleContainer}>
      {isLoading ? (
        <View style={styles.headerTitleTextGroup}>
          <View style={styles.headerTitleSkeleton} />
        </View>
      ) : (
        <View style={styles.headerTitleTextGroup}>
          <ScreenTitle testID="workspace-header-title">{title}</ScreenTitle>
          <WorkspaceHeaderProjectRow
            subtitle={subtitle}
            isSubtitleDistinct={isSubtitleDistinct}
            serverId={normalizedServerId}
          />
        </View>
      )}
      <View style={styles.compactHeaderMenuCluster}>
        {isMobile ? (
          <WorkspaceHeaderMenuMobile
            normalizedServerId={normalizedServerId}
            currentBranchName={currentBranchName}
            showWorkspaceSetup={showWorkspaceSetup}
            showCreateBrowserTab={showCreateBrowserTab}
            createTerminalDisabled={createTerminalDisabled}
            importAgentDisabled={importAgentDisabled}
            copyPathDisabled={copyPathDisabled}
            onCreateDraftTab={onCreateDraftTab}
            onCreateTerminal={onCreateTerminal}
            onCreateTerminalWithProfile={onCreateTerminalWithProfile}
            onCreateBrowser={onCreateBrowser}
            onOpenImportSheet={onOpenImportSheet}
            onCopyWorkspacePath={onCopyWorkspacePath}
            onCopyBranchName={onCopyBranchName}
            onOpenSetupTab={onOpenSetupTab}
          />
        ) : (
          <WorkspaceHeaderMenuDesktop
            currentBranchName={currentBranchName}
            showWorkspaceSetup={showWorkspaceSetup}
            importAgentDisabled={importAgentDisabled}
            copyPathDisabled={copyPathDisabled}
            onOpenImportSheet={onOpenImportSheet}
            onCopyWorkspacePath={onCopyWorkspacePath}
            onCopyBranchName={onCopyBranchName}
            onOpenSetupTab={onOpenSetupTab}
          />
        )}
        {isMobile && workspaceScripts.length > 0 ? (
          <WorkspaceScriptsButton
            serverId={normalizedServerId}
            workspaceId={normalizedWorkspaceId}
            scripts={workspaceScripts}
            liveTerminalIds={liveTerminalIds}
            onScriptTerminalStarted={onScriptTerminalStarted}
            onViewTerminal={onViewScriptTerminal}
            onOpenUrlInBrowserTab={onOpenUrlInBrowserTab}
            hideLabels
            presentation="ghost"
          />
        ) : null}
      </View>
    </View>
  );
}

export interface WorkspaceFrameProps {
  isMobile: boolean;
  hasDesktopSplit: boolean;
  showHeader: boolean;
  header: WorkspaceFrameHeaderProps | null;
  launcher: NewTabLauncher;
  mobileContent: ReactNode;
  desktopContent: ReactNode;
  renderMobileTabs: () => ReactNode;
  renderFallbackTabs: () => ReactNode;
}
export function WorkspaceFrameHeader({ right, ...header }: WorkspaceFrameHeaderProps) {
  const headerHeight = resolveWorkspaceFrameHeaderHeight({
    isMobile: header.isMobile,
    desktopTitleBarHeight: DESKTOP_SHELL_METRICS.titleBarHeight,
  });
  const rowStyle = useMemo(
    () => (headerHeight === undefined ? undefined : { height: headerHeight }),
    [headerHeight],
  );
  return (
    <ScreenHeader
      left={
        <>
          <SidebarMenuToggle />
          <WorkspaceHeaderTitleBar {...header} />
        </>
      }
      right={right}
      rowStyle={rowStyle}
    />
  );
}
function WorkspacePanelContent({
  launcher,
  content,
}: {
  launcher: NewTabLauncher;
  content: ReactNode;
}) {
  return (
    <NewTabLauncherProvider value={launcher}>
      <View style={styles.content}>{content}</View>
    </NewTabLauncherProvider>
  );
}

export const WorkspaceFrame = memo(function WorkspaceFrame({
  isMobile,
  hasDesktopSplit,
  showHeader,
  header,
  launcher,
  mobileContent,
  desktopContent,
  renderMobileTabs,
  renderFallbackTabs,
}: WorkspaceFrameProps) {
  const layout = resolveWorkspaceFrameLayout({ isMobile, hasDesktopSplit, showHeader });
  return (
    <View style={styles.centerColumn}>
      {layout.showHeader && header ? <WorkspaceFrameHeader {...header} /> : null}
      {layout.showMobileTabs ? renderMobileTabs() : null}
      {layout.showFallbackTabs ? (
        <NewTabLauncherProvider value={launcher}>{renderFallbackTabs()}</NewTabLauncherProvider>
      ) : null}
      <View style={styles.centerContent}>
        <WorkspacePanelContent
          launcher={launcher}
          content={isMobile ? mobileContent : desktopContent}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create((theme) => ({
  centerColumn: {
    flex: 1,
    minHeight: 0,
  },
  centerContent: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    flex: 1,
    minHeight: 0,
    backgroundColor: theme.colors.surface0,
    position: "relative",
  },
  headerTitleContainer: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: {
      xs: theme.spacing[1],
      md: theme.spacing[2],
    },
    overflow: "hidden",
  },
  headerTitleTextGroup: {
    minWidth: 0,
    overflow: "hidden",
    flexShrink: 1,
    flexGrow: {
      xs: 1,
      md: 0,
    },
    flexDirection: {
      xs: "column",
      md: "row",
    },
    alignItems: {
      xs: "stretch",
      md: "center",
    },
    justifyContent: "flex-start",
    gap: {
      xs: 0,
      md: theme.spacing[2],
    },
  },
  headerProjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1.5],
    minWidth: 0,
    flexShrink: 1,
  },
  headerProjectTitle: {
    color: theme.colors.foregroundMuted,
    fontSize: {
      xs: theme.fontSize.sm,
      md: theme.fontSize.base,
    },
    flexShrink: 1,
    minWidth: 0,
  },
  headerProjectSeparator: {
    color: theme.colors.foregroundExtraMuted,
    fontSize: theme.fontSize.sm,
    flexShrink: 0,
  },
  headerTitleSkeleton: {
    width: 220,
    maxWidth: "100%",
    height: 22,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface3,
    opacity: 0.25,
  },
  compactHeaderMenuCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: {
      xs: 0,
      md: theme.spacing[2],
    },
  },
}));
