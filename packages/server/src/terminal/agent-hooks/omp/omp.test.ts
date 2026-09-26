import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it } from "vitest";
import {
  agentHooksAreInstalled,
  installAgentHooks,
  resolveAgentHookConfigPath,
  uninstallAgentHooks,
} from "../agent-hook-installer.js";
import { ompAgentHookProvider } from "./omp.js";
import { OMP_HOOK_SOURCE } from "./omp-hook.js";

const temporaryDirs: string[] = [];

afterEach(() => {
  while (temporaryDirs.length > 0) {
    const dir = temporaryDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirs.push(dir);
  return dir;
}

interface OmpHookEvent {
  toolName?: string;
}

interface OmpHookContext {
  hasUI: boolean;
}
type OmpHookHandler = (event: OmpHookEvent, context: OmpHookContext) => Promise<void>;

interface OmpHook {
  (pi: { on(event: string, handler: OmpHookHandler): void }): void;
}

interface InstalledHook {
  commands: string[][];
  handlers: Map<string, OmpHookHandler>;
}

function loadInstalledHook(
  terminalId = "terminal-1",
  exited = Promise.resolve(0),
  hookCli?: string,
): InstalledHook {
  const configDir = createTempDir("paseo-omp-runtime-");
  const { configPath } = installAgentHooks(ompAgentHookProvider, { configDir });
  const source = readFileSync(configPath, "utf8");
  const commands: string[][] = [];
  const handlers = new Map<string, OmpHookHandler>();
  // Supply the host runtime at the script boundary; execute the installed source.
  const hook: OmpHook = runInNewContext(source.replace("export default", "globalThis.hook ="), {
    process: {
      env: {
        ...(terminalId ? { PASEO_TERMINAL_ID: terminalId } : {}),
        ...(hookCli ? { PASEO_HOOK_CLI: hookCli } : {}),
      },
    },
    Bun: {
      spawn(command: string[]) {
        commands.push(command);
        return { exited };
      },
    },
  });
  hook({
    on(event, handler) {
      handlers.set(event, handler);
    },
  });
  return { commands, handlers };
}

function handlerFor(hook: InstalledHook, event: string): OmpHookHandler {
  const handler = hook.handlers.get(event);
  if (!handler) throw new Error(`Missing ${event} handler`);
  return handler;
}

describe("OMP terminal agent hooks", () => {
  it("installs a self-contained OMP hook idempotently", () => {
    const configDir = createTempDir("paseo-omp-config-");

    const firstInstall = installAgentHooks(ompAgentHookProvider, { configDir });
    const secondInstall = installAgentHooks(ompAgentHookProvider, { configDir });

    expect(firstInstall.configPath).toBe(
      join(configDir, "hooks", "post", "paseo-terminal-activity.js"),
    );
    expect(firstInstall.changed).toBe(true);
    expect(secondInstall.changed).toBe(false);
    expect(readFileSync(firstInstall.configPath, "utf8")).toBe(OMP_HOOK_SOURCE);
    expect(agentHooksAreInstalled(ompAgentHookProvider, { configDir })).toBe(true);
  });

  it("reports agent start and settle through the default CLI", async () => {
    const hook = loadInstalledHook();

    await handlerFor(hook, "agent_start")({}, { hasUI: true });
    await handlerFor(hook, "agent_settled")({}, { hasUI: true });

    expect(hook.commands).toEqual([
      ["paseo", "hooks", "omp", "agent_start"],
      ["paseo", "hooks", "omp", "agent_settled"],
    ]);
  });

  it("uses PASEO_HOOK_CLI when provided", async () => {
    const hook = loadInstalledHook("terminal-1", Promise.resolve(0), "C:/tools/paseo.exe");

    await handlerFor(hook, "agent_start")({}, { hasUI: true });

    expect(hook.commands).toEqual([["C:/tools/paseo.exe", "hooks", "omp", "agent_start"]]);
  });

  it("reports ask tool calls and results only", async () => {
    const hook = loadInstalledHook();

    await handlerFor(hook, "tool_call")({ toolName: "bash" }, { hasUI: true });
    await handlerFor(hook, "tool_result")({ toolName: "bash" }, { hasUI: true });
    await handlerFor(hook, "tool_call")({ toolName: "ask" }, { hasUI: true });
    await handlerFor(hook, "tool_result")({ toolName: "ask" }, { hasUI: true });

    expect(hook.commands).toEqual([
      ["paseo", "hooks", "omp", "tool_call"],
      ["paseo", "hooks", "omp", "tool_result"],
    ]);
  });

  it("keeps non-interactive OMP hooks inert", async () => {
    const hook = loadInstalledHook();

    await handlerFor(hook, "agent_start")({}, { hasUI: false });
    await handlerFor(hook, "agent_settled")({}, { hasUI: false });
    await handlerFor(hook, "tool_call")({ toolName: "ask" }, { hasUI: false });
    await handlerFor(hook, "tool_result")({ toolName: "ask" }, { hasUI: false });

    expect(hook.commands).toEqual([]);
  });

  it("keeps every hook inert outside Paseo terminals", async () => {
    const hook = loadInstalledHook("");

    await handlerFor(hook, "agent_start")({}, { hasUI: true });
    await handlerFor(hook, "agent_settled")({}, { hasUI: true });
    await handlerFor(hook, "tool_call")({ toolName: "ask" }, { hasUI: true });
    await handlerFor(hook, "tool_result")({ toolName: "ask" }, { hasUI: true });

    expect(hook.commands).toEqual([]);
  });

  it("uninstalls the OMP hook file", () => {
    const configDir = createTempDir("paseo-omp-config-uninstall-");
    const configPath = resolveAgentHookConfigPath(ompAgentHookProvider, { configDir });
    installAgentHooks(ompAgentHookProvider, { configDir });

    const result = uninstallAgentHooks(ompAgentHookProvider, { configDir });

    expect(result).toEqual({ configPath, changed: true });
    expect(existsSync(configPath)).toBe(false);
    expect(agentHooksAreInstalled(ompAgentHookProvider, { configDir })).toBe(false);
  });

  it("prefers PI_CODING_AGENT_DIR over the default OMP agent directory", () => {
    const homeDir = createTempDir("paseo-home-");
    const configDir = createTempDir("paseo-omp-override-");

    const configPath = resolveAgentHookConfigPath(ompAgentHookProvider, {
      env: { ...process.env, PI_CODING_AGENT_DIR: configDir },
      homeDir,
    });

    expect(configPath).toBe(join(configDir, "hooks", "post", "paseo-terminal-activity.js"));
  });

  it("uses the default OMP agent directory without an override", () => {
    const homeDir = createTempDir("paseo-home-");

    const configPath = resolveAgentHookConfigPath(ompAgentHookProvider, {
      env: { ...process.env, PI_CODING_AGENT_DIR: "" },
      homeDir,
    });

    expect(configPath).toBe(
      join(homeDir, ".omp", "agent", "hooks", "post", "paseo-terminal-activity.js"),
    );
  });

  it.each([
    ["agent_start", "running"],
    ["agent_settled", "idle"],
    ["tool_call", "needs-input"],
    ["tool_result", "running"],
  ] as const)("maps %s to %s", async (event, state) => {
    await expect(
      ompAgentHookProvider.resolveActivity({
        event,
        input: { read: async () => null },
      }),
    ).resolves.toBe(state);
  });
});
