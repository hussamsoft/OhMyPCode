/**
 * @vitest-environment jsdom
 */
import React, { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storageItems = vi.hoisted(() => new Map<string, string>());

const asyncStorage = vi.hoisted(() => ({
  getItem: async (key: string) => storageItems.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    storageItems.set(key, value);
  },
  removeItem: async (key: string) => {
    storageItems.delete(key);
  },
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: asyncStorage,
}));

vi.stubGlobal("React", React);
vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

import {
  SidebarCalloutProvider,
  useActiveSidebarCallout,
  useSidebarCallouts,
} from "@/contexts/sidebar-callout-context";

const CURRENT_KEY = "@ohmypcode:sidebar-callout-dismissals";
const LEGACY_KEY = "@paseo:sidebar-callout-dismissals";

function Probe({ dismissalKey }: { dismissalKey: string }) {
  const callouts = useSidebarCallouts();
  const active = useActiveSidebarCallout();
  useEffect(
    () =>
      callouts.show({
        id: "callout-a",
        dismissalKey,
        title: "Tip",
      }),
    [callouts, dismissalKey],
  );
  return React.createElement("span", null, active ? "visible" : "hidden");
}

async function renderProbe(dismissalKey: string): Promise<{ root: Root; container: HTMLElement }> {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <SidebarCalloutProvider>
        <Probe dismissalKey={dismissalKey} />
      </SidebarCalloutProvider>,
    );
    await Promise.resolve();
  });
  return { root, container };
}

describe("SidebarCalloutProvider dismissed-callout storage", () => {
  beforeEach(() => {
    storageItems.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("suppresses a callout dismissed under the legacy key", async () => {
    storageItems.set(LEGACY_KEY, JSON.stringify(["callout-a"]));

    const { root, container } = await renderProbe("callout-a");

    expect(container.textContent).toBe("hidden");
    await act(async () => root.unmount());
  });

  it("shows a callout whose key is absent from the legacy record", async () => {
    storageItems.set(LEGACY_KEY, JSON.stringify(["callout-other"]));

    const { root, container } = await renderProbe("callout-a");

    expect(container.textContent).toBe("visible");
    await act(async () => root.unmount());
  });

  it("prefers the current key when both keys hold a dismissal list", async () => {
    storageItems.set(CURRENT_KEY, JSON.stringify([]));
    storageItems.set(LEGACY_KEY, JSON.stringify(["callout-a"]));

    const { root, container } = await renderProbe("callout-a");

    expect(container.textContent).toBe("visible");
    await act(async () => root.unmount());
  });

  it("writes dismissals only to the current key", async () => {
    storageItems.set(LEGACY_KEY, JSON.stringify([]));

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const Dismisser = () => {
      const callouts = useSidebarCallouts();
      const active = useActiveSidebarCallout();
      useEffect(() => {
        callouts.show({ id: "callout-a", dismissalKey: "callout-a", title: "Tip" });
      }, [callouts]);
      useEffect(() => {
        // The callout only becomes active once the persisted dismissals have loaded, so waiting
        // for it guarantees the write happens after the read path settled.
        if (active) callouts.dismiss("callout-a");
      }, [active, callouts]);
      return null;
    };
    await act(async () => {
      root.render(
        <SidebarCalloutProvider>
          <Dismisser />
        </SidebarCalloutProvider>,
      );
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(storageItems.get(CURRENT_KEY)).toBe(JSON.stringify(["callout-a"]));
    expect(storageItems.get(LEGACY_KEY)).toBe(JSON.stringify([]));
    await act(async () => root.unmount());
  });
});
