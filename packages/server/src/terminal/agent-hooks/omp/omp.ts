import type { AgentHookActivityState, AgentHookProvider } from "../agent-hook-installer.js";
import { createOmpHookInstallStrategy } from "./omp-hook.js";

const OMP_EVENT_STATES: Record<string, AgentHookActivityState> = {
  agent_start: "running",
  agent_settled: "idle",
  tool_call: "needs-input",
  tool_result: "running",
};

export const ompAgentHookProvider: AgentHookProvider = {
  id: "omp",
  events: [
    { event: "agent_start" },
    { event: "agent_settled" },
    { event: "tool_call" },
    { event: "tool_result" },
  ],
  install: createOmpHookInstallStrategy(),
  async resolveActivity({ event }) {
    return OMP_EVENT_STATES[event] ?? null;
  },
};
