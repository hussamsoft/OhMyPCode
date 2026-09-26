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
 * The app-only-surfaces derivation the plan calls for IS specified (an
 * earlier version of this comment incorrectly claimed the plan's bullet
 * was cut off mid-sentence -- it is not; that was a display artifact in
 * one read of the plan, not a gap in the source document): "App-only
 * surfaces (pane backgrounds, hover, focus ring, border on scrollbar
 * gutters) derive from statusLineBg, export.pageBg, and export.cardBg...
 * the derivation rule lives once in theme.ts as a comment." See
 * buildOmpAppOnlySurfaces below for that rule.
 *
 * One thing the plan's text does get wrong: it says "all 76 color keys in
 * schema.ts are emitted," but the currently-pinned vendor schema
 * (vendor/oh-my-pi/packages/tui/src/theme/schema.ts) declares 60
 * ThemeColor + 7 ThemeBg = 67 total schema keys. `thinkingMax` is one of
 * those 60 ThemeColor members but is the one explicitly optional key (see
 * the `Omit<..., "thinkingMax">` in the schema's own ThemeJson interface);
 * neither dark.json nor light.json populates it, so this module's palette
 * has 66 keys, not 67. The plan's "76" is stale against the
 * currently-pinned OMP version, not a spec this module fails to meet.
 */
import {
  OMP_DARK_EXPORT_TOKENS,
  OMP_DARK_TOKENS,
  OMP_LIGHT_EXPORT_TOKENS,
  OMP_LIGHT_TOKENS,
} from "./tokens.generated";

/**
 * Every non-optional schema key (`ThemeColor | ThemeBg` in the vendor
 * schema.ts), excluding the one explicitly optional key, `thinkingMax`.
 */
export type OmpThemeSchemaKey =
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
  | "statusLineSubagents"
  | "statusLineSep"
  | "statusLineStaged"
  | "statusLineDirty"
  | "statusLineUntracked"
  | "statusLineOutput"
  | "statusLineCost"
  | "selectedBg"
  | "userMessageBg"
  | "customMessageBg"
  | "toolPendingBg"
  | "toolSuccessBg"
  | "toolErrorBg"
  | "statusLineBg";

/**
 * OMP's own value type (vendor schema.ts's `ColorValue`): every schema key
 * may resolve to either a hex/literal string or a 256-color ANSI index,
 * independent per theme -- e.g. `statusLineSep` is the number 244 in
 * dark.json but the string "#808080" in light.json. An earlier version of
 * this module incorrectly split keys into fixed "always string" / "always
 * number" buckets inferred from the two observed theme files rather than
 * from the schema's own type, which both undertyped statusLineSep for the
 * light theme and required unsafe `as OmpThemePalette` casts to paper over
 * the mismatch. Fixed: every key uses this single union, matching the
 * vendor's own `ColorValue` type exactly, and the palette is now built
 * without any cast.
 */
export type OmpColorValue = string | number;

export type OmpThemePalette = Record<OmpThemeSchemaKey, OmpColorValue>;

const SCHEMA_KEYS: readonly OmpThemeSchemaKey[] = [
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
 * with a fallback value. No unsafe cast: every entry is built from a
 * verified-present token value, so the resulting record structurally
 * satisfies OmpThemePalette without needing `as`.
 */
function buildOmpThemePalette(
  tokens: Readonly<Record<string, OmpColorValue | undefined>>,
): OmpThemePalette {
  const entries = SCHEMA_KEYS.map((key) => {
    const value = tokens[key];
    if (value === undefined) {
      throw new Error(
        `OMP theme token "${key}" is declared in the vendor schema but missing ` +
          "from the generated tokens -- regenerate tokens.generated.ts or update this module's " +
          "schema key list if the vendor schema changed.",
      );
    }
    return [key, value] as const;
  });
  return Object.fromEntries(entries) as OmpThemePalette;
}

export const OMP_DARK_THEME_PALETTE: OmpThemePalette = buildOmpThemePalette(OMP_DARK_TOKENS);
export const OMP_LIGHT_THEME_PALETTE: OmpThemePalette = buildOmpThemePalette(OMP_LIGHT_TOKENS);

/**
 * App-only surfaces: pane backgrounds, hover, focus ring, and the border on
 * scrollbar gutters. Per the master plan's Phase 7 bullet, these derive
 * from `statusLineBg` (already part of OmpThemePalette above) plus
 * `export.pageBg` and `export.cardBg` (a separate top-level JSON section,
 * see OMP_{DARK,LIGHT}_EXPORT_TOKENS in tokens.generated.ts). The plan
 * names 3 source values for 4 target surfaces, so one source is reused;
 * this is the one place that reuse decision is made, exactly once, as the
 * plan calls for:
 *
 * - `paneBackground` = `export.pageBg` -- OMP's own name for "the page
 *   background," the closest semantic match for an app-wide base fill.
 * - `hover` = `export.cardBg` -- a "card" surface is already a distinct,
 *   slightly-raised fill relative to the page background in OMP's own
 *   export rendering, which is exactly the relationship a hover state
 *   needs relative to its resting background.
 * - `focusRing` and `scrollbarGutterBorder` = `statusLineBg` -- both are
 *   thin structural/outline roles, not fills; `statusLineBg` is the one
 *   remaining source and is tonally distinct from both page and card
 *   fills, which is what a visible ring/border needs. Reused for both
 *   since they're the same kind of role (outline, not fill).
 */
export interface OmpAppOnlySurfaces {
  paneBackground: string;
  hover: string;
  focusRing: string;
  scrollbarGutterBorder: string;
}

function buildOmpAppOnlySurfaces(
  palette: OmpThemePalette,
  exportTokens: Readonly<Record<"pageBg" | "cardBg", string>>,
): OmpAppOnlySurfaces {
  const statusLineBg = palette.statusLineBg;
  if (typeof statusLineBg !== "string") {
    throw new Error(
      `OMP theme token "statusLineBg" resolved to a non-string value (${String(statusLineBg)}); ` +
        "app-only surfaces need a color string.",
    );
  }
  return {
    paneBackground: exportTokens.pageBg,
    hover: exportTokens.cardBg,
    focusRing: statusLineBg,
    scrollbarGutterBorder: statusLineBg,
  };
}

export const OMP_DARK_APP_ONLY_SURFACES: OmpAppOnlySurfaces = buildOmpAppOnlySurfaces(
  OMP_DARK_THEME_PALETTE,
  OMP_DARK_EXPORT_TOKENS,
);
export const OMP_LIGHT_APP_ONLY_SURFACES: OmpAppOnlySurfaces = buildOmpAppOnlySurfaces(
  OMP_LIGHT_THEME_PALETTE,
  OMP_LIGHT_EXPORT_TOKENS,
);
