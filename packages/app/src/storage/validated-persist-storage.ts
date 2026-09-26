import { z } from "zod";
import type { PersistStorage, StateStorage } from "zustand/middleware";

/**
 * `legacyName`, when provided, is read once as a fallback when `name` has no value yet. A legacy
 * hit is forward-written under `name` immediately so the fallback only ever fires once per
 * install; `name` is the only key later writes ever touch.
 */
export function createValidatedPersistStorage<State>(
  backingStorage: StateStorage,
  stateSchema: z.ZodType<State>,
  legacyName?: string,
): PersistStorage<State> {
  const envelopeSchema = z.strictObject({
    state: stateSchema,
    version: z.number().int().nonnegative().optional(),
  });

  return {
    getItem: async (name) => {
      let raw = await backingStorage.getItem(name);
      let fromLegacy = false;
      if (raw === null && legacyName !== undefined) {
        raw = await backingStorage.getItem(legacyName);
        fromLegacy = raw !== null;
      }
      if (raw === null) return null;

      let decoded: unknown;
      try {
        decoded = JSON.parse(raw);
      } catch {
        await backingStorage.removeItem(name);
        return null;
      }

      const result = envelopeSchema.safeParse(decoded);
      if (!result.success) {
        await backingStorage.removeItem(name);
        return null;
      }
      // Forward-write only a value that already passed validation, so a malformed legacy blob
      // never gets copied over and then immediately deleted on every launch.
      if (fromLegacy) {
        await backingStorage.setItem(name, raw);
      }
      return result.data;
    },
    setItem: async (name, value) => {
      const result = envelopeSchema.safeParse(value);
      if (!result.success) {
        await backingStorage.removeItem(name);
        return;
      }
      await backingStorage.setItem(name, JSON.stringify(result.data));
    },
    removeItem: async (name) => {
      await backingStorage.removeItem(name);
      if (legacyName !== undefined) {
        await backingStorage.removeItem(legacyName);
      }
    },
  };
}
