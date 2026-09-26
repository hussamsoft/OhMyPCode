import { useShallow } from "zustand/react/shallow";
import { useSessionStore } from "@/stores/session-store";

export interface OmpCapabilityState {
  canUseVibe: boolean;
  canSelectTools: boolean;
}

export function selectOmpCapabilityState(input: {
  provider: string | undefined;
  supportsOmpVibe: boolean | undefined;
  supportsOmpToolSelection: boolean | undefined;
  serverSupportsVibe: boolean | undefined;
  serverSupportsTools: boolean | undefined;
}): OmpCapabilityState {
  const isOmp = input.provider === "omp";
  const hasServerFeatures =
    input.serverSupportsVibe === true && input.serverSupportsTools === true;
  return {
    canUseVibe:
      isOmp && hasServerFeatures && input.supportsOmpVibe === true,
    canSelectTools:
      isOmp && hasServerFeatures && input.supportsOmpToolSelection === true,
  };
}

export function useOmpCapabilities(
  serverId: string | null | undefined,
  agentId: string | null | undefined,
): OmpCapabilityState {
  return useSessionStore(
    useShallow((state) => {
      const session = state.sessions[serverId ?? ""];
      const agent = agentId ? session?.agents.get(agentId) : undefined;
      return selectOmpCapabilityState({
        provider: agent?.provider,
        supportsOmpVibe: agent?.capabilities.supportsOmpVibe,
        supportsOmpToolSelection: agent?.capabilities.supportsOmpToolSelection,
        serverSupportsVibe: session?.serverInfo?.features?.ompVibe,
        serverSupportsTools: session?.serverInfo?.features?.ompToolSelection,
      });
    }),
  );
}
