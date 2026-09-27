import { agentPanelRegistration } from "@/panels/agent-panel";
import { browserPanelRegistration } from "@/desktop/browser/panel";
import {
  changesTreePanelRegistration,
  commitDiffPanelRegistration,
  workingDiffPanelRegistration,
} from "@/panels/diff-panel";
import { draftPanelRegistration } from "@/panels/draft-panel";
import { filePanelRegistration } from "@/panels/file-panel";
import { filesPanelRegistration } from "@/panels/files-panel";
import { registerPanel } from "@/panels/panel-registry";
import { setupPanelRegistration } from "@/panels/setup-panel";
import { terminalPanelRegistration } from "@/panels/terminal-panel";
import { providerSubagentPanelRegistration } from "@/panels/provider-subagent-panel";
import { ompVibePanelRegistration } from "@/omp-vibe/vibe-panel";
import { ompSettingsPanelRegistration } from "@/panels/omp-settings-panel";
import { ompKeybindingsPanelRegistration } from "@/panels/omp-keybindings-panel";
import { ompContextPanelRegistration } from "@/panels/omp-context-panel";
import { ompMcpPanelRegistration } from "@/panels/omp-mcp-panel";
import { ompSshPanelRegistration } from "@/panels/omp-ssh-panel";
import { ompGoalPanelRegistration } from "@/panels/omp-goal-panel";
import { ompLoopPanelRegistration } from "@/panels/omp-loop-panel";
import { ompPluginsPanelRegistration } from "@/panels/omp-plugins-panel";
import { ompSkillsPanelRegistration } from "@/panels/omp-skills-panel";
import { ompAgentsHubPanelRegistration } from "@/panels/omp-agents-hub-panel";
import { pullRequestPanelRegistration } from "@/panels/pull-request-panel";
import { pluginPanelRegistration } from "@/plugins/workspace-panels/panel";
import { newTabPanelRegistration } from "@/panels/new-tab-panel";

let panelsRegistered = false;

export function ensurePanelsRegistered(): void {
  if (panelsRegistered) {
    return;
  }
  registerPanel(draftPanelRegistration);
  registerPanel(newTabPanelRegistration);
  registerPanel(agentPanelRegistration);
  registerPanel(providerSubagentPanelRegistration);
  registerPanel(ompVibePanelRegistration);
  registerPanel(ompSettingsPanelRegistration);
  registerPanel(ompKeybindingsPanelRegistration);
  registerPanel(ompContextPanelRegistration);
  registerPanel(ompMcpPanelRegistration);
  registerPanel(ompSshPanelRegistration);
  registerPanel(ompGoalPanelRegistration);
  registerPanel(ompLoopPanelRegistration);
  registerPanel(ompPluginsPanelRegistration);
  registerPanel(ompSkillsPanelRegistration);
  registerPanel(ompAgentsHubPanelRegistration);
  registerPanel(setupPanelRegistration);
  registerPanel(terminalPanelRegistration);
  registerPanel(browserPanelRegistration);
  registerPanel(filePanelRegistration);
  registerPanel(filesPanelRegistration);
  registerPanel(pullRequestPanelRegistration);
  registerPanel(commitDiffPanelRegistration);
  registerPanel(workingDiffPanelRegistration);
  registerPanel(changesTreePanelRegistration);
  registerPanel(pluginPanelRegistration);
  panelsRegistered = true;
}
