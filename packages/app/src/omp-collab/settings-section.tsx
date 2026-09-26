import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { ExternalLink, Eye, RefreshCw, ShieldCheck, SlidersHorizontal } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SettingsSection } from "@/components/settings/headings/settings-section";
import { useToast } from "@/contexts/toast-context";
import { useHostRuntimeClient, useHostRuntimeIsConnected } from "@/runtime/host-runtime";
import { useSessionStore } from "@/stores/session-store";
import { settingsStyles } from "@/styles/settings";
import { buildUsageRoute } from "@/utils/host-routes";
import {
  createAndCopyOmpCollabLink,
  shareAndCopyOmpSession,
  type OmpCollabAccess,
} from "./actions";
import {
  collectOmpSessionShareTargets,
  summarizeOmpCollabHosts,
  type OmpCollabHostSummary,
  type OmpSessionShareTarget,
} from "./model";

type HostListState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; hosts: OmpCollabHostSummary[] }
  | { kind: "error" };

function HostMetadata({ host }: { host: OmpCollabHostSummary }) {
  const { t } = useTranslation();
  const details = [host.cwd, host.model].filter((value): value is string => Boolean(value));
  return (
    <>
      {details.length > 0 ? (
        <Text style={styles.itemHint} numberOfLines={2}>
          {details.join(" · ")}
        </Text>
      ) : null}
      <View style={styles.badges}>
        {host.participants !== null ? (
          <StatusBadge
            label={t("settings.host.ompCollab.participants", { count: host.participants })}
            variant="muted"
          />
        ) : null}
        {host.busy ? (
          <StatusBadge label={t("settings.host.ompCollab.busy")} variant="warning" />
        ) : null}
        {host.inputRequired ? (
          <StatusBadge label={t("settings.host.ompCollab.inputRequired")} variant="warning" />
        ) : null}
        {host.relayConnected === false ? (
          <StatusBadge label={t("settings.host.ompCollab.reconnecting")} variant="warning" />
        ) : null}
        <StatusBadge
          label={
            host.access === "view"
              ? t("settings.host.ompCollab.viewOnly")
              : t("settings.host.ompCollab.controlAvailable")
          }
          variant={host.access === "view" ? "muted" : "success"}
        />
      </View>
    </>
  );
}

function ActiveHostRow({
  host,
  pendingAction,
  onShare,
}: {
  host: OmpCollabHostSummary;
  pendingAction: string | null;
  onShare: (host: OmpCollabHostSummary, access: OmpCollabAccess) => void;
}) {
  const { t } = useTranslation();
  const title =
    host.sessionName ??
    (host.pid !== null
      ? t("settings.host.ompCollab.hostFallbackWithPid", { pid: host.pid })
      : t("settings.host.ompCollab.hostFallback"));
  const viewKey = `host:${host.instanceId}:view`;
  const controlKey = `host:${host.instanceId}:control`;
  const isPending = pendingAction === viewKey || pendingAction === controlKey;
  const handleViewShare = useCallback(() => onShare(host, "view"), [host, onShare]);
  const handleControlShare = useCallback(() => onShare(host, "control"), [host, onShare]);

  return (
    <View style={styles.item} testID={`omp-collab-host-${host.instanceId}`}>
      <Text style={styles.itemTitle} numberOfLines={1}>
        {title}
      </Text>
      <HostMetadata host={host} />
      {host.access === "view" ? (
        <Text style={styles.permissionHint}>{t("settings.host.ompCollab.viewOnlyHint")}</Text>
      ) : null}
      <View style={styles.itemActions}>
        <Button
          size="sm"
          variant="outline"
          leftIcon={Eye}
          loading={pendingAction === viewKey}
          disabled={isPending}
          onPress={handleViewShare}
          testID={`omp-collab-host-${host.instanceId}-view`}
        >
          {t("settings.host.ompCollab.copyViewLink")}
        </Button>
        <Button
          size="sm"
          leftIcon={SlidersHorizontal}
          loading={pendingAction === controlKey}
          disabled={isPending || host.access === "view"}
          onPress={handleControlShare}
          testID={`omp-collab-host-${host.instanceId}-control`}
        >
          {t("settings.host.ompCollab.copyControlLink")}
        </Button>
      </View>
    </View>
  );
}

function SavedSessionRow({
  target,
  pendingAction,
  onShare,
}: {
  target: OmpSessionShareTarget;
  pendingAction: string | null;
  onShare: (target: OmpSessionShareTarget) => void;
}) {
  const { t } = useTranslation();
  const actionKey = `session:${target.sessionId}`;
  const title =
    target.title ??
    t("settings.host.ompCollab.sessionFallback", { id: target.agentId.slice(0, 7) });
  const handleShare = useCallback(() => onShare(target), [onShare, target]);
  return (
    <View style={styles.item} testID={`omp-share-session-${target.agentId}`}>
      <Text style={styles.itemTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.itemHint} numberOfLines={2}>
        {target.cwd}
      </Text>
      <View style={styles.itemActions}>
        <Button
          size="sm"
          variant="outline"
          leftIcon={ShieldCheck}
          loading={pendingAction === actionKey}
          disabled={pendingAction !== null}
          onPress={handleShare}
          testID={`omp-share-session-${target.agentId}-encrypted`}
        >
          {t("settings.host.ompCollab.copyEncryptedShare")}
        </Button>
      </View>
    </View>
  );
}

export function OmpCollabSettingsSection({ serverId }: { serverId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const client = useHostRuntimeClient(serverId);
  const isConnected = useHostRuntimeIsConnected(serverId);
  const agents = useSessionStore((state) => state.sessions[serverId]?.agents ?? null);
  const sessions = useMemo(() => collectOmpSessionShareTargets(agents?.values() ?? []), [agents]);
  const [hostList, setHostList] = useState<HostListState>({ kind: "idle" });
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const isSupported = useSessionStore(
    (state) => state.sessions[serverId]?.serverInfo?.features?.ompCollab === true,
  );
  const canUseActions = Boolean(client && isConnected && isSupported);

  const openUsage = useCallback(() => {
    router.push(buildUsageRoute());
  }, [router]);

  const refreshHosts = useCallback(async () => {
    if (!client || !isConnected) {
      toast.error(t("settings.host.ompCollab.hostDisconnected"));
      return;
    }
    if (!isSupported) {
      toast.error(t("settings.host.ompCollab.updateRequired"));
      return;
    }
    setHostList({ kind: "loading" });
    try {
      const response = await client.listOmpCollabHosts();
      setHostList({ kind: "ready", hosts: summarizeOmpCollabHosts(response.hosts) });
    } catch {
      setHostList({ kind: "error" });
      toast.error(t("settings.host.ompCollab.listFailed"));
    }
  }, [client, isConnected, isSupported, t, toast]);

  const shareHost = useCallback(
    async (host: OmpCollabHostSummary, access: OmpCollabAccess) => {
      if (!client || !canUseActions || pendingAction) return;
      const actionKey = `host:${host.instanceId}:${access}`;
      setPendingAction(actionKey);
      try {
        await createAndCopyOmpCollabLink({
          client,
          instanceId: host.instanceId,
          access,
          writeClipboard: Clipboard.setStringAsync,
        });
        toast.copied(
          access === "view"
            ? t("settings.host.ompCollab.viewLinkCopied")
            : t("settings.host.ompCollab.controlLinkCopied"),
        );
      } catch {
        toast.error(t("settings.host.ompCollab.shareFailed"));
      } finally {
        setPendingAction(null);
      }
    },
    [canUseActions, client, pendingAction, t, toast],
  );

  const shareSession = useCallback(
    async (target: OmpSessionShareTarget) => {
      if (!client || !canUseActions || pendingAction) return;
      setPendingAction(`session:${target.sessionId}`);
      try {
        await shareAndCopyOmpSession({
          client,
          sessionId: target.sessionId,
          writeClipboard: Clipboard.setStringAsync,
        });
        toast.copied(t("settings.host.ompCollab.encryptedShareCopied"));
      } catch {
        toast.error(t("settings.host.ompCollab.shareFailed"));
      } finally {
        setPendingAction(null);
      }
    },
    [canUseActions, client, pendingAction, t, toast],
  );

  return (
    <SettingsSection title={t("settings.host.ompCollab.title")}>
      <View style={styles.stack}>
        <View style={[settingsStyles.card, styles.introCard]}>
          <Text style={styles.description}>{t("settings.host.ompCollab.description")}</Text>
          <Text style={styles.securityNote}>{t("settings.host.ompCollab.securityNote")}</Text>
          <View style={styles.toolbar}>
            <Button size="sm" variant="outline" leftIcon={ExternalLink} onPress={openUsage}>
              {t("settings.host.ompCollab.openUsage")}
            </Button>
            <Button
              size="sm"
              leftIcon={RefreshCw}
              loading={hostList.kind === "loading"}
              disabled={!canUseActions || hostList.kind === "loading"}
              onPress={refreshHosts}
              testID="omp-collab-refresh-hosts"
            >
              {t("settings.host.ompCollab.refreshHosts")}
            </Button>
          </View>
        </View>

        {!isConnected ? (
          <Alert
            variant="info"
            title={t("settings.host.ompCollab.hostDisconnected")}
            description={t("settings.host.ompCollab.hostDisconnectedHint")}
          />
        ) : null}
        {isConnected && !isSupported ? (
          <Alert
            variant="warning"
            title={t("settings.host.ompCollab.updateRequired")}
            description={t("settings.host.ompCollab.updateRequiredHint")}
            testID="omp-collab-unsupported"
          />
        ) : null}

        <View>
          <Text style={styles.subheading}>{t("settings.host.ompCollab.activeHosts")}</Text>
          {hostList.kind === "idle" ? (
            <Text style={styles.emptyText}>{t("settings.host.ompCollab.refreshPrompt")}</Text>
          ) : null}
          {hostList.kind === "error" ? (
            <Alert
              variant="error"
              title={t("settings.host.ompCollab.listFailed")}
              description={t("settings.host.ompCollab.listFailedHint")}
            />
          ) : null}
          {hostList.kind === "ready" && hostList.hosts.length === 0 ? (
            <Text style={styles.emptyText}>{t("settings.host.ompCollab.noActiveHosts")}</Text>
          ) : null}
          {hostList.kind === "ready" && hostList.hosts.length > 0 ? (
            <View style={[settingsStyles.card, styles.list]}>
              {hostList.hosts.map((host, index) => (
                <View
                  key={host.instanceId}
                  style={index > 0 ? settingsStyles.rowBorder : undefined}
                >
                  <ActiveHostRow host={host} pendingAction={pendingAction} onShare={shareHost} />
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View>
          <Text style={styles.subheading}>{t("settings.host.ompCollab.savedSessions")}</Text>
          <Text style={styles.sectionHint}>{t("settings.host.ompCollab.savedSessionsHint")}</Text>
          {sessions.length === 0 ? (
            <Text style={styles.emptyText}>{t("settings.host.ompCollab.noSavedSessions")}</Text>
          ) : (
            <View style={[settingsStyles.card, styles.list]}>
              {sessions.map((target, index) => (
                <View
                  key={target.sessionId}
                  style={index > 0 ? settingsStyles.rowBorder : undefined}
                >
                  <SavedSessionRow
                    target={target}
                    pendingAction={pendingAction}
                    onShare={shareSession}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </SettingsSection>
  );
}

const styles = StyleSheet.create((theme) => ({
  stack: {
    gap: theme.spacing[4],
  },
  introCard: {
    gap: theme.spacing[3],
    padding: theme.spacing[4],
  },
  description: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
  },
  securityNote: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.fontSize.sm * 1.5,
  },
  toolbar: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
  },
  subheading: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing[2],
  },
  sectionHint: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing[2],
  },
  emptyText: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
    paddingVertical: theme.spacing[2],
  },
  list: {
    overflow: "hidden",
  },
  item: {
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  itemTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  itemHint: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  permissionHint: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  badges: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
  },
  itemActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
    marginTop: theme.spacing[1],
  },
}));
