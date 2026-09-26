import os from "node:os";
import path from "node:path";

function expandHomeDir(input: string): string {
  if (input.startsWith("~/")) {
    return path.join(os.homedir(), input.slice(2));
  }
  if (input === "~") {
    return os.homedir();
  }
  return input;
}

let warnedStalePaseoHome = false;

export function resolvePaseoHome(env: NodeJS.ProcessEnv = process.env): string {
  let raw = env.OHMYPCODE_HOME;
  if (raw === undefined && env.PASEO_HOME !== undefined) {
    raw = env.PASEO_HOME;
    if (!warnedStalePaseoHome) {
      warnedStalePaseoHome = true;
      console.warn(
        "[paseo-home] PASEO_HOME is set but no longer read directly; using its value as a " +
          "fallback. Rename it to OHMYPCODE_HOME -- PASEO_HOME support may be removed in a " +
          "future release.",
      );
    }
  }
  raw ??= "~/.paseo";
  const resolved = path.resolve(expandHomeDir(raw));
  return resolved;
}
