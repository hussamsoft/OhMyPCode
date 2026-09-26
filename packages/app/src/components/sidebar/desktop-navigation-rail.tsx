import { router, usePathname } from "expo-router";
import {
  BarChart3,
  CalendarClock,
  History,
  Layers,
  PanelLeft,
  Plus,
  Search,
  Server,
  Settings,
} from "lucide-react-native";
import { memo, useCallback, useMemo, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View, type PressableStateCallbackType } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shortcut } from "@/components/ui/shortcut";
import { DESKTOP_NAVIGATION_RAIL_WIDTH } from "@/components/desktop-sidebar-layout";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { usePanelStore } from "@/stores/panel-store";
import { useKeyboardShortcutsStore } from "@/stores/keyboard-shortcuts-store";
import { useSidebarViewStore } from "@/stores/sidebar-view-store";
import { useHosts } from "@/runtime/host-runtime";
import { isWeb } from "@/constants/platform";
import { builtinSidebarNavLabelKey, builtinSidebarNavShortcutAction } from "@/sidebar-nav/model";
import {
  buildNewWorkspaceRoute,
  buildSchedulesRoute,
  buildSessionsRoute,
  buildSettingsRoute,
  buildUsageRoute,
} from "@/utils/host-routes";
import type { ShortcutKey } from "@/utils/format-shortcut";
import { ICON_SIZE, type Theme } from "@/styles/theme";
import { useActiveWorkspaceSelection } from "@/stores/navigation-active-workspace-store";
import { useWorkspace } from "@/stores/session-store-hooks";
import { useOpenAddProject } from "@/hooks/use-open-add-project";
import { useImportSession } from "@/hooks/use-import-session";
import { openHostOverview } from "@/navigation/settings-navigation";
import { canCreateWorktreeForProjectKind } from "@/projects/host-projects";
import { useHostFeature } from "@/runtime/host-features";

const foregroundColorMapping = (theme: Theme) => ({ color: theme.colors.foreground });
const foregroundMutedColorMapping = (theme: Theme) => ({
  color: theme.colors.foregroundMuted,
});

const ThemedPlus = withUnistyles(Plus);
const ThemedSearch = withUnistyles(Search);
const ThemedHistory = withUnistyles(History);
const ThemedBarChart3 = withUnistyles(BarChart3);
const ThemedCalendarClock = withUnistyles(CalendarClock);
const ThemedSettings = withUnistyles(Settings);
const ThemedServer = withUnistyles(Server);
const ThemedPanelLeft = withUnistyles(PanelLeft);
const ThemedLayers = withUnistyles(Layers);

const PlusAccentGlyph = function PlusAccentGlyph() {
  return <ThemedPlus size={ICON_SIZE.md} strokeWidth={2.4} uniProps={foregroundColorMapping} />;
};
const PlusMutedGlyph = function PlusMutedGlyph() {
  return (
    <ThemedPlus size={ICON_SIZE.md} strokeWidth={2.4} uniProps={foregroundMutedColorMapping} />
  );
};
const SearchGlyph = function SearchGlyph() {
  return <ThemedSearch size={ICON_SIZE.md} uniProps={foregroundMutedColorMapping} />;
};
const HistoryGlyph = function HistoryGlyph() {
  return <ThemedHistory size={ICON_SIZE.md} uniProps={foregroundMutedColorMapping} />;
};
const SchedulesGlyph = function SchedulesGlyph() {
  return <ThemedCalendarClock size={ICON_SIZE.md} uniProps={foregroundMutedColorMapping} />;
};
const UsageGlyph = function UsageGlyph() {
  return <ThemedBarChart3 size={ICON_SIZE.md} uniProps={foregroundMutedColorMapping} />;
};
const ServerGlyph = function ServerGlyph() {
  return <ThemedServer size={ICON_SIZE.md} uniProps={foregroundMutedColorMapping} />;
};
const PanelLeftGlyph = function PanelLeftGlyph() {
  return <ThemedPanelLeft size={ICON_SIZE.md} uniProps={foregroundMutedColorMapping} />;
};
const LayersGlyph = function LayersGlyph() {
  return <ThemedLayers size={ICON_SIZE.md} uniProps={foregroundMutedColorMapping} />;
};
const SettingsGlyph = function SettingsGlyph() {
  return <ThemedSettings size={ICON_SIZE.md} uniProps={foregroundMutedColorMapping} />;
};

interface RailButtonProps {
  label: string;
  glyph: ComponentType;
  onPress: () => void;
  testID: string;
  shortcutKeys: ShortcutKey[][] | null;
  isActive: boolean;
  disabled?: boolean;
}

const RailButton = memo(function RailButton({
  label,
  glyph: Glyph,
  onPress,
  testID,
  shortcutKeys,
  isActive,
  disabled = false,
}: RailButtonProps) {
  const buttonStyle = useCallback(
    function styleCallback({ pressed }: PressableStateCallbackType & { pressed?: boolean }) {
      return [
        styles.button,
        isActive && styles.buttonActive,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ];
    },
    [isActive, disabled],
  );
  const accessibilityState = useMemo(
    () => ({ selected: isActive, disabled }),
    [isActive, disabled],
  );
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Pressable
          onPress={onPress}
          style={buttonStyle}
          testID={testID}
          nativeID={testID}
          accessible
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={accessibilityState}
          hitSlop={4}
          disabled={disabled}
        >
          <Glyph />
        </Pressable>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" offset={6}>
        <View style={styles.tooltipRow}>
          <Text style={styles.tooltipText}>{label}</Text>
          {shortcutKeys ? <Shortcut chord={shortcutKeys} /> : null}
        </View>
      </TooltipContent>
    </Tooltip>
  );
});

function RailDivider() {
  return <View testID="desktop-navigation-rail-divider" style={styles.divider} />;
}

/* eslint-disable @typescript-eslint/no-require-imports */
// Brand-asset resolution follows the same require pattern as use-favicon-status.ts: Metro
// resolves the asset at bundle time, the web build serves the file from /assets/images/, and
// native builds ship the bundled PNG. The light variant is the official OMP mark (white Pi +
// orange connector on the dark theme); the dark variant is kept for future light-theme use.
const RAIL_BRAND_MARK_LIGHT = require("../../../assets/images/favicon-light.png");
/* eslint-enable @typescript-eslint/no-require-imports */

const RAIL_BRAND_LABEL = "OhMyPCode · Oh My Pi";

/**
 * Static brand anchor at the top of the rail. Renders the official OMP mark as
 * a non-interactive image with an accessible label so screen readers announce
 * the brand identity. No click handler, no tooltip, no navigation — the rail
 * already provides New workspace / hosts / settings for navigation, and a
 * project-creation flow would be the wrong default for a brand mark.
 */
const RailBrandMark = memo(function RailBrandMark() {
  return (
    <View
      testID="rail-brand-mark"
      nativeID="rail-brand-mark"
      style={styles.brandMark}
      accessible
      accessibilityRole="image"
      accessibilityLabel={RAIL_BRAND_LABEL}
    >
      <Image
        source={RAIL_BRAND_MARK_LIGHT}
        style={styles.brandMarkImage}
        resizeMode="contain"
        accessible={false}
      />
    </View>
  );
});

/**
 * Top-level rail for the desktop shell. Renders fixed-width host → project → workspace/thread
 * navigation with utilities bottom-pinned. The wider context column that lists
 * projects/workspaces is owned by `LeftSidebar`; this rail is the always-mounted spine.
 */
export const DesktopNavigationRail = memo(function DesktopNavigationRail() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const hosts = useHosts();
  const toggleAgentList = usePanelStore((state) => state.toggleDesktopAgentList);
  const isDesktopAgentListOpen = usePanelStore((state) => state.desktop.agentListOpen);
  const setCommandCenterOpen = useKeyboardShortcutsStore((state) => state.setCommandCenterOpen);
  const groupMode = useSidebarViewStore((state) => state.groupMode);
  const setGroupMode = useSidebarViewStore((state) => state.setGroupMode);
  const activeWorkspaceSelection = useActiveWorkspaceSelection();
  const activeWorkspaceServerId = activeWorkspaceSelection?.serverId ?? null;
  const activeWorkspaceId = activeWorkspaceSelection?.workspaceId ?? null;
  const activeWorkspace = useWorkspace(activeWorkspaceServerId, activeWorkspaceId);
  const supportsWorkspaceMultiplicity = useHostFeature(
    activeWorkspaceServerId,
    "workspaceMultiplicity",
  );
  const canUseActiveWorkspaceContext = Boolean(
    activeWorkspace &&
    (supportsWorkspaceMultiplicity || canCreateWorktreeForProjectKind(activeWorkspace.projectKind)),
  );
  const openAddProject = useOpenAddProject();
  const { open: openImportSession, sheet: importSessionSheet } = useImportSession();

  const newWorkspaceShortcutKeys = useShortcutKeys(
    builtinSidebarNavShortcutAction("new-workspace"),
  );
  const searchShortcutKeys = useShortcutKeys(builtinSidebarNavShortcutAction("search"));
  const settingsShortcutKeys = useShortcutKeys("toggle-settings");
  const schedulesShortcutKeys = useShortcutKeys(builtinSidebarNavShortcutAction("schedules"));
  const newAgentShortcutKeys = useShortcutKeys("new-agent");
  const toggleLeftSidebarKeys = useShortcutKeys("toggle-left-sidebar");

  const pathnameIncludes = useCallback((needle: string) => pathname.includes(needle), [pathname]);

  const handleOpenSearch = useCallback(() => {
    setCommandCenterOpen(true);
  }, [setCommandCenterOpen]);

  const handleOpenNewWorkspace = useCallback(() => {
    router.push(
      activeWorkspaceServerId
        ? buildNewWorkspaceRoute(
            activeWorkspace && canUseActiveWorkspaceContext
              ? {
                  serverId: activeWorkspaceServerId,
                  sourceDirectory: activeWorkspace.projectRootPath,
                  projectId: activeWorkspace.projectId,
                }
              : { serverId: activeWorkspaceServerId },
          )
        : buildNewWorkspaceRoute(),
    );
  }, [activeWorkspace, activeWorkspaceServerId, canUseActiveWorkspaceContext]);

  const handleOpenNewProject = useCallback(() => {
    void openAddProject();
  }, [openAddProject]);

  const handleOpenSessions = useCallback(() => {
    router.push(buildSessionsRoute());
  }, []);

  const handleOpenSchedules = useCallback(() => {
    router.push(buildSchedulesRoute());
  }, []);

  const handleOpenSettings = useCallback(() => {
    router.push(buildSettingsRoute());
  }, []);

  const handleOpenUsage = useCallback(() => {
    router.push(buildUsageRoute());
  }, []);

  const handleToggleAgentList = useCallback(() => {
    toggleAgentList();
  }, [toggleAgentList]);

  const handleToggleGrouping = useCallback(() => {
    setGroupMode(groupMode === "project" ? "status" : "project");
  }, [groupMode, setGroupMode]);

  const handleImportSession = useCallback(() => {
    void openImportSession();
  }, [openImportSession]);

  const handleOpenHostSettings = useCallback(() => {
    if (activeWorkspaceServerId) {
      openHostOverview(activeWorkspaceServerId);
      return;
    }
    const firstHost = hosts[0];
    if (firstHost) {
      openHostOverview(firstHost.serverId);
    }
  }, [activeWorkspaceServerId, hosts]);

  const showUsage = isWeb;
  const hasHosts = hosts.length > 0;

  return (
    <View
      testID="desktop-navigation-rail"
      style={styles.container}
      accessibilityLabel={t("sidebar.sections.workspaces")}
    >
      <RailBrandMark />
      <View style={styles.section}>
        <RailButton
          testID="rail-new-workspace"
          label={t(builtinSidebarNavLabelKey("new-workspace"))}
          shortcutKeys={newWorkspaceShortcutKeys}
          isActive={pathnameIncludes("/new")}
          onPress={handleOpenNewWorkspace}
          glyph={PlusAccentGlyph}
        />
        <RailButton
          testID="rail-new-project"
          label={t("sidebar.actions.addProject")}
          shortcutKeys={newAgentShortcutKeys}
          isActive={pathnameIncludes("/open-project")}
          onPress={handleOpenNewProject}
          glyph={PlusMutedGlyph}
        />
        <RailButton
          testID="rail-search"
          label={t(builtinSidebarNavLabelKey("search"))}
          shortcutKeys={searchShortcutKeys}
          isActive={false}
          onPress={handleOpenSearch}
          glyph={SearchGlyph}
        />
      </View>

      <RailDivider />

      <View style={styles.section}>
        <RailButton
          testID="rail-sessions"
          label={t(builtinSidebarNavLabelKey("history"))}
          shortcutKeys={null}
          isActive={pathnameIncludes("/sessions")}
          onPress={handleOpenSessions}
          glyph={HistoryGlyph}
        />
        <RailButton
          testID="rail-schedules"
          label={t(builtinSidebarNavLabelKey("schedules"))}
          shortcutKeys={schedulesShortcutKeys}
          isActive={pathnameIncludes("/schedules")}
          onPress={handleOpenSchedules}
          glyph={SchedulesGlyph}
        />
        {showUsage ? (
          <RailButton
            testID="rail-usage"
            label={t("usage.title")}
            shortcutKeys={null}
            isActive={pathnameIncludes("/usage")}
            onPress={handleOpenUsage}
            glyph={UsageGlyph}
          />
        ) : null}
        <RailButton
          testID="rail-hosts"
          label={t("sidebar.actions.hosts")}
          shortcutKeys={null}
          isActive={pathnameIncludes("/settings/hosts")}
          onPress={handleOpenHostSettings}
          disabled={!hasHosts}
          glyph={ServerGlyph}
        />
        <RailButton
          testID="rail-import-session"
          label={t("importSession.title")}
          shortcutKeys={null}
          isActive={false}
          onPress={handleImportSession}
          glyph={HistoryGlyph}
        />
      </View>

      <View style={styles.spacer} />

      <View style={styles.section}>
        <RailButton
          testID="rail-toggle-context-column"
          label={t("settings.shortcuts.help.toggleLeftSidebar")}
          shortcutKeys={toggleLeftSidebarKeys}
          isActive={isDesktopAgentListOpen}
          onPress={handleToggleAgentList}
          glyph={PanelLeftGlyph}
        />
        <RailButton
          testID="rail-grouping"
          label={
            groupMode === "project"
              ? t("shell.commandCenter.groupByStatus")
              : t("shell.commandCenter.groupByProject")
          }
          shortcutKeys={null}
          isActive={false}
          onPress={handleToggleGrouping}
          glyph={LayersGlyph}
        />
        <RailButton
          testID="rail-settings"
          label={t("sidebar.actions.settings")}
          shortcutKeys={settingsShortcutKeys}
          isActive={pathnameIncludes("/settings")}
          onPress={handleOpenSettings}
          glyph={SettingsGlyph}
        />
      </View>

      {importSessionSheet}
    </View>
  );
});

const RAIL_BUTTON_SIZE = 40;
const RAIL_BUTTON_HIT_SLOP = 4;
const RAIL_BUTTON_HIT_TARGET = RAIL_BUTTON_SIZE + RAIL_BUTTON_HIT_SLOP * 2;

const styles = StyleSheet.create((theme) => ({
  container: {
    width: DESKTOP_NAVIGATION_RAIL_WIDTH,
    height: "100%" as const,
    // OMP shell is square and disciplined: zero corner radius, hairline border.
    // The active connector comes from the accent stripe on the active tab, not
    // from rounded chrome on the rail.
    backgroundColor: theme.colors.surfaceSidebar,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    borderRadius: 0,
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "column",
  },
  section: {
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing[1],
    width: "100%" as const,
  },
  brandMark: {
    width: RAIL_BUTTON_SIZE,
    height: RAIL_BUTTON_SIZE,
    minWidth: 24,
    minHeight: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    marginBottom: theme.spacing[1],
  },
  brandMarkImage: {
    width: 32,
    height: 24,
  },
  spacer: {
    flex: 1,
    minHeight: theme.spacing[2],
  },
  divider: {
    width: RAIL_BUTTON_HIT_TARGET,
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing[2],
  },
  button: {
    width: RAIL_BUTTON_SIZE,
    height: RAIL_BUTTON_SIZE,
    minWidth: 24,
    minHeight: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
  },
  buttonActive: {
    // OMP active connector: left-edge accent stripe rather than a generic
    // rounded-card fill. Keeps the rail visually technical and identifies the
    // selected surface unambiguously even in dense icon stacks.
    backgroundColor: "transparent",
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.accent,
  },
  buttonPressed: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  buttonDisabled: {
    opacity: theme.opacity[50],
  },
  tooltipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  tooltipText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.popoverForeground,
  },
}));

export const DESKTOP_RAIL_BUTTON_HIT_TARGET = RAIL_BUTTON_HIT_TARGET;
