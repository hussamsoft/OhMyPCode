import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

let electronExePath = "";
vi.mock("electron", () => ({
  app: { getPath: () => electronExePath },
}));

import { getBundledCliShimPath, getCliTargetPath, getLegacyCliTargetPath } from "./paths";

// Regression guard for the bug fixed in 2c24e1607: electron-builder.yml's packaged
// extraResources "to: bin/..." entries and getBundledCliShimPath()'s generated filename
// drifted (packaging shipped bin/ompc, the runtime code looked for bin/paseo) with nothing
// catching it - path.test.ts only exercises resolveCliInstallSourcePath, which takes its
// filename as an input parameter and echoes it back, never generates one itself. Parsing the
// real electron-builder.yml, rather than hardcoding "ompc" here, means this fails again the
// next time the two drift, for any reason - not just this one.
function extraResourceBinBasenames(): string[] {
  const yamlPath = path.resolve(__dirname, "../../../electron-builder.yml");
  const content = readFileSync(yamlPath, "utf-8");
  const matches = [...content.matchAll(/to:\s*bin\/(\S+)/g)];
  return matches.map((m) => m[1]);
}

function withPlatform<T>(platform: NodeJS.Platform, fn: () => T): T {
  const original = process.platform;
  Object.defineProperty(process, "platform", { value: platform, configurable: true });
  try {
    return fn();
  } finally {
    Object.defineProperty(process, "platform", { value: original, configurable: true });
  }
}

describe("cli-install paths vs electron-builder.yml packaging", () => {
  const basenames = extraResourceBinBasenames();

  it("electron-builder.yml actually declares at least one packaged bin/ resource", () => {
    // Guards the guard: if this is empty, the yaml regex broke and every assertion below
    // would trivially pass for the wrong reason (basenames.includes(x) on an empty array
    // is always false, so a broken regex would fail loudly here - not silently elsewhere).
    expect(basenames.length).toBeGreaterThan(0);
  });

  it("getBundledCliShimPath() basename is packaged on darwin", () => {
    electronExePath = "/Applications/OhMyPCode.app/Contents/MacOS/OhMyPCode";
    const shimBasename = withPlatform("darwin", () => path.basename(getBundledCliShimPath()));
    expect(basenames).toContain(shimBasename);
  });

  it("getBundledCliShimPath() basename is packaged on linux", () => {
    electronExePath = "/opt/OhMyPCode/OhMyPCode";
    const shimBasename = withPlatform("linux", () => path.basename(getBundledCliShimPath()));
    expect(basenames).toContain(shimBasename);
  });

  it("getBundledCliShimPath() basename is packaged on win32", () => {
    electronExePath = "C:\\Users\\user\\AppData\\Local\\Programs\\OhMyPCode\\OhMyPCode.exe";
    const shimBasename = withPlatform("win32", () => path.basename(getBundledCliShimPath()));
    expect(basenames).toContain(shimBasename);
  });
});

describe("getCliTargetPath / getLegacyCliTargetPath", () => {
  it("targets ompc on POSIX and ompc.cmd on win32", () => {
    expect(withPlatform("linux", () => path.basename(getCliTargetPath()))).toBe("ompc");
    expect(withPlatform("darwin", () => path.basename(getCliTargetPath()))).toBe("ompc");
    expect(withPlatform("win32", () => path.basename(getCliTargetPath()))).toBe("ompc.cmd");
  });

  it("the legacy path uses the pre-rename paseo name, matching getCliTargetPath's shape", () => {
    expect(withPlatform("linux", () => path.basename(getLegacyCliTargetPath()))).toBe("paseo");
    expect(withPlatform("win32", () => path.basename(getLegacyCliTargetPath()))).toBe("paseo.cmd");
  });

  it("legacy and current targets live in the same directory", () => {
    withPlatform("linux", () => {
      expect(path.dirname(getLegacyCliTargetPath())).toBe(path.dirname(getCliTargetPath()));
    });
  });
});
