import type pino from "pino";
import {
  isOmpParityErrorCode,
  type AgentManager,
  type OmpParityErrorCode,
} from "../../agent/agent-manager.js";
import type { SessionInboundMessage, SessionOutboundMessage } from "../../messages.js";
import type { OmpSlashCommandResult } from "../../agent/agent-sdk-types.js";

const OMP_PARITY_MESSAGE_TYPES: ReadonlySet<SessionInboundMessage["type"]> = new Set([
  "omp.command.run.request",
  "omp.settings.get.request",
  "omp.settings.set.request",
  "omp.modes.get.request",
  "omp.modes.set.request",
  "omp.goal.action.request",
  "omp.keybindings.get.request",
  "omp.keybindings.set.request",
  "omp.session.switch.request",
  "omp.agents.list.request",
]);

type OmpParityRequest = Extract<
  SessionInboundMessage,
  {
    type:
      | "omp.command.run.request"
      | "omp.settings.get.request"
      | "omp.settings.set.request"
      | "omp.modes.get.request"
      | "omp.modes.set.request"
      | "omp.goal.action.request"
      | "omp.keybindings.get.request"
      | "omp.keybindings.set.request"
      | "omp.session.switch.request"
      | "omp.agents.list.request";
  }
>;

export interface OmpParitySessionControllerOptions {
  agentManager: Pick<
    AgentManager,
    | "getOmpModes"
    | "setOmpMode"
    | "goalAction"
    | "runOmpSlashCommand"
    | "getOmpSettings"
    | "setOmpSetting"
    | "getOmpKeybindings"
    | "setOmpKeybinding"
    | "switchOmpAgentSession"
    | "listOmpAgentCatalog"
  >;
  emit: (message: SessionOutboundMessage) => void;
  logger: pino.Logger;
}

type CommandRunPayload = Extract<
  SessionOutboundMessage,
  { type: "omp.command.run.response" }
>["payload"];

/**
 * OMP reports a slash command three ways and a host needs all three answered:
 * text it ran, text to send to the agent, or a surface only the host can draw.
 * The `changed` arm is a mode transition — the fork answers `/plan` in place of a
 * slash result so it lands as a mode change rather than an overlay.
 *
 * Each field is type-checked rather than asserted: the fork's result type widens
 * through `.passthrough()`, so a bare member access would be an unchecked cast.
 */
function mapSlashResult(result: OmpSlashCommandResult): Omit<CommandRunPayload, "requestId"> {
  const base = { agentInvoked: false, output: "", stateChange: false };
  if (!("outcome" in result)) {
    return {
      ...base,
      stateChange: Boolean(result.changed),
      output: `Mode switched to ${String(result.mode)}`,
    };
  }
  switch (result.outcome) {
    case "consumed":
      return {
        ...base,
        agentInvoked: typeof result.agentInvoked === "boolean" ? result.agentInvoked : false,
        output: typeof result.output === "string" ? result.output : "",
      };
    case "prompt":
      return { ...base, agentInvoked: true };
    case "overlay":
      return typeof result.overlay === "string"
        ? { ...base, ui: { kind: "overlay", name: result.overlay } }
        : base;
    default:
      return base;
  }
}

/**
 * Controller dispatching all eight OMP parity requests:
 * - command execution (`omp.command.run.request`)
 * - settings get/set (`omp.settings.get.request`, `omp.settings.set.request`)
 * - mode control (`omp.modes.get.request`, `omp.modes.set.request`)
 * - goal actions (`omp.goal.action.request`: pause/resume/drop, bypassing the mode enter/pause/disable cycle)
 * - keybindings get/set (`omp.keybindings.get.request`, `omp.keybindings.set.request`)
 *
 * Mapped error codes:
 * - `omp_parity_unavailable`: agent is not an OMP agent or has no session
 * - `omp_mode_conflict`: mode transition refused by OMP's guard
 * - `omp_command_failed`: slash command failed or unknown
 * - `omp_setting_failed`: setting path unknown or write invalid
 * - `omp_keybinding_failed`: keybinding unknown or chord invalid
 * - `omp_goal_action_failed`: pause/resume/drop failed (e.g. resume with no paused goal)
 */
export class OmpParitySessionController {
  constructor(private readonly options: OmpParitySessionControllerOptions) {}

  dispatch(msg: SessionInboundMessage): Promise<void> | undefined {
    if (!OMP_PARITY_MESSAGE_TYPES.has(msg.type)) return undefined;
    return this.dispatchParityRequest(msg as OmpParityRequest);
  }

  dispose(): void {}

  private async dispatchParityRequest(msg: OmpParityRequest): Promise<void> {
    try {
      switch (msg.type) {
        case "omp.command.run.request": {
          const result = await this.options.agentManager.runOmpSlashCommand(
            msg.agentId,
            msg.name,
            msg.args,
          );
          this.emitResponse("omp.command.run.response", msg.requestId, mapSlashResult(result));
          return;
        }

        case "omp.settings.get.request": {
          const result = await this.options.agentManager.getOmpSettings(msg.agentId);
          this.emitResponse("omp.settings.get.response", msg.requestId, {
            revision: result.revision,
            settings: result.settings,
          });
          return;
        }

        case "omp.settings.set.request": {
          const result = await this.options.agentManager.setOmpSetting(
            msg.agentId,
            msg.path,
            msg.value,
          );
          this.emitResponse("omp.settings.set.response", msg.requestId, {
            path: result.path,
            value: result.value,
            revision: result.revision,
          });
          return;
        }

        case "omp.modes.get.request": {
          const state = await this.options.agentManager.getOmpModes(msg.agentId);
          this.emitResponse("omp.modes.get.response", msg.requestId, { state });
          return;
        }

        case "omp.modes.set.request": {
          const state = await this.options.agentManager.setOmpMode(
            msg.agentId,
            msg.mode,
            msg.paused,
            {
              objective: msg.objective,
              tokenBudget: msg.tokenBudget,
              args: msg.args,
            },
          );
          this.emitResponse("omp.modes.set.response", msg.requestId, { state });
          return;
        }

        case "omp.goal.action.request": {
          const state = await this.options.agentManager.goalAction(msg.agentId, msg.action);
          this.emitResponse("omp.goal.action.response", msg.requestId, { state });
          return;
        }

        case "omp.keybindings.get.request": {
          const result = await this.options.agentManager.getOmpKeybindings(msg.agentId);
          this.emitResponse("omp.keybindings.get.response", msg.requestId, {
            keybindings: result.keybindings,
          });
          return;
        }

        case "omp.keybindings.set.request": {
          await this.options.agentManager.setOmpKeybinding(msg.agentId, msg.id, msg.keys);
          const current = await this.options.agentManager.getOmpKeybindings(msg.agentId);
          this.emitResponse("omp.keybindings.set.response", msg.requestId, {
            keybindings: current.keybindings,
          });
          return;
        }

        case "omp.session.switch.request": {
          const result = await this.options.agentManager.switchOmpAgentSession(
            msg.agentId,
            msg.providerHandleId,
          );
          this.emitResponse("omp.session.switch.response", msg.requestId, {
            cancelled: result.cancelled,
          });
          return;
        }

        case "omp.agents.list.request": {
          const agents = await this.options.agentManager.listOmpAgentCatalog(msg.agentId);
          this.emitResponse("omp.agents.list.response", msg.requestId, { agents });
          return;
        }
      }
    } catch (error) {
      this.emitError(msg, error);
    }
  }

  private emitResponse(
    type:
      | "omp.command.run.response"
      | "omp.settings.get.response"
      | "omp.settings.set.response"
      | "omp.modes.get.response"
      | "omp.modes.set.response"
      | "omp.goal.action.response"
      | "omp.keybindings.get.response"
      | "omp.keybindings.set.response"
      | "omp.session.switch.response"
      | "omp.agents.list.response",
    requestId: string,
    payload: Record<string, unknown>,
  ): void {
    this.options.emit({ type, payload: { requestId, ...payload } } as SessionOutboundMessage);
  }

  private resolveErrorCode(msg: OmpParityRequest, error: unknown): OmpParityErrorCode {
    // The manager raises these carrying a code, so there is nothing to infer.
    // Only an error from outside that contract is bucketed, and then by request
    // type — the bucket names the domain, not the cause.
    if (error && typeof error === "object" && "code" in error) {
      const code = error.code;
      if (isOmpParityErrorCode(code)) return code;
    }
    switch (msg.type) {
      case "omp.command.run.request":
        return "omp_command_failed";
      case "omp.settings.get.request":
      case "omp.settings.set.request":
        return "omp_setting_failed";
      case "omp.keybindings.get.request":
      case "omp.keybindings.set.request":
        return "omp_keybinding_failed";
      case "omp.modes.get.request":
      case "omp.modes.set.request":
        return "omp_mode_conflict";
      case "omp.goal.action.request":
        // Distinct from omp_mode_conflict: this bucket is "the goal action
        // itself failed" (e.g. resumeGoal() throwing "No paused goal."),
        // not "OMP refused a mode transition because another mode is active".
        return "omp_goal_action_failed";
      case "omp.session.switch.request":
        // In-place switch reuses the same parity machinery; a manager-side
        // failure (file missing, runtime refused, hooks rejected) surfaces
        // here rather than as a generic `omp_parity_unavailable` bucket.
        return "omp_session_switch_failed";
      case "omp.agents.list.request":
        // Read-only catalog. Manager-side failure (e.g. runtime rejected the
        // RPC) is bucketed here so a host can tell the catalog load from
        // a generic parity-unavailable.
        return "omp_agents_list_failed";
    }
  }

  private emitError(msg: OmpParityRequest, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const code = this.resolveErrorCode(msg, error);
    this.options.logger.warn(
      { err: error, requestId: msg.requestId, type: msg.type },
      "OMP parity request failed",
    );
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
