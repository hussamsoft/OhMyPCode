import { promises as fs } from "node:fs";
import path from "node:path";
import { app } from "electron";
import log from "electron-log/main";
import { resolveCliInstallSourcePath } from "./path.js";
import {
  getBundledCliShimPath,
  getCliTargetPath,
  getLegacyCliTargetPath,
  getLocalBinDir,
} from "./paths.js";
import { ensurePathInShellRc } from "./shell-rc.js";

interface InstallStatus {
  installed: boolean;
}

// Detects any filesystem entry at p, including a dangling symlink. Used before
// unlink-and-replace, where a dangling symlink still needs to be removed first.
async function pathOrSymlinkExists(p: string): Promise<boolean> {
  try {
    await fs.lstat(p);
    return true;
  } catch {
    return false;
  }
}

// Detects a usable entry at p: follows symlinks and requires the target to actually
// exist, unlike pathOrSymlinkExists. Used for status reporting, where a dangling
// symlink must NOT read as "installed" - the user would see a command that can't run.
export async function pathIsRunnable(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

// Reads a symlink's raw target without requiring it to exist. fs.realpath rejects with
// ENOENT on a dangling symlink, which is exactly the state a pre-rename legacy symlink
// is in once the app it pointed into no longer ships a file under the old name - so
// realpath cannot be used here, unlike everywhere else in this file that needs an
// existence check. Resolves a relative target against the link's own directory, matching
// realpath's behavior for the (here, not expected but not excluded) relative-symlink case.
async function readSymlinkTargetDir(legacyPath: string): Promise<string | null> {
  let rawTarget: string;
  try {
    rawTarget = await fs.readlink(legacyPath);
  } catch {
    return null;
  }
  const resolved = path.isAbsolute(rawTarget)
    ? rawTarget
    : path.resolve(path.dirname(legacyPath), rawTarget);
  return path.dirname(resolved);
}

// COMPAT(2026-09): removes a pre-rename ~/.local/bin/paseo(.cmd) leftover from an older install
// of this same app, so a stale binary doesn't linger next to the renamed ~/.local/bin/ompc one.
// Deliberately conservative about what counts as "ours":
// - POSIX: only a symlink (never a regular file, which is more likely something the user placed
//   there themselves) whose target directory matches the install source this run just used - i.e.
//   created by a previous install of this exact app, not an unrelated "paseo" binary elsewhere on
//   the machine. Compared by directory, not full path, because the old symlink's target is the
//   old "paseo"-named shim while installSourcePath now resolves to the renamed "ompc" one. The
//   target directory is read via readlink, not realpath: the real-world case this function exists
//   for is exactly a dangling symlink (its target, the pre-rename shim, no longer exists once this
//   app version only packages the renamed one), and realpath throws on a dangling target.
// - win32: installCli() writes a plain-text trampoline file rather than a symlink, so the same
//   symlink check would silently never fire there. Instead requires the legacy file's own
//   content to contain a BUNDLED_CLI= line pointing into the same resources directory as the
//   shim this run just resolved - i.e. it's recognizably our own previously-generated trampoline.
// legacyPath/platform are explicit parameters (not read from getLegacyCliTargetPath()/
// process.platform internally) so this can be unit tested against a real tmpdir without
// mocking os.homedir() or process.platform.
export async function removeStaleLegacyCli(input: {
  legacyPath: string;
  installSourcePath: string;
  shimPath: string;
  platform: NodeJS.Platform;
}): Promise<void> {
  const { legacyPath, installSourcePath, shimPath, platform } = input;
  let stat;
  try {
    stat = await fs.lstat(legacyPath);
  } catch {
    return;
  }

  if (platform === "win32") {
    if (stat.isSymbolicLink()) {
      return;
    }
    let content: string;
    try {
      content = await fs.readFile(legacyPath, "utf-8");
    } catch {
      return;
    }
    if (!content.includes(`BUNDLED_CLI=${path.dirname(shimPath)}`)) {
      return;
    }
  } else {
    if (!stat.isSymbolicLink()) {
      return;
    }
    const targetDir = await readSymlinkTargetDir(legacyPath);
    if (targetDir === null || targetDir !== path.dirname(installSourcePath)) {
      return;
    }
  }

  try {
    await fs.unlink(legacyPath);
    log.info("[integrations] Removed stale pre-rename CLI entry", { legacyPath });
  } catch (err) {
    log.warn("[integrations] Failed to remove stale pre-rename CLI entry", { legacyPath, err });
  }
}

export async function installCli(): Promise<InstallStatus> {
  const targetPath = getCliTargetPath();
  const shimPath = getBundledCliShimPath();
  const installSourcePath = resolveCliInstallSourcePath({
    platform: process.platform,
    isPackaged: app.isPackaged,
    executablePath: app.getPath("exe"),
    shimPath,
    appImagePath: process.env.APPIMAGE,
  });
  const binDir = getLocalBinDir();

  await fs.mkdir(binDir, { recursive: true });

  if (process.platform === "win32") {
    if (await pathOrSymlinkExists(targetPath)) {
      await fs.unlink(targetPath);
    }
    // Generate a thin .cmd trampoline that delegates to the bundled shim.
    // Only the app install path is baked in — internal details (asar layout,
    // entrypoint scripts) live in the bundled shim and update with the app.
    const cmdContent = [
      "@echo off",
      `set "BUNDLED_CLI=${shimPath}"`,
      `if not exist "%BUNDLED_CLI%" (`,
      `  echo OhMyPCode CLI not found at %BUNDLED_CLI% — is OhMyPCode installed? 1>&2`,
      `  exit /b 1`,
      `)`,
      `call "%BUNDLED_CLI%" %*`,
      `exit /b %errorlevel%`,
    ].join("\r\n");
    await fs.writeFile(targetPath, cmdContent, "utf-8");
  } else {
    if (await pathOrSymlinkExists(targetPath)) {
      await fs.unlink(targetPath);
    }
    await fs.symlink(installSourcePath, targetPath);
  }

  await removeStaleLegacyCli({
    legacyPath: getLegacyCliTargetPath(),
    installSourcePath,
    shimPath,
    platform: process.platform,
  });

  const { shellUpdated } = await ensurePathInShellRc();
  if (shellUpdated) {
    log.info("[integrations] Updated shell rc with ~/.local/bin PATH");
  }

  return getCliInstallStatus();
}

export async function getCliInstallStatus(): Promise<InstallStatus> {
  const targetPath = getCliTargetPath();
  return { installed: await pathIsRunnable(targetPath) };
}
