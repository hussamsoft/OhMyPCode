import { describe, expect, test } from "vitest";

import type {
  AgentStreamEvent,
  OmpHookStatusState,
  OmpHookTitleState,
  OmpHookWidgetState,
} from "@ohmypcode/protocol/messages";

import { OmpHarness } from "./test-utils/omp-harness.js";

// OMP extensions push position-addressed UI state via the
// `extension_ui_request` RPC method. `setWidget`, `setStatus`, and `setTitle`
// are *not* timeline items -- the same call fired twice replaces the previous
// value rather than appending -- so we surface them as
// `provider_state_updated` events with a `stateKey` the client keys off of.
// `setFooter`/`setHeader` are vendor no-ops and intentionally not modelled.
describe("OMP agent extension UI hook state", () => {
  function providerStateEvents(omp: OmpHarness) {
    return omp.events.filter(
      (event): event is Extract<AgentStreamEvent, { type: "provider_state_updated" }> =>
        event.type === "provider_state_updated",
    );
  }

  test("setWidget emits hookWidget state with placement and truncated lines", async () => {
    const omp = new OmpHarness();
    await omp.start();

    omp.runtime().emit({
      type: "extension_ui_request",
      id: "widget-1",
      method: "setWidget",
      widgetKey: "plan-todos",
      widgetLines: ["- [ ] first", "- [x] second"],
      widgetPlacement: "aboveEditor",
    });

    const events = providerStateEvents(omp);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "provider_state_updated",
      provider: "omp",
      stateKey: "hookWidget",
      state: {
        widgetKey: "plan-todos",
        widgetLines: ["- [ ] first", "- [x] second"],
        widgetPlacement: "aboveEditor",
      } satisfies OmpHookWidgetState,
    });
  });

  test("setWidget clears the entry when widgetLines is undefined", async () => {
    const omp = new OmpHarness();
    await omp.start();

    omp.runtime().emit({
      type: "extension_ui_request",
      id: "widget-clear",
      method: "setWidget",
      widgetKey: "plan-todos",
      widgetLines: undefined,
    });

    const events = providerStateEvents(omp);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      stateKey: "hookWidget",
      state: {
        widgetKey: "plan-todos",
        widgetLines: [],
      } satisfies OmpHookWidgetState,
    });
  });

  test("setWidget with empty widgetKey is dropped without emitting state", async () => {
    const omp = new OmpHarness();
    await omp.start();

    omp.runtime().emit({
      type: "extension_ui_request",
      id: "widget-bad",
      method: "setWidget",
      widgetKey: "",
      widgetLines: ["ignored"],
    });

    expect(providerStateEvents(omp)).toHaveLength(0);
  });

  test("setStatus emits hookStatus state and clears with null when text is undefined", async () => {
    const omp = new OmpHarness();
    await omp.start();

    omp.runtime().emit({
      type: "extension_ui_request",
      id: "status-1",
      method: "setStatus",
      statusKey: "plan-mode",
      statusText: "📋 1/2",
    });
    omp.runtime().emit({
      type: "extension_ui_request",
      id: "status-2",
      method: "setStatus",
      statusKey: "plan-mode",
      // `setStatus(key, undefined)` clears the entry on the vendor side.
      statusText: undefined,
    });

    const events = providerStateEvents(omp);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      stateKey: "hookStatus",
      state: {
        statusKey: "plan-mode",
        statusText: "📋 1/2",
      } satisfies OmpHookStatusState,
    });
    expect(events[1]).toMatchObject({
      stateKey: "hookStatus",
      state: {
        statusKey: "plan-mode",
        statusText: null,
      } satisfies OmpHookStatusState,
    });
  });

  test("setTitle emits hookTitle state with the title string", async () => {
    const omp = new OmpHarness();
    await omp.start();

    omp.runtime().emit({
      type: "extension_ui_request",
      id: "title-1",
      method: "setTitle",
      title: "Inspecting repo",
    });

    const events = providerStateEvents(omp);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      stateKey: "hookTitle",
      state: { title: "Inspecting repo" } satisfies OmpHookTitleState,
    });
  });

  test("setTitle with non-string title is dropped without emitting state", async () => {
    const omp = new OmpHarness();
    await omp.start();

    omp.runtime().emit({
      type: "extension_ui_request",
      id: "title-bad",
      method: "setTitle",
      // @ts-expect-error -- intentionally wrong shape to exercise the guard.
      title: 42,
    });

    expect(providerStateEvents(omp)).toHaveLength(0);
  });

  test("hook state events do not appear in the agent timeline", async () => {
    const omp = new OmpHarness();
    await omp.start();

    omp.runtime().emit({
      type: "extension_ui_request",
      id: "widget-1",
      method: "setWidget",
      widgetKey: "plan-todos",
      widgetLines: ["- [ ] first"],
    });

    expect(omp.timeline()).toEqual([]);
    expect(providerStateEvents(omp)).toHaveLength(1);
  });
});
