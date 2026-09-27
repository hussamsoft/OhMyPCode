/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n as testI18n } from "@/i18n/i18next";
import { OmpStatusBar, type OmpStatusBarData } from "./omp-status-bar";

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
