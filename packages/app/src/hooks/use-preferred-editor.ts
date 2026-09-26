import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { readValidatedString, type ValidatedStorage } from "@/storage/validated-storage";

type EditorTargetId = string;

const PREFERRED_EDITOR_STORAGE_KEY = "@ohmypcode:preferred-editor";
// COMPAT(2026-09): read legacy @paseo:preferred-editor once; remove after a migration window.
const LEGACY_PREFERRED_EDITOR_STORAGE_KEY = "@paseo:preferred-editor";
const PREFERRED_EDITOR_QUERY_KEY = ["preferred-editor"];
const PREFERRED_EDITOR_ID_SCHEMA = z.string().trim().min(1);

/** Exported so the legacy-key fallback can be exercised without the AsyncStorage singleton. */
export async function readPreferredEditorId(
  storage: ValidatedStorage,
): Promise<EditorTargetId | null> {
  return (
    (await readValidatedString(
      storage,
      PREFERRED_EDITOR_STORAGE_KEY,
      PREFERRED_EDITOR_ID_SCHEMA,
    )) ??
    // COMPAT(2026-09): read legacy @paseo:preferred-editor once; remove after a migration window.
    (await readValidatedString(
      storage,
      LEGACY_PREFERRED_EDITOR_STORAGE_KEY,
      PREFERRED_EDITOR_ID_SCHEMA,
    ))
  );
}

async function loadPreferredEditor(): Promise<EditorTargetId | null> {
  return readPreferredEditorId(AsyncStorage);
}

export function resolvePreferredEditorId(
  availableEditorIds: readonly EditorTargetId[],
  storedEditorId: EditorTargetId | null | undefined,
): EditorTargetId | null {
  if (storedEditorId === undefined) {
    return null;
  }
  if (
    storedEditorId &&
    availableEditorIds.some((availableEditorId) => availableEditorId === storedEditorId)
  ) {
    return storedEditorId;
  }
  return availableEditorIds[0] ?? null;
}

export function usePreferredEditor() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: PREFERRED_EDITOR_QUERY_KEY,
    queryFn: loadPreferredEditor,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const updatePreferredEditor = useCallback(
    async (editorId: EditorTargetId | null) => {
      queryClient.setQueryData(PREFERRED_EDITOR_QUERY_KEY, editorId);
      if (editorId) {
        await AsyncStorage.setItem(PREFERRED_EDITOR_STORAGE_KEY, editorId);
        return;
      }
      await AsyncStorage.removeItem(PREFERRED_EDITOR_STORAGE_KEY);
    },
    [queryClient],
  );

  return {
    preferredEditorId: isPending ? undefined : (data ?? null),
    isLoading: isPending,
    updatePreferredEditor,
  };
}
