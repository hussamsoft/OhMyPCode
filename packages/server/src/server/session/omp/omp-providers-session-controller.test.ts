import { describe, expect, test, vi } from "vitest";
import type { OmpProviderLoginEvent } from "@ohmypcode/protocol/messages";
import { SessionDelivery } from "../owned-subscriptions/index.js";
import { OmpProvidersSessionController } from "./omp-providers-session-controller.js";
import type {
  OmpProviderLoginHandle,
  OmpProvidersService,
} from "../../../services/omp-providers/index.js";
import type { SessionOutboundMessage } from "../../messages.js";
import { createTestLogger } from "../../../test-utils/test-logger.js";

/**
 * The real OmpProvidersService.startLogin() returns its cancel handle
 * immediately (login.start.request's own dispatch settles almost instantly)
 * and streams extension_ui_request events later, from an independent async
 * callback chain driven by the OMP CLI child process. Progress emitted after
 * the originating request's dispatch has returned can't ride SessionDelivery's
 * ALS-scoped reply() path; only a registered SessionDelivery.operation() keeps
 * the socket authorized to receive it. This regression guards that wiring —
 * it fails if a controller ever goes back to emitting progress through the
 * plain `emit` callback instead of an owned operation.
 */
function createFakeService(onEventRef: {
  current: ((event: OmpProviderLoginEvent) => void) | undefined;
}): OmpProvidersService {
  return {
    listProviders: vi.fn(async () => []),
    startLogin: vi.fn(
      async (_providerId: string, onEvent: (event: OmpProviderLoginEvent) => void) => {
        onEventRef.current = onEvent;
        const handle: OmpProviderLoginHandle = {
          respond: vi.fn(),
          cancel: vi.fn(async () => {}),
        };
        return handle;
      },
    ),
    logout: vi.fn(async () => {}),
  };
}

describe("OmpProvidersSessionController", () => {
  test("delivers login progress that arrives after the request's own dispatch has returned", async () => {
    const sent: SessionOutboundMessage[] = [];
    const socket = {};
    const delivery = new SessionDelivery((_source, message) => {
      sent.push(message);
    });
    delivery.attach(socket, true);

    const onEventRef: { current: ((event: OmpProviderLoginEvent) => void) | undefined } = {
      current: undefined,
    };
    const controller = new OmpProvidersSessionController({
      service: createFakeService(onEventRef),
      // Mirrors session.ts's real emit(): reply() authorizes messages still
      // inside the originating request's ALS scope; anything else must pass
      // the same permits() gate websocket-server.ts applies to the general
      // broadcast path.
      emit: (message) => {
        if (delivery.reply(message)) return;
        if (delivery.permits(socket, message)) sent.push(message);
      },
      delivery,
      refreshOmpCatalog: vi.fn(async () => {}),
      logger: createTestLogger(),
    });

    const request = {
      type: "omp.providers.login.start.request" as const,
      requestId: "req-1",
      providerId: "deepseek",
    };
    await delivery.request(socket, request, () => controller.dispatch(request)!);

    expect(sent.some((message) => message.type === "omp.providers.login.start.response")).toBe(
      true,
    );
    expect(onEventRef.current).toBeDefined();

    // Fire from a genuinely detached async callback: setImmediate runs after
    // the microtask queue (and therefore after delivery.request()'s ALS scope)
    // has already unwound, exactly like a real extension_ui_request arriving
    // seconds into an OMP CLI login flow.
    await new Promise<void>((resolve) => {
      setImmediate(() => {
        onEventRef.current!({
          kind: "open_url",
          uiRequestId: "ui-1",
          url: "https://example.com/device",
        });
        resolve();
      });
    });

    const progress = sent.find((message) => message.type === "omp.providers.login.progress");
    expect(progress).toMatchObject({
      type: "omp.providers.login.progress",
      payload: {
        requestId: "req-1",
        event: { kind: "open_url", uiRequestId: "ui-1", url: "https://example.com/device" },
      },
    });
  });

  test("releases the owned operation once the login reaches a terminal event", async () => {
    const sent: SessionOutboundMessage[] = [];
    const socket = {};
    const delivery = new SessionDelivery((_source, message) => {
      sent.push(message);
    });
    delivery.attach(socket, true);

    const onEventRef: { current: ((event: OmpProviderLoginEvent) => void) | undefined } = {
      current: undefined,
    };
    const refreshOmpCatalog = vi.fn(async () => {});
    const controller = new OmpProvidersSessionController({
      service: createFakeService(onEventRef),
      emit: (message) => {
        if (delivery.reply(message)) return;
        if (delivery.permits(socket, message)) sent.push(message);
      },
      delivery,
      refreshOmpCatalog,
      logger: createTestLogger(),
    });

    const request = {
      type: "omp.providers.login.start.request" as const,
      requestId: "req-2",
      providerId: "deepseek",
    };
    await delivery.request(socket, request, () => controller.dispatch(request)!);

    await new Promise<void>((resolve) => {
      setImmediate(() => {
        onEventRef.current!({ kind: "completed" });
        resolve();
      });
    });

    expect(sent.some((message) => message.type === "omp.providers.login.progress")).toBe(true);
    expect(refreshOmpCatalog).toHaveBeenCalledTimes(1);
  });
});
