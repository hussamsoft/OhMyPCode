import { useSessionStore } from "@/stores/session-store";
import { useWorkspaceLayoutStore } from "@/stores/workspace-layout-store";
import { buildWorkspaceTabPersistenceKey } from "@/workspace-tabs/model";

/** Opens the OMP MCP management screen for an agent in its owning workspace's main pane. */
export function openOmpMcpTarget(input: { agentId: string }): string | null {
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
    return store.openTab({
      workspaceKey,
      target: { kind: "omp_mcp", agentId: input.agentId },
      intent: "reveal",
    });
  }
  return null;
}
