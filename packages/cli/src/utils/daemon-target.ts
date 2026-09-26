import { resolvePaseoHome } from "@getpaseo/server/daemon-control";

export type DaemonTarget = { kind: "instance"; home: string } | { kind: "endpoint"; host: string };

let warnedStalePaseoHost = false;

// COMPAT(paseoEnv): remove after 2027-01-01.
function resolveDaemonHostEnv(
  env: NodeJS.ProcessEnv,
): { value: string; key: "OMPCODE_HOST" | "PASEO_HOST" } | undefined {
  if (env.OMPCODE_HOST !== undefined) return { value: env.OMPCODE_HOST, key: "OMPCODE_HOST" };
  if (env.PASEO_HOST === undefined) return undefined;
  if (!warnedStalePaseoHost) {
    warnedStalePaseoHost = true;
    console.warn(
      "[daemon-target] PASEO_HOST is set but no longer read directly; using its value as a " +
        "fallback. Rename it to OMPCODE_HOST -- PASEO_HOST support may be removed in a future " +
        "release.",
    );
  }
  return { value: env.PASEO_HOST, key: "PASEO_HOST" };
}

function resolveHomeEnvKey(env: NodeJS.ProcessEnv): "OHMYPCODE_HOME" | "PASEO_HOME" | undefined {
  if (env.OHMYPCODE_HOME !== undefined) return "OHMYPCODE_HOME";
  if (env.PASEO_HOME !== undefined) return "PASEO_HOME";
  return undefined;
}

export function selectDaemonTarget(
  options: { home?: string; host?: string },
  env: NodeJS.ProcessEnv = process.env,
  localOnly = false,
): DaemonTarget {
  for (const key of ["home", "host"] as const) {
    if (options[key] !== undefined && !options[key]!.trim())
      throw { code: "TARGET_INVALID", message: `--${key} requires a non-empty value.` };
  }
  if (options.home !== undefined && options.host !== undefined)
    throw { code: "TARGET_AMBIGUOUS", message: "Choose either --home or --host, not both." };
  if (localOnly) {
    if (options.host !== undefined)
      throw {
        code: "LOCAL_OPERATION",
        message: "This is a local operation; use --home. --host is not supported.",
      };
    return {
      kind: "instance",
      home: resolvePaseoHome({
        OHMYPCODE_HOME: options.home ?? env.OHMYPCODE_HOME,
        PASEO_HOME: env.PASEO_HOME,
      }),
    };
  }
  if (options.home !== undefined)
    return { kind: "instance", home: resolvePaseoHome({ OHMYPCODE_HOME: options.home }) };
  if (options.host !== undefined) return { kind: "endpoint", host: options.host };
  const hostEnv = resolveDaemonHostEnv(env);
  const homeEnvKey = resolveHomeEnvKey(env);
  if (homeEnvKey && hostEnv)
    throw {
      code: "TARGET_AMBIGUOUS",
      message: `${homeEnvKey} and ${hostEnv.key} are both set. Choose --home or --host explicitly.`,
    };
  if (hostEnv) return { kind: "endpoint", host: hostEnv.value };
  return {
    kind: "instance",
    home: resolvePaseoHome({ OHMYPCODE_HOME: env.OHMYPCODE_HOME, PASEO_HOME: env.PASEO_HOME }),
  };
}

export function describeDaemonTarget(target: DaemonTarget): string {
  if (target.kind === "instance") return `home ${target.home}`;
  try {
    const url = new URL(target.host);
    if (url.password) url.password = "REDACTED";
    for (const key of url.searchParams.keys())
      if (/password|token|secret/i.test(key)) url.searchParams.set(key, "REDACTED");
    if (url.hash) url.hash = "REDACTED";
    return url.toString();
  } catch {
    return target.host.replace(/([?&](?:password|token|secret)=)[^&]*/gi, "$1REDACTED");
  }
}
