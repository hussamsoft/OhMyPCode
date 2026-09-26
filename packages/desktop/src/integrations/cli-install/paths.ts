import path from "node:path";
import os from "node:os";
import { app } from "electron";

export function getLocalBinDir(): string {
  return path.join(os.homedir(), ".local", "bin");
}

export function getCliTargetPath(): string {
  const filename = process.platform === "win32" ? "ompc.cmd" : "ompc";
  return path.join(getLocalBinDir(), filename);
}

// COMPAT(2026-09): pre-rename installs symlinked ~/.local/bin/paseo. installCli() removes it
// once it can confirm the symlink is our own (not an unrelated user binary of the same name).
export function getLegacyCliTargetPath(): string {
  const filename = process.platform === "win32" ? "paseo.cmd" : "paseo";
  return path.join(getLocalBinDir(), filename);
}

export function getBundledCliShimPath(): string {
  const cliShimFilename = process.platform === "win32" ? "ompc.cmd" : "ompc";

  if (process.platform === "darwin") {
    const electronExePath = app.getPath("exe");
    const appBundle = electronExePath.replace(/\/Contents\/MacOS\/.+$/, "");
    return path.join(appBundle, "Contents", "Resources", "bin", cliShimFilename);
  }

  if (process.platform === "win32") {
    const electronExePath = app.getPath("exe");
    return path.join(path.dirname(electronExePath), "resources", "bin", cliShimFilename);
  }

  // Linux
  const electronExePath = app.getPath("exe");
  return path.join(path.dirname(electronExePath), "resources", "bin", cliShimFilename);
}
