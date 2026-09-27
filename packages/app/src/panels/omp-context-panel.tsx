import { Gauge } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { View } from "react-native";
import { OmpContextForm } from "@/omp-context/omp-context-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";

const ThemedGauge = withUnistyles(Gauge);
const ompContextPanelPresentation = {
  label: (t) => t("panels.ompContext.label"),
  subtitle: (t) => t("panels.ompContext.subtitle"),
  tooltip: (t) => t("panels.ompContext.tooltip"),
  icon: ThemedGauge,
} satisfies PanelPresentation;

function OmpContextPanel() {
  const { serverId, target } = usePaneContext();
  invariant(target.kind === "omp_context", "OmpContextPanel requires omp_context target");
  return (
    <View style={styles.container}>
      <OmpContextForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompContextPanelRegistration = definePanel("omp_context", {
  component: OmpContextPanel,
  presentation: ompContextPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
