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
import { Brain, Settings2, Shield, Sparkles, Wrench } from "lucide-react-native";
import { getAgentFeatureIcon, type AgentControlIcon } from "@/agent-controls/icons";
import { AdaptiveModalSheet, type SheetHeader } from "@/components/adaptive-modal-sheet";
import { Combobox, ComboboxItem, type ComboboxOption } from "@/components/ui/combobox";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/segmented-control";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { AgentFeature, AgentToolDefinition } from "@ohmypcode/protocol/agent-types";
import { resolveToolCallIcon, type ToolCallIconComponent } from "@/utils/tool-call-icon";
import { useComposerControlLayout } from "@/composer/agent-controls/layout-context";
import { type AgentModeControlValue } from "@/composer/agent-controls/mode-control";
import { toErrorMessage } from "@/utils/error-messages";
import { ControlChip } from "./control-chip";
import { OmpSettingsForm } from "@/omp-settings/omp-settings-form";
import {
  applyOmpToolSelection,
  buildOmpSettingsGroups,
  groupOmpToolsByServer,
  isOmpMcpServerGroupRequired,
  resolveOmpMcpServerGroupState,
  resolveMcpServerName,
  resolveOmpLabelVisibility,
  OMP_APPROVAL_MODE_OPTIONS,
  OMP_APPROVAL_MODE_PATH,
  resolveOmpApprovalModeId,
  type OmpApprovalMode,
  type OmpMcpServerGroup,
  type OmpMode,
} from "./model";
import {
  useOmpModeSetter,
  useOmpModes,
  useOmpSettingSetter,
  useOmpSettings,
} from "./use-omp-rpc";
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
  serverId?: string | null;
  agentId?: string | null;
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

interface OmpModeSegmentDescriptor {
  id: OmpMode;
  labelKey: string;
  testID: string;
}

const OMP_MODE_SEGMENTS: readonly OmpModeSegmentDescriptor[] = [
  { id: "build", labelKey: "agentControls.omp.build", testID: "omp-mode-build" },
  { id: "plan", labelKey: "agentControls.omp.plan", testID: "omp-mode-plan" },
  { id: "vibe", labelKey: "agentControls.omp.vibe", testID: "omp-mode-vibe" },
  { id: "goal", labelKey: "agentControls.omp.goal", testID: "omp-mode-goal" },
  { id: "loop", labelKey: "agentControls.omp.loop", testID: "omp-mode-loop" },
];

function resolveCommittedMode(input: {
  planEnabled: boolean;
  goalEnabled: boolean;
  loopEnabled: boolean;
  vibeEnabled: boolean;
}): OmpMode {
  if (input.planEnabled) return "plan";
  if (input.goalEnabled) return "goal";
  if (input.loopEnabled) return "loop";
  if (input.vibeEnabled) return "vibe";
  return "build";
}

function OmpModeSegmentChip({
  segment,
  label,
  selected,
  pending,
  disabledReason,
  onPress,
}: {
  segment: OmpModeSegmentDescriptor;
  label: string;
  selected: boolean;
  pending: boolean;
  disabledReason?: string;
  onPress(): void;
}) {
  const { t } = useTranslation();
  const Icon = getModeIcon(segment.id === "vibe");
  const baseAccessibilityLabel = t("agentControls.omp.selectMode", { value: label });
  const accessibilityLabel = disabledReason
    ? `${baseAccessibilityLabel}. ${disabledReason}`
    : baseAccessibilityLabel;
  const isDisabled = Boolean(disabledReason);
  return (
    <View style={styles.modeSegmentSlot}>
      <ControlChip
        icon={Icon}
        label={label}
        value={label}
        accessibilityRole="radio"
        accessibilityLabel={accessibilityLabel}
        selected={selected}
        accentSelected
        disabled={isDisabled}
        onPress={onPress}
        testID={segment.testID}
      />
      {pending ? <ThemedLoadingSpinner /> : null}
    </View>
  );
}

function OmpModeControl({
  vibe,
  serverId,
  agentId,
}: {
  vibe: OmpVibeControls;
  serverId?: string | null;
  agentId?: string | null;
}) {
  const { t } = useTranslation();
  const modesQuery = useOmpModes(serverId ?? null, agentId ?? null);
  const modeSetter = useOmpModeSetter(serverId ?? null, agentId ?? null);
  const { modes, isLoading: modesLoading, error: modesError } = modesQuery;
  const [pendingMode, setPendingMode] = useState<OmpMode | null>(null);
  const [optimisticMode, setOptimisticMode] = useState<OmpMode | null>(null);
  const [segmentError, setSegmentError] = useState<{ mode: OmpMode; message: string } | null>(
    null,
  );
  const committedMode: OmpMode = optimisticMode
    ? optimisticMode
    : modes
      ? resolveCommittedMode({
          planEnabled: modes.planModeEnabled,
          goalEnabled: modes.goalModeEnabled,
          loopEnabled: modes.loopModeEnabled,
          vibeEnabled: vibe.enabled,
        })
      : (vibe.enabled ? "vibe" : "build");
  const canEnterAll = modes?.canEnter ?? true;
  const globalBlockedReason = modes?.blockedReason;
  const transitionTo = useCallback(
    async (mode: OmpMode) => {
      if (pendingMode) return;
      if (mode === committedMode) return;
      setPendingMode(mode);
      setOptimisticMode(mode);
      setSegmentError(null);
      try {
        if (mode === "vibe") {
          if (!vibe.canUse) {
            throw new Error(t("agentControls.omp.modeUnavailable"));
          }
          await vibe.setEnabled(true);
        } else if (mode === "build") {
          // Build is the implicit "no plan/goal/loop/vibe" baseline. Disable
          // any active plan/goal/loop and turn the vibe flag off. If only
          // vibe is on, exit it through the existing path.
          if (vibe.enabled) {
            if (!vibe.canUse) {
              throw new Error(t("agentControls.omp.modeUnavailable"));
            }
            await vibe.setEnabled(false);
          }
          if (modes?.planModeEnabled) {
            await modeSetter.setMode({ mode: "plan" });
          } else if (modes?.goalModeEnabled) {
            await modeSetter.setMode({ mode: "goal" });
          } else if (modes?.loopModeEnabled) {
            await modeSetter.setMode({ mode: "loop" });
          }
        } else {
          await modeSetter.setMode({ mode });
          if (vibe.enabled) {
            await vibe.setEnabled(false);
          }
        }
        setOptimisticMode(null);
      } catch (cause) {
        setOptimisticMode(null);
        setSegmentError({ mode, message: toErrorMessage(cause) });
      } finally {
        setPendingMode(null);
      }
    },
    [committedMode, modeSetter, modes, pendingMode, t, vibe],
  );
  const segmentMeta = useMemo(() => {
    return OMP_MODE_SEGMENTS.map((segment) => {
      const label = t(segment.labelKey);
      const isPlanOrGoalOrLoop =
        segment.id === "plan" || segment.id === "goal" || segment.id === "loop";
      const enabledFlag = isPlanOrGoalOrLoop
        ? modes
          ? segment.id === "plan"
            ? modes.planModeEnabled
            : segment.id === "goal"
              ? modes.goalModeEnabled
              : modes.loopModeEnabled
          : false
        : null;
      const localBlocked =
        canEnterAll === false
          ? globalBlockedReason
          : enabledFlag === false && isPlanOrGoalOrLoop && !modesLoading
            ? t("agentControls.omp.modeDisabledForAgent")
            : undefined;
      const isPending = pendingMode === segment.id;
      const isSelected = committedMode === segment.id;
      const isBusy = Boolean(pendingMode);
      const isDisabled = Boolean(localBlocked) || (isBusy && !isPending);
      return { segment, label, isPending, isSelected, isDisabled, disabledReason: localBlocked };
    });
  }, [canEnterAll, committedMode, globalBlockedReason, modes, modesLoading, pendingMode, t]);
  const visibleError = segmentError;
  const headerAccessibilityLabel = t("agentControls.omp.selectMode", {
    value: committedMode,
  });
  return (
    <View style={styles.modeGroup}>
      <View
        accessibilityLabel={headerAccessibilityLabel}
        accessibilityRole="radiogroup"
        style={styles.modeSegments}
      >
        {segmentMeta.map((entry) => (
          <OmpModeSegmentChip
            key={entry.segment.id}
            segment={entry.segment}
            label={entry.label}
            selected={entry.isSelected}
            pending={entry.isPending}
            disabledReason={entry.isDisabled ? entry.disabledReason : undefined}
            onPress={() => void transitionTo(entry.segment.id)}
          />
        ))}
      </View>
      {visibleError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {visibleError.message}
        </Text>
      ) : null}
      {modesError && !visibleError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {toErrorMessage(modesError)}
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
  serverId,
  agentId,
}: {
  visible: boolean;
  onClose(): void;
  features?: readonly AgentFeature[];
  onSetFeature?: (featureId: string, value: unknown) => void;
  serverId?: string | null;
  agentId?: string | null;
}) {
  const { t } = useTranslation();
  const groups = useMemo(() => buildOmpSettingsGroups(features), [features]);
  const header = useMemo<SheetHeader>(() => ({ title: t("agentControls.omp.settings") }), [t]);
  // When the host can address a specific agent, render the generated
  // settings form backed by the OMP RPC (`get_settings` / `set_setting`).
  // Otherwise (draft source / no agent id) fall back to the existing
  // behavior / startup feature rows so this component still has something
  // meaningful to display.
  const useGeneratedForm = Boolean(serverId && agentId);
  return (
    <AdaptiveModalSheet
      header={header}
      visible={visible}
      onClose={onClose}
      testID="omp-settings-sheet"
    >
      {useGeneratedForm ? (
        <OmpSettingsForm serverId={serverId ?? null} agentId={agentId ?? null} />
      ) : (
        <>
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
        </>
      )}
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

function OmpMcpServerGroupRow({
  group,
  pending,
  onToggle,
}: {
  group: OmpMcpServerGroup;
  pending: boolean;
  onToggle(names: readonly string[], enabled: boolean): void;
}) {
  const { t } = useTranslation();
  const groupEnabled = resolveOmpMcpServerGroupState(group);
  const allRequired = isOmpMcpServerGroupRequired(group);
  const locked = pending || allRequired;
  const names = useMemo(() => group.rows.map((tool) => tool.name), [group.rows]);
  const handlePress = useCallback(() => {
    if (locked) return;
    onToggle(names, !groupEnabled);
  }, [groupEnabled, locked, names, onToggle]);
  const accessibilityState = useMemo(
    () => ({ checked: groupEnabled, disabled: locked }),
    [groupEnabled, locked],
  );
  const style = useCallback(
    ({ focused, hovered, pressed }: PressableStateCallbackType & { focused?: boolean }) => [
      styles.mcpServerRow,
      hovered && !locked && styles.toolRowHovered,
      pressed && !locked && styles.toolRowPressed,
      focused && styles.focusedRow,
      locked && styles.disabled,
    ],
    [locked],
  );
  const accessibilityLabel = t("agentControls.omp.mcpServerAccessibleName", {
    server: group.serverName,
    count: group.rows.length,
  });
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      aria-checked={groupEnabled}
      aria-disabled={locked}
      disabled={locked}
      onPress={handlePress}
      style={style}
      testID={`omp-mcp-server-${group.serverName}`}
    >
      <View style={styles.toolText}>
        <View style={styles.toolTitleRow}>
          <Text style={styles.toolLabel}>{group.serverName}</Text>
          <Text style={styles.sourceBadge}>
            {t("agentControls.omp.mcpServerBadge", { count: group.rows.length })}
          </Text>
          {allRequired ? (
            <Text style={styles.requiredBadge}>{t("agentControls.omp.required")}</Text>
          ) : null}
        </View>
        <Text style={styles.toolDescription}>{t("agentControls.omp.mcpServerDescription")}</Text>
      </View>
      <Switch pointerEvents="none" value={groupEnabled} />
    </Pressable>
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
    async (name: string | readonly string[], enabled: boolean) => {
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
  const handleToolToggle = useCallback(
    (name: string, enabled: boolean) => {
      void handleToggle(name, enabled);
    },
    [handleToggle],
  );
  const handleGroupToggle = useCallback(
    (names: readonly string[], enabled: boolean) => {
      void handleToggle(names, enabled);
    },
    [handleToggle],
  );
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((tool) => {
      const serverName = resolveMcpServerName(tool) ?? "";
      return `${tool.label} ${tool.description} ${tool.source} ${serverName}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, rows]);
  const grouping = useMemo(() => groupOmpToolsByServer(filteredRows), [filteredRows]);
  const enabledToolCount = rows.filter((tool) => tool.enabled).length;
  const toolCountLabel = t("agentControls.omp.toolCount", {
    enabled: enabledToolCount,
    total: rows.length,
  });
  const isEmpty = grouping.nonMcp.length === 0 && grouping.mcp.length === 0;
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
      {isEmpty ? (
        <Text style={styles.emptyTools}>{t("agentControls.omp.noTools")}</Text>
      ) : null}
      <ToolRows rows={grouping.nonMcp} pending={pending} onToggle={handleToolToggle} />
      {grouping.mcp.map((group) => (
        <View key={group.serverName} testID={`omp-mcp-group-${group.serverName}`}>
          <OmpMcpServerGroupRow
            group={group}
            pending={pending}
            onToggle={handleGroupToggle}
          />
          <View style={styles.mcpGroupChildren}>
            <ToolRows rows={group.rows} pending={pending} onToggle={handleToolToggle} />
          </View>
        </View>
      ))}
      {tools.isLoading ? (
        <Text style={styles.emptyTools}>{t("agentControls.omp.loadingTools")}</Text>
      ) : null}
    </AdaptiveModalSheet>
  );
}

function OmpAccessControl({
  serverId,
  agentId,
  showLabel,
  disabled,
  onClose,
}: {
  serverId?: string | null;
  agentId?: string | null;
  showLabel: boolean;
  disabled?: boolean;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const { presentation } = useComposerControlLayout();
  const settingsQuery = useOmpSettings(serverId ?? null, agentId ?? null);
  const settingSetter = useOmpSettingSetter(serverId ?? null, agentId ?? null);
  const anchorRef = useRef<View>(null);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<OmpApprovalMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const approvalEntry = useMemo(() => {
    return settingsQuery.settings.find(
      (entry) => entry.path === OMP_APPROVAL_MODE_PATH,
    );
  }, [settingsQuery.settings]);
  const currentMode: OmpApprovalMode = approvalEntry
    ? resolveOmpApprovalModeId(approvalEntry.value)
    : "yolo";
  const optionById = useMemo(() => {
    const record: Partial<Record<OmpApprovalMode, (typeof OMP_APPROVAL_MODE_OPTIONS)[number]>> = {};
    for (const option of OMP_APPROVAL_MODE_OPTIONS) {
      record[option.id] = option;
    }
    return record;
  }, []);
  const options: ComboboxOption[] = useMemo(
    () =>
      OMP_APPROVAL_MODE_OPTIONS.map((option) => ({
        id: option.id,
        label: t(option.labelKey),
      })),
    [t],
  );
  const currentLabel = options.find((option) => option.id === currentMode)?.label
    ?? t("agentControls.access.unknown");
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      const wasOpen = openRef.current;
      openRef.current = nextOpen;
      setOpen(nextOpen);
      if (!nextOpen) {
        if (wasOpen) onClose?.();
      }
    },
    [onClose],
  );
  const handlePress = useCallback(() => handleOpenChange(!open), [handleOpenChange, open]);
  const handleSelect = useCallback(
    async (id: string) => {
      if (id === currentMode) {
        handleOpenChange(false);
        return;
      }
      const option = optionById[id as OmpApprovalMode];
      if (!option) {
        handleOpenChange(false);
        return;
      }
      setPendingMode(option.id);
      setError(null);
      try {
        await settingSetter.setSetting({
          path: OMP_APPROVAL_MODE_PATH,
          value: option.id,
        });
        handleOpenChange(false);
      } catch (cause) {
        setError(toErrorMessage(cause));
      } finally {
        setPendingMode(null);
      }
    },
    [currentMode, handleOpenChange, optionById, settingSetter],
  );
  const renderOption = useCallback(
    (renderProps: {
      option: ComboboxOption;
      selected: boolean;
      active: boolean;
      onPress: () => void;
    }) => (
      <ComboboxItem
        label={renderProps.option.label}
        selected={renderProps.selected}
        active={renderProps.active}
        onPress={renderProps.onPress}
      />
    ),
    [],
  );
  const sheetHeader = useMemo<SheetHeader>(
    () => ({
      title: t("agentControls.access.title"),
      search: {
        onChange: () => {},
        placeholder: t("agentControls.access.searchPlaceholder"),
        testID: "omp-access-search",
      },
    }),
    [t],
  );
  const triggerLabel = showLabel ? t("agentControls.access.title") : currentLabel;
  const triggerValue = currentLabel;
  const isDisabled = Boolean(disabled || settingsQuery.isLoading);
  const isPending = pendingMode !== null || settingSetter.isPending;
  return (
    <>
      <ControlChip
        ref={anchorRef}
        icon={Shield}
        label={triggerLabel}
        value={triggerValue}
        accessibilityLabel={t("agentControls.access.selectWithValue", {
          value: currentLabel,
        })}
        onPress={handlePress}
        showLabel={showLabel}
        selected={open}
        open={open}
        showCaret={presentation.showCarets}
        disabled={isDisabled}
        testID="omp-access-control"
      />
      <Combobox
        options={options}
        value={currentMode}
        onSelect={(id) => void handleSelect(id)}
        open={open}
        onOpenChange={handleOpenChange}
        anchorRef={anchorRef}
        desktopPlacement="top-start"
        desktopMinWidth={240}
        header={sheetHeader}
        renderOption={renderOption}
      />
      {isPending ? <ThemedLoadingSpinner /> : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {error}
        </Text>
      ) : null}
    </>
  );
}

export function OmpControlDeck({
  modelSelector,
  thinkingOptions,
  selectedThinkingId,
  onSelectThinking,
  access: _access,
  features,
  onSetFeature,
  vibe,
  tools,
  disabled = false,
  onDropdownClose,
  serverId,
  agentId,
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
      <OmpModeControl vibe={vibe} serverId={serverId} agentId={agentId} />
      <View style={styles.modelSlot}>{modelSelector}</View>
      <OmpThinkingControl
        options={thinkingOptions}
        selectedId={selectedThinkingId}
        onSelect={onSelectThinking}
        showLabel={visibility.thinking}
        disabled={disabled}
      />
      <View style={styles.accessSlot}>
        <OmpAccessControl
          serverId={serverId}
          agentId={agentId}
          showLabel={visibility.access}
          disabled={disabled}
          onClose={onDropdownClose}
        />
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
        serverId={serverId ?? null}
        agentId={agentId ?? null}
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
    width: 440,
    flexDirection: "row",
    gap: theme.spacing[1],
  },
  modeSegmentSlot: {
    minWidth: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    flexShrink: 0,
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
  mcpServerRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface2,
  },
  mcpGroupChildren: {
    paddingLeft: theme.spacing[4],
    gap: theme.spacing[1],
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
