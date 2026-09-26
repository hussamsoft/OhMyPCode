import React, { forwardRef, useCallback, useMemo } from "react";
import { Pressable, Text, View, type PressableStateCallbackType } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ChevronDown } from "lucide-react-native";
import type { AgentControlIcon } from "@/agent-controls/icons";

export interface ControlChipProps {
  icon: AgentControlIcon;
  label: string;
  value: string;
  accessibilityLabel: string;
  onPress: () => void;
  showLabel?: boolean;
  selected?: boolean;
  accentSelected?: boolean;
  open?: boolean;
  disabled?: boolean;
  showCaret?: boolean;
  accessibilityRole?: "button" | "radio";
  compact?: boolean;
  testID?: string;
}

export const ControlChip = forwardRef<View, ControlChipProps>(function ControlChip(
  {
    icon: Icon,
    label,
    value,
    accessibilityLabel,
    onPress,
    accessibilityRole = "button",
    showLabel = true,
    selected = false,
    accentSelected = false,
    open = false,
    disabled = false,
    showCaret = false,
    compact = false,
    testID,
  },
  ref,
) {
  const iconColor = selected ? styles.selectedIcon.color : styles.iconColor.color;
  const style = useCallback(
    ({ focused, hovered, pressed }: PressableStateCallbackType & { focused?: boolean }) => [
      styles.control,
      compact ? styles.compact : styles.desktop,
      selected && (accentSelected ? styles.selectedAccent : styles.selected),
      !showLabel && (compact ? styles.iconOnlyCompact : styles.iconOnly),
      (hovered || open) && styles.hovered,
      pressed && styles.pressed,
      focused && styles.focused,
      disabled && styles.disabled,
    ],
    [accentSelected, compact, disabled, open, selected, showLabel],
  );
  const accessibilityState = useMemo(
    () =>
      accessibilityRole === "radio"
        ? { checked: selected, disabled }
        : { expanded: open, disabled },
    [accessibilityRole, disabled, open, selected],
  );

  return (
    <Pressable
      ref={ref}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      aria-checked={accessibilityRole === "radio" ? selected : undefined}
      aria-expanded={accessibilityRole === "button" ? open : undefined}
      aria-disabled={disabled}
      collapsable={false}
      disabled={disabled}
      onPress={onPress}
      style={style}
      testID={testID}
    >
      <View style={styles.icon}>
        <Icon size={compact ? 18 : 16} color={iconColor} />
      </View>
      {showLabel ? <Text style={styles.label}>{label}</Text> : null}
      <Text numberOfLines={1} style={selected ? styles.selectedValue : styles.value}>
        {value}
      </Text>
      {showCaret ? <ChevronDown size={14} color={iconColor} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create((theme) => ({
  control: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    borderWidth: 2,
    borderColor: theme.colors.surface0,
    borderRadius: theme.borderRadius["2xl"],
    backgroundColor: "transparent",
  },
  desktop: {
    height: 32,
    paddingHorizontal: theme.spacing[2],
  },
  compact: {
    minHeight: 44,
    paddingHorizontal: theme.spacing[3],
  },
  iconOnly: {
    width: 32,
    paddingHorizontal: 0,
    justifyContent: "center",
  },
  iconOnlyCompact: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    justifyContent: "center",
  },
  hovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  pressed: {
    backgroundColor: theme.colors.surface2,
  },
  selected: {
    backgroundColor: theme.colors.surface3,
  },
  selectedAccent: {
    backgroundColor: theme.colors.accent,
  },
  focused: {
    borderColor: theme.colors.ring,
  },
  disabled: {
    opacity: theme.opacity[50],
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconColor: {
    color: theme.colors.foregroundMuted,
  },
  selectedIcon: {
    color: theme.colors.foreground,
  },
  label: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.normal,
  },
  value: {
    minWidth: 0,
    flexShrink: 1,
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.normal,
  },
  selectedValue: {
    minWidth: 0,
    flexShrink: 1,
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.normal,
  },
}));
