import { Compass } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { View } from "react-native";
import { OmpSkillsForm } from "@/omp-skills/omp-skills-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";

const ThemedCompass = withUnistyles(Compass);
const ompSkillsPanelPresentation = {
  label: (t) => t("panels.ompSkills.label"),
  subtitle: (t) => t("panels.ompSkills.subtitle"),
  tooltip: (t) => t("panels.ompSkills.tooltip"),
  icon: ThemedCompass,
} satisfies PanelPresentation;

function OmpSkillsPanel() {
  const { serverId, target } = usePaneContext();
  invariant(target.kind === "omp_skills", "OmpSkillsPanel requires omp_skills target");
  return (
    <View style={styles.container}>
      <OmpSkillsForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompSkillsPanelRegistration = definePanel("omp_skills", {
  component: OmpSkillsPanel,
  presentation: ompSkillsPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
