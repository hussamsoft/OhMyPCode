import type pino from "pino";
import type {
  AgentManagerOmpVibeError as AgentManagerOmpVibeErrorType,
  AgentManager,
} from "../../agent/agent-manager.js";
import type { SessionInboundMessage, SessionOutboundMessage } from "../../messages.js";

const OMP_VIBE_MESSAGE_TYPES: ReadonlySet<SessionInboundMessage["type"]> = new Set([
  "omp.vibe.status.request",
  "omp.vibe.enter.request",
  "omp.vibe.exit.request",
  "omp.vibe.spawn.request",
  "omp.vibe.send.request",
  "omp.vibe.wait.request",
  "omp.vibe.kill.request",
]);

type OmpVibeRequest = Extract<
  SessionInboundMessage,
  {
    type:
      | "omp.vibe.status.request"
      | "omp.vibe.enter.request"
      | "omp.vibe.exit.request"
      | "omp.vibe.spawn.request"
      | "omp.vibe.send.request"
      | "omp.vibe.wait.request"
      | "omp.vibe.kill.request";
  }
>;

export interface OmpVibeSessionControllerOptions {
  agentManager: Pick<
    AgentManager,
    | "getOmpVibeState"
    | "enterOmpVibe"
    | "exitOmpVibe"
    | "spawnOmpVibeWorker"
    | "sendOmpVibeWorker"
    | "waitOmpVibeWorkers"
    | "killOmpVibeWorker"
  >;
  emit: (message: SessionOutboundMessage) => void;
  logger: pino.Logger;
}

export class OmpVibeSessionController {
  constructor(private readonly options: OmpVibeSessionControllerOptions) {}

  dispatch(msg: SessionInboundMessage): Promise<void> | undefined {
    if (!OMP_VIBE_MESSAGE_TYPES.has(msg.type)) return undefined;
    return this.dispatchVibeRequest(msg as OmpVibeRequest);
  }

  dispose(): void {}

  private async dispatchVibeRequest(msg: OmpVibeRequest): Promise<void> {
    try {
      switch (msg.type) {
        case "omp.vibe.status.request": {
          const state = await this.options.agentManager.getOmpVibeState(msg.agentId);
          this.emitResponse("omp.vibe.status.response", msg.requestId, { state });
          return;
        }
        case "omp.vibe.enter.request": {
          const { state } = await this.options.agentManager.enterOmpVibe(msg.agentId, msg.prompt);
          this.emitResponse("omp.vibe.enter.response", msg.requestId, { state });
          return;
        }
        case "omp.vibe.exit.request": {
          const { state } = await this.options.agentManager.exitOmpVibe(msg.agentId);
          this.emitResponse("omp.vibe.exit.response", msg.requestId, { state });
          return;
        }
        case "omp.vibe.spawn.request": {
          const { result, state } = await this.options.agentManager.spawnOmpVibeWorker(
            msg.agentId,
            {
              cli: msg.tier,
              ...(msg.name === undefined ? {} : { name: msg.name }),
              prompt: msg.prompt,
            },
          );
          this.emitResponse("omp.vibe.spawn.response", msg.requestId, {
            worker: result,
            state,
          });
          return;
        }
        case "omp.vibe.send.request": {
          const { result, state } = await this.options.agentManager.sendOmpVibeWorker(msg.agentId, {
            session: msg.workerId,
            message: msg.message,
          });
          this.emitResponse("omp.vibe.send.response", msg.requestId, {
            delivery: result.delivery,
            state,
          });
          return;
        }
        case "omp.vibe.wait.request": {
          const { result, state } = await this.options.agentManager.waitOmpVibeWorkers(
            msg.agentId,
            {
              ...(msg.workerIds === undefined ? {} : { sessions: msg.workerIds }),
              ...(msg.timeoutMs === undefined ? {} : { timeoutMs: msg.timeoutMs }),
            },
          );
          this.emitResponse("omp.vibe.wait.response", msg.requestId, {
            settled: result.settled,
            stillRunning: result.stillRunning,
            timedOut: result.timedOut,
            state,
          });
          return;
        }
        case "omp.vibe.kill.request": {
          const { result, state } = await this.options.agentManager.killOmpVibeWorker(
            msg.agentId,
            msg.workerId,
          );
          this.emitResponse("omp.vibe.kill.response", msg.requestId, {
            worker: result,
            state,
          });
          return;
        }
      }
    } catch (error) {
      this.emitError(msg, error);
    }
  }

  private emitResponse(
    type:
      | "omp.vibe.status.response"
      | "omp.vibe.enter.response"
      | "omp.vibe.exit.response"
      | "omp.vibe.spawn.response"
      | "omp.vibe.send.response"
      | "omp.vibe.wait.response"
      | "omp.vibe.kill.response",
    requestId: string,
    payload: Record<string, unknown>,
  ): void {
    this.options.emit({ type, payload: { requestId, ...payload } } as SessionOutboundMessage);
  }

  private emitError(msg: OmpVibeRequest, error: unknown): void {
    const managerError = error as Partial<AgentManagerOmpVibeErrorType>;
    const code = isOmpVibeErrorCode(managerError.code) ? managerError.code : "omp_vibe_conflict";
    const message = error instanceof Error ? error.message : String(error);
    this.options.logger.warn({ err: error, requestId: msg.requestId }, "OMP Vibe request failed");
    this.options.emit({
      type: "rpc_error",
      payload: {
        requestId: msg.requestId,
        requestType: msg.type,
        error: message,
        code,
      },
    });
  }
}

function isOmpVibeErrorCode(value: unknown): value is AgentManagerOmpVibeErrorType["code"] {
  return (
    value === "omp_vibe_unavailable" ||
    value === "omp_vibe_busy" ||
    value === "omp_vibe_worker_not_found" ||
    value === "omp_vibe_conflict"
  );
}
