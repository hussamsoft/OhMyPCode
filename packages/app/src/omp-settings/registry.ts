/**
 * Tab registry for the OMP settings form rendered in the desktop composer.
 *
 * The actual tab list is declared in OMP's `tui/src/overlays/settings-defs.ts`
 * via `SETTING_TABS`. The wire schema (OmpSettingEntrySchema) carries the same
 * `ui.tab` string back to us, so we must use those literal names verbatim;
 * entries declaring an unknown tab are still rendered (under an "Other" bucket)
 * so a schema bump is non-breaking for users who land on a slightly newer OMP.
 */

export type OmpSettingsTabId =
  | "appearance"
  | "model"
  | "interaction"
  | "context"
  | "memory"
  | "files"
  | "shell"
  | "tools"
  | "tasks"
  | "providers";

/**
 * Subset that the desktop composer surface exposes by default and the order
 * they appear in. Re-ordered against `SETTING_TABS` so the model and
 * interaction tabs are most prominent (the things an OMP session actually
 * cares about), with environment-specific tabs (`files`, `shell`, `tasks`)
 * retained but ranked lower. Anything not listed falls through to "Other".
 */
export const OMP_SETTINGS_TAB_ORDER: readonly OmpSettingsTabId[] = [
  "model",
  "interaction",
  "context",
  "appearance",
  "tools",
  "providers",
  "memory",
  "shell",
  "files",
  "tasks",
];

const OMP_SETTINGS_TAB_LABEL_MAP: Readonly<Record<OmpSettingsTabId, string>> = {
  appearance: "Appearance",
  model: "Model",
  interaction: "Interaction",
  context: "Context",
  memory: "Memory",
  files: "Files",
  shell: "Shell",
  tools: "Tools",
  tasks: "Tasks",
  providers: "Providers",
};

/** Display label for the catch-all bucket when an entry references an unknown tab. */
export const OMP_SETTINGS_OTHER_TAB_LABEL = "Other";

/** Type guard + display lookup; preserving this indirection is justified because
 * callers from outside this module need type-narrowing, and label lookup is the
 * pivot both the form and any test fixtures use. */
export function ompSettingsTabLabel(tab: OmpSettingsTabId): string {
  return OMP_SETTINGS_TAB_LABEL_MAP[tab];
}
