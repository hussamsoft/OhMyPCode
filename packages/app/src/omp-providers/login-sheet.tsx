import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import type { OmpProviderLoginEvent } from "@getpaseo/protocol/messages";
import {
  AdaptiveModalSheet,
  AdaptiveTextInput,
  type SheetHeader,
} from "@/components/adaptive-modal-sheet";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Theme } from "@/styles/theme";
import { openExternalUrl } from "@/utils/open-external-url";
import type { EditingTextInputHandle } from "@/components/ui/text-input";
import { useOmpProviderLogin } from "./use-omp-provider-login";

type LoginPrompt = Extract<OmpProviderLoginEvent, { kind: "input" | "select" | "confirm" }>;
type LoginOpenUrl = Extract<OmpProviderLoginEvent, { kind: "open_url" }>;

const ThemedLoadingSpinner = withUnistyles(LoadingSpinner);
const foregroundMutedMapping = (theme: Theme) => ({ color: theme.colors.foregroundMuted });

interface OmpProviderLoginSheetProps {
  visible: boolean;
  serverId: string;
  provider: { id: string; name: string } | null;
  onClose: () => void;
}

function LoginNotices({ notices }: { notices: readonly string[] }) {
  if (notices.length === 0) return null;
  return (
    <View style={styles.notices}>
      {notices.map((notice) => (
        <Text key={notice} style={styles.notice}>
          {notice}
        </Text>
      ))}
    </View>
  );
}

function LoginOpenUrlCard({
  openUrl,
  onOpen,
}: {
  openUrl: LoginOpenUrl | null;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  if (!openUrl) return null;
  return (
    <View style={styles.openUrlCard}>
      {openUrl.instructions ? (
        <Text style={styles.instructions}>{openUrl.instructions}</Text>
      ) : null}
      <Text style={styles.url} selectable>
        {openUrl.url}
      </Text>
      <Button size="sm" variant="outline" onPress={onOpen}>
        {t("ompProviders.openSignIn")}
      </Button>
    </View>
  );
}

function LoginInputPrompt({
  prompt,
  onRespond,
}: {
  prompt: Extract<LoginPrompt, { kind: "input" }>;
  onRespond: (value: string) => Promise<void>;
}) {
  const inputRef = useRef<EditingTextInputHandle>(null);
  const inputValueRef = useRef("");
  const { t } = useTranslation();
  useEffect(() => {
    inputValueRef.current = "";
    inputRef.current?.replaceText("");
  }, [prompt.uiRequestId]);
  const handleInputChange = useCallback((value: string) => {
    inputValueRef.current = value;
  }, []);
  const handleSubmit = useCallback(() => {
    const value = inputValueRef.current;
    inputValueRef.current = "";
    inputRef.current?.replaceText("");
    void onRespond(value).catch(() => undefined);
  }, [onRespond]);
  return (
    <View style={styles.prompt}>
      <Text style={styles.promptTitle}>{prompt.title}</Text>
      <AdaptiveTextInput
        key={prompt.uiRequestId}
        ref={inputRef}
        accessibilityLabel={prompt.title}
        placeholder={prompt.placeholder}
        secureTextEntry={prompt.secret}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={handleInputChange}
        onSubmitEditing={handleSubmit}
        style={styles.input}
        testID="omp-provider-login-input"
      />
      <Button size="sm" variant="default" onPress={handleSubmit}>
        {t("ompProviders.submit")}
      </Button>
    </View>
  );
}

function LoginSelectOption({
  option,
  onSelect,
}: {
  option: string;
  onSelect: (value: string) => Promise<void>;
}) {
  const handlePress = useCallback(() => {
    void onSelect(option).catch(() => undefined);
  }, [onSelect, option]);
  return (
    <Button size="sm" variant="secondary" onPress={handlePress}>
      {option}
    </Button>
  );
}

function LoginSelectPrompt({
  prompt,
  onSelect,
}: {
  prompt: Extract<LoginPrompt, { kind: "select" }>;
  onSelect: (value: string) => Promise<void>;
}) {
  return (
    <View style={styles.prompt}>
      {prompt.title ? <Text style={styles.promptTitle}>{prompt.title}</Text> : null}
      <View style={styles.options}>
        {prompt.options.map((option) => (
          <LoginSelectOption key={option} option={option} onSelect={onSelect} />
        ))}
      </View>
    </View>
  );
}

function LoginConfirmButton({
  confirmed,
  label,
  onConfirm,
  variant,
}: {
  confirmed: boolean;
  label: string;
  onConfirm: (confirmed: boolean) => Promise<void>;
  variant: "default" | "secondary";
}) {
  const handlePress = useCallback(() => {
    void onConfirm(confirmed).catch(() => undefined);
  }, [confirmed, onConfirm]);
  return (
    <Button size="sm" variant={variant} style={styles.actionButton} onPress={handlePress}>
      {label}
    </Button>
  );
}

function LoginConfirmPrompt({
  prompt,
  onConfirm,
}: {
  prompt: Extract<LoginPrompt, { kind: "confirm" }>;
  onConfirm: (confirmed: boolean) => Promise<void>;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.prompt}>
      {prompt.title ? <Text style={styles.promptTitle}>{prompt.title}</Text> : null}
      {prompt.message ? <Text style={styles.message}>{prompt.message}</Text> : null}
      <View style={styles.actions}>
        <LoginConfirmButton
          confirmed={false}
          label={t("ompProviders.no")}
          onConfirm={onConfirm}
          variant="secondary"
        />
        <LoginConfirmButton
          confirmed
          label={t("ompProviders.yes")}
          onConfirm={onConfirm}
          variant="default"
        />
      </View>
    </View>
  );
}

function LoginPromptContent({
  status,
  prompt,
  onInput,
  onSelect,
  onConfirm,
}: {
  status: "idle" | "running" | "completed" | "failed";
  prompt: LoginPrompt | null;
  onInput: (value: string) => Promise<void>;
  onSelect: (value: string) => Promise<void>;
  onConfirm: (confirmed: boolean) => Promise<void>;
}) {
  if (status !== "running") return null;
  if (!prompt) {
    return (
      <View style={styles.pending}>
        <ThemedLoadingSpinner size={14} uniProps={foregroundMutedMapping} />
      </View>
    );
  }
  switch (prompt.kind) {
    case "input":
      return <LoginInputPrompt prompt={prompt} onRespond={onInput} />;
    case "select":
      return <LoginSelectPrompt prompt={prompt} onSelect={onSelect} />;
    case "confirm":
      return <LoginConfirmPrompt prompt={prompt} onConfirm={onConfirm} />;
  }
}

function LoginResultContent({
  status,
  error,
  onRetry,
  onCancel,
}: {
  status: "idle" | "running" | "completed" | "failed";
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  if (status === "completed") {
    return <Text style={styles.completed}>{t("ompProviders.completed")}</Text>;
  }
  if (status === "failed") {
    return (
      <View style={styles.failed}>
        <Text style={styles.error}>{error ?? t("ompProviders.failed")}</Text>
        <Button size="sm" variant="default" onPress={onRetry}>
          {t("ompProviders.retry")}
        </Button>
      </View>
    );
  }
  return (
    <>
      {status === "running" && error ? <Text style={styles.error}>{error}</Text> : null}
      {status === "running" ? (
        <Button size="sm" variant="secondary" onPress={onCancel}>
          {t("ompProviders.cancel")}
        </Button>
      ) : null}
    </>
  );
}

export function OmpProviderLoginSheet({
  visible,
  serverId,
  provider,
  onClose,
}: OmpProviderLoginSheetProps) {
  const { status, pendingPrompt, notices, openUrl, error, start, respond, cancel } =
    useOmpProviderLogin(serverId);
  const startedProviderIdRef = useRef<string | null>(null);
  const header = useMemo<SheetHeader>(() => ({ title: provider?.name ?? "" }), [provider?.name]);
  useEffect(() => {
    if (!visible) {
      startedProviderIdRef.current = null;
      return;
    }
    if (!provider || startedProviderIdRef.current === provider.id) return;
    startedProviderIdRef.current = provider.id;
    void start(provider.id);
  }, [provider, start, visible]);
  useEffect(() => {
    if (!visible || status !== "completed") return;
    const timeout = setTimeout(onClose, 1500);
    return () => clearTimeout(timeout);
  }, [onClose, status, visible]);
  const handleCancel = useCallback(() => {
    void cancel().catch(() => undefined);
    onClose();
  }, [cancel, onClose]);
  const handleOpenSignIn = useCallback(() => {
    if (openUrl) void openExternalUrl(openUrl.url);
  }, [openUrl]);
  const handleInput = useCallback(
    async (value: string) => {
      await respond({ value });
    },
    [respond],
  );
  const handleSelect = useCallback(
    async (value: string) => {
      await respond({ value });
    },
    [respond],
  );
  const handleConfirm = useCallback(
    async (confirmed: boolean) => {
      await respond({ confirmed });
    },
    [respond],
  );
  const handleRetry = useCallback(() => {
    if (provider) void start(provider.id);
  }, [provider, start]);
  if (!provider) return null;
  return (
    <AdaptiveModalSheet
      header={header}
      visible={visible}
      onClose={handleCancel}
      testID="omp-provider-login-sheet"
    >
      <View style={styles.body}>
        <LoginNotices notices={notices} />
        <LoginOpenUrlCard openUrl={openUrl} onOpen={handleOpenSignIn} />
        <LoginPromptContent
          status={status}
          prompt={pendingPrompt}
          onInput={handleInput}
          onSelect={handleSelect}
          onConfirm={handleConfirm}
        />
        <LoginResultContent
          status={status}
          error={error}
          onRetry={handleRetry}
          onCancel={handleCancel}
        />
      </View>
    </AdaptiveModalSheet>
  );
}

const styles = StyleSheet.create((theme) => ({
  body: {
    gap: theme.spacing[3],
    paddingBottom: theme.spacing[2],
  },
  notices: {
    gap: theme.spacing[2],
  },
  notice: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.base,
  },
  openUrlCard: {
    gap: theme.spacing[3],
    padding: theme.spacing[4],
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  instructions: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
  },
  url: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
  },
  pending: {
    alignItems: "center",
    paddingVertical: theme.spacing[3],
  },
  prompt: {
    gap: theme.spacing[3],
  },
  promptTitle: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  message: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.base,
  },
  input: {
    backgroundColor: theme.colors.surface0,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
  },
  options: {
    gap: theme.spacing[2],
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing[2],
  },
  actionButton: {
    flex: 1,
  },
  completed: {
    color: theme.colors.statusSuccess,
    fontSize: theme.fontSize.base,
  },
  failed: {
    gap: theme.spacing[3],
  },
  error: {
    color: theme.colors.statusDanger,
    fontSize: theme.fontSize.base,
  },
}));
