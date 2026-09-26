import { afterEach, describe, expect, it } from "vitest";
import { disposeOmpHookState, seedOmpHookState, useOmpHookStore } from "@/omp-ui/hook-widget/store";

afterEach(() => {
  // Reset between tests so state from one case doesn't leak into another.
  const agents = Object.keys(useOmpHookStore.getState().stateByAgent);
  for (const agentId of agents) disposeOmpHookState(agentId);
});

describe("OMP hook widget store", () => {
  it("stores widget, status, and title independently per agent", () => {
    const store = useOmpHookStore.getState();

    store.publishWidget("agent-1", {
      widgetKey: "plan-todos",
      widgetLines: ["- [ ] first"],
      widgetPlacement: "aboveEditor",
    });
    store.publishStatus("agent-1", {
      statusKey: "plan-mode",
      statusText: "📋 1/2",
    });
    store.publishTitle("agent-1", { title: "Inspecting" });

    expect(useOmpHookStore.getState().stateByAgent["agent-1"]).toEqual({
      widget: {
        widgetKey: "plan-todos",
        widgetLines: ["- [ ] first"],
        widgetPlacement: "aboveEditor",
      },
      status: { statusKey: "plan-mode", statusText: "📋 1/2" },
      title: { title: "Inspecting" },
    });

    // A different agent starts fresh.
    expect(useOmpHookStore.getState().stateByAgent["agent-2"]).toBeUndefined();
  });

  it("treats statusText: null as a clear and drops the row", () => {
    const store = useOmpHookStore.getState();
    store.publishStatus("agent-1", { statusKey: "plan-mode", statusText: "active" });
    expect(useOmpHookStore.getState().stateByAgent["agent-1"]?.status).toEqual({
      statusKey: "plan-mode",
      statusText: "active",
    });

    store.publishStatus("agent-1", { statusKey: "plan-mode", statusText: null });
    expect(useOmpHookStore.getState().stateByAgent["agent-1"]?.status).toBeNull();
  });

  it("replaces widget when a new key arrives without dropping other slices", () => {
    const store = useOmpHookStore.getState();
    store.publishWidget("agent-1", { widgetKey: "plan-todos", widgetLines: ["old"] });
    store.publishStatus("agent-1", { statusKey: "plan-mode", statusText: "active" });
    store.publishTitle("agent-1", { title: "Inspecting" });

    store.publishWidget("agent-1", { widgetKey: "annotations", widgetLines: ["new"] });

    const state = useOmpHookStore.getState().stateByAgent["agent-1"];
    expect(state?.widget?.widgetKey).toBe("annotations");
    expect(state?.status).toEqual({ statusKey: "plan-mode", statusText: "active" });
    expect(state?.title).toEqual({ title: "Inspecting" });
  });

  it("seedOmpHookState hydrates all three slices from a snapshot", () => {
    seedOmpHookState({
      agentId: "agent-1",
      widget: { widgetKey: "plan-todos", widgetLines: ["- [ ]"] },
      status: { statusKey: "plan-mode", statusText: "active" },
      title: { title: "Inspecting" },
    });

    const state = useOmpHookStore.getState().stateByAgent["agent-1"];
    expect(state).toEqual({
      widget: { widgetKey: "plan-todos", widgetLines: ["- [ ]"] },
      status: { statusKey: "plan-mode", statusText: "active" },
      title: { title: "Inspecting" },
    });
  });

  it("seedOmpHookState with null clears the matching slice only", () => {
    const store = useOmpHookStore.getState();
    store.publishWidget("agent-1", { widgetKey: "plan-todos", widgetLines: ["- [ ]"] });
    store.publishStatus("agent-1", { statusKey: "plan-mode", statusText: "active" });
    store.publishTitle("agent-1", { title: "Inspecting" });

    seedOmpHookState({
      agentId: "agent-1",
      widget: null,
      status: { statusKey: "plan-mode", statusText: "still active" },
      title: null,
    });

    const state = useOmpHookStore.getState().stateByAgent["agent-1"];
    expect(state?.widget).toBeNull();
    expect(state?.status).toEqual({ statusKey: "plan-mode", statusText: "still active" });
    expect(state?.title).toBeNull();
  });

  it("disposeOmpHookState drops everything for the agent", () => {
    const store = useOmpHookStore.getState();
    store.publishWidget("agent-1", { widgetKey: "plan-todos", widgetLines: ["- [ ]"] });
    store.publishStatus("agent-1", { statusKey: "plan-mode", statusText: "active" });

    disposeOmpHookState("agent-1");

    expect(useOmpHookStore.getState().stateByAgent["agent-1"]).toBeUndefined();
  });
});
