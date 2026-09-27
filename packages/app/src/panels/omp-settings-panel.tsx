import { Settings2 } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { OmpSettingsForm } from "@/omp-settings/omp-settings-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";
import { View } from "react-native";

const ThemedSettings2 = withUnistyles(Settings2);
const ompSettingsPanelPresentation = {
  label: (t) => t("panels.ompSettings.label"),
  subtitle: (t) => t("panels.ompSettings.subtitle"),
  tooltip: (t) => t("panels.ompSettings.tooltip"),
  icon: ThemedSettings2,
} satisfies PanelPresentation;

function OmpSettingsPanel() {
  const { serverId, target } = usePaneContext();
  invariant(target.kind === "omp_settings", "OmpSettingsPanel requires omp_settings target");
  return (
    <View style={styles.container}>
      <OmpSettingsForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompSettingsPanelRegistration = definePanel("omp_settings", {
  component: OmpSettingsPanel,
  presentation: ompSettingsPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
