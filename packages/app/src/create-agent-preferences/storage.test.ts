import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AsyncStorageCreateAgentPreferenceStorage,
  CREATE_AGENT_PREFERENCES_STORAGE_KEY,
  LEGACY_CREATE_AGENT_PREFERENCES_STORAGE_KEY,
} from "./storage";

// The module under test reaches the real AsyncStorage singleton directly, so the seam is the
// module itself rather than an injected fake.
const stored = vi.hoisted(() => new Map<string, string>());

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => stored.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      stored.set(key, value);
    },
    removeItem: async (key: string) => {
      stored.delete(key);
    },
  },
}));

const LEGACY_PREFERENCES = {
  provider: "claude",
  providerPreferences: { claude: { model: "opus" } },
};

describe("create agent preference storage keys", () => {
  beforeEach(() => {
    stored.clear();
  });

  it("reads preferences that only exist under the pre-rename key", async () => {
    stored.set(LEGACY_CREATE_AGENT_PREFERENCES_STORAGE_KEY, JSON.stringify(LEGACY_PREFERENCES));
    const storage = new AsyncStorageCreateAgentPreferenceStorage();

    await expect(storage.read()).resolves.toEqual(LEGACY_PREFERENCES);
  });

  it("keeps writing only to the renamed key, which then shadows the pre-rename one", async () => {
    stored.set(LEGACY_CREATE_AGENT_PREFERENCES_STORAGE_KEY, JSON.stringify(LEGACY_PREFERENCES));
    const storage = new AsyncStorageCreateAgentPreferenceStorage();

    await storage.write({ provider: "codex" });

    expect(stored.get(LEGACY_CREATE_AGENT_PREFERENCES_STORAGE_KEY)).toBe(
      JSON.stringify(LEGACY_PREFERENCES),
    );
    expect(stored.get(CREATE_AGENT_PREFERENCES_STORAGE_KEY)).toBe(
      JSON.stringify({ provider: "codex" }),
    );
    await expect(storage.read()).resolves.toEqual({ provider: "codex" });
  });

  it("resolves to nothing when neither key holds preferences", async () => {
    const storage = new AsyncStorageCreateAgentPreferenceStorage();

    await expect(storage.read()).resolves.toBeNull();
  });
});
