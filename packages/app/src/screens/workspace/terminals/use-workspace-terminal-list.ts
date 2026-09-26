import type { DaemonClient } from "@ohmypcode/client/internal/daemon-client";
import type { ListTerminalsResponse } from "@ohmypcode/protocol/messages";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { workspaceTerminalsPushRoute } from "@/data/push-router";
import { useReplicaQuery } from "@/data/query";
import { buildTerminalsQueryKey } from "@/screens/workspace/terminals/state";

type ListTerminalsPayload = ListTerminalsResponse["payload"];

interface UseWorkspaceTerminalListInput {
  client: DaemonClient | null;
  enabled: boolean;
  serverId: string;
  workspaceDirectory: string | null;
  workspaceId: string;
}

export function useWorkspaceTerminalList(input: UseWorkspaceTerminalListInput) {
  const { client, enabled, serverId, workspaceDirectory, workspaceId } = input;
  const { t } = useTranslation();
  const queryKey = useMemo(
    () => buildTerminalsQueryKey(serverId, workspaceDirectory, workspaceId || null),
    [serverId, workspaceDirectory, workspaceId],
  );
  const query = useReplicaQuery<ListTerminalsPayload>({
    queryKey,
    enabled,
    pushEvent: "terminals_changed",
    meta: workspaceTerminalsPushRoute({
      enabled,
      serverId,
      cwd: workspaceDirectory ?? "",
      ...(workspaceId ? { workspaceId } : {}),
    }),
    queryFn: async () => {
      if (!client || !workspaceDirectory) {
        throw new Error(t("workspace.terminal.hostDisconnected"));
      }
      return client.listTerminals(workspaceDirectory, undefined, {
        workspaceId: workspaceId || undefined,
      });
    },
  });
  const terminals = useMemo(() => query.data?.terminals ?? [], [query.data]);

  return { query, queryKey, terminals };
}
