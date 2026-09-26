import Svg, { Circle, Rect } from "react-native-svg";
import { withUnistyles } from "react-native-unistyles";
import type { Theme } from "@/styles/theme";

interface OmpLogoProps {
  size?: number;
  color?: string;
}

interface ThemedOmpLogoProps {
  size?: number;
  foreground: string;
  accent: string;
  surface0: string;
}

const ompLogoColorMapping = (theme: Theme) => ({
  foreground: theme.colors.foreground,
  accent: theme.colors.accent,
  surface0: theme.colors.surface0,
});

// The mark's natural proportions (a wide "IDE window" glyph) are 4:3, but
// every call site treats `size` as a square footprint -- matching the
// PaseoLogo API it replaced. `preserveAspectRatio` centers and scales the
// 120x90 shape to fit inside a size x size viewport without distortion,
// so a mask/container built around `{ width: size, height: size }` always
// fully covers the rendered mark (no bottom-quarter gap).
function ThemedOmpLogo({ size = 64, foreground, accent, surface0 }: ThemedOmpLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 90" preserveAspectRatio="xMidYMid meet">
      <Rect x="10" y="8" width="100" height="12" rx="2" fill={foreground} />
      <Rect x="25" y="20" width="12" height="62" rx="2" fill={foreground} />
      <Rect x="75" y="20" width="12" height="45" rx="2" fill={foreground} />
      <Rect x="71" y="55" width="20" height="16" rx="3" fill={accent} />
      <Rect x="76" y="59" width="3" height="8" rx="1" fill={surface0} />
      <Rect x="82" y="59" width="3" height="8" rx="1" fill={surface0} />
      <Circle cx="18" cy="14" r="2" fill={accent} opacity={0.8} />
      <Circle cx="102" cy="14" r="2" fill={accent} opacity={0.8} />
    </Svg>
  );
}

const ThemedOmpLogoIcon = withUnistyles(ThemedOmpLogo);

/**
 * A `color` override renders every shape in one flat fill instead of the
 * themed foreground/accent/surface0 trio -- needed for silhouette use cases
 * (mask elements, shimmer animations) where a single-tone shape is required.
 */
export function OmpLogo({ size = 64, color }: OmpLogoProps) {
  if (color !== undefined)
    return (
      <Svg width={size} height={size} viewBox="0 0 120 90" preserveAspectRatio="xMidYMid meet">
        <Rect x="10" y="8" width="100" height="12" rx="2" fill={color} />
        <Rect x="25" y="20" width="12" height="62" rx="2" fill={color} />
        <Rect x="75" y="20" width="12" height="45" rx="2" fill={color} />
        <Rect x="71" y="55" width="20" height="16" rx="3" fill={color} />
        <Rect x="76" y="59" width="3" height="8" rx="1" fill={color} />
        <Rect x="82" y="59" width="3" height="8" rx="1" fill={color} />
        <Circle cx="18" cy="14" r="2" fill={color} />
        <Circle cx="102" cy="14" r="2" fill={color} />
      </Svg>
    );
  return <ThemedOmpLogoIcon size={size} uniProps={ompLogoColorMapping} />;
}
