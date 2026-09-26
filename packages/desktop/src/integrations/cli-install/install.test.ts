import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { removeStaleLegacyCli } from "./install";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-install-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("removeStaleLegacyCli (POSIX)", () => {
  it("removes a symlink pointing into the same directory as the current install source", async () => {
    const resourcesDir = path.join(tmpDir, "resources", "bin");
    await fs.mkdir(resourcesDir, { recursive: true });
    const oldShim = path.join(resourcesDir, "paseo");
    const newShim = path.join(resourcesDir, "ompc");
    await fs.writeFile(oldShim, "#!/bin/sh\necho old\n");
    await fs.writeFile(newShim, "#!/bin/sh\necho new\n");
    const legacyPath = path.join(tmpDir, "local-bin", "paseo");
    await fs.mkdir(path.dirname(legacyPath), { recursive: true });
    await fs.symlink(oldShim, legacyPath);

    await removeStaleLegacyCli({
      legacyPath,
      installSourcePath: newShim,
      shimPath: newShim,
      platform: "linux",
    });

    await expect(fs.lstat(legacyPath)).rejects.toThrow();
  });

  it("leaves a regular file alone even if it happens to be named paseo", async () => {
    const legacyPath = path.join(tmpDir, "local-bin", "paseo");
    await fs.mkdir(path.dirname(legacyPath), { recursive: true });
    await fs.writeFile(legacyPath, "#!/bin/sh\necho unrelated user binary\n");

    await removeStaleLegacyCli({
      legacyPath,
      installSourcePath: path.join(tmpDir, "resources", "bin", "ompc"),
      shimPath: path.join(tmpDir, "resources", "bin", "ompc"),
      platform: "linux",
    });

    await expect(fs.lstat(legacyPath)).resolves.toBeDefined();
  });

  it("leaves a symlink alone when it points somewhere unrelated to the current install", async () => {
    const unrelatedTarget = path.join(tmpDir, "some-other-app", "paseo");
    await fs.mkdir(path.dirname(unrelatedTarget), { recursive: true });
    await fs.writeFile(unrelatedTarget, "#!/bin/sh\necho unrelated\n");
    const legacyPath = path.join(tmpDir, "local-bin", "paseo");
    await fs.mkdir(path.dirname(legacyPath), { recursive: true });
    await fs.symlink(unrelatedTarget, legacyPath);

    await removeStaleLegacyCli({
      legacyPath,
      installSourcePath: path.join(tmpDir, "resources", "bin", "ompc"),
      shimPath: path.join(tmpDir, "resources", "bin", "ompc"),
      platform: "linux",
    });

    await expect(fs.lstat(legacyPath)).resolves.toBeDefined();
  });

  it("is a no-op when no legacy path exists", async () => {
    const legacyPath = path.join(tmpDir, "local-bin", "paseo");

    await expect(
      removeStaleLegacyCli({
        legacyPath,
        installSourcePath: path.join(tmpDir, "resources", "bin", "ompc"),
        shimPath: path.join(tmpDir, "resources", "bin", "ompc"),
        platform: "linux",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("removeStaleLegacyCli (win32)", () => {
  it("removes a legacy trampoline whose BUNDLED_CLI points into the current resources dir", async () => {
    const resourcesDir = path.join(tmpDir, "resources", "bin");
    await fs.mkdir(resourcesDir, { recursive: true });
    const newShim = path.join(resourcesDir, "ompc.cmd");
    await fs.writeFile(newShim, "@echo off\r\n");
    const legacyPath = path.join(tmpDir, "local-bin", "paseo.cmd");
    await fs.mkdir(path.dirname(legacyPath), { recursive: true });
    const legacyContent = [
      "@echo off",
      `set "BUNDLED_CLI=${path.join(resourcesDir, "paseo.cmd")}"`,
      `call "%BUNDLED_CLI%" %*`,
    ].join("\r\n");
    await fs.writeFile(legacyPath, legacyContent, "utf-8");

    await removeStaleLegacyCli({
      legacyPath,
      installSourcePath: newShim,
      shimPath: newShim,
      platform: "win32",
    });

    await expect(fs.lstat(legacyPath)).rejects.toThrow();
  });

  it("leaves a trampoline alone when BUNDLED_CLI points into a different install", async () => {
    const legacyPath = path.join(tmpDir, "local-bin", "paseo.cmd");
    await fs.mkdir(path.dirname(legacyPath), { recursive: true });
    const legacyContent = [
      "@echo off",
      `set "BUNDLED_CLI=${path.join(tmpDir, "some-other-install", "resources", "bin", "paseo.cmd")}"`,
      `call "%BUNDLED_CLI%" %*`,
    ].join("\r\n");
    await fs.writeFile(legacyPath, legacyContent, "utf-8");

    await removeStaleLegacyCli({
      legacyPath,
      installSourcePath: path.join(tmpDir, "resources", "bin", "ompc.cmd"),
      shimPath: path.join(tmpDir, "resources", "bin", "ompc.cmd"),
      platform: "win32",
    });

    await expect(fs.lstat(legacyPath)).resolves.toBeDefined();
  });

  it("leaves a legacy symlink alone on win32 (installCli never creates one there)", async () => {
    const target = path.join(tmpDir, "resources", "bin", "paseo.cmd");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, "@echo off\r\n");
    const legacyPath = path.join(tmpDir, "local-bin", "paseo.cmd");
    await fs.mkdir(path.dirname(legacyPath), { recursive: true });
    await fs.symlink(target, legacyPath);

    await removeStaleLegacyCli({
      legacyPath,
      installSourcePath: path.join(tmpDir, "resources", "bin", "ompc.cmd"),
      shimPath: path.join(tmpDir, "resources", "bin", "ompc.cmd"),
      platform: "win32",
    });

    await expect(fs.lstat(legacyPath)).resolves.toBeDefined();
  });
});
