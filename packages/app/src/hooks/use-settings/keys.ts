/** Storage keys live here so `storage` and `migrations` can share them without importing each other. */

export const APP_SETTINGS_KEY = "@ohmypcode:app-settings";
// COMPAT(2026-09): read legacy @paseo:app-settings once; remove after a migration window.
export const LEGACY_APP_SETTINGS_KEY = "@paseo:app-settings";
export const LEGACY_SETTINGS_KEY = "@paseo:settings";

/**
 * The applied-migration marker deliberately sits outside the settings blob:
 * App settings preserve fields newer builds understand, but this marker remains separate so
 * applying a migration never becomes an app-settings field that older builds must interpret.
 * Keeping the marker as a list of ids also means the next migration is a new entry rather than
 * a schema change.
 */
export const SETTINGS_MIGRATIONS_KEY = "@ohmypcode:settings-migrations";
// COMPAT(2026-09): read legacy @paseo:settings-migrations once; remove after a migration window.
export const LEGACY_SETTINGS_MIGRATIONS_KEY = "@paseo:settings-migrations";
