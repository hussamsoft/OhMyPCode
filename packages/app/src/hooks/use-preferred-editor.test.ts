import { describe, expect, it } from "vitest";
import { readPreferredEditorId, resolvePreferredEditorId } from "./use-preferred-editor";

function createMemoryStorage(initial: Record<string, string>) {
  const entries = new Map(Object.entries(initial));
  return {
    async getItem(key: string) {
      return entries.get(key) ?? null;
    },
    async removeItem(key: string) {
      entries.delete(key);
    },
  };
}

describe("readPreferredEditorId", () => {
  it("reads the editor id stored under the legacy key", async () => {
    const storage = createMemoryStorage({ "@paseo:preferred-editor": "vscode" });

    expect(await readPreferredEditorId(storage)).toBe("vscode");
  });

  it("prefers the current key over the legacy one", async () => {
    const storage = createMemoryStorage({
      "@ohmypcode:preferred-editor": "zed",
      "@paseo:preferred-editor": "vscode",
    });

    expect(await readPreferredEditorId(storage)).toBe("zed");
  });

  it("returns null when neither key holds a value", async () => {
    expect(await readPreferredEditorId(createMemoryStorage({}))).toBeNull();
  });
});

describe("resolvePreferredEditorId", () => {
  it("keeps the stored editor when it is still available", () => {
    expect(resolvePreferredEditorId(["cursor", "vscode"], "vscode")).toBe("vscode");
  });

  it("falls back to the first available editor when the stored one is missing", () => {
    expect(resolvePreferredEditorId(["zed", "finder"], "cursor")).toBe("zed");
  });

  it("falls back when a platform-specific file manager target is unavailable", () => {
    expect(resolvePreferredEditorId(["explorer", "vscode"], "finder")).toBe("explorer");
  });

  it("keeps unknown editor ids when they are still available", () => {
    expect(resolvePreferredEditorId(["unknown-editor", "cursor"], "unknown-editor")).toBe(
      "unknown-editor",
    );
  });

  it("keeps custom script target ids as plain strings", () => {
    expect(resolvePreferredEditorId(["script:open-in-nvim", "cursor"], "script:open-in-nvim")).toBe(
      "script:open-in-nvim",
    );
  });

  it("returns null when no editors are available", () => {
    expect(resolvePreferredEditorId([], "cursor")).toBeNull();
  });
});
