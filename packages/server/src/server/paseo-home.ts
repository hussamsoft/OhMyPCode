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
  let raw = env.OHMYPCODE_HOME?.trim() ? env.OHMYPCODE_HOME : undefined;
  if (raw === undefined && env.PASEO_HOME?.trim()) {
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
  // Default to the OhMyPCode home. The legacy `~/.paseo` name is not a safe
  // fallback here: it holds a different server-id and a different daemon
  // password than `~/.ohmypcode`, so a daemon that lands there while the
  // desktop expects `~/.ohmypcode` fails every handshake with "invalid
  // daemon password" and never returns a server id. Both the desktop
  // (packages/desktop/src/product-bootstrap.ts) and this resolver must agree.
  raw ??= "~/.ohmypcode";
  const resolved = path.resolve(expandHomeDir(raw));
  return resolved;
}
