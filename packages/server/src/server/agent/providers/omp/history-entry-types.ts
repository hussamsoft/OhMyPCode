/**
 * The OMP session-entry type union, read from the vendored fork.
 *
 * `history.ts` filters control entries out of the transcript using
 * CONTROL_ENTRY_TYPES. That list is only correct while it matches OMP's own
 * `SessionEntry` union, and a type that falls through does not fail loudly --
 * it renders as `[type] Unsupported history record` in the user's transcript.
 * That is how `model_usage` and `credential_pin` reached real sessions.
 *
 * So the list is derived here, from the same file OMP derives it, and
 * `history-mapper.test.ts` asserts the two agree. An OMP bump that adds an
 * entry type then fails the suite instead of shipping corrupted transcripts.
 *
 * Parsing is deliberately regex-based over the interface declarations rather
 * than a TypeScript program: the union is a flat list of
 * `export interface XEntry extends SessionEntryBase { type: "literal"; ... }`,
 * and the server package must not gain a compiler dependency to read it.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Vendored OMP source of truth for the session-entry union. */
function resolveSessionEntriesSource(): string {
  const relative = path.join(
    "vendor",
    "oh-my-pi",
    "packages",
    "coding-agent",
    "src",
    "session",
    "session-entries.ts",
  );
  // Walk up to the repo root rather than counting `..` segments: the module
  // runs under vitest (cwd = package root) and under the built server (cwd =
  // anywhere), and `import.meta.dirname` is not reliable in both.
  let dir = import.meta.dirname;
  for (let depth = 0; depth < 12; depth += 1) {
    const candidate = path.join(dir, relative);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Could not locate ${relative} from ${import.meta.dirname}`);
}

export const OMP_SESSION_ENTRIES_SOURCE = resolveSessionEntriesSource();

/**
 * Entry types that carry transcript *content* and therefore must never be
 * classified as control entries. Anything the union declares that is not
 * named here is treated as metadata and filtered out of the transcript.
 */
export const CONTENT_ENTRY_TYPES: readonly string[] = ["message", "custom_message"];

/**
 * Reads every `type:` literal declared on a `SessionEntryBase` implementor
 * that the union actually names.
 *
 * Two declaration shapes are recognised:
 *   type: "model_usage";
 *   type: typeof SESSION_TITLE_SLOT_ENTRY_TYPE;
 *
 * The second form is a re-exported constant rather than a literal, so it
 * cannot be resolved without evaluating the module. Those are reported as
 * `const:<NAME>` so a control-list mismatch is visible instead of silently
 * skipped.
 */
export function readOmpSessionEntryTypes(sourcePath = OMP_SESSION_ENTRIES_SOURCE): string[] {
  const source = readFileSync(sourcePath, "utf8");
  // Restrict the scan to the union so a `type:` field on some unrelated
  // interface in the same file cannot be mistaken for an entry type.
  const unionIndex = source.indexOf("export type SessionEntry =");
  if (unionIndex === -1) {
    throw new Error(`Could not find "export type SessionEntry =" in ${sourcePath}`);
  }
  const body = source.slice(unionIndex);

  // Union -> declared type. A plain object literal keyed by the known member
  // names: the set is fixed by the union, not discovered at runtime.
  const declared: Record<string, string> = {};
  for (const match of body.matchAll(/^\t\| (\w+)\s*$/gm)) {
    const member = match[1];
    const declaration = new RegExp(`export interface ${member}\\b[\\s\\S]*?\\n\\}`).exec(source);
    if (!declaration) continue;
    const literal = /\n\ttype: "([^"]+)";/.exec(declaration[0]);
    if (literal) {
      declared[member] = literal[1];
      continue;
    }
    const constant = /\n\ttype: typeof (\w+);/.exec(declaration[0]);
    if (constant) declared[member] = `const:${constant[1]}`;
  }

  const names = Object.keys(declared);
  if (names.length === 0) {
    throw new Error(`No session entry types parsed from ${sourcePath}`);
  }
  return names.map((member) => declared[member]!).sort();
}
