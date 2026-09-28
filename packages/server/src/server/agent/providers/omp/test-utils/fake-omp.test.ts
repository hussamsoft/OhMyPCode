import { describe, expect, it } from "vitest";

import { FakeOmpSession } from "./fake-omp.js";

/**
 * The shared OMP test double has to agree with itself.
 *
 * `enterVibe` used to return `{ enabled: true }` without touching
 * `vibeState`, so a following `getVibeStatus()` answered `enabled: false`.
 * Any test asserting the state after entering was therefore asserting a
 * contradiction, and the contradiction is invisible unless something reads
 * the state back — which is exactly what the composer does.
 */
describe("FakeOmpSession vibe state", () => {
  const launch = { command: "omp", args: ["--mode", "rpc"], cwd: "/tmp", env: undefined } as never;

  it("reports enabled after enterVibe, matching the result it returned", async () => {
    const session = new FakeOmpSession(launch);

    const result = await session.enterVibe();
    expect(result.enabled).toBe(true);

    const status = await session.getVibeStatus();
    expect(status.enabled, "enterVibe returned enabled but getVibeStatus disagrees").toBe(true);
  });

  it("advances the revision so a pending operation can settle", async () => {
    const session = new FakeOmpSession(launch);
    const before = (await session.getVibeStatus()).revision;

    await session.enterVibe();

    expect((await session.getVibeStatus()).revision).toBeGreaterThan(before);
  });

  it("reports disabled after exitVibe, matching the result it returned", async () => {
    const session = new FakeOmpSession(launch);
    await session.enterVibe();

    const result = await session.exitVibe();
    expect(result.enabled).toBe(false);

    const status = await session.getVibeStatus();
    expect(status.enabled, "exitVibe returned disabled but getVibeStatus disagrees").toBe(false);
  });
});
