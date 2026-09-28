import { Text, View } from "react-native";
import { ompColorFrom } from "@/omp-theme/theme";
import { StyleSheet } from "react-native-unistyles";

/**
 * The composer's armed-execution indicator.
 *
 * OMP's TUI sets `isBashMode` / `isPythonMode` while a draft begins with `!`
 * or `$` and repaints the editor border, using `bashMode` / `pythonMode` as the
 * colour keys. This mirrors that: the chip appears the moment the draft
 * addresses an arm and goes away when it no longer does, so the submit button
 * never silently changes meaning. The double sigil is called out, because
 * `!!` / `$$` run the command but keep its output out of the model's context --
 * a distinction the user cannot infer from the text alone.
 *
 * The colours come from `theme.colors.omp`, the slot Phase 7 opened for OMP's
 * own palette. That indirection is the point: this component no longer knows
 * which token set is active, and swapping or extending OMP's palette no longer
 * requires touching a component.
 */

const styles = StyleSheet.create((theme) => {
  // Read from the theme rather than the generated token module: Phase 7 put
  // OMP's palette under colors.omp, so the token follows whatever theme is
  // active instead of branching on colorScheme here.
  const bash = ompColorFrom(theme.colors, "bashMode", "#0088fa");
  const python = ompColorFrom(theme.colors, "pythonMode", "#d97706");
  return {
    chip: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    sigil: {
      fontSize: 12,
      fontWeight: "600",
    },
    command: {
      fontSize: 12,
    },
    // The excluded-from-context marker is a badge, not another colour: the arm
    // is about where the output goes, not which language it is.
    excluded: {
      fontSize: 10,
      opacity: 0.75,
    },
    bash: { borderColor: bash, color: bash },
    python: { borderColor: python, color: python },
  };
});

export interface BashArmedChipProps {
  command: string;
  arm: "bash" | "python";
  excludeFromContext: boolean;
}

export function BashArmedChip({
  command,
  arm,
  excludeFromContext,
}: BashArmedChipProps): React.JSX.Element | null {
  if (command.length === 0) {
    return null;
  }
  const sigil = arm === "python" ? "$" : "!";
  const doubled = excludeFromContext ? sigil.repeat(2) : sigil;
  const tone = arm === "python" ? styles.python : styles.bash;
  return (
    <View testID="omp-bash-armed" style={[styles.chip, tone]} accessibilityRole="text">
      <Text testID="omp-bash-armed-sigil" style={[styles.sigil, tone]}>
        {doubled}
      </Text>
      <Text testID="omp-bash-armed-command" numberOfLines={1} style={[styles.command, tone]}>
        {command}
      </Text>
      {excludeFromContext ? (
        <Text testID="omp-bash-armed-excluded" style={styles.excluded}>
          no context
        </Text>
      ) : null}
    </View>
  );
}
