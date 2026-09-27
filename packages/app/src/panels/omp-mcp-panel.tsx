import { Plug } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { View } from "react-native";
import { OmpMcpForm } from "@/omp-mcp/omp-mcp-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";

const ThemedPlug = withUnistyles(Plug);
const ompMcpPanelPresentation = {
  label: (t) => t("panels.ompMcp.label"),
  subtitle: (t) => t("panels.ompMcp.subtitle"),
  tooltip: (t) => t("panels.ompMcp.tooltip"),
  icon: ThemedPlug,
} satisfies PanelPresentation;

function OmpMcpPanel() {
  const { serverId, target } = usePaneContext();
  invariant(target.kind === "omp_mcp", "OmpMcpPanel requires omp_mcp target");
  return (
    <View style={styles.container}>
      <OmpMcpForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompMcpPanelRegistration = definePanel("omp_mcp", {
  component: OmpMcpPanel,
  presentation: ompMcpPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
