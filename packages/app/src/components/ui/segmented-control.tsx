import { useCallback, useMemo, type ReactNode } from "react";
import { Pressable, Text, View, type PressableStateCallbackType } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import {
  createControlGeometry,
  segmentedIconSize,
  type SegmentedControlSize,
} from "@/components/ui/control-geometry";
import type { Theme } from "@/styles/theme";
import { isWeb } from "@/constants/platform";

type SegmentedControlIconRenderer = (props: { color: string; size: number }) => ReactNode;

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: SegmentedControlIconRenderer;
  disabled?: boolean;
  testID?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  size?: SegmentedControlSize;
  accessibilityLabel?: string;
  hideLabels?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface SegmentIconProps {
  icon: SegmentedControlIconRenderer;
  iconSize: number;
  iconColor: string;
}

function SegmentIcon({ icon, iconSize, iconColor }: SegmentIconProps) {
  return <View style={styles.iconContainer}>{icon({ color: iconColor, size: iconSize })}</View>;
}

const ThemedSegmentIcon = withUnistyles(SegmentIcon);

const selectedIconMapping = (theme: Theme) => ({ iconColor: theme.colors.foreground });
const mutedIconMapping = (theme: Theme) => ({ iconColor: theme.colors.foregroundMuted });

export function SegmentedControl<T extends string>({
  options,
  value,
  accessibilityLabel,
  onValueChange,
  size = "md",
  hideLabels = false,
  style,
  testID,
}: SegmentedControlProps<T>) {
  const sizeStyles = {
    xs: { container: styles.containerXs, segment: styles.segmentXs, label: styles.labelXs },
    sm: { container: styles.containerSm, segment: styles.segmentSm, label: styles.labelSm },
    md: { container: styles.containerMd, segment: styles.segmentMd, label: styles.labelMd },
  }[size];
  const containerSizeStyle = sizeStyles.container;
  const segmentSizeStyle = sizeStyles.segment;
  const labelSizeStyle = sizeStyles.label;
  const iconSize = segmentedIconSize[size];

  const containerStyle = useMemo(
    () => [styles.container, containerSizeStyle, style],
    [containerSizeStyle, style],
  );

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={containerStyle}
      testID={testID}
    >
      {options.map((option, optionIndex) => {
        const isSelected = option.value === value;

        return (
          <SegmentItem
            key={option.value}
            option={option}
            isSelected={isSelected}
            iconSize={iconSize}
            hideLabels={hideLabels}
            segmentSizeStyle={sizeStyles.segment}
            labelSizeStyle={sizeStyles.label}
            currentValue={value}
            options={options}
            optionIndex={optionIndex}
            onValueChange={onValueChange}
          />
        );
      })}
    </View>
  );
}

function SegmentItem<T extends string>({
  option,
  isSelected,
  iconSize,
  hideLabels,
  segmentSizeStyle,
  labelSizeStyle,
  currentValue,
  options,
  optionIndex,
  onValueChange,
}: {
  option: SegmentedControlOption<T>;
  isSelected: boolean;
  iconSize: number;
  hideLabels: boolean;
  segmentSizeStyle: { minHeight: number; paddingHorizontal: number; borderRadius: number };
  labelSizeStyle: { fontSize: number };
  currentValue: T;
  options: readonly SegmentedControlOption<T>[];
  optionIndex: number;
  onValueChange: (value: T) => void;
}) {
  const labelStyle = useMemo(
    () => [styles.label, labelSizeStyle, isSelected && styles.labelSelected],
    [labelSizeStyle, isSelected],
  );
  const handlePress = useCallback(() => {
    if (!option.disabled && option.value !== currentValue) {
      onValueChange(option.value);
    }
  }, [option.disabled, option.value, currentValue, onValueChange]);
  const handleKeyDown = useCallback(
    (event: { nativeEvent: { key: string }; preventDefault(): void; stopPropagation(): void }) => {
      if (option.disabled) return;
      let nextIndex: number | null = null;
      if (event.nativeEvent.key === "ArrowRight" || event.nativeEvent.key === "ArrowDown") {
        nextIndex = (optionIndex + 1) % options.length;
      } else if (event.nativeEvent.key === "ArrowLeft" || event.nativeEvent.key === "ArrowUp") {
        nextIndex = (optionIndex - 1 + options.length) % options.length;
      }
      if (nextIndex === null) return;
      event.preventDefault();
      event.stopPropagation();
      const next = options[nextIndex];
      if (next && !next.disabled) onValueChange(next.value);
    },
    [onValueChange, option.disabled, optionIndex, options],
  );
  const pressableStyle = useCallback(
    ({ focused, hovered, pressed }: PressableStateCallbackType & { focused?: boolean; hovered?: boolean }) => [
      styles.segment,
      segmentSizeStyle,
      focused && styles.segmentFocused,
      isSelected && styles.segmentSelected,
      Boolean(hovered) && !isSelected && styles.segmentHover,
      pressed && !isSelected && styles.segmentPressed,
      option.disabled && styles.segmentDisabled,
    ],
    [isSelected, option.disabled, segmentSizeStyle],
  );
  const accessibilityState = useMemo(
    () => ({ checked: isSelected, disabled: option.disabled }),
    [isSelected, option.disabled],
  );
  // `aria-checked` and `onKeyDown` exist only in react-native-web. Passing them
  // unconditionally does not typecheck against RN's Pressable, and a native build
  // has no DOM to deliver them, so they are spread in on web alone.
  const webOnlyProps = isWeb
    ? { "aria-checked": isSelected, onKeyDown: handleKeyDown }
    : undefined;
  return (
    <Pressable
      accessibilityLabel={option.label}
      accessibilityRole="radio"
      accessibilityState={accessibilityState}
      disabled={option.disabled}
      testID={option.testID}
      onPress={handlePress}
      style={pressableStyle}
      {...webOnlyProps}
    >
      {option.icon ? (
        <ThemedSegmentIcon
          icon={option.icon}
          iconSize={iconSize}
          uniProps={isSelected ? selectedIconMapping : mutedIconMapping}
        />
      ) : null}
      {hideLabels ? null : (
        <Text style={labelStyle} numberOfLines={1}>
          {option.label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => {
  const geometry = createControlGeometry(theme);

  return {
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "transparent",
      gap: theme.spacing[1],
    },
    containerXs: {
      ...geometry.segmentedContainerXs,
    },
    containerSm: {
      ...geometry.segmentedContainerSm,
    },
    containerMd: {
      ...geometry.segmentedContainerMd,
    },
    segment: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      gap: theme.spacing[1],
    },
    segmentXs: {
      ...geometry.segmentedSegmentXs,
    },
    segmentSm: {
      ...geometry.segmentedSegmentSm,
    },
    segmentMd: {
      ...geometry.segmentedSegmentMd,
    },
    segmentSelected: {
      backgroundColor: theme.colors.surface3,
    },
    segmentHover: {
      backgroundColor: theme.colors.surface2,
    },
    segmentPressed: {
      backgroundColor: theme.colors.surface3,
    },
    segmentDisabled: {
      opacity: theme.opacity[50],
    },
  segmentFocused: {
    borderWidth: 2,
    borderColor: theme.colors.ring,
  },
    iconContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      color: theme.colors.foregroundMuted,
      fontWeight: theme.fontWeight.normal,
    },
    labelXs: {
      ...geometry.segmentedLabelXs,
    },
    labelSm: {
      ...geometry.segmentedLabelSm,
    },
    labelMd: {
      ...geometry.segmentedLabelMd,
    },
    labelSelected: {
      color: theme.colors.foreground,
    },
  };
});
