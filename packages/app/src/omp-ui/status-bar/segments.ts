/**
 * Status-line segment catalog.
 *
 * Ported structurally from `vendor/oh-my-pi/packages/tui/src/status-line/schema.ts`
 * (segment ids) and the option sub-shapes in `types.ts` (model/path/git/time
 * overrides). The vendor's terminal-rendered `Seg` objects deliberately stay in
 * the TUI package; we only carry the names, the option shape, and the preset
 * shape so the React renderer can be wired without re-deriving the schema.
 *
 * The compiler treats every segment id as a literal string -- a typo here shows
 * up as a type error in the preset and renderer. Adding a new segment to the
 * upstream vendor means appending its id here.
 */

export const STATUS_LINE_SEGMENT_IDS = [
  "pi",
  "status",
  "model",
  "mode",
  "path",
  "git",
  "pr",
  "subagents",
  "token_in",
  "token_out",
  "token_total",
  "token_rate",
  "cost",
  "context_pct",
  "context_total",
  "time_spent",
  "time",
  "session",
  "hostname",
  "cache_read",
  "cache_write",
  "cache_hit",
  "session_name",
  "usage",
  "collab",
  "stream",
  "vim",
] as const;

export type StatusLineSegmentId = (typeof STATUS_LINE_SEGMENT_IDS)[number];

export const CONTEXT_LINE_MODE_VALUES = ["off", "percentage", "annotated", "embedded"] as const;
export type ContextLineMode = (typeof CONTEXT_LINE_MODE_VALUES)[number];

export const STATUS_LINE_PRESET_VALUES = [
  "default",
  "minimal",
  "compact",
  "full",
  "nerd",
  "ascii",
  "custom",
] as const;
export type StatusLinePreset = (typeof STATUS_LINE_PRESET_VALUES)[number];

export const STATUS_LINE_SEPARATOR_VALUES = [
  "powerline",
  "powerline-thin",
  "slash",
  "pipe",
  "block",
  "none",
  "ascii",
] as const;
export type StatusLineSeparatorStyle = (typeof STATUS_LINE_SEPARATOR_VALUES)[number];

/**
 * Per-segment render options the vendor `types.ts` carries as `segmentOptions`.
 * Mirrors the vendor shape exactly so a future compatibility layer can pass
 * these through verbatim.
 */
export interface StatusLineSegmentOptions {
  model?: { showThinkingLevel?: boolean };
  path?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean };
  git?: {
    showBranch?: boolean;
    showStaged?: boolean;
    showUnstaged?: boolean;
    showUntracked?: boolean;
  };
  time?: { format?: "12h" | "24h"; showSeconds?: boolean };
}

/**
 * Baseline segment list for the `custom` preset. Used as a default when the
 * user picks `custom` without overriding the segment lists themselves. Same
 * shape as the vendor's `CUSTOM_STATUS_LINE_DEFAULTS`.
 */
export const CUSTOM_STATUS_LINE_DEFAULTS: {
  readonly left: StatusLineSegmentId[];
  readonly right: StatusLineSegmentId[];
} = {
  left: ["vim", "model", "mode", "path", "git", "pr"],
  right: ["session_name", "token_total", "cost", "context_pct"],
};
