/**
 * OMP color palette, typed against the vendor schema's exact key set and
 * populated one-to-one from the generated tokens (see tokens.generated.ts).
 *
 * This module is deliberately additive and unwired: it does not touch
 * packages/app/src/styles/theme.ts's `Theme` type, `REGISTERED_THEMES`, or
 * any existing theme construction. None of the ~60 slot names here (
 * toolPendingBg, mdHeading, syntaxKeyword, statusLine*, etc.) currently
 * exist anywhere on `Theme.colors` -- wiring this in requires deciding
 * where these fields live in the app's theme type hierarchy (a new nested
 * object? merged into the flat `colors` map? do the other 9 still-live
 * themes need placeholder values for type-safety, or do these fields stay
 * OMP-only?), which is a real architecture decision, not covered by this
 * module.
 *
 * Two things the master plan's own text does not resolve, left untouched
 * here rather than guessed:
 * - "App-only surfaces (pane backgrounds, hover, focus ring, border on
 *   scrollbar g…" -- the plan's bullet is cut off mid-sentence at that
 *   exact point; there is no stated rule for deriving these from OMP's
 *   palette.
 * - The plan says "all 76 color keys in schema.ts are emitted," but the
 *   currently-pinned vendor schema (vendor/oh-my-pi/packages/tui/src/theme/
 *   schema.ts) declares 60 ThemeColor + 7 ThemeBg = 67 total schema keys.
 *   `thinkingMax` is one of those 60 ThemeColor members but is the one
 *   explicitly optional key (see the `Omit<..., "thinkingMax">` in the
 *   schema's own ThemeJson interface); neither dark.json nor light.json
 *   populates it, so this module's palette has 66 keys, not 67. The plan's
 *   "76" is stale against the currently-pinned OMP version, not a spec
 *   this module fails to meet.
 */
import { OMP_DARK_TOKENS, OMP_LIGHT_TOKENS } from "./tokens.generated";

/** Every color-valued schema key (`ThemeColor` in the vendor schema.ts),
 * excluding the one explicitly optional key, `thinkingMax`. */
export type OmpThemeColorKey =
  | "accent"
  | "border"
  | "borderAccent"
  | "borderMuted"
  | "success"
  | "error"
  | "warning"
  | "muted"
  | "dim"
  | "text"
  | "thinkingText"
  | "userMessageText"
  | "customMessageText"
  | "customMessageLabel"
  | "toolTitle"
  | "toolOutput"
  | "mdHeading"
  | "mdLink"
  | "mdLinkUrl"
  | "mdCode"
  | "mdCodeBlock"
  | "mdCodeBlockBorder"
  | "mdQuote"
  | "mdQuoteBorder"
  | "mdHr"
  | "mdListBullet"
  | "toolDiffAdded"
  | "toolDiffRemoved"
  | "toolDiffContext"
  | "syntaxComment"
  | "syntaxKeyword"
  | "syntaxFunction"
  | "syntaxVariable"
  | "syntaxString"
  | "syntaxNumber"
  | "syntaxType"
  | "syntaxOperator"
  | "syntaxPunctuation"
  | "thinkingOff"
  | "thinkingMinimal"
  | "thinkingLow"
  | "thinkingMedium"
  | "thinkingHigh"
  | "thinkingXhigh"
  | "bashMode"
  | "pythonMode"
  | "statusLineModel"
  | "statusLinePath"
  | "statusLineGitClean"
  | "statusLineGitDirty"
  | "statusLineContext"
  | "statusLineSpend"
  | "statusLineSubagents";

/** Every numeric-valued schema key (256-color ANSI codes). */
export type OmpThemeNumericColorKey =
  | "statusLineSep"
  | "statusLineStaged"
  | "statusLineDirty"
  | "statusLineUntracked"
  | "statusLineOutput"
  | "statusLineCost";

/** Every background-valued schema key (`ThemeBg` in the vendor schema.ts). */
export type OmpThemeBgKey =
  | "selectedBg"
  | "userMessageBg"
  | "customMessageBg"
  | "toolPendingBg"
  | "toolSuccessBg"
  | "toolErrorBg"
  | "statusLineBg";

export interface OmpThemePalette
  extends
    Record<OmpThemeColorKey, string>,
    Record<OmpThemeNumericColorKey, number>,
    Record<OmpThemeBgKey, string> {}

const SCHEMA_KEYS: readonly (OmpThemeColorKey | OmpThemeNumericColorKey | OmpThemeBgKey)[] = [
  "accent",
  "border",
  "borderAccent",
  "borderMuted",
  "success",
  "error",
  "warning",
  "muted",
  "dim",
  "text",
  "thinkingText",
  "userMessageText",
  "customMessageText",
  "customMessageLabel",
  "toolTitle",
  "toolOutput",
  "mdHeading",
  "mdLink",
  "mdLinkUrl",
  "mdCode",
  "mdCodeBlock",
  "mdCodeBlockBorder",
  "mdQuote",
  "mdQuoteBorder",
  "mdHr",
  "mdListBullet",
  "toolDiffAdded",
  "toolDiffRemoved",
  "toolDiffContext",
  "syntaxComment",
  "syntaxKeyword",
  "syntaxFunction",
  "syntaxVariable",
  "syntaxString",
  "syntaxNumber",
  "syntaxType",
  "syntaxOperator",
  "syntaxPunctuation",
  "thinkingOff",
  "thinkingMinimal",
  "thinkingLow",
  "thinkingMedium",
  "thinkingHigh",
  "thinkingXhigh",
  "bashMode",
  "pythonMode",
  "statusLineModel",
  "statusLinePath",
  "statusLineGitClean",
  "statusLineGitDirty",
  "statusLineContext",
  "statusLineSpend",
  "statusLineSubagents",
  "statusLineSep",
  "statusLineStaged",
  "statusLineDirty",
  "statusLineUntracked",
  "statusLineOutput",
  "statusLineCost",
  "selectedBg",
  "userMessageBg",
  "customMessageBg",
  "toolPendingBg",
  "toolSuccessBg",
  "toolErrorBg",
  "statusLineBg",
];

/**
 * Builds a typed OMP palette from a generated token record, one-to-one by
 * key name. Throws if the generated tokens are missing a schema-declared
 * key (other than the always-optional `thinkingMax`, which this palette
 * type doesn't include at all) -- a real gap, not something to paper over
 * with a fallback value.
 */
function buildOmpThemePalette(tokens: Readonly<Record<string, string | number>>): OmpThemePalette {
  const palette: Partial<OmpThemePalette> = {};
  for (const key of SCHEMA_KEYS) {
    const value = tokens[key];
    if (value === undefined) {
      throw new Error(
        `OMP theme token "${key}" is declared in the vendor schema but missing ` +
          "from the generated tokens -- regenerate tokens.generated.ts or update this module's " +
          "schema key list if the vendor schema changed.",
      );
    }
    (palette as Record<string, string | number>)[key] = value;
  }
  return palette as OmpThemePalette;
}

export const OMP_DARK_THEME_PALETTE: OmpThemePalette = buildOmpThemePalette(OMP_DARK_TOKENS);
export const OMP_LIGHT_THEME_PALETTE: OmpThemePalette = buildOmpThemePalette(OMP_LIGHT_TOKENS);
