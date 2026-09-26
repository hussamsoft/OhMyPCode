import { execFile } from "node:child_process";
import { join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const cliHome = mkdtempSync(join(tmpdir(), "paseo-test-cli-os-home-"));
process.once("exit", () => rmSync(cliHome, { recursive: true, force: true }));

const CLI_ENTRY = join(import.meta.dirname, "..", "..", "dist", "index.js");

export interface LocalPaseoResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

/**
 * Runs the CLI via execFile (argv array, no shell) rather than zx's `$`
 * template tag. zx's default shell resolution on this host is Git Bash,
 * which cannot execute a Windows-style absolute path (process.execPath,
 * e.g. "C:\Program Files\nodejs\node.exe") at all -- not a quoting issue,
 * confirmed by testing both a corrected bash-quoted path and a bare `node`
 * PATH lookup (Git Bash's own PATH has no usable node entry on this
 * machine either). execFile spawns the process directly through the OS,
 * with no shell in the path at all, so there's nothing to quote or
 * translate. Matches packages/relay/src/e2e.test.ts's spawnRelayDevServer,
 * which uses the identical spawn(process.execPath, [...], {cwd, env})
 * shape and already runs green on this host.
 */
export function runLocalPaseo(
  args: string[],
  env: NodeJS.ProcessEnv = {},
  cwd = process.cwd(),
): Promise<LocalPaseoResult> {
  const { promise, resolve } = Promise.withResolvers<LocalPaseoResult>();
  const child = execFile(
    process.execPath,
    [CLI_ENTRY, ...args],
    {
      cwd,
      env: {
        ...Object.fromEntries(
          Object.entries(process.env).filter(([key]) => !key.startsWith("PASEO_")),
        ),
        ...env,
        HOME: cliHome,
        USERPROFILE: cliHome,
      },
      maxBuffer: 16 * 1024 * 1024,
    },
    (_error, stdout, stderr) => {
      resolve({
        exitCode: child.exitCode,
        signal: child.signalCode,
        stdout,
        stderr,
      });
    },
  );
  return promise;
}
