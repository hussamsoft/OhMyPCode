import { describe, expect, it } from "vitest";
import { buildWorkspaceTabPersistenceKey, type WorkspaceTabTarget } from "./model";

describe("buildWorkspaceTabPersistenceKey", () => {
  it("trims and joins opaque server and workspace ids", () => {
    expect(
      buildWorkspaceTabPersistenceKey({
        serverId: "  server-1  ",
        workspaceId: "  setup\\workspace\\  ",
      }),
    ).toBe("server-1:setup\\workspace\\");
  });

  it("rejects incomplete identities", () => {
    expect(buildWorkspaceTabPersistenceKey({ serverId: "", workspaceId: "workspace" })).toBeNull();
    expect(buildWorkspaceTabPersistenceKey({ serverId: "server", workspaceId: "  " })).toBeNull();
  });

  it("preserves omp vibe target shape and persistence identity", () => {
    const target = {
      kind: "omp_vibe",
      agentId: "parent-1",
      workerId: null,
    } satisfies WorkspaceTabTarget;

    expect(target).toEqual({ kind: "omp_vibe", agentId: "parent-1", workerId: null });
    expect(
      buildWorkspaceTabPersistenceKey({
        serverId: "server-1",
        workspaceId: "workspace-1",
      }),
    ).toBe("server-1:workspace-1");
  });
});
