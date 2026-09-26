/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OmpRuntimeStatus } from "@/desktop/updates/omp-runtime-status";
import { OmpRuntimeRows } from "./omp-runtime-section";

const { theme, statusState } = vi.hoisted(() => ({
  theme: {
    spacing: { 1: 4, 4: 16 },
    fontSize: { sm: 13, base: 15 },
    fontWeight: { normal: "400" },
    borderRadius: { lg: 8 },
    colors: {
      foreground: "#fff",
      foregroundMuted: "#aaa",
      border: "#555",
      surface1: "#111",
      statusDanger: "#ff0000",
      palette: { amber: { 500: "#febc38" } },
    },
  },
  statusState: {
    status: null as OmpRuntimeStatus | null,
    isLoading: false,
  },
}));

vi.mock("react-native", () => ({
  View: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children),
  Text: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("span", null, children),
}));

vi.mock("react-native-unistyles", () => ({
  StyleSheet: {
    create: (factory: unknown) =>
      typeof factory === "function" ? (factory as (t: typeof theme) => unknown)(theme) : factory,
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const table: Record<string, string> = {
        "settings.about.ompRuntime": "OMP runtime",
        "settings.about.ompRuntimeSystem": "system omp",
        "settings.about.ompRuntimeUnavailable": "Not found",
        "settings.about.ompRuntimeStaleWarning":
          "Bundled OMP runtime is out of date — rebuild with `npm run build:omp-runtime`",
        "settings.about.ompSource": "OMP source",
        "settings.about.ompSourceUnavailable": "Unknown",
      };
      return table[key] ?? key;
    },
  }),
}));

function fakeFormatVersionWithPrefix(version: string | null | undefined): string {
  if (!version) return "";
  return version.startsWith("v") ? version : `v${version}`;
}

vi.mock("@/desktop/updates/desktop-updates", () => ({
  formatVersionWithPrefix: fakeFormatVersionWithPrefix,
}));

vi.mock("@/desktop/updates/use-omp-runtime-status", () => ({
  useOmpRuntimeStatus: () => statusState,
}));

function renderInto(container: HTMLElement) {
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(OmpRuntimeRows));
  });
  return root;
}

describe("OmpRuntimeRows", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    vi.stubGlobal("React", React);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = null;
  });

  afterEach(() => {
    if (root) act(() => root!.unmount());
    container.remove();
    statusState.status = null;
    statusState.isLoading = false;
    vi.unstubAllGlobals();
  });

  it("renders nothing while loading", () => {
    statusState.isLoading = true;
    root = renderInto(container);
    expect(container.textContent).toBe("");
  });

  it("renders nothing when status is unavailable to load", () => {
    statusState.status = null;
    root = renderInto(container);
    expect(container.textContent).toBe("");
  });

  it("renders bundled runtime + source rows without a warning when not stale", () => {
    statusState.status = {
      kind: "bundled",
      ompVersion: "18.3.1",
      sourceCommit: "e5d1b5d886387793b8a56835de463a23c68a8d19",
      liveProbedVersion: "18.3.1",
      isStale: false,
    };
    root = renderInto(container);
    expect(container.textContent).toContain("OMP runtime");
    expect(container.textContent).toContain("v18.3.1");
    expect(container.textContent).toContain("OMP source");
    expect(container.textContent).toContain("e5d1b5d");
    expect(container.textContent).not.toContain("out of date");
  });

  it("renders a stale warning when the manifest disagrees with the live probe", () => {
    statusState.status = {
      kind: "bundled",
      ompVersion: "18.3.0",
      sourceCommit: "abc123def456",
      liveProbedVersion: "18.3.1",
      isStale: true,
    };
    root = renderInto(container);
    expect(container.textContent).toContain("out of date");
  });

  it("renders the system-omp label and version, with no source row", () => {
    statusState.status = {
      kind: "system",
      ompVersion: "18.3.1",
      sourceCommit: null,
      liveProbedVersion: "18.3.1",
      isStale: false,
    };
    root = renderInto(container);
    expect(container.textContent).toContain("system omp");
    expect(container.textContent).toContain("v18.3.1");
    expect(container.textContent).not.toContain("OMP source");
  });

  it("renders 'Not found' with no source row when unavailable", () => {
    statusState.status = {
      kind: "unavailable",
      ompVersion: null,
      sourceCommit: null,
      liveProbedVersion: null,
      isStale: false,
    };
    root = renderInto(container);
    expect(container.textContent).toContain("Not found");
    expect(container.textContent).not.toContain("OMP source");
  });
});
