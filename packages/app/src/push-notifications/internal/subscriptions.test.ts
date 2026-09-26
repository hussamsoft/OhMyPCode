import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DaemonClient } from "@getpaseo/client/internal/daemon-client";

const storageItems = vi.hoisted(() => new Map<string, string>());

const asyncStorage = vi.hoisted(() => ({
  getItem: async (key: string) => storageItems.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    storageItems.set(key, value);
  },
  removeItem: async (key: string) => {
    storageItems.delete(key);
  },
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: asyncStorage,
}));

vi.mock("expo-constants", () => ({
  default: { easConfig: null, expoConfig: null },
}));

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  PermissionStatus: { GRANTED: "granted", DENIED: "denied" },
  AndroidImportance: { DEFAULT: 3 },
}));

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));

import { revokeSubscription } from "./subscriptions";

const SERVER_ID = "srv_1";
const CURRENT_KEY = `@ohmypcode:expo-push-token:${SERVER_ID}`;
const LEGACY_KEY = `@paseo:expo-push-token:${SERVER_ID}`;

function createClient(options: { connected?: boolean; supportsRevocation?: boolean } = {}) {
  const revoked: string[] = [];
  const client = {
    isConnected: options.connected ?? true,
    getLastServerInfoMessage: () => ({
      features: { pushTokenRevocation: options.supportsRevocation ?? true },
    }),
    unregisterPushToken: async (token: string) => {
      revoked.push(token);
    },
  } as unknown as DaemonClient;
  return { client, revoked };
}

describe("revokeSubscription", () => {
  beforeEach(() => {
    storageItems.clear();
  });

  it("revokes a token stored under the current key", async () => {
    storageItems.set(CURRENT_KEY, "ExponentPushToken[current]");
    const { client, revoked } = createClient();

    await revokeSubscription({ client, serverId: SERVER_ID });

    expect(revoked).toEqual(["ExponentPushToken[current]"]);
    expect(storageItems.has(CURRENT_KEY)).toBe(false);
  });

  it("revokes a token stored under the legacy key and clears it", async () => {
    storageItems.set(LEGACY_KEY, "ExponentPushToken[legacy]");
    const { client, revoked } = createClient();

    await revokeSubscription({ client, serverId: SERVER_ID });

    expect(revoked).toEqual(["ExponentPushToken[legacy]"]);
    expect(storageItems.has(LEGACY_KEY)).toBe(false);
  });

  it("prefers the current key when both prefixes hold a token", async () => {
    storageItems.set(CURRENT_KEY, "ExponentPushToken[current]");
    storageItems.set(LEGACY_KEY, "ExponentPushToken[legacy]");
    const { client, revoked } = createClient();

    await revokeSubscription({ client, serverId: SERVER_ID });

    expect(revoked).toEqual(["ExponentPushToken[current]"]);
  });

  it("still clears both keys when the daemon is offline", async () => {
    storageItems.set(LEGACY_KEY, "ExponentPushToken[legacy]");
    const { client, revoked } = createClient({ connected: false });

    await revokeSubscription({ client, serverId: SERVER_ID });

    expect(revoked).toEqual([]);
    expect(storageItems.has(LEGACY_KEY)).toBe(false);
  });
});
