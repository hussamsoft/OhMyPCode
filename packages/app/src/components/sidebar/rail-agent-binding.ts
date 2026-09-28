import { useSessionStore } from "@/stores/session-store";

/** The slice of a session the binding rule needs. */
export interface RailAgentCandidate {
  id: string;
}

/** The slice of a session the binding rule needs, minus the agents. */
export interface RailAgentSession {
  focusedAgentId: string | null;
  agents: Map<string, RailAgentCandidate>;
}

/**
 * Pick the agent a global navigation rail should act on.
 *
 * Two of the seven OMP rail entries -- Vibe team and Plugins -- are
 * agent-scoped: their targets resolve the owning workspace from an `agentId`.
 * The rail is not scoped to a workspace, so the binding has to be derived.
 *
 * The rule is "the agent you were last looking at": a session's focused agent
 * wins outright, and otherwise the most recently active agent across all
 * sessions does. A focused agent beats recency on purpose -- recency is a
 * fallback for a session nobody is looking at, not a reason to yank the rail
 * away from the agent in front of them.
 *
 * Returns null when there is no agent at all, so callers can disable the
 * agent-scoped entries rather than navigate somewhere arbitrary.
 */
export function selectRailAgentId(
  sessions: Iterable<RailAgentSession>,
  lastActivityAt: (agentId: string) => number | undefined,
): string | null {
  let bestId: string | null = null;
  let bestAt = -Infinity;

  for (const session of sessions) {
    const focused = session.focusedAgentId;
    if (focused && session.agents.has(focused)) {
      return focused;
    }
    for (const agent of session.agents.values()) {
      const at = lastActivityAt(agent.id) ?? 0;
      if (at > bestAt) {
        bestAt = at;
        bestId = agent.id;
      }
    }
  }
  return bestId;
}

/** Store-shaped wrapper: resolves the rail's agent from live session state. */
export function useRailAgentId(): string | null {
  return useSessionStore((state) =>
    selectRailAgentId(Object.values(state.sessions), (agentId) => {
      const recency = state.agentLastActivity.get(agentId);
      if (recency) return recency.getTime();
      for (const session of Object.values(state.sessions)) {
        const agent = session.agents.get(agentId);
        if (agent) return agent.lastActivityAt?.getTime();
      }
      return undefined;
    }),
  );
}
