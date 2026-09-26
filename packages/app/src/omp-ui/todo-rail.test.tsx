/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OmpTodoRail, type OmpTodoItem, type OmpTodoPhase } from "./todo-rail";

beforeEach(() => {
  vi.stubGlobal("React", React);
});

afterEach(() => {
  cleanup();
});

function pending(content: string): OmpTodoItem {
  return { text: content, status: "pending" };
}

function completed(content: string): OmpTodoItem {
  return { text: content, status: "completed" };
}

function inProgress(content: string): OmpTodoItem {
  return { text: content, status: "in_progress" };
}

describe("OmpTodoRail", () => {
  it("renders an aggregated header from phase tasks", () => {
    const phases: OmpTodoPhase[] = [
      {
        name: "Setup",
        tasks: [completed("install deps"), pending("compile")],
      },
      {
        name: "Verify",
        tasks: [inProgress("smoke test")],
      },
    ];
    const view = render(<OmpTodoRail phases={phases} />);
    expect(view.getByText("Setup")).toBeTruthy();
    expect(view.getByText("Verify")).toBeTruthy();
    // Per-phase progress reads "completed/total".
    expect(view.getByText("1/2")).toBeTruthy();
    expect(view.getByText("0/1")).toBeTruthy();
  });

  it("parses prefixed raw items into phase buckets", () => {
    const items: OmpTodoItem[] = [
      { text: "[Setup] install deps", status: "completed" },
      { text: "[Setup] compile", status: "pending" },
      { text: "[Verify] smoke", status: "in_progress" },
      { text: "no-prefix todo", status: "pending" },
    ];
    const view = render(<OmpTodoRail items={items} />);
    // Phase names lifted out of the prefix; unprefixed task lives under "Unassigned".
    expect(view.getByText("Setup")).toBeTruthy();
    expect(view.getByText("Verify")).toBeTruthy();
    expect(view.getByText("Unassigned")).toBeTruthy();
    expect(view.getByText("install deps")).toBeTruthy();
    expect(view.getByText("compile")).toBeTruthy();
    expect(view.getByText("smoke")).toBeTruthy();
    expect(view.getByText("no-prefix todo")).toBeTruthy();
  });

  it("renders nothing when no phases and no items are given", () => {
    const view = render(<OmpTodoRail />);
    expect(view.container.firstChild).toBeNull();
  });

  it("honors the bottom position layout", () => {
    const phases: OmpTodoPhase[] = [{ name: "Phase A", tasks: [pending("task")] }];
    const view = render(<OmpTodoRail phases={phases} position="bottom" />);
    expect(view.getByTestId("omp-todo-rail")).toBeTruthy();
    expect(view.getByText("Phase A")).toBeTruthy();
  });
});
