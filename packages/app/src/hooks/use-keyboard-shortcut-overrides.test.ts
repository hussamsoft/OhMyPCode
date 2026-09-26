import { describe, expect, it } from "vitest";
import { readShortcutOverrides } from "./use-keyboard-shortcut-overrides";

function createMemoryStorage(initial: Record<string, string>) {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    async getItem(key: string) {
      return entries.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      entries.set(key, value);
    },
    async removeItem(key: string) {
      entries.delete(key);
    },
  };
}

describe("readShortcutOverrides", () => {
  it("reads overrides stored under the legacy key", async () => {
    const storage = createMemoryStorage({
      "@paseo:keyboard-shortcut-overrides": JSON.stringify({
        "agent.cancel": "ctrl+shift+backspace",
      }),
    });

    expect(await readShortcutOverrides(storage)).toEqual({
      "agent.cancel": "ctrl+shift+backspace",
    });
  });

  it("prefers the current key over the legacy one", async () => {
    const storage = createMemoryStorage({
      "@ohmypcode:keyboard-shortcut-overrides": JSON.stringify({ "agent.cancel": "ctrl+alt+c" }),
      "@paseo:keyboard-shortcut-overrides": JSON.stringify({
        "agent.cancel": "ctrl+shift+backspace",
      }),
    });

    expect(await readShortcutOverrides(storage)).toEqual({ "agent.cancel": "ctrl+alt+c" });
  });

  it("returns no overrides when neither key holds a value", async () => {
    expect(await readShortcutOverrides(createMemoryStorage({}))).toEqual({});
  });
});
