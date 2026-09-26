import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { DaemonClient } from "@getpaseo/client/internal/daemon-client";
import type { OmpStatisticsResponseMessage } from "@getpaseo/protocol/messages";
import { useFetchQuery } from "@/data/query";
import { useHostRuntimeClient, useHostRuntimeIsConnected } from "@/runtime/host-runtime";
import { useSessionStore } from "@/stores/session-store";

export const OMP_STATISTICS_STALE_TIME_MS = 5 * 60 * 1000;

type OmpStatisticsPayload = OmpStatisticsResponseMessage["payload"];
type OmpStatisticsClient = Pick<DaemonClient, "getOmpStatistics">;

export type OmpStatisticsView =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; payload: OmpStatisticsPayload; isRefreshing: boolean };

export function ompStatisticsQueryKey(serverId: string | null | undefined) {
  return ["ompStatistics", serverId ?? ""] as const;
}

async function fetchOmpStatistics(client: OmpStatisticsClient): Promise<OmpStatisticsPayload> {
  return await client.getOmpStatistics();
}

export function useOmpStatistics(serverId: string | null | undefined): {
  view: OmpStatisticsView;
  refresh: () => Promise<void>;
} {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const client = useHostRuntimeClient(serverId ?? "");
  const isConnected = useHostRuntimeIsConnected(serverId ?? "");
  const supportsOmpStatistics = useSessionStore(
    (state) => state.sessions[serverId ?? ""]?.serverInfo?.features?.ompStatistics === true,
  );
  const queryKey = useMemo(() => ompStatisticsQueryKey(serverId), [serverId]);
  const canFetch = Boolean(serverId && client && isConnected && supportsOmpStatistics);
  const queryFn = useCallback(async () => {
    if (!client) throw new Error(t("ompStatistics.errors.hostDisconnected"));
    return await fetchOmpStatistics(client);
  }, [client, t]);
  const query = useFetchQuery({
    queryKey,
    queryFn,
    enabled: canFetch,
    dataShape: "value",
    staleTimeMs: OMP_STATISTICS_STALE_TIME_MS,
  });
  const refresh = useCallback(async () => {
    if (!client || !canFetch) return;
    await queryClient.fetchQuery({
      queryKey,
      queryFn: () => client.getOmpStatistics({ forceRefresh: true }),
      staleTime: 0,
    });
  }, [canFetch, client, queryClient, queryKey]);
  const view = useMemo<OmpStatisticsView>(() => {
    if (!serverId || !client || !isConnected) {
      return { kind: "error", message: t("ompStatistics.errors.hostDisconnected") };
    }
    if (!supportsOmpStatistics) {
      return { kind: "error", message: t("ompStatistics.errors.updateHost") };
    }
    if (query.data) {
      return { kind: "ready", payload: query.data, isRefreshing: query.isFetching };
    }
    if (query.error) {
      return {
        kind: "error",
        message:
          query.error instanceof Error
            ? query.error.message
            : t("ompStatistics.errors.unavailable"),
      };
    }
    return { kind: "loading" };
  }, [
    client,
    isConnected,
    query.data,
    query.error,
    query.isFetching,
    serverId,
    supportsOmpStatistics,
    t,
  ]);

  return { view, refresh };
}
