import { describe, expect, it } from "vitest";
import { resolveCliInstallSourcePath } from "./path";

describe("cli-install-path", () => {
  it("uses the bundled shim for packaged macOS installs", () => {
    expect(
      resolveCliInstallSourcePath({
        platform: "darwin",
        isPackaged: true,
        executablePath: "/Applications/OhMyPCode.app/Contents/MacOS/OhMyPCode",
        shimPath: "/Applications/OhMyPCode.app/Contents/Resources/bin/ompc",
      }),
    ).toBe("/Applications/OhMyPCode.app/Contents/Resources/bin/ompc");
  });

  it("prefers the original AppImage path on linux", () => {
    expect(
      resolveCliInstallSourcePath({
        platform: "linux",
        isPackaged: true,
        executablePath: "/tmp/.mount_ohmypcode123/ompc",
        shimPath: "/tmp/.mount_ohmypcode123/resources/bin/ompc",
        appImagePath: "/home/user/Applications/OhMyPCode.AppImage",
      }),
    ).toBe("/home/user/Applications/OhMyPCode.AppImage");
  });

  it("uses the bundled shim for packaged linux installs outside an AppImage", () => {
    expect(
      resolveCliInstallSourcePath({
        platform: "linux",
        isPackaged: true,
        executablePath: "/opt/OhMyPCode/OhMyPCode",
        shimPath: "/opt/OhMyPCode/resources/bin/ompc",
      }),
    ).toBe("/opt/OhMyPCode/resources/bin/ompc");
  });

  it("falls back to the shim on windows and in development", () => {
    expect(
      resolveCliInstallSourcePath({
        platform: "win32",
        isPackaged: true,
        executablePath: "C:\\Users\\user\\AppData\\Local\\Programs\\OhMyPCode\\OhMyPCode.exe",
        shimPath: "C:\\Users\\user\\AppData\\Local\\Programs\\OhMyPCode\\resources\\bin\\ompc.cmd",
      }),
    ).toBe("C:\\Users\\user\\AppData\\Local\\Programs\\OhMyPCode\\resources\\bin\\ompc.cmd");

    expect(
      resolveCliInstallSourcePath({
        platform: "linux",
        isPackaged: false,
        executablePath: "/opt/OhMyPCode/ompc",
        shimPath: "/opt/OhMyPCode/resources/bin/ompc",
      }),
    ).toBe("/opt/OhMyPCode/resources/bin/ompc");
  });
});
