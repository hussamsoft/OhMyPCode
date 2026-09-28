import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { OMP_DARK_TOKENS, OMP_LIGHT_TOKENS } from "@/omp-theme/tokens.generated";

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
 * The colours are resolved from the generated OMP tokens rather than from
 * `theme.colors`, because where OMP colour slots live in the app theme is
 * decided separately. Reading the token here consumes it without pre-empting
 * that call: when the slots land, this is the one place that has to change.
 */

const FALLBACK = "#0088fa";

function resolveToken(name: "bashMode" | "pythonMode", colorScheme: string | undefined): string {
  const source = colorScheme === "light" ? OMP_LIGHT_TOKENS : OMP_DARK_TOKENS;
  const value = source[name];
  return typeof value === "string" && value.length > 0 ? value : FALLBACK;
}

const styles = StyleSheet.create((theme) => {
  const bash = resolveToken("bashMode", theme.colorScheme);
  const python = resolveToken("pythonMode", theme.colorScheme);
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
    <View
      testID="omp-bash-armed"
      style={[styles.chip, tone]}
      accessibilityRole="text"
    >
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
