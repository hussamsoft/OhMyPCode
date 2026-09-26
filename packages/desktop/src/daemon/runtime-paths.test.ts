import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { resolveBundledOmpPath, resolveNodeExecPath } from "./runtime-paths";

const mocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  app: {
    isPackaged: true,
  },
}));

vi.mock("node:fs", () => ({
  existsSync: mocks.existsSync,
  readFileSync: vi.fn(),
}));

vi.mock("electron", () => ({
  app: mocks.app,
}));

vi.mock("electron-log/main", () => ({
  default: { warn: vi.fn() },
}));

const originalPlatform = process.platform;
const originalExecPath = process.execPath;
const originalResourcesPath = process.resourcesPath;

function setProcessRuntime(input: {
  platform: NodeJS.Platform;
  execPath: string;
  resourcesPath?: string;
}): void {
  Object.defineProperty(process, "platform", {
    configurable: true,
    value: input.platform,
  });
  Object.defineProperty(process, "execPath", {
    configurable: true,
    value: input.execPath,
  });
  Object.defineProperty(process, "resourcesPath", {
    configurable: true,
    value: input.resourcesPath,
  });
}

describe("runtime-paths", () => {
  beforeEach(() => {
    mocks.app.isPackaged = true;
    mocks.existsSync.mockReturnValue(true);
    setProcessRuntime({
      platform: "darwin",
      execPath: "/Applications/Paseo.app/Contents/MacOS/Paseo",
      resourcesPath: "/Applications/Paseo.app/Contents/Resources",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setProcessRuntime({
      platform: originalPlatform,
      execPath: originalExecPath,
      resourcesPath: originalResourcesPath,
    });
  });

  it("uses the macOS Helper executable for packaged daemon node launches", () => {
    expect(resolveNodeExecPath()).toBe(
      "/Applications/Paseo.app/Contents/Frameworks/Paseo Helper.app/Contents/MacOS/Paseo Helper",
    );
  });

  it("resolves the development OMP binary at the repository root when present", () => {
    mocks.app.isPackaged = false;
    const expectedPath = path.resolve(
      import.meta.dirname,
      "../../../..",
      "ohmypcode",
      "runtime",
      "omp",
      `${process.platform}-${process.arch}`,
      "omp",
    );
    mocks.existsSync.mockImplementation((filePath: string) => filePath === expectedPath);
    expect(resolveBundledOmpPath()).toBe(expectedPath);
  });

  it("returns null when the embedded OMP binary is absent", () => {
    mocks.app.isPackaged = false;
    mocks.existsSync.mockReturnValue(false);
    expect(resolveBundledOmpPath()).toBeNull();
  });
});
