import AsyncStorage from "@react-native-async-storage/async-storage";
import { type QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { ShortcutOverrides } from "@/keyboard/keyboard-shortcuts";
import {
  createShortcutOverrideStore,
  type ShortcutOverrideStore,
} from "@/keyboard/shortcut-override-store";
import { readValidatedJson, type ValidatedStorage } from "@/storage/validated-storage";

const STORAGE_KEY = "@ohmypcode:keyboard-shortcut-overrides";
// COMPAT(2026-09): read legacy @paseo:keyboard-shortcut-overrides once; remove after a migration window.
const LEGACY_STORAGE_KEY = "@paseo:keyboard-shortcut-overrides";
const QUERY_KEY = ["keyboard-shortcut-overrides"];

const EMPTY_OVERRIDES: ShortcutOverrides = {};
const ShortcutOverridesSchema = z.record(z.string(), z.string().nullable());

export interface UseKeyboardShortcutOverridesReturn {
  overrides: ShortcutOverrides;
  isLoading: boolean;
  setOverride: (bindingId: string, comboString: string) => Promise<void>;
  clearOverride: (bindingId: string) => Promise<void>;
  removeOverride: (bindingId: string) => Promise<void>;
  resetAll: () => Promise<void>;
  hasOverrides: boolean;
}

export function useKeyboardShortcutOverrides(): UseKeyboardShortcutOverridesReturn {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: loadOverridesFromStorage,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const store = getStore(queryClient);
  const overrides = data ?? EMPTY_OVERRIDES;

  return {
    overrides,
    isLoading: isPending,
    setOverride: store.set,
    clearOverride: store.clear,
    removeOverride: store.remove,
    resetAll: store.resetAll,
    hasOverrides: Object.keys(overrides).length > 0,
  };
}

/**
 * One store per query client. Every component that calls the hook has to share
 * a single write queue -- a store per hook instance would give each its own
 * queue and reintroduce the interleaving the store exists to prevent.
 */
const stores = new WeakMap<QueryClient, ShortcutOverrideStore>();

function getStore(queryClient: QueryClient): ShortcutOverrideStore {
  const existing = stores.get(queryClient);
  if (existing) return existing;

  const created = createShortcutOverrideStore({
    cache: {
      read: () => queryClient.getQueryData<ShortcutOverrides>(QUERY_KEY) ?? EMPTY_OVERRIDES,
      write: (next) => {
        queryClient.setQueryData<ShortcutOverrides>(QUERY_KEY, next);
      },
    },
    storage: {
      write: (serialized) => AsyncStorage.setItem(STORAGE_KEY, serialized),
      remove: () => AsyncStorage.removeItem(STORAGE_KEY),
    },
    onError: (err) => {
      console.error("[KeyboardShortcutOverrides] Failed to save overrides:", err);
    },
  });
  stores.set(queryClient, created);
  return created;
}

/** Exported so the legacy-key fallback can be exercised without the AsyncStorage singleton. */
export async function readShortcutOverrides(storage: ValidatedStorage): Promise<ShortcutOverrides> {
  return (
    (await readValidatedJson(storage, STORAGE_KEY, ShortcutOverridesSchema)) ??
    // COMPAT(2026-09): read legacy @paseo:keyboard-shortcut-overrides once; remove after a migration window.
    (await readValidatedJson(storage, LEGACY_STORAGE_KEY, ShortcutOverridesSchema)) ??
    EMPTY_OVERRIDES
  );
}

async function loadOverridesFromStorage(): Promise<ShortcutOverrides> {
  try {
    return await readShortcutOverrides(AsyncStorage);
  } catch (err) {
    console.error("[KeyboardShortcutOverrides] Failed to load overrides:", err);
  }
  return EMPTY_OVERRIDES;
}
