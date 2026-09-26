import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { OmpProviderLoginEvent } from "@getpaseo/protocol/messages";
import { useHostRuntimeClient } from "@/runtime/host-runtime";
import { providersSnapshotQueryRoot } from "@/hooks/use-providers-snapshot";
import { openExternalUrl } from "@/utils/open-external-url";
import { toErrorMessage } from "@/utils/error-messages";

type OmpProviderLoginStatus = "idle" | "running" | "completed" | "failed";
type OmpProviderLoginPrompt = Extract<
  OmpProviderLoginEvent,
  { kind: "input" | "select" | "confirm" }
>;
type OmpProviderLoginOpenUrl = Extract<OmpProviderLoginEvent, { kind: "open_url" }>;

interface OmpProviderLoginResult {
  status: OmpProviderLoginStatus;
  pendingPrompt: OmpProviderLoginPrompt | null;
  notices: string[];
  openUrl: OmpProviderLoginOpenUrl | null;
  error: string | null;
  start: (providerId: string) => Promise<void>;
  respond: (response: { value?: string; confirmed?: boolean; cancelled?: boolean }) => Promise<void>;
  cancel: () => Promise<void>;
}


export function useOmpProviderLogin(serverId: string): OmpProviderLoginResult {
  const client = useHostRuntimeClient(serverId);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<OmpProviderLoginStatus>("idle");
  const [pendingPrompt, setPendingPrompt] = useState<OmpProviderLoginPrompt | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [openUrl, setOpenUrl] = useState<OmpProviderLoginOpenUrl | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loginIdRef = useRef<string | null>(null);
  const statusRef = useRef<OmpProviderLoginStatus>("idle");
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const openedUrlRequestIdsRef = useRef(new Set<string>());
  const disposedRef = useRef(false);
  const loginAttemptRef = useRef(0);

  const clearSubscription = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  }, []);

  const handleProgressEvent = useCallback(
    (event: OmpProviderLoginEvent) => {
      if (disposedRef.current) return;

      if (event.kind === "open_url") {
        setOpenUrl(event);
        if (!openedUrlRequestIdsRef.current.has(event.uiRequestId)) {
          openedUrlRequestIdsRef.current.add(event.uiRequestId);
          void openExternalUrl(event.url);
        }
        return;
      }
      if (event.kind === "notify") {
        setNotices((current) => [...current, event.message]);
        return;
      }
      if (event.kind === "input" || event.kind === "select" || event.kind === "confirm") {
        setPendingPrompt(event);
        return;
      }
      if (event.kind === "completed") {
        loginIdRef.current = null;
        clearSubscription();
        statusRef.current = "completed";
        setStatus("completed");
        void queryClient.invalidateQueries({ queryKey: ["omp-providers", serverId] });
        void queryClient.invalidateQueries({ queryKey: providersSnapshotQueryRoot(serverId) });
        return;
      }
      loginIdRef.current = null;
      clearSubscription();
      statusRef.current = "failed";
      setStatus("failed");
      setError(event.error);
    },
    [clearSubscription, queryClient, serverId],
  );

  const cancel = useCallback(async () => {
    if (statusRef.current !== "running") return;

    loginAttemptRef.current += 1;
    const loginId = loginIdRef.current;
    loginIdRef.current = null;
    clearSubscription();
    statusRef.current = "idle";
    setStatus("idle");
    setPendingPrompt(null);
    if (!loginId || !client) return;

    try {
      await client.cancelOmpProviderLogin(loginId);
    } catch (cause) {
      statusRef.current = "failed";
      setStatus("failed");
      setError(toErrorMessage(cause));
      throw cause;
    }
  }, [clearSubscription, client]);

  const start = useCallback(
    async (providerId: string) => {
      if (statusRef.current === "running") return;
      if (!client) {
        statusRef.current = "failed";
        setStatus("failed");
        setError(null);
        return;
      }
      const attempt = loginAttemptRef.current + 1;
      loginAttemptRef.current = attempt;

      clearSubscription();
      loginIdRef.current = null;
      openedUrlRequestIdsRef.current.clear();
      setPendingPrompt(null);
      setNotices([]);
      setOpenUrl(null);
      setError(null);
      statusRef.current = "running";
      setStatus("running");

      const pendingEvents: Array<{ loginId: string; event: OmpProviderLoginEvent }> = [];
      let knownLoginId: string | null = null;
      const unsubscribe = client.on("omp.providers.login.progress", (message) => {
        if (knownLoginId === null) {
          pendingEvents.push({ loginId: message.payload.loginId, event: message.payload.event });
          return;
        }
        if (message.payload.loginId !== knownLoginId) return;
        handleProgressEvent(message.payload.event);
      });
      unsubscribeRef.current = unsubscribe;

      try {
        const response = await client.startOmpProviderLogin(providerId);
        if (
          disposedRef.current ||
          attempt !== loginAttemptRef.current ||
          statusRef.current !== "running"
        ) {
          unsubscribe();
          if (unsubscribeRef.current === unsubscribe) unsubscribeRef.current = null;
          void client.cancelOmpProviderLogin(response.loginId);
          return;
        }

        loginIdRef.current = response.loginId;
        knownLoginId = response.loginId;
        for (const buffered of pendingEvents) {
          if (buffered.loginId === response.loginId) handleProgressEvent(buffered.event);
        }
        pendingEvents.length = 0;
      } catch (cause) {
        unsubscribe();
        if (unsubscribeRef.current === unsubscribe) unsubscribeRef.current = null;
        if (disposedRef.current || attempt !== loginAttemptRef.current) return;
        loginIdRef.current = null;
        statusRef.current = "failed";
        setStatus("failed");
        setError(toErrorMessage(cause));
      }
    },
    [clearSubscription, client, handleProgressEvent],
  );

  const respond = useCallback(
    async (response: { value?: string; confirmed?: boolean; cancelled?: boolean }) => {
      const loginId = loginIdRef.current;
      const prompt = pendingPrompt;
      if (!client || !loginId || !prompt || statusRef.current !== "running") return;

      setPendingPrompt(null);
      try {
        await client.respondOmpProviderLogin(loginId, prompt.uiRequestId, response);
      } catch (cause) {
        setPendingPrompt(prompt);
        setError(toErrorMessage(cause));
        throw cause;
      }
    },
    [client, pendingPrompt],
  );

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      const loginId = loginIdRef.current;
      clearSubscription();
      if (loginId && client && statusRef.current === "running") {
        void client.cancelOmpProviderLogin(loginId);
      }
    };
  }, [clearSubscription, client]);

  return { status, pendingPrompt, notices, openUrl, error, start, respond, cancel };
}
