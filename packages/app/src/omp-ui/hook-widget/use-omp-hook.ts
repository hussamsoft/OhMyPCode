import { useEffect, useMemo } from "react";
import type {
  OmpHookStatusState,
  OmpHookTitleState,
  OmpHookWidgetState,
} from "@ohmypcode/protocol/messages";
import { useSessionStore } from "@/stores/session-store";
import { parseOmpHookStatusState, parseOmpHookTitleState, parseOmpHookWidgetState } from "./model";
import { disposeOmpHookState, seedOmpHookState, useOmpHookStore, type OmpHookState } from "./store";

/**
 * Per-agent hook into the OMP extension-UI hook state.
 *
 * Source-of-truth contract: the server emits `provider_state_updated` with
 * `stateKey` in `{hookWidget, hookStatus, hookTitle}` and `AgentManager`
 * projects the value into `runtimeInfo.extra[stateKey]`. The hydration
 * effect below mirrors that projection into the per-agent zustand store so
 * consumers (status bar, widget chrome, terminal title) can subscribe
 * without owning the snapshot pipeline.
 */
export function useOmpHook(serverId: string, agentId: string): OmpHookState {
  const extra = useSessionStore(
    (store) => store.sessions[serverId]?.agents.get(agentId)?.runtimeInfo?.extra ?? null,
  );
  const widgetRuntime = extra?.hookWidget ?? null;
  const statusRuntime = extra?.hookStatus ?? null;
  const titleRuntime = extra?.hookTitle ?? null;

  useEffect(() => {
    const widget = parseOmpHookWidgetState(widgetRuntime);
    const status = parseOmpHookStatusState(statusRuntime);
    const title = parseOmpHookTitleState(titleRuntime);
    seedOmpHookState({
      agentId,
      widget: widget === null ? null : widget,
      status: status === null ? null : status,
      title: title === null ? null : title,
    });
  }, [agentId, widgetRuntime, statusRuntime, titleRuntime]);

  useEffect(() => {
    return () => {
      disposeOmpHookState(agentId);
    };
  }, [agentId]);

  const widget = useOmpHookStore((store) => store.stateByAgent[agentId]?.widget ?? null);
  const status = useOmpHookStore((store) => store.stateByAgent[agentId]?.status ?? null);
  const title = useOmpHookStore((store) => store.stateByAgent[agentId]?.title ?? null);

  return useMemo(() => ({ widget, status, title }), [widget, status, title]);
}

export interface UseOmpHookWidgetSelector {
  agentId: string;
  /** Optional filter; omit to take the current agent's widget regardless of placement. */
  placement?: OmpHookWidgetState["widgetPlacement"];
}

/**
 * Selector-style hook for the hook widget body. Returns `null` when no
 * widget is registered for this agent (or when the registered widget
 * targets a placement the caller doesn't want).
 *
 * The vendor defaults `widgetPlacement` to `"aboveEditor"` when missing,
 * so a widget without an explicit placement surfaces under the aboveEditor
 * selector.
 */
export function useOmpHookWidget(input: UseOmpHookWidgetSelector): OmpHookWidgetState | null {
  const widget = useOmpHookStore((store) => store.stateByAgent[input.agentId]?.widget ?? null);
  if (!widget) return null;
  const widgetPlacement = widget.widgetPlacement ?? "aboveEditor";
  if (input.placement && widgetPlacement !== input.placement) return null;
  return widget;
}

export interface UseOmpHookStatusSelector {
  agentId: string;
  /** Optional key filter; omit to take the agent's current status entry. */
  statusKey?: string;
}

export function useOmpHookStatus(input: UseOmpHookStatusSelector): OmpHookStatusState | null {
  const status = useOmpHookStore((store) => store.stateByAgent[input.agentId]?.status ?? null);
  if (!status) return null;
  if (input.statusKey && status.statusKey !== input.statusKey) return null;
  return status;
}

export function useOmpHookTitle(agentId: string): OmpHookTitleState | null {
  return useOmpHookStore((store) => store.stateByAgent[agentId]?.title ?? null);
}
