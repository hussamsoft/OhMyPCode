import { randomUUID } from "node:crypto";
import type { OmpProviderLoginEvent } from "@getpaseo/protocol/messages";
import type pino from "pino";
import type { SessionInboundMessage, SessionOutboundMessage } from "../../messages.js";
import type { OwnedOperation, SessionDelivery } from "../owned-subscriptions/index.js";
import type {
  OmpProviderLoginHandle,
  OmpProvidersService,
} from "../../../services/omp-providers/index.js";

const OMP_PROVIDER_MESSAGE_TYPES: ReadonlySet<SessionInboundMessage["type"]> = new Set([
  "omp.providers.list.request",
  "omp.providers.login.start.request",
  "omp.providers.login.respond.request",
  "omp.providers.login.cancel.request",
  "omp.providers.logout.request",
]);

type OmpProviderRequest = Extract<
  SessionInboundMessage,
  { type: `omp.providers.${string}.request` }
>;

export interface OmpProvidersSessionControllerOptions {
  service: OmpProvidersService;
  emit: (msg: SessionOutboundMessage) => void;
  delivery: SessionDelivery;
  refreshOmpCatalog: () => Promise<void>;
  logger: pino.Logger;
}

export class OmpProvidersSessionController {
  private readonly activeLogins = new Map<
    string,
    { requestId: string; handle: OmpProviderLoginHandle; operation: OwnedOperation }
  >();

  constructor(private readonly options: OmpProvidersSessionControllerOptions) {}

  dispatch(msg: SessionInboundMessage): Promise<void> | undefined {
    if (!OMP_PROVIDER_MESSAGE_TYPES.has(msg.type)) return undefined;
    switch (msg.type) {
      case "omp.providers.list.request":
        return this.list(msg);
      case "omp.providers.login.start.request":
        return this.start(msg);
      case "omp.providers.login.respond.request":
        return this.respond(msg);
      case "omp.providers.login.cancel.request":
        return this.cancel(msg);
      case "omp.providers.logout.request":
        return this.logout(msg);
    }
  }

  dispose(): void {
    for (const { handle, operation } of this.activeLogins.values()) {
      void handle
        .cancel()
        .catch((error) =>
          this.options.logger.debug({ err: error }, "Failed to cancel OMP provider login"),
        );
      void operation.release();
    }
    this.activeLogins.clear();
  }

  private async list(
    msg: Extract<SessionInboundMessage, { type: "omp.providers.list.request" }>,
  ): Promise<void> {
    try {
      const providers = await this.options.service.listProviders();
      this.options.emit({
        type: "omp.providers.list.response",
        payload: { requestId: msg.requestId, providers },
      });
    } catch {
      this.emitUnavailable(msg);
    }
  }

  private async start(
    msg: Extract<SessionInboundMessage, { type: "omp.providers.login.start.request" }>,
  ): Promise<void> {
    const loginId = randomUUID();
    let handleRef: OmpProviderLoginHandle | undefined;
    // Progress events arrive from the OMP CLI process well after this request's
    // own dispatch has returned, so they can't ride the ALS-scoped `reply()`
    // path `emit()` normally uses. `delivery.operation()` mints a long-lived
    // owner, tied to this socket, that stays valid until released below.
    const operation = this.options.delivery.operation(
      (message) =>
        message.type === "omp.providers.login.progress" &&
        "payload" in message &&
        message.payload.loginId === loginId,
      () => void handleRef?.cancel(),
    );
    const emitProgress = (event: OmpProviderLoginEvent) => {
      operation.emit({
        type: "omp.providers.login.progress",
        payload: { requestId: msg.requestId, loginId, event },
      });
      if (event.kind === "completed" || event.kind === "failed") {
        this.activeLogins.delete(loginId);
        void operation.release();
        if (event.kind === "completed") {
          void this.options
            .refreshOmpCatalog()
            .catch((error) =>
              this.options.logger.debug(
                { err: error },
                "Failed to refresh OMP catalog after sign-in",
              ),
            );
        }
      }
    };
    try {
      const handle = await this.options.service.startLogin(msg.providerId, emitProgress);
      handleRef = handle;
      this.activeLogins.set(loginId, { requestId: msg.requestId, handle, operation });
      this.options.emit({
        type: "omp.providers.login.start.response",
        payload: { requestId: msg.requestId, loginId },
      });
    } catch {
      void operation.release();
      this.emitUnavailable(msg);
    }
  }

  private async respond(
    msg: Extract<SessionInboundMessage, { type: "omp.providers.login.respond.request" }>,
  ): Promise<void> {
    const login = this.activeLogins.get(msg.loginId);
    if (!login) return this.emitLoginNotFound(msg);
    login.handle.respond(msg.uiRequestId, {
      value: msg.value,
      confirmed: msg.confirmed,
      cancelled: msg.cancelled,
    });
    this.options.emit({
      type: "omp.providers.login.respond.response",
      payload: { requestId: msg.requestId },
    });
  }

  private async cancel(
    msg: Extract<SessionInboundMessage, { type: "omp.providers.login.cancel.request" }>,
  ): Promise<void> {
    const login = this.activeLogins.get(msg.loginId);
    if (!login) return this.emitLoginNotFound(msg);
    this.activeLogins.delete(msg.loginId);
    await login.handle.cancel();
    void login.operation.release();
    this.options.emit({
      type: "omp.providers.login.cancel.response",
      payload: { requestId: msg.requestId },
    });
  }

  private async logout(
    msg: Extract<SessionInboundMessage, { type: "omp.providers.logout.request" }>,
  ): Promise<void> {
    try {
      await this.options.service.logout(msg.providerId);
      try {
        await this.options.refreshOmpCatalog();
      } catch (error) {
        this.options.logger.debug({ err: error }, "Failed to refresh OMP catalog after logout");
      }
      this.options.emit({
        type: "omp.providers.logout.response",
        payload: { requestId: msg.requestId },
      });
    } catch {
      this.options.emit({
        type: "rpc_error",
        payload: {
          requestId: msg.requestId,
          requestType: msg.type,
          error: "OMP provider logout failed",
          code: "omp_logout_failed",
        },
      });
    }
  }

  private emitUnavailable(msg: OmpProviderRequest): void {
    this.options.emit({
      type: "rpc_error",
      payload: {
        requestId: msg.requestId,
        requestType: msg.type,
        error: "OMP providers are unavailable",
        code: "omp_providers_failed",
      },
    });
  }

  private emitLoginNotFound(msg: OmpProviderRequest): void {
    this.options.emit({
      type: "rpc_error",
      payload: {
        requestId: msg.requestId,
        requestType: msg.type,
        error: "OMP provider login was not found",
        code: "omp_login_not_found",
      },
    });
  }
}
