import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  DaemonClient,
  OmpProvidersListPayload,
} from "@ohmypcode/client/internal/daemon-client";
import { useFetchQuery } from "@/data/query";
import { useHostRuntimeClient, useHostRuntimeIsConnected } from "@/runtime/host-runtime";
import { useSessionStore } from "@/stores/session-store";

const OMP_PROVIDERS_STALE_TIME_MS = 60_000;

type OmpProvidersClient = Pick<DaemonClient, "listOmpProviders">;

export function ompProvidersQueryKey(serverId: string | null | undefined) {
  return ["omp-providers", serverId ?? ""] as const;
}

async function fetchOmpProviders(client: OmpProvidersClient): Promise<OmpProvidersListPayload> {
  return await client.listOmpProviders();
}

interface OmpProvidersResult {
  providers: OmpProvidersListPayload["providers"];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<OmpProvidersListPayload | undefined>;
}

export function useOmpProviders(serverId: string | null | undefined): OmpProvidersResult {
  const normalizedServerId = serverId ?? "";
  const client = useHostRuntimeClient(normalizedServerId);
  const isConnected = useHostRuntimeIsConnected(normalizedServerId);
  const supportsOmpProviders = useSessionStore(
    (state) => state.sessions[normalizedServerId]?.serverInfo?.features?.ompProviders === true,
  );
  const queryKey = useMemo(() => ompProvidersQueryKey(serverId), [serverId]);
  const canFetch = Boolean(serverId && client && isConnected && supportsOmpProviders);
  const queryFn = useCallback(async () => {
    if (!client) {
      throw new Error("OMP providers host is unavailable");
    }
    return await fetchOmpProviders(client);
  }, [client]);
  const query = useFetchQuery({
    queryKey,
    queryFn,
    enabled: canFetch,
    dataShape: "value",
    staleTimeMs: OMP_PROVIDERS_STALE_TIME_MS,
  });
  const queryClient = useQueryClient();
  const refetch = useCallback(async () => {
    if (!client || !canFetch) return;
    return await queryClient.fetchQuery({
      queryKey,
      queryFn,
      staleTime: 0,
    });
  }, [canFetch, client, queryClient, queryFn, queryKey]);

  return {
    providers: query.data?.providers ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refetch,
  };
}
