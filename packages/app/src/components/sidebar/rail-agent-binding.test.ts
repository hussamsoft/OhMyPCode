import { describe, expect, it } from "vitest";
import { selectRailAgentId, type RailAgentSession } from "./rail-agent-binding";

function session(agents: string[], focusedAgentId: string | null = null): RailAgentSession {
  return {
    focusedAgentId,
    agents: new Map(agents.map((id) => [id, { id }])),
  };
}

const at = (table: Record<string, number>) => (id: string) => table[id];

describe("selectRailAgentId", () => {
  it("returns null when there are no agents at all", () => {
    // Every agent-scoped rail entry depends on this: with no agent the entry
    // must disable rather than navigate somewhere arbitrary.
    expect(selectRailAgentId([], at({}))).toBeNull();
    expect(selectRailAgentId([session([])], at({}))).toBeNull();
  });

  it("falls back to the most recently active agent across sessions", () => {
    const sessions = [session(["a", "b"]), session(["c"])];
    expect(selectRailAgentId(sessions, at({ a: 10, b: 30, c: 20 }))).toBe("b");
  });

  // The rule that matters most: the agent in front of the user beats a more
  // recently active one elsewhere. Recency is a fallback for a session nobody
  // is looking at, not a reason to yank the rail away.
  it("prefers a focused agent over a more recently active one", () => {
    const sessions = [session(["a", "b"], "a"), session(["c"])];
    expect(selectRailAgentId(sessions, at({ a: 1, b: 5, c: 99 }))).toBe("a");
  });

  // A stale focusedAgentId left over from a deleted agent must not win, or the
  // rail would point at a workspace that no longer exists.
  it("ignores a focused id that no longer resolves to an agent", () => {
    const sessions = [session(["b"], "deleted-agent")];
    expect(selectRailAgentId(sessions, at({ b: 42 }))).toBe("b");
  });

  it("treats an agent with no recorded activity as the oldest, not the newest", () => {
    const sessions = [session(["unknown", "known"])];
    expect(selectRailAgentId(sessions, at({ known: 1 }))).toBe("known");
  });

  it("does not depend on map iteration order", () => {
    const forwards = selectRailAgentId([session(["a", "b", "c"])], at({ a: 3, b: 1, c: 2 }));
    const backwards = selectRailAgentId([session(["c", "b", "a"])], at({ a: 3, b: 1, c: 2 }));
    expect(forwards).toBe("a");
    expect(backwards).toBe("a");
  });
});
