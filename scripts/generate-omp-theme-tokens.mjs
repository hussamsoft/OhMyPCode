#!/usr/bin/env node
// Generates packages/app/src/omp-theme/tokens.generated.ts from OMP's own
// theme JSON files and symbol tables, vendored at
// vendor/oh-my-pi/packages/tui/src/theme/{dark,light}.json and symbols.ts.
//
// Run: npm run generate:omp-theme  (or npm run generate:omp-theme:check)
// Equivalent to: node --import tsx scripts/generate-omp-theme-tokens.mjs
//
// The `--import tsx` flag is REQUIRED: symbols.ts is imported by file path
// at runtime (see loadSymbolsModule below) because @oh-my-pi/pi-tui is a
// vendored submodule, not a resolvable workspace package, so plain `node
// scripts/generate-omp-theme-tokens.mjs` cannot import a .ts file on its
// own and will fail with an unsupported-file-extension error. This is a
// deliberate deviation from OMP_DESKTOP_MASTER_PLAN.md's literal Phase 7
// gate command (`node scripts/generate-omp-theme-tokens.mjs --check`,
// no --import flag) -- use the npm script above, not the bare plan text.
//
// --check: exit non-zero if the generated file would differ from what's on
// disk, without writing. Used as a CI/pre-commit drift guard -- if OMP's
// theme JSON changes shape, this script (and the check) fails loudly rather
// than silently emitting a stale tokens.generated.ts.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const THEME_DIR = path.join(REPO_ROOT, "vendor/oh-my-pi/packages/tui/src/theme");
const OUTPUT_PATH = path.join(REPO_ROOT, "packages/app/src/omp-theme/tokens.generated.ts");

/**
 * Mirrors vendor/oh-my-pi/packages/tui/src/theme/color.ts's resolveVarRefs
 * exactly: a numeric value, the empty string, or a leading `#` is a literal;
 * anything else is a key into `vars`; a cycle throws.
 */
function resolveVarRefs(value, vars, visited = new Set()) {
  if (typeof value === "number" || value === "" || value.startsWith("#")) {
    return value;
  }
  if (visited.has(value)) {
    throw new Error(`Circular variable reference detected: ${value}`);
  }
  if (!(value in vars)) {
    throw new Error(`Variable reference not found: ${value}`);
  }
  visited.add(value);
  return resolveVarRefs(vars[value], vars, visited);
}

function loadThemeJson(fileName) {
  const filePath = path.join(THEME_DIR, fileName);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  if (typeof raw.colors !== "object" || raw.colors === null) {
    throw new Error(`${fileName}: missing or invalid "colors" object`);
  }
  const vars = raw.vars ?? {};
  /** @type {Record<string, string | number>} */
  const resolved = {};
  for (const [key, value] of Object.entries(raw.colors)) {
    resolved[key] = resolveVarRefs(value, vars);
  }
  // App-only surfaces (pane backgrounds, hover, focus ring, border on
  // scrollbar gutters) derive from statusLineBg (already in `colors` above)
  // plus these two `export` object fields, per the master plan's Phase 7
  // bullet -- a separate top-level JSON section, not part of the
  // ThemeColor|ThemeBg schema `colors` reads.
  if (typeof raw.export !== "object" || raw.export === null) {
    throw new Error(`${fileName}: missing or invalid "export" object`);
  }
  for (const key of ["pageBg", "cardBg"]) {
    if (raw.export[key] === undefined) {
      throw new Error(`${fileName}: missing "export.${key}"`);
    }
  }
  const exportColors = {
    pageBg: resolveVarRefs(raw.export.pageBg, vars),
    cardBg: resolveVarRefs(raw.export.cardBg, vars),
  };
  return { colors: resolved, exportColors };
}

/** Groups a flat SymbolKey -> string map ("status.success": "✓") into a
 * nested { status: { success: "✓" } } structure by its dot-separated prefix. */
function groupSymbolsByCategory(flatMap) {
  /** @type {Record<string, Record<string, string>>} */
  const grouped = {};
  for (const [key, value] of Object.entries(flatMap)) {
    const dotIndex = key.indexOf(".");
    if (dotIndex < 0) {
      throw new Error(`Symbol key "${key}" has no category prefix (expected "category.name")`);
    }
    const category = key.slice(0, dotIndex);
    const name = key.slice(dotIndex + 1);
    (grouped[category] ??= {})[name] = value;
  }
  return grouped;
}

async function loadSymbolsModule() {
  const symbolsPath = path.join(THEME_DIR, "symbols.ts");
  if (!existsSync(symbolsPath)) {
    throw new Error(`Expected vendor symbols module at ${symbolsPath}`);
  }
  return import(pathToFileUrl(symbolsPath));
}

function pathToFileUrl(absolutePath) {
  return `file://${absolutePath.replace(/\\/g, "/")}`;
}

function formatObjectLiteral(value, indent = 0) {
  const pad = "  ".repeat(indent);
  const innerPad = "  ".repeat(indent + 1);
  if (typeof value !== "object" || value === null) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((item) => `${innerPad}${formatObjectLiteral(item, indent + 1)},`);
    return `[\n${items.join("\n")}\n${pad}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";
  const lines = entries.map(
    ([key, val]) => `${innerPad}${JSON.stringify(key)}: ${formatObjectLiteral(val, indent + 1)},`,
  );
  return `{\n${lines.join("\n")}\n${pad}}`;
}

function buildGeneratedSource({
  darkTokens,
  lightTokens,
  darkExportTokens,
  lightExportTokens,
  groupedSymbols,
  spinnerFrames,
}) {
  const header = `// GENERATED FILE -- do not hand-edit.
// Source: vendor/oh-my-pi/packages/tui/src/theme/{dark,light}.json, symbols.ts
// Regenerate: npm run generate:omp-theme
// Verify: npm run generate:omp-theme:check
`;

  const darkBlock = `export const OMP_DARK_TOKENS: Readonly<Record<string, string | number>> = ${formatObjectLiteral(darkTokens)} as const;\n`;
  const lightBlock = `export const OMP_LIGHT_TOKENS: Readonly<Record<string, string | number>> = ${formatObjectLiteral(lightTokens)} as const;\n`;

  // App-only surfaces (see omp-theme/theme.ts) derive from these plus
  // statusLineBg, which is already part of OMP_{DARK,LIGHT}_TOKENS above.
  const darkExportBlock = `export const OMP_DARK_EXPORT_TOKENS: Readonly<Record<"pageBg" | "cardBg", string>> = ${formatObjectLiteral(darkExportTokens)} as const;\n`;
  const lightExportBlock = `export const OMP_LIGHT_EXPORT_TOKENS: Readonly<Record<"pageBg" | "cardBg", string>> = ${formatObjectLiteral(lightExportTokens)} as const;\n`;

  const symbolPresetBlocks = Object.entries(groupedSymbols)
    .map(
      ([preset, categories]) =>
        `  ${JSON.stringify(preset)}: ${formatObjectLiteral(categories, 1)},`,
    )
    .join("\n");
  const symbolsBlock = `export const OMP_SYMBOLS = {\n${symbolPresetBlocks}\n} as const;\n`;

  const spinnerBlock = `export const OMP_SPINNER_FRAMES: Readonly<Record<"unicode" | "nerd" | "ascii", Readonly<Record<"status" | "activity", readonly string[]>>>> = ${formatObjectLiteral(spinnerFrames)} as const;\n`;

  return [
    header,
    darkBlock,
    lightBlock,
    darkExportBlock,
    lightExportBlock,
    symbolsBlock,
    spinnerBlock,
  ].join("\n");
}

async function main() {
  const checkOnly = process.argv.includes("--check");

  const { colors: darkTokens, exportColors: darkExportTokens } = loadThemeJson("dark.json");
  const { colors: lightTokens, exportColors: lightExportTokens } = loadThemeJson("light.json");

  const symbolsModule = await loadSymbolsModule();
  const { SYMBOL_PRESETS, SPINNER_FRAMES } = symbolsModule;
  if (!SYMBOL_PRESETS || typeof SYMBOL_PRESETS !== "object") {
    throw new Error("vendor symbols.ts did not export SYMBOL_PRESETS");
  }
  if (!SPINNER_FRAMES || typeof SPINNER_FRAMES !== "object") {
    throw new Error("vendor symbols.ts did not export SPINNER_FRAMES");
  }

  /** @type {Record<string, Record<string, Record<string, string>>>} */
  const groupedSymbols = {};
  for (const [preset, flatMap] of Object.entries(SYMBOL_PRESETS)) {
    groupedSymbols[preset] = groupSymbolsByCategory(flatMap);
  }

  const generated = buildGeneratedSource({
    darkTokens,
    lightTokens,
    darkExportTokens,
    lightExportTokens,
    groupedSymbols,
    spinnerFrames: SPINNER_FRAMES,
  });

  if (checkOnly) {
    const current = existsSync(OUTPUT_PATH) ? readFileSync(OUTPUT_PATH, "utf-8") : null;
    if (current !== generated) {
      console.error(
        `${path.relative(REPO_ROOT, OUTPUT_PATH)} is out of date. Run: npm run generate:omp-theme`,
      );
      process.exit(1);
    }
    console.log(`${path.relative(REPO_ROOT, OUTPUT_PATH)} is up to date.`);
    return;
  }

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, generated, "utf-8");
  console.log(`Wrote ${path.relative(REPO_ROOT, OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
