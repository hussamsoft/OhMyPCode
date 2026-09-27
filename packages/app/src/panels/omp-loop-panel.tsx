import { Repeat } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { View } from "react-native";
import { OmpLoopForm } from "@/omp-loop/omp-loop-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";

const ThemedRepeat = withUnistyles(Repeat);
const ompLoopPanelPresentation = {
  label: (t) => t("panels.ompLoop.label"),
  subtitle: (t) => t("panels.ompLoop.subtitle"),
  tooltip: (t) => t("panels.ompLoop.tooltip"),
  icon: ThemedRepeat,
} satisfies PanelPresentation;

function OmpLoopPanel() {
  const { serverId, target } = usePaneContext();
  invariant(target.kind === "omp_loop", "OmpLoopPanel requires omp_loop target");
  return (
    <View style={styles.container}>
      <OmpLoopForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompLoopPanelRegistration = definePanel("omp_loop", {
  component: OmpLoopPanel,
  presentation: ompLoopPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
