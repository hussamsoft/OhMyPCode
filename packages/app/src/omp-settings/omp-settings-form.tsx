/**
 * Generated settings form for OMP.
 *
 * The actual settings schema lives in `vendor/oh-my-pi/.../tui/src/overlays/settings-defs.ts`
 * (`SettingsDisplayEntry`) and is mirrored on the wire by `OmpSettingEntrySchema`
 * (`packages/protocol/src/messages.ts`). This component walks the entries and
 * renders a row per entry, so adding a new OMP setting to upstream updates the
 * UI for free.
 *
 * Tab ordering / labels come from `./registry` (which itself reads
 * `SETTING_TABS`); entries the OMP runtime declares but the desktop registry
 * does not list fall through to an "Other" bucket. Writes go through the
 * `useOmpSettingSetter` mutation hook (which calls
 * `client.setOmpSetting` -> `omp.settings.set.request`) so the change hits
 * `OmpRuntimeHost.set_setting` on the OMP side.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  type PressableStateCallbackType,
} from "react-native";
import { Lock } from "lucide-react-native";
import {
  ompSettingsQueryKey,
  useOmpSettingSetter,
  useOmpSettings,
  useOmpSettingsUpdate,
  type OmpSettingEntry,
} from "@/composer/omp-control-deck/use-omp-rpc";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { EditingTextInput } from "@/components/ui/text-input";
import {
  OMP_SETTINGS_TAB_ORDER,
  ompSettingsTabLabel,
  OMP_SETTINGS_OTHER_TAB_LABEL,
  type OmpSettingsTabId,
} from "./registry";

export interface OmpSettingsFormProps {
  serverId?: string | null;
  agentId?: string | null;
  /**
   * Optional pre-fetched entries — when provided, the form skips the query.
   * Useful for tests and previews; production callers omit this.
   */
  initialEntries?: readonly OmpSettingEntry[];
}

interface OmpSettingsGroup {
  groupName: string;
  entries: OmpSettingEntry[];
}

interface OmpSettingsTab {
  tabId: OmpSettingsTabId | "other";
  label: string;
  groups: OmpSettingsGroup[];
}

type OmpSettingSetterFn = (path: string, value: unknown) => Promise<unknown>;

const OMP_OTHER_TAB_ID = "other" as const;

function LockIcon({ size, color }: { size: number; color: string }) {
  return <Lock size={size} color={color} />;
}

const ThemedLockIcon = withUnistyles(LockIcon, (theme) => ({
  color: theme.colors.foregroundMuted,
}));

function partitionByTab(entries: readonly OmpSettingEntry[]): OmpSettingsTab[] {
  const knownTabs = new Set<string>(OMP_SETTINGS_TAB_ORDER);
  const buckets = new Map<string, OmpSettingEntry[]>();
  for (const id of OMP_SETTINGS_TAB_ORDER) buckets.set(id, []);
  buckets.set(OMP_OTHER_TAB_ID, []);
  for (const entry of entries) {
    const declaredTab = entry.ui?.tab;
    const bucket = declaredTab && knownTabs.has(declaredTab) ? declaredTab : OMP_OTHER_TAB_ID;
    const list = buckets.get(bucket);
    if (list) list.push(entry);
  }

  const tabs: OmpSettingsTab[] = [];
  // Render every known tab even when empty so the chip navigation reflects
  // the full taxonomy the runtime is publishing. Entries then light up the
  // tabs that actually have something to show. The "Other" bucket only
  // appears if OMP returns an entry we don't recognise.
  for (const id of OMP_SETTINGS_TAB_ORDER) {
    const list = buckets.get(id) ?? [];
    tabs.push({
      tabId: id,
      label: ompSettingsTabLabel(id),
      groups: partitionByGroup(list),
    });
  }
  const otherList = buckets.get(OMP_OTHER_TAB_ID) ?? [];
  if (otherList.length > 0) {
    tabs.push({
      tabId: OMP_OTHER_TAB_ID,
      label: OMP_SETTINGS_OTHER_TAB_LABEL,
      groups: partitionByGroup(otherList),
    });
  }
  return tabs;
}

function partitionByGroup(entries: readonly OmpSettingEntry[]): OmpSettingsGroup[] {
  const order: string[] = [];
  const buckets = new Map<string, OmpSettingEntry[]>();
  for (const entry of entries) {
    const groupName = entry.ui?.group ?? "";
    let list = buckets.get(groupName);
    if (!list) {
      list = [];
      buckets.set(groupName, list);
      order.push(groupName);
    }
    list.push(entry);
  }
  return order.map((groupName) => ({
    groupName,
    entries: buckets.get(groupName) ?? [],
  }));
}

function maskCredentialValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  return "•".repeat(8);
}

function EnumOption({
  option,
  selected,
  disabled,
  path,
  onSelect,
}: {
  option: string;
  selected: boolean;
  disabled: boolean;
  path: string;
  onSelect(value: unknown): void;
}) {
  const handlePress = useCallback(() => onSelect(option), [onSelect, option]);
  const accessibilityState = useMemo(() => ({ selected, disabled }), [selected, disabled]);
  const style = useCallback(
    ({
      focused,
      hovered,
      pressed,
    }: PressableStateCallbackType & {
      focused?: boolean;
      pressed?: boolean;
    }) => [
      styles.enumOption,
      selected && styles.enumOptionSelected,
      hovered && styles.enumOptionHovered,
      pressed && styles.enumOptionPressed,
      focused && styles.focusedRow,
    ],
    [selected],
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={handlePress}
      style={style}
      testID={`omp-setting-enum-${path}-${option}`}
    >
      <Text style={styles.enumOptionLabel}>{option}</Text>
    </Pressable>
  );
}

function normaliseEnumValue(value: unknown, values: readonly string[]): string | undefined {
  if (typeof value === "string" && values.includes(value)) return value;
  return undefined;
}

function entryBoolValue(entry: OmpSettingEntry): boolean {
  if (typeof entry.value === "boolean") return entry.value;
  if (typeof entry.defaultValue === "boolean") return entry.defaultValue;
  return false;
}

function entryStringValue(entry: OmpSettingEntry): string {
  if (typeof entry.value === "string") return entry.value;
  if (typeof entry.value === "number" || typeof entry.value === "boolean")
    return String(entry.value);
  if (typeof entry.defaultValue === "string") return entry.defaultValue;
  return "";
}

function OmpSettingRow({
  entry,
  onSet,
  pending,
}: {
  entry: OmpSettingEntry;
  onSet: OmpSettingSetterFn;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const label = entry.ui?.label ?? entry.path;
  const description = entry.ui?.description ?? entry.description;
  const type = entry.type;
  const credential = entry.credential === true;
  const enumValues = entry.enumValues ?? [];

  const handleSet = useCallback(
    (next: unknown) => {
      void onSet(entry.path, next);
    },
    [entry.path, onSet],
  );

  let control: React.ReactNode;
  if (credential) {
    control = (
      <EditingTextInput
        accessibilityLabel={t("agentControls.omp.credentialField", { label })}
        editable={false}
        secureTextEntry
        initialValue={maskCredentialValue(entry.value ?? entry.defaultValue)}
        style={styles.credentialInput}
        testID={`omp-setting-input-${entry.path}`}
      />
    );
  } else if (type === "boolean") {
    control = (
      <Switch
        accessibilityLabel={t("agentControls.omp.booleanField", { label })}
        value={entryBoolValue(entry)}
        onValueChange={handleSet}
        disabled={pending}
        testID={`omp-setting-switch-${entry.path}`}
      />
    );
  } else if (type === "enum" && enumValues.length > 0) {
    const selected = normaliseEnumValue(entry.value ?? entry.defaultValue, enumValues);
    control = (
      <View style={styles.enumRow}>
        {enumValues.map((value) => (
          <EnumOption
            key={value}
            option={value}
            selected={value === selected}
            disabled={pending}
            path={entry.path}
            onSelect={handleSet}
          />
        ))}
      </View>
    );
  } else {
    control = (
      <EditingTextInput
        accessibilityLabel={label}
        editable={!pending}
        initialValue={entryStringValue(entry)}
        onChangeText={handleSet}
        style={styles.valueInput}
        testID={`omp-setting-input-${entry.path}`}
      />
    );
  }

  return (
    <View style={styles.row} testID={`omp-setting-row-${entry.path}`}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{label}</Text>
        {credential ? <ThemedLockIcon size={14} /> : null}
      </View>
      {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      <View style={styles.rowControl}>{control}</View>
    </View>
  );
}

function OmpSettingsTabBar({
  tabs,
  activeTabId,
  onSelect,
}: {
  tabs: readonly OmpSettingsTab[];
  activeTabId: string;
  onSelect(tabId: string): void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabBar}
    >
      {tabs.map((tab) => (
        <TabChip key={tab.tabId} tab={tab} active={tab.tabId === activeTabId} onSelect={onSelect} />
      ))}
    </ScrollView>
  );
}

function TabChip({
  tab,
  active,
  onSelect,
}: {
  tab: OmpSettingsTab;
  active: boolean;
  onSelect(tabId: string): void;
}) {
  const handlePress = useCallback(() => onSelect(tab.tabId), [onSelect, tab.tabId]);
  const accessibilityState = useMemo(() => ({ selected: active }), [active]);
  const style = useCallback(
    ({
      focused,
      hovered,
      pressed,
    }: PressableStateCallbackType & {
      focused?: boolean;
      pressed?: boolean;
    }) => [
      styles.tabChip,
      active && styles.tabChipActive,
      hovered && !active && styles.tabChipHovered,
      pressed && styles.tabChipPressed,
      focused && styles.focusedRow,
    ],
    [active],
  );
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
      onPress={handlePress}
      style={style}
      testID={`omp-settings-tab-${tab.tabId}`}
    >
      <Text style={styles.tabChipLabel}>{tab.label}</Text>
    </Pressable>
  );
}

export function OmpSettingsForm({ serverId, agentId, initialEntries }: OmpSettingsFormProps) {
  const { t } = useTranslation();
  const enabled = Boolean(serverId && agentId);
  const { settings, isLoading, error, refresh } = useOmpSettings(serverId, agentId, { enabled });
  const { setSetting, isPending } = useOmpSettingSetter(serverId, agentId);
  const update = useOmpSettingsUpdate(serverId, agentId);

  // Merge in any pre-fetched entries (used by tests and previews) so the form
  // is renderable without an RPC roundtrip.
  const merged: readonly OmpSettingEntry[] = initialEntries ?? settings;

  const tabs = useMemo(() => partitionByTab(merged), [merged]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.tabId ?? "");

  // Keep the active tab in sync with the available tabs (e.g. after refresh).
  useEffect(() => {
    if (tabs.length === 0) {
      if (activeTabId !== "") setActiveTabId("");
      return;
    }
    if (!tabs.some((tab) => tab.tabId === activeTabId)) {
      setActiveTabId(tabs[0].tabId);
    }
  }, [tabs, activeTabId]);

  // Refresh on settings push. `useOmpSettingsUpdate` returns null until the
  // server starts projecting `settings` onto `runtimeInfo.extra.settings`, so
  // we still call refresh on null→null safely (the query refetch is idempotent
  // and the mutation invalidation in `useOmpSettingSetter` already covers the
  // local case).
  useEffect(() => {
    if (!enabled) return;
    if (update === null) return;
    void refresh();
    // intentionally only depend on `update` (refresh is stable enough that we
    // don't need to re-run the effect on its changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update, enabled]);

  const onSet = useCallback(
    async (path: string, value: unknown) => {
      return setSetting({ path, value });
    },
    [setSetting],
  );

  if (!enabled) {
    return (
      <View style={styles.placeholder} testID="omp-settings-form-placeholder">
        <Text style={styles.message}>{t("agentControls.omp.settingsUnavailable")}</Text>
      </View>
    );
  }

  if (isLoading && merged.length === 0) {
    return (
      <View style={styles.placeholder} testID="omp-settings-form-loading">
        <Text style={styles.message}>{t("agentControls.omp.settingsLoading")}</Text>
      </View>
    );
  }

  if (error && merged.length === 0) {
    return (
      <View style={styles.placeholder} testID="omp-settings-form-error">
        <Text style={styles.error}>{error.message}</Text>
      </View>
    );
  }

  const activeTab = tabs.find((tab) => tab.tabId === activeTabId) ?? tabs[0];

  return (
    <View style={styles.form} testID="omp-settings-form">
      {tabs.length > 1 ? (
        <OmpSettingsTabBar tabs={tabs} activeTabId={activeTabId} onSelect={setActiveTabId} />
      ) : null}
      <ScrollView style={styles.body} testID={`omp-settings-form-body-${activeTab?.tabId ?? ""}`}>
        {activeTab ? (
          activeTab.groups.map((group) => (
            <View
              key={group.groupName || "ungrouped"}
              style={styles.section}
              testID={`omp-settings-section-${group.groupName || "ungrouped"}`}
            >
              {group.groupName ? <Text style={styles.sectionTitle}>{group.groupName}</Text> : null}
              {group.entries.map((entry) => (
                <OmpSettingRow key={entry.path} entry={entry} onSet={onSet} pending={isPending} />
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.message}>{t("agentControls.omp.noSettings")}</Text>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Re-export the settings query key so tests / future consumers can mock the
 * underlying transport without depending on the internal location of the
 * keys.
 */
export { ompSettingsQueryKey };

const styles = StyleSheet.create((theme) => ({
  form: {
    flex: 1,
    gap: theme.spacing[2],
  },
  body: {
    flex: 1,
  },
  tabBar: {
    gap: theme.spacing[1],
    paddingVertical: theme.spacing[1],
  },
  tabChip: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface2,
  },
  tabChipActive: {
    backgroundColor: theme.colors.accent,
  },
  tabChipHovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  tabChipPressed: {
    backgroundColor: theme.colors.surface3,
  },
  tabChipLabel: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  section: {
    gap: theme.spacing[2],
    paddingVertical: theme.spacing[2],
  },
  sectionTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  row: {
    gap: theme.spacing[1],
    paddingVertical: theme.spacing[2],
    borderBottomWidth: theme.borderWidth[1],
    borderBottomColor: theme.colors.borderAccent,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  rowLabel: {
    flex: 1,
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  rowDescription: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  rowControl: {
    minHeight: 36,
    justifyContent: "center",
  },
  enumRow: {
    flexDirection: "row",
    gap: theme.spacing[1],
    flexWrap: "wrap",
  },
  enumOption: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface2,
  },
  enumOptionSelected: {
    backgroundColor: theme.colors.accent,
  },
  enumOptionHovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  enumOptionPressed: {
    backgroundColor: theme.colors.surface3,
  },
  enumOptionLabel: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
  },
  valueInput: {
    color: theme.colors.foreground,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    fontSize: theme.fontSize.sm,
  },
  credentialInput: {
    color: theme.colors.foreground,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    fontSize: theme.fontSize.sm,
    letterSpacing: 2,
    fontFamily: theme.fontFamily.mono,
  },
  focusedRow: {
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth[1],
    borderColor: theme.colors.ring,
  },
  placeholder: {
    padding: theme.spacing[3],
  },
  message: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  error: {
    color: theme.colors.statusDanger,
    fontSize: theme.fontSize.sm,
  },
}));
