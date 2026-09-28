/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n as testI18n } from "@/i18n/i18next";
import { OmpStatusBar, type OmpStatusBarData } from "./omp-status-bar";
import type { StatusLineSegmentId } from "./segments";

// useTranslation demands an initialized i18n instance. The shared project
// instance is fine — the rootLabel key intentionally falls back to the key
// itself when missing, so an absent key doesn't fail rendering.
void testI18n;

beforeEach(() => {
  vi.stubGlobal("React", React);
});

afterEach(() => {
  cleanup();
});

const FULL_DEFAULT_DATA: OmpStatusBarData = {
  preset: "default",
  modelLabel: "sonnet",
  path: "/repo",
  currentBranch: "main",
  lastUsage: {
    inputTokens: 1234,
    outputTokens: 56,
    cachedInputTokens: 200,
    totalCostUsd: 0.42,
    contextWindowUsedTokens: 4000,
    contextWindowMaxTokens: 200000,
  },
};

const MINIMAL_DEFAULT_DATA: OmpStatusBarData = {
  preset: "default",
  modelLabel: "sonnet",
  path: "/repo",
};

const GIT_HIDDEN_DATA: OmpStatusBarData = {
  preset: "default",
  modelLabel: "sonnet",
  path: "/repo",
  currentBranch: "main",
  unavailable: new Set(["git"]),
};

const EMPTY_DEFAULT_DATA: OmpStatusBarData = { preset: "default" };

describe("OmpStatusBar", () => {
  it("renders real model / path / git / cost / ctx segments when their data is supplied", () => {
    // `default` is the only preset that includes path, model, git, and context
    // in a single line: ["pi", "vim", "model", "mode", "collab", "stream",
    // "path", "git", "pr", "context_pct", "cost"].
    const view = render(<OmpStatusBar data={FULL_DEFAULT_DATA} />);
    expect(view.getByText("sonnet")).toBeTruthy();
    expect(view.getByText("/repo")).toBeTruthy();
    expect(view.getByText("main")).toBeTruthy();
    // context_pct = 4000/200000 = 2%
    expect(view.getByText("2%")).toBeTruthy();
  });

  it("suppresses git / pr / subagents when their data is absent (no fabrication)", () => {
    const view = render(<OmpStatusBar data={MINIMAL_DEFAULT_DATA} />);
    expect(view.getByText("sonnet")).toBeTruthy();
    expect(view.getByText("/repo")).toBeTruthy();
    // No #PR without data.
    expect(view.queryByText(/^#\d+$/)).toBeNull();
  });

  it("respects the explicit `unavailable` set", () => {
    const view = render(<OmpStatusBar data={GIT_HIDDEN_DATA} />);
    expect(view.getByText("sonnet")).toBeTruthy();
    expect(view.getByText("/repo")).toBeTruthy();
    // Even though currentBranch='main', the unavailable set hides it.
    expect(view.queryByText("main")).toBeNull();
  });

  it("still renders the static `pi` segment even when no other data is supplied", () => {
    const view = render(<OmpStatusBar data={EMPTY_DEFAULT_DATA} />);
    expect(view.getByText("π")).toBeTruthy();
  });
});

describe("newly wired segments", () => {
  // Each case names its segment explicitly so the test proves that segment
  // renders rather than that the default preset happens to include it.
  const bar = (ids: StatusLineSegmentId[], data: Partial<OmpStatusBarData> = {}) =>
    render(
      <OmpStatusBar
        data={{
          preset: "default",
          ...data,
          overrides: { leftSegments: ids, rightSegments: [] },
        }}
      />,
    );

  it("reports provider headroom, and nothing when there is no balance", () => {
    expect(
      bar(["usage"], { providerUsage: { remainingPct: 7, providerId: "anthropic" } }).getByText(
        "7%",
      ),
    ).toBeTruthy();
    // No balance must render no segment -- a fabricated 0% would read as
    // "you are out of quota", which is a different and alarming claim.
    expect(bar(["usage"]).container.textContent).not.toContain("%");
  });

  it("includes the reset window when the provider reports one", () => {
    const view = bar(["usage"], {
      providerUsage: { remainingPct: 42, providerId: "anthropic", resetLabel: "resets 09:00" },
    });
    expect(view.getByText(/42% · resets 09:00/)).toBeTruthy();
  });

  it("shows the session identity", () => {
    expect(bar(["session"], { sessionIdentity: "agent-42" }).getByText("agent-42")).toBeTruthy();
    expect(bar(["session"]).container.textContent).not.toContain("agent-42");
  });

  it("shows collab only when the capability is actually present", () => {
    expect(bar(["collab"], { collabAvailable: true }).getByText("collab")).toBeTruthy();
    expect(bar(["collab"], { collabAvailable: false }).container.textContent).not.toContain(
      "collab",
    );
  });

  it("prefers a caller-supplied clock over the internal tick", () => {
    // The bar owns a clock, but a caller that already has a formatted time must
    // win, or the two would disagree.
    expect(bar(["time"], { clockTime: "09:41" }).getByText("09:41")).toBeTruthy();
  });

  it("shows the elapsed turn time when one is supplied", () => {
    expect(bar(["time_spent"], { turnElapsed: "01:05" }).getByText("01:05")).toBeTruthy();
  });
});
