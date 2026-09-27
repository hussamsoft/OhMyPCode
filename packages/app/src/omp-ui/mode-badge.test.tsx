/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OmpModeBadge, type OmpModeBadgeProps } from "./mode-badge";

beforeEach(() => {
  vi.stubGlobal("React", React);
});

afterEach(() => {
  cleanup();
});

const ACTIVE_TOGGLES: OmpModeBadgeProps["toggles"] = {
  fast: true,
  advisor: false,
  prewalk: true,
};

describe("OmpModeBadge", () => {
  it("renders the no-mode badge when no mode is supplied", () => {
    const view = render(<OmpModeBadge />);
    expect(view.getByText("No mode")).toBeTruthy();
  });

  it("renders plan / vibe / goal labels", () => {
    const plan = render(<OmpModeBadge persistedMode="plan" />);
    expect(plan.getByText("Plan")).toBeTruthy();

    const vibe = render(<OmpModeBadge persistedMode="vibe" />);
    expect(vibe.getByText("Vibe")).toBeTruthy();

    const goal = render(<OmpModeBadge persistedMode="goal" />);
    expect(goal.getByText("Goal")).toBeTruthy();
  });

  it("renders the warning-styled paused variants for plan_paused and goal_paused", () => {
    const planPaused = render(<OmpModeBadge persistedMode="plan_paused" />);
    expect(planPaused.getByText("Plan · paused")).toBeTruthy();
    const goalPaused = render(<OmpModeBadge persistedMode="goal_paused" />);
    expect(goalPaused.getByText("Goal · paused")).toBeTruthy();
  });

  it(
    "renders unknown mode ids verbatim rather than hiding them -- " +
      "this is the forward-compatibility behavior the plan calls out specifically",
    () => {
      // A future OMP version could add a new persisted mode name; the badge
      // must still surface the id so the user can see what's actually selected.
      const view = render(<OmpModeBadge persistedMode="hyperthread_pivot" />);
      expect(view.getByText("hyperthread_pivot")).toBeTruthy();
    },
  );

  it("renders unknown session-mode ids verbatim", () => {
    const view = render(<OmpModeBadge persistedMode="plan" sessionMode="temporal" />);
    expect(view.getByText("Plan")).toBeTruthy();
    // The session id appears as `· <id>` beside the persisted badge; match the
    // id substring so we don't depend on the exact leading separator.
    expect(view.getByText(/temporal/)).toBeTruthy();
  });

  it("renders active toggles and suppresses off toggles", () => {
    const view = render(<OmpModeBadge persistedMode="plan" toggles={ACTIVE_TOGGLES} />);
    // Toggle labels are capitalized ("Fast", "Prewalk"); case-insensitive match
    // keeps the test stable across future label re-styling.
    expect(view.getByText(/Fast/)).toBeTruthy();
    expect(view.getByText(/Prewalk/)).toBeTruthy();
    expect(view.queryByText(/Advisor/)).toBeNull();
  });

  it("hides the session-mode pill when sessionMode is the literal `none`", () => {
    const view = render(<OmpModeBadge persistedMode="plan" sessionMode="none" />);
    // Persisted badge renders "Plan"; no "· Loop" or "· <id>" follows.
    expect(view.getByText("Plan")).toBeTruthy();
    expect(view.queryByText(/·/)).toBeNull();
  });
});
