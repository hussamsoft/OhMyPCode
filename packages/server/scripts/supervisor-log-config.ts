import path from "node:path";

import type { loadPersistedConfig } from "../src/server/persisted-config.js";

const DEFAULT_DAEMON_LOG_FILENAME = "daemon.log";
const DEFAULT_LOG_ROTATE_SIZE = "10m";
const DEFAULT_LOG_ROTATE_MAX_FILES = 3;

const warnedStaleEnvKeys = new Set<string>();

// COMPAT(paseoEnv): remove after 2027-01-01. Reads the canonical OMPCODE_* env
// var, falling back to the legacy PASEO_* name with a one-time warning.
function readCompatEnv(
  env: NodeJS.ProcessEnv,
  canonicalKey: string,
  legacyKey: string,
): string | undefined {
  const canonical = env[canonicalKey];
  if (canonical !== undefined) return canonical;
  const legacy = env[legacyKey];
  if (legacy === undefined) return undefined;
  if (!warnedStaleEnvKeys.has(legacyKey)) {
    warnedStaleEnvKeys.add(legacyKey);
    console.warn(
      `[supervisor-log-config] ${legacyKey} is set but no longer read directly; using its ` +
        `value as a fallback. Rename it to ${canonicalKey} -- ${legacyKey} support may be ` +
        "removed in a future release.",
    );
  }
  return legacy;
}

export function resolveSupervisorLogFile(
  paseoHome: string,
  persistedConfig: ReturnType<typeof loadPersistedConfig>,
  env: NodeJS.ProcessEnv = process.env,
) {
  const configuredFile = persistedConfig.log?.file;
  const configuredPath = configuredFile?.path;
  const envRotateSize = readCompatEnv(
    env,
    "OMPCODE_LOG_ROTATE_SIZE",
    "PASEO_LOG_ROTATE_SIZE",
  )?.trim();
  const envRotateMaxFiles = parseOptionalPositiveInteger(
    readCompatEnv(env, "OMPCODE_LOG_ROTATE_COUNT", "PASEO_LOG_ROTATE_COUNT"),
  );
  let logPath = path.join(paseoHome, DEFAULT_DAEMON_LOG_FILENAME);
  if (configuredPath) {
    logPath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(paseoHome, configuredPath);
  }

  return {
    path: logPath,
    rotate: {
      maxSize: configuredFile?.rotate?.maxSize ?? envRotateSize ?? DEFAULT_LOG_ROTATE_SIZE,
      maxFiles:
        configuredFile?.rotate?.maxFiles ?? envRotateMaxFiles ?? DEFAULT_LOG_ROTATE_MAX_FILES,
    },
  };
}

function parseOptionalPositiveInteger(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
