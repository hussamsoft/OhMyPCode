import { Keyboard } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { View } from "react-native";
import { OmpKeybindingsForm } from "@/omp-keybindings/omp-keybindings-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";

const ThemedKeyboard = withUnistyles(Keyboard);
const ompKeybindingsPanelPresentation = {
  label: (t) => t("panels.ompKeybindings.label"),
  subtitle: (t) => t("panels.ompKeybindings.subtitle"),
  tooltip: (t) => t("panels.ompKeybindings.tooltip"),
  icon: ThemedKeyboard,
} satisfies PanelPresentation;

function OmpKeybindingsPanel() {
  const { serverId, target } = usePaneContext();
  invariant(
    target.kind === "omp_keybindings",
    "OmpKeybindingsPanel requires omp_keybindings target",
  );
  return (
    <View style={styles.container}>
      <OmpKeybindingsForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompKeybindingsPanelRegistration = definePanel("omp_keybindings", {
  component: OmpKeybindingsPanel,
  presentation: ompKeybindingsPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
