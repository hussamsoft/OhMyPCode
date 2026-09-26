import { create } from "zustand";
import type {
  OmpHookStatusState,
  OmpHookTitleState,
  OmpHookWidgetState,
} from "@ohmypcode/protocol/messages";

/**
 * OMP extension hook UI state per agent.
 *
 * The wire shape (see `OmpHook*StateSchema` in `@ohmypcode/protocol/messages`)
 * is position-addressed, not chronological: a second `setWidget` for the same
 * `widgetKey` replaces the prior value, so the store simply mirrors the
 * latest snapshot per agent.
 *
 * This intentionally shadows neither the chronological timeline nor the
 * vibe store. Three slices co-exist because each has a distinct update
 * shape (events vs. revisioned snapshot vs. latest-wins by key); the
 * downstream components subscribe to whichever slice matches their needs.
 */
export interface OmpHookState {
  widget: OmpHookWidgetState | null;
  status: OmpHookStatusState | null;
  title: OmpHookTitleState | null;
}

interface OmpHookStateByAgent {
  [agentId: string]: OmpHookState;
}

interface OmpHookStoreState {
  stateByAgent: OmpHookStateByAgent;
  publishWidget(agentId: string, widget: OmpHookWidgetState): void;
  publishStatus(agentId: string, status: OmpHookStatusState): void;
  publishTitle(agentId: string, title: OmpHookTitleState): void;
  clearAgent(agentId: string): void;
}

const EMPTY_HOOK_STATE: OmpHookState = { widget: null, status: null, title: null };

function dropKey(current: OmpHookStateByAgent, agentId: string, key: keyof OmpHookState) {
  const previous = current[agentId] ?? EMPTY_HOOK_STATE;
  if (previous[key] === null) return current;
  return {
    ...current,
    [agentId]: { ...previous, [key]: null },
  };
}

export const useOmpHookStore = create<OmpHookStoreState>((set) => ({
  stateByAgent: {},
  publishWidget: (agentId, widget) =>
    set((current) => ({
      stateByAgent: {
        ...current.stateByAgent,
        [agentId]: { ...(current.stateByAgent[agentId] ?? EMPTY_HOOK_STATE), widget },
      },
    })),
  publishStatus: (agentId, status) =>
    // `statusText: null` is the canonical "clear" sentinel the server emits
    // for `setStatus(key, undefined)`. Drop the row entirely so consumers
    // don't have to special-case the null.
    set((current) =>
      status.statusText === null
        ? { stateByAgent: dropKey(current.stateByAgent, agentId, "status") }
        : {
            stateByAgent: {
              ...current.stateByAgent,
              [agentId]: { ...(current.stateByAgent[agentId] ?? EMPTY_HOOK_STATE), status },
            },
          },
    ),
  publishTitle: (agentId, title) =>
    set((current) => ({
      stateByAgent: {
        ...current.stateByAgent,
        [agentId]: { ...(current.stateByAgent[agentId] ?? EMPTY_HOOK_STATE), title },
      },
    })),
  clearAgent: (agentId) =>
    set((current) => {
      if (!current.stateByAgent[agentId]) return current;
      const next = { ...current.stateByAgent };
      delete next[agentId];
      return { stateByAgent: next };
    }),
}));

/**
 * Seed hook state from a hydrated `runtimeInfo.extra[stateKey]` snapshot.
 * Used by the hydration hook on mount / connection. Each key is independent,
 * so callers can pass only the slices they have hydrated. Passing `null`
 * clears that slice (matching the server-side clear semantics).
 */
export function seedOmpHookState(input: {
  agentId: string;
  widget?: OmpHookWidgetState | null;
  status?: OmpHookStatusState | null;
  title?: OmpHookTitleState | null;
}): void {
  const { agentId, widget, status, title } = input;
  const store = useOmpHookStore.getState();
  if (widget !== undefined) {
    if (widget !== null) store.publishWidget(agentId, widget);
    else
      useOmpHookStore.setState((current) => ({
        stateByAgent: dropKey(current.stateByAgent, agentId, "widget"),
      }));
  }
  if (status !== undefined) {
    if (status === null) store.publishStatus(agentId, { statusKey: "", statusText: null });
    else store.publishStatus(agentId, status);
  }
  if (title !== undefined) {
    if (title === null)
      useOmpHookStore.setState((current) => ({
        stateByAgent: dropKey(current.stateByAgent, agentId, "title"),
      }));
    else store.publishTitle(agentId, title);
  }
}

/**
 * Drop everything for an agent (called on disconnect / agent removal).
 */
export function disposeOmpHookState(agentId: string): void {
  useOmpHookStore.getState().clearAgent(agentId);
}
