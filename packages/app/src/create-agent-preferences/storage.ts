import AsyncStorage from "@react-native-async-storage/async-storage";
import { readValidatedJson } from "@/storage/validated-storage";
import {
  FormPreferencesSchema,
  StoredFormPreferencesSchema,
  type FormPreferences,
} from "./preferences";

export const CREATE_AGENT_PREFERENCES_STORAGE_KEY = "@ohmypcode:create-agent-preferences";
// COMPAT(2026-09): read legacy @paseo:create-agent-preferences once; remove after a migration window.
export const LEGACY_CREATE_AGENT_PREFERENCES_STORAGE_KEY = "@paseo:create-agent-preferences";

export interface CreateAgentPreferenceStorage {
  read(): Promise<unknown>;
  write(preferences: FormPreferences): Promise<void>;
}

export class AsyncStorageCreateAgentPreferenceStorage implements CreateAgentPreferenceStorage {
  async read(): Promise<unknown> {
    const stored = await readValidatedJson(
      AsyncStorage,
      CREATE_AGENT_PREFERENCES_STORAGE_KEY,
      StoredFormPreferencesSchema,
    );
    if (stored !== null) {
      return stored;
    }

    // COMPAT(2026-09): every existing user's preferences still live under the pre-rename key, so
    // a miss on the new key falls back to it. Writes only ever target the new key, which shadows
    // the legacy one from that point on. Remove after a migration window.
    return readValidatedJson(
      AsyncStorage,
      LEGACY_CREATE_AGENT_PREFERENCES_STORAGE_KEY,
      StoredFormPreferencesSchema,
    );
  }

  async write(preferences: FormPreferences): Promise<void> {
    const result = FormPreferencesSchema.safeParse(preferences);
    if (!result.success) {
      await AsyncStorage.removeItem(CREATE_AGENT_PREFERENCES_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(CREATE_AGENT_PREFERENCES_STORAGE_KEY, JSON.stringify(result.data));
  }
}
