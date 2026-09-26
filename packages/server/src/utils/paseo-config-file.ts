import { existsSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  PaseoConfigRawSchema,
  type PaseoConfigRaw,
  type PaseoConfigRevision,
  type ProjectConfigRpcError,
} from "@ohmypcode/protocol/paseo-config-schema";
export {
  PaseoConfigRevisionSchema,
  ProjectConfigRpcErrorSchema,
  type PaseoConfigRevision,
  type ProjectConfigRpcError,
} from "@ohmypcode/protocol/paseo-config-schema";

export const PASEO_CONFIG_FILE_NAME = "ohmypcode.json";

// COMPAT(paseoConfigFileRename): the project config file was renamed from
// paseo.json to ohmypcode.json. Reads prefer the new name but fall back to
// this legacy name for repos not yet migrated; writes always target the new
// name and remove the stale legacy file once migrated. No fixed sunset --
// this is a local on-disk filename, not a server API, so old repos should
// keep working indefinitely until they're next edited.
const LEGACY_PASEO_CONFIG_FILE_NAME = "paseo.json";

/** Preferred-first list of on-disk names this app recognizes as the project config file. */
export function getPaseoConfigFileNameCandidates(): string[] {
  return [PASEO_CONFIG_FILE_NAME, LEGACY_PASEO_CONFIG_FILE_NAME];
}

export type ReadPaseoConfigForEditResult =
  | { ok: true; config: PaseoConfigRaw | null; revision: PaseoConfigRevision | null }
  | { ok: false; error: ProjectConfigRpcError };

export type WritePaseoConfigForEditResult =
  | { ok: true; config: PaseoConfigRaw; revision: PaseoConfigRevision }
  | { ok: false; error: ProjectConfigRpcError };

export interface WritePaseoConfigForEditInput {
  repoRoot: string;
  config: PaseoConfigRaw;
  expectedRevision: PaseoConfigRevision | null;
}

export function resolvePaseoConfigPath(repoRoot: string): string {
  return join(repoRoot, PASEO_CONFIG_FILE_NAME);
}

/** Resolves whichever recognized config filename currently exists on disk, preferring the
 * current name; defaults to the current name's path if neither exists yet. */
export function resolveExistingPaseoConfigPath(repoRoot: string): string {
  for (const name of getPaseoConfigFileNameCandidates()) {
    const candidate = join(repoRoot, name);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return resolvePaseoConfigPath(repoRoot);
}

export function statPaseoConfigPath(repoRoot: string): PaseoConfigRevision | null {
  const configPath = resolveExistingPaseoConfigPath(repoRoot);
  if (!existsSync(configPath)) {
    return null;
  }
  const stats = statSync(configPath);
  return {
    mtimeMs: stats.mtimeMs,
    size: stats.size,
  };
}

export function readPaseoConfigJson(repoRoot: string): unknown {
  const configPath = resolveExistingPaseoConfigPath(repoRoot);
  if (!existsSync(configPath)) {
    return null;
  }
  return JSON.parse(readFileSync(configPath, "utf8"));
}

export function readPaseoConfigForEdit(repoRoot: string): ReadPaseoConfigForEditResult {
  try {
    const json = readPaseoConfigJson(repoRoot);
    if (json === null) {
      return { ok: true, config: null, revision: null };
    }
    return {
      ok: true,
      config: PaseoConfigRawSchema.parse(json),
      revision: statPaseoConfigPath(repoRoot),
    };
  } catch {
    return {
      ok: false,
      error: { code: "invalid_project_config" },
    };
  }
}

export function writePaseoConfigForEdit(
  input: WritePaseoConfigForEditInput,
): WritePaseoConfigForEditResult {
  const parsed = PaseoConfigRawSchema.safeParse(input.config);
  if (!parsed.success) {
    return { ok: false, error: { code: "invalid_project_config" } };
  }

  const configPath = resolvePaseoConfigPath(input.repoRoot);
  const tempPath = join(
    input.repoRoot,
    `.${PASEO_CONFIG_FILE_NAME}.${process.pid}.${randomUUID()}.tmp`,
  );

  try {
    writeFileSync(tempPath, `${JSON.stringify(parsed.data, null, 2)}\n`);
    const currentRevision = statPaseoConfigPath(input.repoRoot);
    if (!paseoConfigRevisionsEqual(currentRevision, input.expectedRevision)) {
      removeTempPaseoConfig(tempPath);
      return {
        ok: false,
        error: { code: "stale_project_config", currentRevision },
      };
    }

    renameSync(tempPath, configPath);
    removeLegacyPaseoConfigAfterMigration(input.repoRoot, configPath);
    const revision = statPaseoConfigPath(input.repoRoot);
    if (!revision) {
      return { ok: false, error: { code: "write_failed" } };
    }
    return { ok: true, config: parsed.data, revision };
  } catch {
    removeTempPaseoConfig(tempPath);
    return { ok: false, error: { code: "write_failed" } };
  }
}

function removeLegacyPaseoConfigAfterMigration(repoRoot: string, writtenPath: string): void {
  const legacyPath = join(repoRoot, LEGACY_PASEO_CONFIG_FILE_NAME);
  if (legacyPath === writtenPath) return;
  try {
    rmSync(legacyPath, { force: true });
  } catch {
    // Best-effort cleanup only; the write itself already succeeded.
  }
}

function paseoConfigRevisionsEqual(
  left: PaseoConfigRevision | null,
  right: PaseoConfigRevision | null,
): boolean {
  if (left === null || right === null) {
    return left === right;
  }
  return left.mtimeMs === right.mtimeMs && left.size === right.size;
}

function removeTempPaseoConfig(tempPath: string): void {
  try {
    rmSync(tempPath, { force: true });
  } catch {
    // Best-effort cleanup only; callers need the original write outcome.
  }
}
