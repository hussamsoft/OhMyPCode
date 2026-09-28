import { describe, expect, it } from "vitest";

import { resolveDefaultOmpCommand } from "./cli-runtime.js";
import { buildOmpLaunch } from "./runtime.js";
import { createOmpRuntimeForTest } from "./agent.js";
import { mergeOmpRuntimeSettings } from "./provider-config.js";

/**
 * The OMP binary the agent actually runs.
 *
 * Regression: createRuntime passed a hardcoded `command: ["omp"]`, so
 * OmpCliRuntime's `options.command ?? DEFAULT_OMP_COMMAND` never fell through
 * to the env read. The packaged desktop sets OMP_COMMAND to its bundled
 * runtime (packages/desktop/src/daemon/daemon-manager.ts) and that pointer was
 * discarded — the agent resolved `omp` through PATH instead.
 *
 * On a machine with a stock `omp` newer than the bundle this silently disables
 * the entire fork RPC surface. Verified against the two real binaries on this
 * machine:
 *
 *   ohmypcode/runtime/omp/win32-x64/omp.exe  (omp/18.3.1, the bundle)
 *     {"type":"get_tool_catalog"} -> "success":true
 *   C:/Users/hussa/AppData/Local/omp/omp.exe (omp/18.3.5, PATH)
 *     {"type":"get_tool_catalog"} -> "success":false
 *
 * The composer then showed "Tool selection unavailable" with no explanation,
 * because the capability probe had asked a binary that does not implement it.
 */
describe("resolveDefaultOmpCommand", () => {
  it("prefers OMP_COMMAND over PATH", () => {
    expect(
      resolveDefaultOmpCommand({ OMP_COMMAND: "C:/app/resources/omp/win32-x64/omp.exe" }),
    ).toEqual(["C:/app/resources/omp/win32-x64/omp.exe"]);
  });

  it("falls back to the bare name only when OMP_COMMAND is absent or blank", () => {
    expect(resolveDefaultOmpCommand({})).toEqual(["omp"]);
    expect(resolveDefaultOmpCommand({ OMP_COMMAND: "" })).toEqual(["omp"]);
    expect(resolveDefaultOmpCommand({ OMP_COMMAND: "   " })).toEqual(["omp"]);
  });

  it("keeps an explicit runtimeSettings.command authoritative over the env", () => {
    // buildOmpLaunch applies runtimeSettings.command with mode "replace", so a
    // user who pinned a binary in config still wins over the desktop default.
    const launch = buildOmpLaunch({
      command: resolveDefaultOmpCommand({ OMP_COMMAND: "C:/bundled/omp.exe" }),
      runtimeSettings: {
        command: { mode: "replace", argv: ["C:/user/pinned/omp.exe"] },
      },
      session: { cwd: "C:/work" },
    });
    expect(launch.argv[0]).toBe("C:/user/pinned/omp.exe");
  });

  it("uses the env-resolved binary when no explicit command is configured", () => {
    const launch = buildOmpLaunch({
      command: resolveDefaultOmpCommand({ OMP_COMMAND: "C:/bundled/omp.exe" }),
      session: { cwd: "C:/work" },
    });
    expect(launch.argv[0]).toBe("C:/bundled/omp.exe");
  });
});

describe("createRuntime (the agent's own factory)", () => {
  it("resolves the binary through OMP_COMMAND, not a hardcoded 'omp'", async () => {
    // This is the assertion that actually covers the bug. The mutation
    // `command: ["omp"]` typechecks, passes every other suite, and only
    // misbehaves at spawn time -- so the factory's own argv is what has to be
    // pinned, not the helper it delegates to.
    const previous = process.env.OMP_COMMAND;
    process.env.OMP_COMMAND = "C:/bundled/win32-x64/omp.exe";
    try {
      const runtime = createOmpRuntimeForTest(
        { child: { warn: () => {}, error: () => {}, debug: () => {}, info: () => {} } } as never,
        undefined,
        {},
      );
      // startSession builds the launch; capture it without spawning by
      // reading the private field the constructor assigned.
      const command = (runtime as unknown as { command: string[] }).command;
      expect(command).toEqual(["C:/bundled/win32-x64/omp.exe"]);
    } finally {
      if (previous === undefined) delete process.env.OMP_COMMAND;
      else process.env.OMP_COMMAND = previous;
    }
  });
});

describe("OmpAgentClient runtime settings", () => {
  it("does not install a baseline command that would override OMP_COMMAND", () => {
    // The client constructor used to pass
    //   mergeOmpRuntimeSettings({ command: { mode: "replace", argv: ["omp"] } }, ...)
    // and buildOmpLaunch applies mode "replace" ahead of the runtime's own
    // resolution. That baseline overwrote the desktop's OMP_COMMAND pointer for
    // every real agent session, so the packaged app kept launching the PATH
    // binary even after createRuntime stopped hardcoding the command.
    //
    // With no caller-supplied runtimeSettings there must now be no command at
    // all, so OmpCliRuntime falls through to resolveDefaultOmpCommand().
    expect(mergeOmpRuntimeSettings(undefined, undefined)).toBeUndefined();
    expect(mergeOmpRuntimeSettings(undefined, {})?.command).toBeUndefined();

    // An explicit caller setting still wins, and still replaces.
    const pinned = mergeOmpRuntimeSettings(undefined, {
      command: { mode: "replace", argv: ["C:/user/pinned/omp.exe"] },
    });
    const launch = buildOmpLaunch({
      command: resolveDefaultOmpCommand({ OMP_COMMAND: "C:/bundled/omp.exe" }),
      runtimeSettings: pinned,
      session: { cwd: "C:/work" },
    });
    expect(launch.argv[0]).toBe("C:/user/pinned/omp.exe");
  });
});
