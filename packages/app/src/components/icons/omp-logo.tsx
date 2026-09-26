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

function ThemedOmpLogo({ size = 64, foreground, accent, surface0 }: ThemedOmpLogoProps) {
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 120 90">
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

export function OmpLogo({ size = 64 }: OmpLogoProps) {
  return <ThemedOmpLogoIcon size={size} uniProps={ompLogoColorMapping} />;
}
