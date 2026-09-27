import { Target } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { View } from "react-native";
import { OmpGoalForm } from "@/omp-goal/omp-goal-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";

const ThemedTarget = withUnistyles(Target);
const ompGoalPanelPresentation = {
  label: (t) => t("panels.ompGoal.label"),
  subtitle: (t) => t("panels.ompGoal.subtitle"),
  tooltip: (t) => t("panels.ompGoal.tooltip"),
  icon: ThemedTarget,
} satisfies PanelPresentation;

function OmpGoalPanel() {
  const { serverId, target } = usePaneContext();
  invariant(target.kind === "omp_goal", "OmpGoalPanel requires omp_goal target");
  return (
    <View style={styles.container}>
      <OmpGoalForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompGoalPanelRegistration = definePanel("omp_goal", {
  component: OmpGoalPanel,
  presentation: ompGoalPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
