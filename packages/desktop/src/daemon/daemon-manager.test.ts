import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_DESKTOP_SETTINGS } from "../settings/desktop-settings";
import { createDaemonCommandHandlers, seedDaemonConfigFromPackagedDefault } from "./daemon-manager";

const mocks = vi.hoisted(() => ({
  paseoHome: "",
  settings: {
    releaseChannel: "stable",
    daemon: {
      manageBuiltInDaemon: true,
      keepRunningAfterQuit: true,
    },
  },
  runExternalCliJsonCommand: vi.fn(),
  runExternalCliTextCommand: vi.fn(),
  createNodeEntrypointInvocation: vi.fn(() => ({
    command: "node",
    args: [],
    env: {},
  })),
  spawnProcess: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
  appLogPath: "",
  getElectronLogFile: vi.fn(),
  isPackaged: true,
}));

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => mocks.paseoHome),
    getVersion: vi.fn(() => "1.2.3"),
    get isPackaged() {
      return mocks.isPackaged;
    },
  },
  ipcMain: { handle: vi.fn() },
  powerMonitor: { getSystemIdleTime: vi.fn(() => 0) },
}));

vi.mock("electron-log/main", () => ({
  default: {
    info: mocks.logInfo,
    error: mocks.logError,
    transports: {
      file: {
        getFile: mocks.getElectronLogFile,
      },
    },
  },
}));

vi.mock("@ohmypcode/server/daemon-control", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ohmypcode/server/daemon-control")>();
  return {
    resolvePaseoHome: vi.fn(() => mocks.paseoHome),
    spawnProcess: mocks.spawnProcess,
    // Real: this is the function under test in the "seeds a fresh home"
    // case below, and it needs the real schema validation + atomic
    // private-file write, not a stub.
    seedPersistedConfigIfAbsent: actual.seedPersistedConfigIfAbsent,
  };
});

vi.mock("../settings/desktop-settings-electron.js", () => ({
  getDesktopSettingsStore: () => ({
    get: async () => mocks.settings,
    patch: vi.fn(),
    migrateLegacyRendererSettings: vi.fn(),
  }),
}));

vi.mock("./runtime-paths.js", () => ({
  createNodeEntrypointInvocation: mocks.createNodeEntrypointInvocation,
  resolveDaemonRunnerEntrypoint: vi.fn(() => ({
    entryPath: path.join(mocks.paseoHome, "daemon.js"),
    execArgv: [],
  })),
}));

vi.mock("./cli/external.js", () => ({
  runExternalCliJsonCommand: mocks.runExternalCliJsonCommand,
  runExternalCliTextCommand: mocks.runExternalCliTextCommand,
}));

describe("daemon-manager commands", () => {
  let fixtureRoot: string;

  beforeEach(() => {
    fixtureRoot = mkdtempSync(path.join(tmpdir(), "paseo daemon manager "));
    mocks.paseoHome = path.join(fixtureRoot, "home");
    mocks.appLogPath = path.join(fixtureRoot, "main.log");
    mocks.settings = DEFAULT_DESKTOP_SETTINGS;
    mocks.runExternalCliJsonCommand.mockReset();
    mocks.runExternalCliTextCommand.mockReset();
    mocks.createNodeEntrypointInvocation.mockReset();
    mocks.createNodeEntrypointInvocation.mockReturnValue({ command: "node", args: [], env: {} });
    mocks.spawnProcess.mockReset();
    mocks.logInfo.mockReset();
    mocks.logError.mockReset();
    mocks.getElectronLogFile.mockReset();
    mocks.getElectronLogFile.mockReturnValue({ path: mocks.appLogPath });
    mocks.isPackaged = true;
  });

  afterEach(() => {
    rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("returns the Electron main-process log tail from electron-log", () => {
    writeFileSync(
      mocks.appLogPath,
      Array.from({ length: 105 }, (_value, index) => `main log line ${index + 1}`).join("\n"),
    );
    const handlers = createDaemonCommandHandlers();

    expect(handlers.desktop_app_logs()).toEqual({
      logPath: mocks.appLogPath,
      contents: Array.from({ length: 100 }, (_value, index) => `main log line ${index + 6}`).join(
        "\n",
      ),
    });
  });

  it("exposes updater diagnostics through the desktop command boundary", () => {
    const diagnostics = createDaemonCommandHandlers().desktop_update_diagnostics();

    expect(diagnostics).toMatchObject({
      platform: process.platform,
      currentVersion: "1.2.3",
    });
  });

  it("seeds a fresh home from the real packaged default config, enabling omp", () => {
    // isPackaged: false exercises the dev-relative path resolution branch
    // (the one this test runs under); resolveDefaultConfigPath's packaged
    // branch (process.resourcesPath) isn't reachable outside a built app
    // and is covered by its symmetry with resolveBundledOmpPath, which
    // runtime-paths.test.ts already verifies for both branches.
    mocks.isPackaged = false;
    seedDaemonConfigFromPackagedDefault(mocks.paseoHome);

    const seeded = JSON.parse(readFileSync(path.join(mocks.paseoHome, "config.json"), "utf-8"));
    expect(seeded.agents.providers.omp).toMatchObject({ enabled: true });
  });

  it("never overwrites an existing config.json when seeding", () => {
    mocks.isPackaged = false;
    seedDaemonConfigFromPackagedDefault(mocks.paseoHome);
    const firstWrite = readFileSync(path.join(mocks.paseoHome, "config.json"), "utf-8");

    seedDaemonConfigFromPackagedDefault(mocks.paseoHome);
    const secondRead = readFileSync(path.join(mocks.paseoHome, "config.json"), "utf-8");
    expect(secondRead).toBe(firstWrite);
  });
});
