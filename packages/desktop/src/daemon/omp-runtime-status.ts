import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { execCommand } from "@getpaseo/server/process";
import { isOmpRuntimeAvailable } from "@getpaseo/server/omp-command";
import { resolveBundledOmpPath } from "./runtime-paths.js";

export interface OmpRuntimeStatus {
  /** "bundled" reads the desktop-packaged binary; "system" falls back to PATH/OMP_COMMAND. */
  kind: "bundled" | "system" | "unavailable";
  /** The version this build's sidecar manifest.json claims, or the live-probed
   * version for a system runtime. Null when neither source is available. */
  ompVersion: string | null;
  /** Only present for a bundled runtime -- manifest.json's build provenance. */
  sourceCommit: string | null;
  /** What `omp --version` actually reports right now, independent of the
   * manifest. Used to detect a manifest/binary mismatch. */
  liveProbedVersion: string | null;
  /** True only when a bundled manifest's ompVersion disagrees with what the
   * bundled binary itself reports -- a build-output inconsistency, not a
   * normal update-available state. */
  isStale: boolean;
}

const UNAVAILABLE_STATUS: OmpRuntimeStatus = {
  kind: "unavailable",
  ompVersion: null,
  sourceCommit: null,
  liveProbedVersion: null,
  isStale: false,
};

interface OmpRuntimeManifest {
  ompVersion: string;
  sourceCommit: string;
}

export function parseManifest(manifestPath: string): OmpRuntimeManifest | null {
  if (!existsSync(manifestPath)) return null;
  try {
    const raw = JSON.parse(readFileSync(manifestPath, "utf-8")) as Record<string, unknown>;
    if (typeof raw.ompVersion !== "string" || typeof raw.sourceCommit !== "string") return null;
    return { ompVersion: raw.ompVersion, sourceCommit: raw.sourceCommit };
  } catch {
    return null;
  }
}

/** `omp --version` prints `omp/<version>`; strip the prefix for comparison
 * against manifest.json's bare `ompVersion` field. */
export function parseProbedVersion(stdout: string): string | null {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  const match = /^omp\/(.+)$/.exec(trimmed);
  return match ? match[1] : trimmed;
}

async function probeOmpVersion(command: string): Promise<string | null> {
  try {
    const { stdout } = await execCommand(command, ["--version"], {
      envMode: "internal",
      timeout: 5_000,
    });
    return parseProbedVersion(stdout);
  } catch {
    return null;
  }
}

export async function resolveOmpRuntimeStatus(): Promise<OmpRuntimeStatus> {
  const bundledPath = resolveBundledOmpPath();
  if (bundledPath) {
    const manifest = parseManifest(path.join(path.dirname(bundledPath), "manifest.json"));
    const liveProbedVersion = await probeOmpVersion(bundledPath);
    return {
      kind: "bundled",
      ompVersion: manifest?.ompVersion ?? null,
      sourceCommit: manifest?.sourceCommit ?? null,
      liveProbedVersion,
      isStale:
        manifest !== null &&
        liveProbedVersion !== null &&
        liveProbedVersion !== manifest.ompVersion,
    };
  }

  if (!isOmpRuntimeAvailable()) {
    return UNAVAILABLE_STATUS;
  }

  // No bundled runtime, so this is deliberately not resolveOmpCommand():
  // OMP_COMMAND is only ever set on the spawned daemon's child env, never
  // on this (Electron main) process's own process.env, and there is no
  // bundled path here for it to plausibly override anyway. Probe whatever
  // "omp" resolves to on PATH, which is exactly what isOmpRuntimeAvailable()
  // above just confirmed exists.
  const liveProbedVersion = await probeOmpVersion("omp");
  return {
    kind: "system",
    ompVersion: liveProbedVersion,
    sourceCommit: null,
    liveProbedVersion,
    isStale: false,
  };
}
