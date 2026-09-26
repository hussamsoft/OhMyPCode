import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";
import { buildWorkspaceTabPersistenceKey } from "@/workspace-tabs/model";

/** Opens the Vibe team or a worker transcript in its owning workspace. */
export function openOmpVibeTarget(input: { agentId: string; workerId: string | null }): string | null {
  const session = useSessionStore.getState().sessions;
  for (const serverSession of Object.values(session)) {
    const agent = serverSession.agents.get(input.agentId);
    if (!agent || !agent.workspaceId) continue;
    const workspaceKey = buildWorkspaceTabPersistenceKey({
      serverId: agent.serverId,
      workspaceId: agent.workspaceId,
    });
    if (!workspaceKey) continue;
    const store = useWorkspaceLayoutStore.getState();
    const sidePaneId = store.ensureSidePane(workspaceKey, { focus: true });
    if (!sidePaneId) return null;
    return store.openTab({
      workspaceKey,
      target: { kind: "omp_vibe", agentId: input.agentId, workerId: input.workerId },
      intent: "reveal",
    });
  }
  return null;
}
