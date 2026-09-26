// Daemon configuration inputs. General provider credentials and executable/runtime
// controls remain available to managed launches and their agent processes.
export const DAEMON_SETTING_ENV_KEYS = [
  "MCP_DEBUG",
  "OPENAI_STT_BASE_URL",
  "OPENAI_TTS_BASE_URL",
  "OMPCODE_ALLOWED_HOSTS",
  "OMPCODE_APP_BASE_URL",
  "OMPCODE_CORS_ORIGINS",
  "OMPCODE_DICTATION_ENABLED",
  "OMPCODE_DICTATION_LANGUAGE",
  "OMPCODE_DICTATION_LOCAL_STT_MODEL",
  "OMPCODE_DICTATION_STT_PROVIDER",
  "OMPCODE_GIT_CONCURRENCY",
  "OMPCODE_GIT_MAX_PROCESSES_PER_SECOND",
  "OMPCODE_GIT_MAX_PROCESS_CONCURRENCY",
  "OMPCODE_HOSTNAMES",
  "OMPCODE_LISTEN",
  "OMPCODE_LOCAL_MODELS_DIR",
  "OMPCODE_LOG",
  "OMPCODE_LOG_CONSOLE_FORMAT",
  "OMPCODE_LOG_CONSOLE_LEVEL",
  "OMPCODE_LOG_FILE_LEVEL",
  "OMPCODE_LOG_FILE_PATH",
  "OMPCODE_LOG_FILE_ROTATE_COUNT",
  "OMPCODE_LOG_FILE_ROTATE_SIZE",
  "OMPCODE_LOG_FORMAT",
  "OMPCODE_LOG_LEVEL",
  "OMPCODE_LOG_ROTATE_COUNT",
  "OMPCODE_LOG_ROTATE_SIZE",
  "OMPCODE_PASSWORD",
  "OMPCODE_RELAY_ENABLED",
  "OMPCODE_RELAY_ENDPOINT",
  "OMPCODE_RELAY_PUBLIC_ENDPOINT",
  "OMPCODE_RELAY_PUBLIC_USE_TLS",
  "OMPCODE_RELAY_USE_TLS",
  "OMPCODE_SERVICE_PROXY_ENABLED",
  "OMPCODE_SERVICE_PROXY_LISTEN",
  "OMPCODE_SERVICE_PROXY_PUBLIC_BASE_URL",
  "OMPCODE_TRUSTED_PROXIES",
  "OMPCODE_VOICE_LANGUAGE",
  "OMPCODE_VOICE_LLM_PROVIDER",
  "OMPCODE_VOICE_LOCAL_STT_MODEL",
  "OMPCODE_VOICE_LOCAL_TTS_MODEL",
  "OMPCODE_VOICE_LOCAL_TTS_SPEAKER_ID",
  "OMPCODE_VOICE_LOCAL_TTS_SPEED",
  "OMPCODE_VOICE_MODE_ENABLED",
  "OMPCODE_VOICE_STT_PROVIDER",
  "OMPCODE_VOICE_TTS_PROVIDER",
  "OMPCODE_VOICE_TURN_DETECTION_PROVIDER",
  "OMPCODE_WEB_UI_DIST_DIR",
  "OMPCODE_WEB_UI_ENABLED",
  "PORT",
  "STT_CONFIDENCE_THRESHOLD",
  "STT_MODEL",
  "TTS_MODEL",
  "TTS_VOICE",
] as const;

const CONFIG_CONTEXT_ENV_KEYS = [
  "OMPCODE_NODE_ENV",
  "OHMYPCODE_DESKTOP_MANAGED",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_STT_API_KEY",
  "OPENAI_TTS_API_KEY",
] as const;

const warnedStaleDaemonEnvKeys = new Set<string>();

// COMPAT(paseoEnv): remove after 2027-01-01. `PASEO_*` was the daemon config
// prefix before the OhMyPCode rename; a stock `paseo` CLI on the same machine
// may still export these, so an unrenamed caller keeps working until the
// compat window closes.
function legacyDaemonEnvKey(key: string): string | undefined {
  return key.startsWith("OMPCODE_") ? `PASEO_${key.slice("OMPCODE_".length)}` : undefined;
}

export function configurationEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const resolved = Object.fromEntries(
    [...DAEMON_SETTING_ENV_KEYS, ...CONFIG_CONTEXT_ENV_KEYS].map((key) => [key, env[key]]),
  );
  for (const key of Object.keys(resolved)) {
    if (resolved[key] !== undefined && resolved[key].trim()) continue;
    const legacyKey = legacyDaemonEnvKey(key);
    const legacyValue = legacyKey === undefined ? undefined : env[legacyKey];
    if (legacyKey !== undefined && legacyValue !== undefined && legacyValue.trim()) {
      resolved[key] = legacyValue;
      if (!warnedStaleDaemonEnvKeys.has(legacyKey)) {
        warnedStaleDaemonEnvKeys.add(legacyKey);
        console.warn(
          `[config] ${legacyKey} is set but no longer read directly; using its value as a ` +
            `fallback for ${key}. Rename it -- ${legacyKey} support may be removed in a future release.`,
        );
      }
    } else {
      // Neither name holds a usable value -- a blank canonical value must not
      // shadow the caller's own default/persisted fallback (e.g. config.ts's
      // `?? persisted...` chains only skip null/undefined, not "").
      resolved[key] = undefined;
    }
  }
  return resolved;
}

export function daemonLaunchEnvironment(input: {
  env: NodeJS.ProcessEnv;
  home: string;
  mode: "managed" | "deployment";
  desktopManaged?: boolean;
}): NodeJS.ProcessEnv {
  const env = { ...input.env };
  if (input.mode === "managed") {
    for (const key of DAEMON_SETTING_ENV_KEYS) {
      delete env[key];
      const legacyKey = legacyDaemonEnvKey(key);
      if (legacyKey !== undefined) delete env[legacyKey];
    }
  }
  delete env.PASEO_HOST;
  delete env.OMPCODE_HOST;
  delete env.OHMYPCODE_DESKTOP_MANAGED;
  env.OHMYPCODE_HOME = input.home;
  if (input.desktopManaged) env.OHMYPCODE_DESKTOP_MANAGED = "1";
  return env;
}
