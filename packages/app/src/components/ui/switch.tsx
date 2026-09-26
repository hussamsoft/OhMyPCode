import { useCallback, useMemo } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { createControlGeometry, switchGeometry } from "@/components/ui/control-geometry";
import type { Theme } from "@/styles/theme";

interface SwitchProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  trackColor?: { false?: string; true?: string };
  thumbColor?: string;
}

const TIMING = { duration: 180, easing: Easing.inOut(Easing.ease) };

interface SwitchTrackProps {
  value: boolean;
  trackOffColor: string;
  trackOnColor: string;
  thumbOffColor: string;
  thumbOnColor: string;
  trackColor?: { false?: string; true?: string };
  thumbColor?: string;
}

function SwitchTrack({
  value,
  trackOffColor: themedTrackOffColor,
  trackOnColor: themedTrackOnColor,
  thumbOffColor: themedThumbOffColor,
  thumbOnColor: themedThumbOnColor,
  trackColor,
  thumbColor,
}: SwitchTrackProps) {
  const reduceMotion = useReducedMotion();
  const trackOffColor = trackColor?.false ?? themedTrackOffColor;
  const trackOnColor = trackColor?.true ?? themedTrackOnColor;
  const thumbOffColor = thumbColor ?? themedThumbOffColor;
  const thumbOnColor = thumbColor ?? themedThumbOnColor;
  const progress = useDerivedValue(() => {
    const target = value ? 1 : 0;
    return reduceMotion ? target : withTiming(target, TIMING);
  });

  const trackAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [trackOffColor, trackOnColor]),
  }));

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [thumbOffColor, thumbOnColor]),
    transform: [{ translateX: progress.value * switchGeometry.thumbTravel }],
  }));

  const trackStyle = useMemo(() => [styles.switchTrack, trackAnimatedStyle], [trackAnimatedStyle]);
  const thumbStyle = useMemo(
    () => [styles.switchThumb, styles.thumb, thumbAnimatedStyle],
    [thumbAnimatedStyle],
  );

  return (
    <Animated.View style={trackStyle}>
      <Animated.View style={thumbStyle} />
    </Animated.View>
  );
}

const ThemedSwitchTrack = withUnistyles(SwitchTrack, (theme: Theme) => ({
  trackOffColor: theme.colors.surface3,
  trackOnColor: theme.colors.accent,
  thumbOffColor: theme.colors.palette.white,
  thumbOnColor: theme.colors.accentForeground,
}));

export function Switch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  testID,
  style,
  trackColor,
  thumbColor,
}: SwitchProps) {
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      if (disabled) return;
      onValueChange?.(!value);
    },
    [disabled, onValueChange, value],
  );

  const accessibilityState = useMemo(() => ({ checked: value, disabled }), [value, disabled]);
  const pressableStyle = useCallback(
    ({ focused }: PressableStateCallbackType & { focused?: boolean }) => [
      styles.switchControl,
      focused && styles.switchFocused,
      disabled ? styles.disabled : null,
      style,
    ],
    [disabled, style],
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
      focusable
      accessibilityRole="switch"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      aria-checked={value}
      testID={testID}
      style={pressableStyle}
    >
      <ThemedSwitchTrack value={value} trackColor={trackColor} thumbColor={thumbColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => {
  const geometry = createControlGeometry(theme);

  return {
    switchControl: {
      ...geometry.switchControl,
      borderRadius: theme.borderRadius.full,
      outlineWidth: 2,
      outlineColor: "transparent",
      outlineOffset: 1,
      outlineStyle: "solid",
    },
    switchFocused: {
      outlineColor: theme.colors.ring,
    },
    switchTrack: {
      width: switchGeometry.trackWidth,
      height: switchGeometry.trackHeight,
      borderRadius: switchGeometry.trackHeight / 2,
      padding: (switchGeometry.trackHeight - switchGeometry.thumbSize) / 2,
      justifyContent: "center",
    },
    switchThumb: {
      width: switchGeometry.thumbSize,
      height: switchGeometry.thumbSize,
      borderRadius: switchGeometry.thumbSize / 2,
    },
    thumb: {
      shadowColor: "rgba(0, 0, 0, 0.25)",
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      shadowOpacity: 1,
      elevation: 2,
    },
    disabled: {
      opacity: theme.opacity[50],
    },
  };
});
