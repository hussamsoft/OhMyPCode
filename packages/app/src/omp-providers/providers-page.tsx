import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import type { OmpProvidersListPayload } from "@getpaseo/client/internal/daemon-client";
import { AdaptiveTextInput } from "@/components/adaptive-modal-sheet";
import { SettingsSection } from "@/components/settings/headings/settings-section";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/contexts/toast-context";
import { useHostFeature } from "@/runtime/host-features";
import { useHostRuntimeClient } from "@/runtime/host-runtime";
import { settingsStyles } from "@/styles/settings";
import { confirmDialog } from "@/utils/confirm-dialog";
import { toErrorMessage } from "@/utils/error-messages";
import { OmpProviderLoginSheet } from "./login-sheet";
import { useOmpProviders } from "./use-omp-providers";
import type { Theme } from "@/styles/theme";

const ThemedLoadingSpinner = withUnistyles(LoadingSpinner);
const foregroundMutedMapping = (theme: Theme) => ({ color: theme.colors.foregroundMuted });

type OmpProvider = OmpProvidersListPayload["providers"][number];

interface OmpProviderRowProps {
  provider: OmpProvider;
  isFirst: boolean;
  isDisconnecting: boolean;
  onConnect: (provider: OmpProvider) => void;
  onDisconnect: (provider: OmpProvider) => void;
}

function OmpProviderRow({
  provider,
  isFirst,
  isDisconnecting,
  onConnect,
  onDisconnect,
}: OmpProviderRowProps) {
  const { t } = useTranslation();
  const handleConnect = useCallback(() => onConnect(provider), [onConnect, provider]);
  const handleDisconnect = useCallback(() => onDisconnect(provider), [onDisconnect, provider]);
  const isConnected = provider.authenticated;

  return (
    <View style={[settingsStyles.row, !isFirst && settingsStyles.rowBorder, styles.row]}>
      <View style={styles.rowContent}>
        <Text style={settingsStyles.rowTitle} numberOfLines={1}>
          {provider.name}
        </Text>
        <Text style={settingsStyles.rowHint} numberOfLines={1}>
          {provider.id}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <StatusBadge
          label={t(isConnected ? "ompProviders.connected" : "ompProviders.available")}
          variant={isConnected ? "success" : "muted"}
        />
        <Button size="sm" variant="outline" onPress={handleConnect} disabled={isDisconnecting}>
          {t(isConnected ? "ompProviders.reconnect" : "ompProviders.connect")}
        </Button>
        {isConnected ? (
          <Button
            size="sm"
            variant="outline"
            onPress={handleDisconnect}
            loading={isDisconnecting}
            disabled={isDisconnecting}
          >
            {t("ompProviders.disconnect")}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

interface ProviderSectionProps {
  title: string;
  providers: readonly OmpProvider[];
  emptyLabel: string;
  disconnectingProviderId: string | null;
  onConnect: (provider: OmpProvider) => void;
  onDisconnect: (provider: OmpProvider) => void;
}

function ProviderSection({
  title,
  providers,
  emptyLabel,
  disconnectingProviderId,
  onConnect,
  onDisconnect,
}: ProviderSectionProps) {
  return (
    <View style={styles.providerSection}>
      <Text style={styles.providerSectionTitle}>{title}</Text>
      {providers.length === 0 ? <Text style={styles.empty}>{emptyLabel}</Text> : null}
      {providers.length > 0 ? (
        <View style={settingsStyles.card}>
          {providers.map((provider, index) => (
            <OmpProviderRow
              key={provider.id}
              provider={provider}
              isFirst={index === 0}
              isDisconnecting={disconnectingProviderId === provider.id}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function OmpProvidersPage({ serverId }: { serverId: string }) {
  const { t } = useTranslation();
  const toast = useToast();
  const client = useHostRuntimeClient(serverId);
  const supportsOmpProviders = useHostFeature(serverId, "ompProviders");
  const { providers, isLoading, error, refetch } = useOmpProviders(serverId);
  const [search, setSearch] = useState("");
  const [loginProvider, setLoginProvider] = useState<OmpProvider | null>(null);
  const [isLoginSheetOpen, setIsLoginSheetOpen] = useState(false);
  const [disconnectingProviderId, setDisconnectingProviderId] = useState<string | null>(null);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredProviders = useMemo(() => {
    if (!normalizedSearch) return providers;
    return providers.filter((provider) => {
      return (
        provider.name.toLowerCase().includes(normalizedSearch) ||
        provider.id.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [normalizedSearch, providers]);
  const connectedProviders = useMemo(
    () => filteredProviders.filter((provider) => provider.authenticated),
    [filteredProviders],
  );
  const availableProviders = useMemo(
    () => filteredProviders.filter((provider) => !provider.authenticated),
    [filteredProviders],
  );

  const handleOpenLogin = useCallback((provider: OmpProvider) => {
    setLoginProvider(provider);
    setIsLoginSheetOpen(true);
  }, []);
  const handleCloseLogin = useCallback(() => setIsLoginSheetOpen(false), []);
  const handleDisconnect = useCallback(
    async (provider: OmpProvider) => {
      if (!client || disconnectingProviderId) return;

      const confirmed = await confirmDialog({
        title: t("ompProviders.disconnect"),
        message: t("ompProviders.disconnectConfirm", { name: provider.name }),
        confirmLabel: t("ompProviders.disconnect"),
        cancelLabel: t("ompProviders.cancel"),
        destructive: true,
      });
      if (!confirmed) return;

      setDisconnectingProviderId(provider.id);
      try {
        await client.logoutOmpProvider(provider.id);
        const refreshed = await refetch();
        if (refreshed?.providers.some((candidate) => candidate.id === provider.id && candidate.authenticated)) {
          toast.show(t("ompProviders.stillConnected"), { variant: "warning" });
        }
      } catch (cause) {
        toast.error(toErrorMessage(cause));
      } finally {
        setDisconnectingProviderId(null);
      }
    },
    [client, disconnectingProviderId, refetch, t, toast],
  );

  return (
    <>
      <SettingsSection title={t("ompProviders.title")}>
        <View style={[settingsStyles.card, styles.descriptionCard]}>
          <Text style={styles.description}>{t("ompProviders.description")}</Text>
        </View>

        {!supportsOmpProviders ? (
          <Alert variant="info" title={t("ompProviders.updateHost")} testID="omp-providers-unsupported" />
        ) : null}

        {supportsOmpProviders ? (
          <>
            <AdaptiveTextInput
              placeholder={t("ompProviders.searchPlaceholder")}
              accessibilityLabel={t("ompProviders.searchPlaceholder")}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearch}
              style={styles.search}
              testID="omp-providers-search"
            />
            {isLoading ? (
              <View style={styles.loading}>
                <ThemedLoadingSpinner size={14} uniProps={foregroundMutedMapping} />
              </View>
            ) : null}
            {error ? <Alert variant="error" title={t("ompProviders.failed")} description={error.message} /> : null}
            {!isLoading && !error ? (
              <View style={styles.sections}>
                <ProviderSection
                  title={t("ompProviders.connected")}
                  providers={connectedProviders}
                  emptyLabel={t("ompProviders.noneConnected")}
                  disconnectingProviderId={disconnectingProviderId}
                  onConnect={handleOpenLogin}
                  onDisconnect={handleDisconnect}
                />
                <ProviderSection
                  title={t("ompProviders.available")}
                  providers={availableProviders}
                  emptyLabel={t("ompProviders.empty")}
                  disconnectingProviderId={disconnectingProviderId}
                  onConnect={handleOpenLogin}
                  onDisconnect={handleDisconnect}
                />
              </View>
            ) : null}
          </>
        ) : null}
      </SettingsSection>
      <OmpProviderLoginSheet
        visible={isLoginSheetOpen}
        serverId={serverId}
        provider={loginProvider}
        onClose={handleCloseLogin}
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  descriptionCard: {
    padding: theme.spacing[4],
  },
  description: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.base,
  },
  search: {
    backgroundColor: theme.colors.surface0,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
  },
  loading: {
    alignItems: "center",
    paddingVertical: theme.spacing[3],
  },
  sections: {
    gap: theme.spacing[6],
  },
  providerSection: {
    gap: theme.spacing[3],
  },
  providerSectionTitle: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing[1],
  },
  empty: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.base,
  },
  row: {
    gap: theme.spacing[3],
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowActions: {
    alignItems: "flex-end",
    gap: theme.spacing[2],
  },
}));
