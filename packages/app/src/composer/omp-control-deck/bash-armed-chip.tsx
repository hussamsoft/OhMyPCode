import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { OMP_DARK_TOKENS, OMP_LIGHT_TOKENS } from "@/omp-theme/tokens.generated";

/**
 * The composer's armed-command indicator.
 *
 * OMP's TUI sets `isBashMode` while a draft begins with `!` and repaints the
 * editor border, and `bashMode` is the colour key it uses for that. This mirrors
 * that: the chip appears the moment the draft addresses the `!` arm and goes away
 * when it no longer does, so the submit button never silently changes meaning.
 *
 * The colour is resolved from the generated OMP tokens rather than from
 * `theme.colors`, because where OMP colour slots live in the app theme is still
 * an open decision. Reading the token here consumes it without pre-empting that
 * call: when the slots do land, this is the one place that has to change.
 */

const FALLBACK = "#0088fa";

function resolveBashMode(colorScheme: string | undefined): string {
  const source = colorScheme === "light" ? OMP_LIGHT_TOKENS : OMP_DARK_TOKENS;
  const value = source.bashMode;
  return typeof value === "string" && value.length > 0 ? value : FALLBACK;
}

const styles = StyleSheet.create((theme) => {
  const accent = resolveBashMode(theme.colorScheme);
  return {
    chip: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: accent,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    sigil: {
      color: accent,
      fontSize: 12,
      fontWeight: "600",
    },
    command: {
      color: accent,
      fontSize: 12,
    },
  };
});

export function BashArmedChip({ command }: { command: string }): React.JSX.Element | null {
  if (command.length === 0) {
    return null;
  }
  return (
    <View testID="omp-bash-armed" style={styles.chip} accessibilityRole="text">
      <Text testID="omp-bash-armed-sigil" style={styles.sigil}>
        !
      </Text>
      <Text testID="omp-bash-armed-command" numberOfLines={1} style={styles.command}>
        {command}
      </Text>
    </View>
  );
}
