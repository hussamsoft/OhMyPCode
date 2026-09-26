import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  Switch,
  Text,
  View,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
} from "react-native";
import { Brain, Settings2, Sparkles, Wrench } from "lucide-react-native";
import { getAgentFeatureIcon, type AgentControlIcon } from "@/agent-controls/icons";
import { AdaptiveModalSheet, type SheetHeader } from "@/components/adaptive-modal-sheet";
import { Combobox, ComboboxItem, type ComboboxOption } from "@/components/ui/combobox";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/segmented-control";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { AgentFeature, AgentToolDefinition } from "@ohmypcode/protocol/agent-types";
import { resolveToolCallIcon, type ToolCallIconComponent } from "@/utils/tool-call-icon";
import { useComposerControlLayout } from "@/composer/agent-controls/layout-context";
import {
  AgentModeControl,
  type AgentModeControlValue,
} from "@/composer/agent-controls/mode-control";
import { toErrorMessage } from "@/utils/error-messages";
import { ControlChip } from "./control-chip";
import {
  applyOmpToolSelection,
  buildOmpSettingsGroups,
  resolveOmpLabelVisibility,
  type OmpMode,
} from "./model";
export { OMP_VIBE_FEATURE_ID, resolveOmpEnabledTools } from "./model";

export type OmpDeckSource = "live" | "draft";

export interface OmpVibeControls {
  enabled: boolean;
  canUse: boolean;
  setEnabled(enabled: boolean): void | Promise<void>;
}

export interface OmpToolControls {
  rows: readonly AgentToolDefinition[];
  canUse: boolean;
  /**
   * Saved tool names the host cannot resolve because tool selection is
   * unavailable. The control reports them as kept instead of showing a tool
   * count, so a saved selection never reads as lost.
   */
  savedSelection?: readonly string[];
  unavailableReason?: string;
  isLoading?: boolean;
  list(): Promise<AgentToolDefinition[]>;
  set(enabledTools: string[]): Promise<AgentToolDefinition[]>;
}

export interface OmpControlDeckProps {
  source: OmpDeckSource;
  modelSelector: ReactNode;
  thinkingOptions: readonly { id: string; label: string }[];
  selectedThinkingId?: string;
  onSelectThinking(id: string): void;
  access: AgentModeControlValue;
  features?: readonly AgentFeature[];
  onSetFeature?: (featureId: string, value: unknown) => void;
  vibe: OmpVibeControls;
  tools: OmpToolControls;
  disabled?: boolean;
  onDropdownClose?: () => void;
}

function getModeIcon(enabled: boolean): AgentControlIcon {
  return enabled ? Sparkles : Brain;
}

interface OmpIconProps {
  icon: AgentControlIcon;
  size: number;
  color: string;
}

function OmpIcon({ icon: Icon, size, color }: OmpIconProps) {
  return <Icon size={size} color={color} />;
}

const ThemedOmpIcon = withUnistyles(OmpIcon, (theme) => ({
  color: theme.colors.foregroundMuted,
}));

function OmpToolIcon({
  icon: Icon,
  size,
  color,
}: {
  icon: ToolCallIconComponent;
  size: number;
  color: string;
}) {
  return <Icon size={size} color={color} />;
}
const ThemedOmpToolIcon = withUnistyles(OmpToolIcon, (theme) => ({
  color: theme.colors.foregroundMuted,
}));

const ThemedLoadingSpinner = withUnistyles(LoadingSpinner, (theme) => ({
  color: theme.colors.foregroundMuted,
}));

interface OmpComboboxRenderProps {
  option: ComboboxOption;
  selected: boolean;
  active: boolean;
  onPress(): void;
}

function renderOmpComboboxOption({ option, selected, active, onPress }: OmpComboboxRenderProps) {
  return (
    <ComboboxItem label={option.label} selected={selected} active={active} onPress={onPress} />
  );
}

function OmpModeControl({ vibe }: { vibe: OmpVibeControls }) {
  const { t } = useTranslation();
  const [pendingMode, setPendingMode] = useState<OmpMode | null>(null);
  const [optimisticMode, setOptimisticMode] = useState<OmpMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const committedMode: OmpMode = vibe.enabled ? "vibe" : "build";
  const visibleMode = optimisticMode ?? committedMode;
  const transitionTo = useCallback(
    async (mode: OmpMode) => {
      if (!vibe.canUse || mode === committedMode || pendingMode) return;
      setPendingMode(mode);
      setOptimisticMode(mode);
      setError(null);
      try {
        await vibe.setEnabled(mode === "vibe");
        setOptimisticMode(null);
      } catch (cause) {
        setOptimisticMode(null);
        setError(toErrorMessage(cause));
      } finally {
        setPendingMode(null);
      }
    },
    [committedMode, pendingMode, vibe],
  );
  const buildLabel = t("agentControls.omp.build");
  const vibeLabel = t("agentControls.omp.vibe");
  const ModeIcon = getModeIcon(visibleMode === "vibe");
  const selectBuild = useCallback(() => void transitionTo("build"), [transitionTo]);
  const selectVibe = useCallback(() => void transitionTo("vibe"), [transitionTo]);
  return (
    <View style={styles.modeGroup}>
      <View
        accessibilityLabel={t("agentControls.omp.selectMode", { value: visibleMode })}
        accessibilityRole="radiogroup"
        style={styles.modeSegments}
      >
        <ControlChip
          icon={ModeIcon}
          label={buildLabel}
          value={buildLabel}
          accessibilityRole="radio"
          accessibilityLabel={t("agentControls.omp.selectMode", { value: buildLabel })}
          selected={visibleMode === "build"}
          accentSelected
          disabled={!vibe.canUse || (pendingMode !== null && pendingMode !== "build")}
          onPress={selectBuild}
          testID="omp-mode-build"
        />
        <ControlChip
          icon={ModeIcon}
          label={vibeLabel}
          value={vibeLabel}
          accessibilityRole="radio"
          accessibilityLabel={t("agentControls.omp.selectMode", { value: vibeLabel })}
          selected={visibleMode === "vibe"}
          accentSelected
          disabled={!vibe.canUse || (pendingMode !== null && pendingMode !== "vibe")}
          onPress={selectVibe}
          testID="omp-mode-vibe"
        />
      </View>
      {pendingMode ? <ThemedLoadingSpinner /> : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function OmpThinkingControl({
  options,
  selectedId,
  onSelect,
  showLabel,
  disabled,
}: {
  options: readonly { id: string; label: string }[];
  selectedId?: string;
  onSelect(id: string): void;
  showLabel: boolean;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const anchorRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === selectedId) ?? options[0];
  const comboboxOptions = useMemo<ComboboxOption[]>(
    () => options.map((option) => ({ id: option.id, label: option.label })),
    [options],
  );
  const value = selected?.label ?? t("agentControls.thinking.unknown");
  const handleOpenChange = useCallback((nextOpen: boolean) => setOpen(nextOpen), []);
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      setOpen(false);
    },
    [onSelect],
  );
  const toggleOpen = useCallback(() => setOpen(!open), [open]);
  if (options.length === 0) return null;
  return (
    <>
      <ControlChip
        ref={anchorRef}
        icon={Brain}
        label={t("agentControls.thinking.title")}
        value={value}
        accessibilityLabel={t("agentControls.thinking.selectWithValue", { value })}
        onPress={toggleOpen}
        showLabel={showLabel}
        selected={open}
        open={open}
        showCaret
        disabled={disabled}
        testID="agent-thinking-selector"
      />
      <Combobox
        options={comboboxOptions}
        value={selected?.id ?? ""}
        onSelect={handleSelect}
        searchable={options.length > 6}
        open={open}
        onOpenChange={handleOpenChange}
        anchorRef={anchorRef}
        desktopPlacement="top-start"
        desktopMinWidth={200}
        renderOption={renderOmpComboboxOption}
      />
    </>
  );
}

function OmpFeatureRow({
  feature,
  onSetFeature,
  launchOnly,
}: {
  feature: AgentFeature;
  onSetFeature?: (featureId: string, value: unknown) => void;
  launchOnly: boolean;
}) {
  const { t } = useTranslation();
  const Icon = getAgentFeatureIcon(feature.icon);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<View>(null);
  const selectFeature = feature.type === "select" ? feature : null;
  const isTriState = selectFeature?.options.some((option) => option.id === "default") === true;
  let value = t("agentControls.omp.off");
  if (selectFeature) {
    value =
      selectFeature.options.find((option) => option.id === selectFeature.value)?.label ??
      selectFeature.value ??
      "";
  } else if (feature.value) {
    value = t("agentControls.omp.on");
  }
  const handleValueChange = useCallback(
    (next: string) => onSetFeature?.(feature.id, next),
    [feature.id, onSetFeature],
  );
  const handleSwitch = useCallback(
    (next: boolean) => onSetFeature?.(feature.id, next),
    [feature.id, onSetFeature],
  );
  const selectOptions = useMemo<ComboboxOption[]>(
    () => selectFeature?.options.map((option) => ({ id: option.id, label: option.label })) ?? [],
    [selectFeature],
  );
  const featureOptions = useMemo<SegmentedControlOption<string>[]>(
    () => [
      { value: "default", label: t("agentControls.omp.default") },
      { value: "on", label: t("agentControls.omp.on") },
      { value: "off", label: t("agentControls.omp.off") },
    ],
    [t],
  );
  const switchState = useMemo(() => ({ checked: feature.value === true }), [feature.value]);
  const toggleOpen = useCallback(() => setOpen(!open), [open]);
  const handleSelect = useCallback(
    (id: string) => {
      handleValueChange(id);
      setOpen(false);
    },
    [handleValueChange],
  );
  let control: ReactNode;
  if (feature.type === "toggle") {
    control = (
      <Switch
        accessibilityLabel={feature.label}
        accessibilityState={switchState}
        value={feature.value === true}
        onValueChange={handleSwitch}
      />
    );
  } else if (isTriState && selectFeature) {
    control = (
      <SegmentedControl
        size="sm"
        value={selectFeature.value ?? "default"}
        onValueChange={handleValueChange}
        options={featureOptions}
      />
    );
  } else {
    control = (
      <>
        <ControlChip
          ref={anchorRef}
          icon={Icon}
          label={feature.label}
          value={value}
          accessibilityLabel={t("agentControls.omp.selectFeature", { label: feature.label, value })}
          selected={open}
          open={open}
          showCaret
          onPress={toggleOpen}
          testID={`omp-feature-${feature.id}`}
        />
        <Combobox
          options={selectOptions}
          value={selectFeature?.value ?? ""}
          onSelect={handleSelect}
          open={open}
          onOpenChange={setOpen}
          anchorRef={anchorRef}
          desktopPlacement="top-start"
          renderOption={renderOmpComboboxOption}
        />
      </>
    );
  }

  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIdentity}>
        <ThemedOmpIcon icon={Icon} size={16} />
        <View style={styles.featureText}>
          <Text style={styles.featureLabel}>{feature.label}</Text>
          {feature.description ? (
            <Text style={styles.featureDescription}>{feature.description}</Text>
          ) : null}
        </View>
      </View>
      {control}
      {launchOnly ? (
        <Text style={styles.launchOnly}>{t("agentControls.omp.startsNewSession")}</Text>
      ) : null}
    </View>
  );
}
function OmpSettingsSheet({
  visible,
  onClose,
  features,
  onSetFeature,
}: {
  visible: boolean;
  onClose(): void;
  features?: readonly AgentFeature[];
  onSetFeature?: (featureId: string, value: unknown) => void;
}) {
  const { t } = useTranslation();
  const groups = useMemo(() => buildOmpSettingsGroups(features), [features]);
  const header = useMemo<SheetHeader>(() => ({ title: t("agentControls.omp.settings") }), [t]);
  return (
    <AdaptiveModalSheet
      header={header}
      visible={visible}
      onClose={onClose}
      testID="omp-settings-sheet"
    >
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>{t("agentControls.omp.behavior")}</Text>
        {groups.behavior.map((feature) => (
          <OmpFeatureRow
            key={feature.id}
            feature={feature}
            onSetFeature={onSetFeature}
            launchOnly={false}
          />
        ))}
      </View>
      {groups.startup.length > 0 ? (
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{t("agentControls.omp.startup")}</Text>
          {groups.startup.map((feature) => (
            <OmpFeatureRow
              key={feature.id}
              feature={feature}
              onSetFeature={onSetFeature}
              launchOnly
            />
          ))}
        </View>
      ) : null}
    </AdaptiveModalSheet>
  );
}

function OmpToolRow({
  tool,
  disabled,
  onToggle,
}: {
  tool: AgentToolDefinition;
  disabled: boolean;
  onToggle(name: string, enabled: boolean): void;
}) {
  const { t } = useTranslation();
  const Icon = resolveToolCallIcon(tool.name);
  const handlePress = useCallback(() => {
    if (!disabled && !tool.required) onToggle(tool.name, !tool.enabled);
  }, [disabled, onToggle, tool.enabled, tool.name, tool.required]);
  const accessibilityState = useMemo(
    () => ({ checked: tool.enabled, disabled: disabled || tool.required }),
    [disabled, tool.enabled, tool.required],
  );
  const style = useCallback(
    ({ focused, hovered, pressed }: PressableStateCallbackType & { focused?: boolean }) => [
      styles.toolRow,
      hovered && styles.toolRowHovered,
      pressed && styles.toolRowPressed,
      focused && styles.focusedRow,
      disabled && styles.disabled,
    ],
    [disabled],
  );
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={t("agentControls.omp.toolAccessibleName", { label: tool.label })}
      accessibilityState={accessibilityState}
      aria-checked={tool.enabled}
      disabled={disabled || tool.required}
      onPress={handlePress}
      style={style}
    >
      <ThemedOmpToolIcon icon={Icon} size={18} />
      <View style={styles.toolText}>
        <View style={styles.toolTitleRow}>
          <Text style={styles.toolLabel}>{tool.label}</Text>
          <Text style={styles.sourceBadge}>{t(`agentControls.omp.toolSource.${tool.source}`)}</Text>
          {tool.required ? (
            <Text style={styles.requiredBadge}>{t("agentControls.omp.required")}</Text>
          ) : null}
        </View>
        <Text style={styles.toolDescription}>{tool.description}</Text>
      </View>
      <Switch pointerEvents="none" value={tool.enabled} />
    </Pressable>
  );
}

function ToolRows({
  rows,
  pending,
  onToggle,
}: {
  rows: AgentToolDefinition[];
  pending: boolean;
  onToggle(name: string, enabled: boolean): void;
}) {
  return (
    <>
      {rows.map((tool) => (
        <OmpToolRow key={tool.name} tool={tool} disabled={pending} onToggle={onToggle} />
      ))}
    </>
  );
}

function OmpToolsSheet({
  visible,
  onClose,
  tools,
}: {
  visible: boolean;
  onClose(): void;
  tools: OmpToolControls;
}) {
  const { t } = useTranslation();
  const listTools = tools.list;
  const setTools = tools.set;
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AgentToolDefinition[]>([...tools.rows]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const header = useMemo<SheetHeader>(
    () => ({
      title: t("agentControls.omp.tools"),
      search: {
        onChange: setQuery,
        placeholder: t("agentControls.omp.searchTools"),
        testID: "omp-tools-search",
      },
    }),
    [t],
  );
  const loadTools = useCallback(async () => {
    setError(null);
    try {
      setRows(await listTools());
    } catch (cause) {
      setError(toErrorMessage(cause));
    }
  }, [listTools]);
  useEffect(() => {
    if (!visible) {
      setRows([...tools.rows]);
      setError(null);
      setQuery("");
    }
  }, [tools.rows, visible]);
  useEffect(() => {
    if (visible) void loadTools();
  }, [loadTools, visible]);
  const handleToggle = useCallback(
    async (name: string, enabled: boolean) => {
      if (pending) return;
      setPending(true);
      setError(null);
      const result = await applyOmpToolSelection({ rows, name, enabled, set: setTools });
      if (result.ok) setRows(result.rows);
      else setError(result.error);
      setPending(false);
    },
    [pending, rows, setTools],
  );
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((tool) =>
      `${tool.label} ${tool.description} ${tool.source}`.toLowerCase().includes(normalized),
    );
  }, [query, rows]);
  const enabledToolCount = rows.filter((tool) => tool.enabled).length;
  const toolCountLabel = t("agentControls.omp.toolCount", {
    enabled: enabledToolCount,
    total: rows.length,
  });
  return (
    <AdaptiveModalSheet
      header={header}
      visible={visible}
      onClose={onClose}
      testID="omp-tools-sheet"
    >
      <View style={styles.toolsStatus}>
        <Text accessibilityLiveRegion="polite" role="status" aria-atomic style={styles.toolCount}>
          {toolCountLabel}
        </Text>
        {pending ? <ThemedLoadingSpinner /> : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.sheetError}>
          {error}
        </Text>
      ) : null}
      {filteredRows.length === 0 ? (
        <Text style={styles.emptyTools}>{t("agentControls.omp.noTools")}</Text>
      ) : null}
      <ToolRows rows={filteredRows} pending={pending} onToggle={handleToggle} />
      {tools.isLoading ? (
        <Text style={styles.emptyTools}>{t("agentControls.omp.loadingTools")}</Text>
      ) : null}
    </AdaptiveModalSheet>
  );
}

export function OmpControlDeck({
  modelSelector,
  thinkingOptions,
  selectedThinkingId,
  onSelectThinking,
  access,
  features,
  onSetFeature,
  vibe,
  tools,
  disabled = false,
  onDropdownClose,
}: OmpControlDeckProps) {
  const { t } = useTranslation();
  const { presentation } = useComposerControlLayout();
  const [availableWidth, setAvailableWidth] = useState(0);
  const [activeSheet, setActiveSheet] = useState<"settings" | "tools" | null>(null);
  const visibility = resolveOmpLabelVisibility(availableWidth);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setAvailableWidth(event.nativeEvent.layout.width);
  }, []);
  const openSheet = useCallback((sheet: "settings" | "tools") => setActiveSheet(sheet), []);
  const openTools = useCallback(() => openSheet("tools"), [openSheet]);
  const openSettings = useCallback(() => openSheet("settings"), [openSheet]);
  const closeSheet = useCallback(() => {
    setActiveSheet(null);
    onDropdownClose?.();
  }, [onDropdownClose]);
  const toolsUnavailable = !tools.canUse;
  const keptToolCount = toolsUnavailable ? (tools.savedSelection?.length ?? 0) : 0;
  const enabledToolCount = tools.rows.filter((tool) => tool.enabled).length;
  const toolCountLabel = t("agentControls.omp.toolCount", {
    enabled: enabledToolCount,
    total: tools.rows.length,
  });
  // A disabled control must not read as a live one: it says why it is disabled
  // and, when a selection is already stored, that the selection is kept.
  const keptToolsLabel =
    keptToolCount > 0
      ? t("agentControls.omp.toolsUnavailableSaved", { count: keptToolCount })
      : undefined;
  const defaultUnavailableLabel =
    tools.unavailableReason ?? t("agentControls.omp.toolsUnavailable");
  let toolsValueLabel = toolCountLabel;
  if (toolsUnavailable) {
    toolsValueLabel = keptToolsLabel
      ? `${defaultUnavailableLabel} (${keptToolsLabel})`
      : defaultUnavailableLabel;
  }
  const toolsAccessibilityLabel = toolsUnavailable
    ? [t("agentControls.omp.openTools"), defaultUnavailableLabel, keptToolsLabel]
        .filter((part) => Boolean(part))
        .join(". ")
    : `${t("agentControls.omp.openTools")}. ${toolCountLabel}`;
  return (
    <View style={styles.deck} onLayout={onLayout} testID="omp-control-deck">
      <OmpModeControl vibe={vibe} />
      <View style={styles.modelSlot}>{modelSelector}</View>
      <OmpThinkingControl
        options={thinkingOptions}
        selectedId={selectedThinkingId}
        onSelect={onSelectThinking}
        showLabel={visibility.thinking}
        disabled={disabled}
      />
      <View style={styles.accessSlot}>
        <AgentModeControl {...access} surface="toolbar" onClose={onDropdownClose} />
      </View>
      <ControlChip
        icon={Wrench}
        label={t("agentControls.omp.tools")}
        value={toolsValueLabel}
        accessibilityLabel={toolsAccessibilityLabel}
        onPress={openTools}
        showLabel={visibility.tools}
        selected={!toolsUnavailable && activeSheet === "tools"}
        open={!toolsUnavailable && activeSheet === "tools"}
        showCaret={presentation.showCarets && !toolsUnavailable}
        disabled={disabled || toolsUnavailable}
        testID="omp-tools-control"
      />
      <ControlChip
        icon={Settings2}
        label={t("agentControls.omp.settings")}
        value={t("agentControls.omp.settings")}
        accessibilityLabel={t("agentControls.omp.openSettings")}
        onPress={openSettings}
        showLabel={visibility.settings}
        selected={activeSheet === "settings"}
        open={activeSheet === "settings"}
        disabled={disabled}
        testID="omp-settings-control"
      />
      <OmpSettingsSheet
        visible={activeSheet === "settings"}
        onClose={closeSheet}
        features={features}
        onSetFeature={onSetFeature}
      />
      <OmpToolsSheet visible={activeSheet === "tools"} onClose={closeSheet} tools={tools} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  deck: {
    minWidth: 0,
    flex: 1,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  modeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    flexShrink: 0,
  },
  modeSegments: {
    width: 200,
    flexDirection: "row",
    gap: theme.spacing[1],
  },
  modelSlot: {
    minWidth: 0,
    flexShrink: 1,
  },
  accessSlot: {
    minWidth: 0,
    flexShrink: 1,
  },
  inlineError: {
    maxWidth: 160,
    color: theme.colors.statusDanger,
    fontSize: theme.fontSize.sm,
  },
  visuallyHidden: {
    width: 0,
    height: 0,
    overflow: "hidden",
  },
  settingsSection: {
    gap: theme.spacing[2],
  },
  sectionTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  featureRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  featureIdentity: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  featureText: {
    minWidth: 0,
    flex: 1,
    gap: theme.spacing[1],
  },
  featureLabel: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
  },
  featureDescription: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  launchOnly: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  toolsStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toolCount: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  toolRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
  },
  toolRowHovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  toolRowPressed: {
    backgroundColor: theme.colors.surface2,
  },
  focusedRow: {
    borderWidth: 2,
    borderColor: theme.colors.ring,
  },
  toolText: {
    minWidth: 0,
    flex: 1,
    gap: theme.spacing[1],
  },
  toolTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  toolLabel: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
  },
  toolDescription: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  sourceBadge: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
    backgroundColor: theme.colors.surface3,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    overflow: "hidden",
  },
  requiredBadge: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  sheetError: {
    color: theme.colors.statusDanger,
    fontSize: theme.fontSize.sm,
  },
  emptyTools: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.base,
    paddingVertical: theme.spacing[4],
  },
  disabled: {
    opacity: theme.opacity[50],
  },
  reloadTools: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  reloadToolsText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.base,
  },
}));
