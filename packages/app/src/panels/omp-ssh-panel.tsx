import { Server } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { View } from "react-native";
import { OmpSshForm } from "@/omp-ssh/omp-ssh-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";

const ThemedServer = withUnistyles(Server);
const ompSshPanelPresentation = {
  label: (t) => t("panels.ompSsh.label"),
  subtitle: (t) => t("panels.ompSsh.subtitle"),
  tooltip: (t) => t("panels.ompSsh.tooltip"),
  icon: ThemedServer,
} satisfies PanelPresentation;

function OmpSshPanel() {
  const { serverId, target } = usePaneContext();
  invariant(target.kind === "omp_ssh", "OmpSshPanel requires omp_ssh target");
  return (
    <View style={styles.container}>
      <OmpSshForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompSshPanelRegistration = definePanel("omp_ssh", {
  component: OmpSshPanel,
  presentation: ompSshPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
