import { existsSync } from "node:fs";
import { delimiter, join } from "node:path";

/** The desktop manager points OMP_COMMAND at the bundled runtime when it ships one. */
const OMP_COMMAND_ENV = "OMP_COMMAND";

/** Windows resolves `omp` through PATHEXT, so batch shims count as an OMP runtime. */
const WINDOWS_EXECUTABLE_NAMES = ["omp", "omp.exe", "omp.cmd", "omp.bat"] as const;
const POSIX_EXECUTABLE_NAMES = ["omp"] as const;

export function resolveOmpCommand(env: NodeJS.ProcessEnv = process.env): string {
  return env[OMP_COMMAND_ENV] ?? "omp";
}

/**
 * The bundled runtime override, or null when the daemon must fall back to PATH.
 * A blank/whitespace-only value is treated as unset so a half-configured
 * environment does not turn into an unspawnable command.
 */
export function resolveBundledOmpCommand(env: NodeJS.ProcessEnv = process.env): string | null {
  const override = env[OMP_COMMAND_ENV]?.trim();
  return override ? override : null;
}

export interface OmpRuntimeAvailabilityOptions {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  exists?: (filePath: string) => boolean;
}

/**
 * Whether this process can actually launch OMP: either the desktop-managed
 * bundled runtime exists, or a bare `omp` executable is on PATH. Synchronous and
 * existence-based so daemon feature advertisement stays deterministic.
 */
export function isOmpRuntimeAvailable(options: OmpRuntimeAvailabilityOptions = {}): boolean {
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const exists = options.exists ?? existsSync;

  const bundled = resolveBundledOmpCommand(env);
  if (bundled) {
    return containsPathSeparator(bundled)
      ? exists(bundled)
      : isOnPath(bundled, platform, env, exists);
  }
  return isOnPath("omp", platform, env, exists);
}

function containsPathSeparator(value: string): boolean {
  return value.includes("/") || value.includes("\\");
}

function isOnPath(
  name: string,
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
  exists: (filePath: string) => boolean,
): boolean {
  const names: readonly string[] =
    platform === "win32" ? WINDOWS_EXECUTABLE_NAMES : POSIX_EXECUTABLE_NAMES;
  const searchNames = names.includes(name) ? names : [name];
  const pathValue = env.PATH ?? env.Path ?? env.path ?? "";
  if (!pathValue) return false;
  for (const entry of pathValue.split(delimiter)) {
    const dir = entry.trim();
    if (!dir) continue;
    for (const candidate of searchNames) {
      if (exists(join(dir, candidate))) return true;
    }
  }
  return false;
}

/**
 * Terminal spawns ask for `omp` by name. Remap that to the bundled runtime when
 * the desktop manager provides one so the OMP TUI does not silently depend on a
 * globally installed `omp`. Anything else, and a missing override, is untouched.
 */
export function resolveOmpTerminalSpawn(
  command: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): { command: string; args: string[] } {
  const bundled = resolveBundledOmpCommand(env);
  if (bundled && command === "omp") {
    return { command: bundled, args: [...args] };
  }
  return { command, args: [...args] };
}
