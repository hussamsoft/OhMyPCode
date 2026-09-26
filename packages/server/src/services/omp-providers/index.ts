import { tmpdir } from "node:os";
import type pino from "pino";
import type { OmpProviderLoginEvent } from "@ohmypcode/protocol/messages";
import { execCommand } from "../../utils/spawn.js";
import type { OmpRuntimeEvent } from "../../server/agent/providers/omp/rpc-types.js";
import { OmpCliRuntime } from "../../server/agent/providers/omp/cli-runtime.js";
import type { OmpRuntime, OmpRuntimeSession } from "../../server/agent/providers/omp/runtime.js";
import { resolveOmpCommand } from "../omp-command.js";

const PROVIDER_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;

export interface OmpLoginProviderSummary {
  id: string;
  name: string;
  authenticated: boolean;
  available: boolean;
}

export type { OmpProviderLoginEvent } from "@ohmypcode/protocol/messages";

export interface OmpProviderLoginHandle {
  respond(
    uiRequestId: string,
    response: { value?: string; confirmed?: boolean; cancelled?: boolean },
  ): void;
  cancel(): Promise<void>;
}

export interface OmpProvidersService {
  listProviders(): Promise<OmpLoginProviderSummary[]>;
  startLogin(
    providerId: string,
    onEvent: (event: OmpProviderLoginEvent) => void,
  ): Promise<OmpProviderLoginHandle>;
  logout(providerId: string): Promise<void>;
}

export class OmpProvidersError extends Error {
  constructor(readonly code: "invalid_provider" | "omp_providers_failed") {
    super(code === "invalid_provider" ? "Invalid OMP provider" : "OMP providers are unavailable");
    this.name = "OmpProvidersError";
  }
}

export interface CreateOmpProvidersServiceOptions {
  logger: pino.Logger;
  runtime?: OmpRuntime;
  execute?: typeof execCommand;
}

function assertProviderId(providerId: string): void {
  if (!PROVIDER_ID_PATTERN.test(providerId)) {
    throw new OmpProvidersError("invalid_provider");
  }
}

function startRuntimeSession(runtime: OmpRuntime): Promise<OmpRuntimeSession> {
  return runtime.startSession({
    cwd: tmpdir(),
    protocolMode: "rpc",
    noSession: true,
    extraArgs: ["--no-extensions", "--no-skills", "--no-lsp"],
  });
}

function buildOpenUrlEvent(
  event: Extract<OmpRuntimeEvent, { type: "extension_ui_request" }>,
): OmpProviderLoginEvent | null {
  const url = event.url ?? event.launchUrl;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  } catch {
    return null;
  }
  return {
    kind: "open_url",
    uiRequestId: event.id,
    url,
    ...(event.instructions ? { instructions: event.instructions } : {}),
  };
}

function buildInputEvent(
  event: Extract<OmpRuntimeEvent, { type: "extension_ui_request" }>,
): OmpProviderLoginEvent {
  return {
    kind: "input",
    uiRequestId: event.id,
    title: event.title ?? "",
    ...(event.placeholder ? { placeholder: event.placeholder } : {}),
    secret: /key|token|secret|password/i.test(event.title ?? ""),
  };
}

function buildSelectEvent(
  event: Extract<OmpRuntimeEvent, { type: "extension_ui_request" }>,
): OmpProviderLoginEvent {
  return {
    kind: "select",
    uiRequestId: event.id,
    ...(event.title ? { title: event.title } : {}),
    options: event.options ?? [],
  };
}

function buildConfirmEvent(
  event: Extract<OmpRuntimeEvent, { type: "extension_ui_request" }>,
): OmpProviderLoginEvent {
  return {
    kind: "confirm",
    uiRequestId: event.id,
    ...(event.title ? { title: event.title } : {}),
    ...(event.message ? { message: event.message } : {}),
  };
}

function buildNotifyEvent(
  event: Extract<OmpRuntimeEvent, { type: "extension_ui_request" }>,
): OmpProviderLoginEvent {
  const notifyType = "notifyType" in event ? event.notifyType : undefined;
  return {
    kind: "notify",
    message: event.message ?? "",
    level:
      notifyType === "warning" || notifyType === "error" || notifyType === "info"
        ? notifyType
        : "info",
  };
}

function emitExtensionEvent(
  event: Extract<OmpRuntimeEvent, { type: "extension_ui_request" }>,
  emit: (event: OmpProviderLoginEvent) => void,
): void {
  let loginEvent: OmpProviderLoginEvent | null;
  switch (event.method) {
    case "open_url":
      loginEvent = buildOpenUrlEvent(event);
      break;
    case "input":
      loginEvent = buildInputEvent(event);
      break;
    case "select":
      loginEvent = buildSelectEvent(event);
      break;
    case "confirm":
      loginEvent = buildConfirmEvent(event);
      break;
    case "notify":
      loginEvent = buildNotifyEvent(event);
      break;
    default:
      return;
  }
  if (loginEvent) emit(loginEvent);
}

export function createOmpProvidersService({
  logger,
  runtime = new OmpCliRuntime({ logger }),
  execute = execCommand,
}: CreateOmpProvidersServiceOptions): OmpProvidersService {
  return {
    async listProviders() {
      const session = await startRuntimeSession(runtime);
      try {
        const providers = await session.getLoginProviders();
        return providers
          .map(({ id, name, authenticated, available }) => ({
            id,
            name,
            authenticated: authenticated ?? false,
            available: available ?? false,
          }))
          .sort(
            (left, right) =>
              Number(right.authenticated) - Number(left.authenticated) ||
              left.name.localeCompare(right.name),
          );
      } finally {
        await session.close();
      }
    },

    async startLogin(providerId, onEvent) {
      assertProviderId(providerId);
      const session = await startRuntimeSession(runtime);
      let closed = false;
      let terminal = false;
      const emitTerminal = (
        event: Extract<OmpProviderLoginEvent, { kind: "completed" | "failed" }>,
      ) => {
        if (terminal) return;
        terminal = true;
        onEvent(event);
      };
      const close = async () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        await session.close();
      };
      const unsubscribe = session.onEvent((event) => {
        if (event.type === "extension_ui_request") {
          emitExtensionEvent(event, onEvent);
        } else if (event.type === "process_exit") {
          emitTerminal({ kind: "failed", error: "OMP exited during sign-in" });
        }
      });
      void session
        .login(providerId)
        .then(() => emitTerminal({ kind: "completed" }))
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          emitTerminal({ kind: "failed", error: message.slice(0, 300) });
        })
        .finally(() => close());
      return {
        respond(uiRequestId, response) {
          session.respondToExtensionUiRequest(uiRequestId, response);
        },
        cancel: close,
      };
    },

    async logout(providerId) {
      assertProviderId(providerId);
      await execute(resolveOmpCommand(), ["auth-broker", "logout", providerId], {
        timeout: 30_000,
        maxBuffer: 1024 * 1024,
      });
    },
  };
}
