/** Storage key lives here so the store and its tests can share it without importing
 * index.ts, which schedules AsyncStorage hydration and attachment GC on import. */
export const DRAFT_STORE_KEY = "ohmypcode-drafts";

// COMPAT(2026-09): read legacy paseo-drafts once; remove after a migration window. Drafts hold
// unsent user-typed text, so this key needs the same fallback treatment as the @paseo: keys.
export const LEGACY_DRAFT_STORE_KEY = "paseo-drafts";
