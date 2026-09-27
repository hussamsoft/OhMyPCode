import { Users } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { View } from "react-native";
import { OmpAgentsHubForm } from "@/omp-agents-hub/omp-agents-hub-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";

const ThemedUsers = withUnistyles(Users);
const ompAgentsHubPanelPresentation = {
  label: (t) => t("panels.ompAgentsHub.label"),
  subtitle: (t) => t("panels.ompAgentsHub.subtitle"),
  tooltip: (t) => t("panels.ompAgentsHub.tooltip"),
  icon: ThemedUsers,
} satisfies PanelPresentation;

function OmpAgentsHubPanel() {
  const { serverId, target } = usePaneContext();
  invariant(target.kind === "omp_agents_hub", "OmpAgentsHubPanel requires omp_agents_hub target");
  return (
    <View style={styles.container}>
      <OmpAgentsHubForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompAgentsHubPanelRegistration = definePanel("omp_agents_hub", {
  component: OmpAgentsHubPanel,
  presentation: ompAgentsHubPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
