/**
 * `omp_sessions` panel for OhMyPCode.
 *
 * Lists OMP sessions for the agent's current working directory and lets the
 * user resume any one of them in-place (the live agent's runtime session
 * gets re-bound to the selected `.jsonl` file -- the same wire path as the
 * OMP CLI's `/switch` slash command). Distinct from the import sheet, which
 * spawns a *new* agent over the same file: this keeps the same agent but
 * drops its current session and adopts a different one.
 *
 * Capability-gated: the panel renders a placeholder when the connection is
 * down, when the host lacks the `ompSessionSwitch` server feature flag, or
 * when the agent doesn't expose `supportsOmpSessionSwitch` on its
 * `AgentCapabilityFlags`. Rows whose `filePath` is missing (non-OMP
 * providers, or providers that don't store sessions as a file) get a
 * disabled "Resume here" button with an explanatory tooltip rather than
 * being filtered -- keeps the surface honest about why a particular entry
 * can't be actioned.
 */
import { History } from "lucide-react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import invariant from "tiny-invariant";
import { View } from "react-native";
import { OmpSessionsForm } from "@/omp-sessions/omp-sessions-form";
import { usePaneContext } from "@/panels/pane-context";
import { definePanel, type PanelPresentation } from "@/panels/panel-registry";

const ThemedHistory = withUnistyles(History);
const ompSessionsPanelPresentation = {
  label: (t) => t("panels.ompSessions.label"),
  subtitle: (t) => t("panels.ompSessions.subtitle"),
  tooltip: (t) => t("panels.ompSessions.tooltip"),
  icon: ThemedHistory,
} satisfies PanelPresentation;

function OmpSessionsPanel() {
  const { serverId, target } = usePaneContext();
  invariant(target.kind === "omp_sessions", "OmpSessionsPanel requires omp_sessions target");
  return (
    <View style={styles.container}>
      <OmpSessionsForm serverId={serverId} agentId={target.agentId} />
    </View>
  );
}

export const ompSessionsPanelRegistration = definePanel("omp_sessions", {
  component: OmpSessionsPanel,
  presentation: ompSessionsPanelPresentation,
});

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
