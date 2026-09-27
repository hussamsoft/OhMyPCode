import { Package } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { View } from "react-native";
import { OmpPluginsForm } from "@/omp-plugins/omp-plugins-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";

const ThemedPackage = withUnistyles(Package);
const ompPluginsPanelPresentation = {
  label: (t) => t("panels.ompPlugins.label"),
  subtitle: (t) => t("panels.ompPlugins.subtitle"),
  tooltip: (t) => t("panels.ompPlugins.tooltip"),
  icon: ThemedPackage,
} satisfies PanelPresentation;

function OmpPluginsPanel() {
  const { serverId, target } = usePaneContext();
  invariant(target.kind === "omp_plugins", "OmpPluginsPanel requires omp_plugins target");
  return (
    <View style={styles.container}>
      <OmpPluginsForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompPluginsPanelRegistration = definePanel("omp_plugins", {
  component: OmpPluginsPanel,
  presentation: ompPluginsPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
