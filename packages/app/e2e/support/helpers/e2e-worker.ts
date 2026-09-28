import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { forkPaseoHomeMetadata, resolvePaseoHomePath } from "./paseo-home-fork";
import { startIsolatedHostDaemon } from "./isolated-host-daemon";

export interface E2EWorker {
  close(): Promise<void>;
}

export interface E2EWorkerOptions {
  forkProviders?: string[];
  injectPaseoTools?: boolean;
  daemonConfig?: Record<string, unknown>;
  environment?: Record<string, string>;
  /**
   * Prepare the fake OMP runtime for this worker. The fake daemon reads its
   * scenario from a file, so the worker seeds an empty one and exports the path
   * a spec mutates through `configureFakeOmpScenario`.
   */
  fakeOmpRuntime?: boolean;
}

function resolveOptionalHome(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return resolvePaseoHomePath(trimmed === "current" ? "~/.paseo" : trimmed);
}

async function createFakeEditorBin(): Promise<string> {
  const binDir = await mkdtemp(path.join(tmpdir(), "paseo-e2e-editor-bin-"));
  let realGhPath = "";
  try {
    const locator = process.platform === "win32" ? "where.exe" : "which";
    const candidates = execFileSync(locator, ["gh"], { encoding: "utf8" })
      .split(/\r?\n/u)
      .map((candidate) => candidate.trim())
      .filter(Boolean);
    realGhPath =
      candidates.find(
        (candidate) =>
          process.platform !== "win32" || !/\.(?:cmd|bat)$/iu.test(path.extname(candidate)),
      ) ?? "";
  } catch {
    // The local GitHub fixture remains usable without a system gh binary.
  }
  const fakeEditorSource = `#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const recordPath = process.env.PASEO_E2E_EDITOR_RECORD_PATH;
if (recordPath) {
  fs.appendFileSync(recordPath, JSON.stringify({
    command: path.basename(process.argv[1]),
    args: process.argv.slice(2),
    cwd: process.cwd(),
    at: Date.now()
  }) + "\\n");
}
`;
  for (const editorCommand of ["cursor", "code"]) {
    const editorPath = path.join(binDir, editorCommand);
    await writeFile(editorPath, fakeEditorSource);
    await chmod(editorPath, 0o755);
    if (process.platform === "win32") {
      await writeFile(`${editorPath}.cmd`, `@node "%~dp0${editorCommand}" %*\r\n`);
    }
  }

  const fakeGhPath = path.join(binDir, "gh");
  const fakeGhSource = `#!/usr/bin/env node
const { spawnSync } = require("child_process");
const args = process.argv.slice(2);
const fixtureRemote = "https://github.com/paseo-e2e/local-fixture.git";
const origin = spawnSync("git", ["config", "--get", "remote.origin.url"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"]
}).stdout?.trim();

if (origin === fixtureRemote) {
  const command = args.slice(0, 2).join(" ");
  if (command === "auth status") process.exit(0);
  if (command === "repo view") {
    process.stdout.write(JSON.stringify({ owner: { login: "paseo-e2e" }, name: "local-fixture", parent: null }));
    process.exit(0);
  }
  if (command === "issue list") {
    process.stdout.write("[]");
    process.exit(0);
  }
  if (command === "pr list" || command === "pr view") {
    const isFork = args.includes("2");
    const pr = {
      number: isFork ? 2 : 1,
      title: "Use pasted PR as start ref",
      url: "https://github.com/paseo-e2e/local-fixture/pull/" + (isFork ? 2 : 1),
      state: "OPEN",
      body: null,
      labels: [],
      baseRefName: "main",
      headRefName: isFork ? "pr-branch-2" : "pr-branch-1",
      updatedAt: "2026-01-01T00:00:00Z"
    };
    process.stdout.write(JSON.stringify(command === "pr list" ? [pr] : pr));
    process.exit(0);
  }
  if (command === "api graphql" && args.some((arg) => arg.includes("PullRequestCheckoutTarget"))) {
    const isFork = args.some((arg) => arg === "number=2");
    process.stdout.write(JSON.stringify({
      data: { repository: { pullRequest: {
        number: isFork ? 2 : 1,
        baseRefName: "main",
        headRefName: isFork ? "pr-branch-2" : "pr-branch-1",
        isCrossRepository: isFork,
        headRepositoryOwner: { login: isFork ? "fork-owner" : "paseo-e2e" },
        headRepository: {
          sshUrl: isFork ? "git@github.com:fork-owner/local-fixture.git" : "git@github.com:paseo-e2e/local-fixture.git",
          url: isFork ? "https://github.com/fork-owner/local-fixture" : fixtureRemote
        }
      } } }
    }));
    process.exit(0);
  }
  process.stderr.write("Unsupported local GitHub fixture command: " + args.join(" ") + "\\n");
  process.exit(1);
}

const realGhPath = ${JSON.stringify(realGhPath)};
if (!realGhPath) process.exit(127);
const result = spawnSync(realGhPath, args, { stdio: "inherit" });
process.exit(result.status ?? 1);
`;
  await writeFile(fakeGhPath, fakeGhSource);
  await chmod(fakeGhPath, 0o755);
  if (process.platform === "win32") {
    await writeFile(`${fakeGhPath}.cmd`, '@node "%~dp0gh" %*\r\n');
  }
  return binDir;
}

async function applyMetadataFork(targetHome: string, providerIds: string[]): Promise<void> {
  const sourceHome = resolveOptionalHome(process.env.E2E_FORK_PASEO_HOME_FROM);
  if (!sourceHome) return;
  const result = await forkPaseoHomeMetadata({ sourceHome, targetHome });
  process.env.E2E_FORK_SOURCE_PASEO_HOME = result.sourceHome;
  process.env.E2E_FORK_TARGET_PASEO_HOME = result.targetHome;
  process.env.E2E_FORK_COPIED_FILES = String(result.copiedFiles);
  process.env.E2E_FORK_COPIED_BYTES = String(result.copiedBytes);

  if (providerIds.length === 0) return;

  const sourceConfig = JSON.parse(
    await readFile(path.join(result.sourceHome, "config.json"), "utf8"),
  );
  const sourceProviders = sourceConfig.agents?.providers ?? {};
  const providers = Object.fromEntries(
    providerIds.map((providerId: string) => {
      const provider = sourceProviders[providerId];
      if (!provider) {
        throw new Error(`E2E provider '${providerId}' is not configured in ${result.sourceHome}`);
      }
      return [providerId, provider];
    }),
  );
  await writeFile(
    path.join(targetHome, "config.json"),
    `${JSON.stringify({ version: 1, agents: { providers } }, null, 2)}\n`,
  );
}

export /**
 * Reserve a TCP port for a fixture daemon to bind.
 *
 * The fake OMP entry asserts `E2E_FAKE_OMP_DAEMON_PORT` equals the listen
 * address it is about to use, so the port cannot be chosen inside the spawn.
 * The socket is closed immediately: the port is handed over, not held, and the
 * window between release and bind is the same one the daemon's own retry loop
 * already covers.
 */
async function reserveE2EDaemonPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to reserve an e2e daemon port")));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

export async function startE2EWorker(
  workerIndex: number,
  options: E2EWorkerOptions = {},
): Promise<E2EWorker> {
  const requestedRoot = resolveOptionalHome(process.env.E2E_PASEO_HOME);
  const paseoHome = requestedRoot
    ? path.join(requestedRoot, `worker-${workerIndex}`)
    : await mkdtemp(path.join(tmpdir(), `paseo-e2e-worker-${workerIndex}-`));
  const preserveHome = Boolean(requestedRoot) || process.env.E2E_KEEP_PASEO_HOME === "1";
  const fakeEditorBin = await createFakeEditorBin();
  const editorRecordPath = path.join(paseoHome, "editor-open-records.jsonl");
  const serverId = `srv_e2e_worker_${workerIndex}`;
  const fakeOmpScenarioPath = path.join(paseoHome, "fake-omp-scenario.json");

  try {
    await applyMetadataFork(paseoHome, options.forkProviders ?? []);
    if (options.fakeOmpRuntime) {
      await writeFile(fakeOmpScenarioPath, "{}\n", "utf8");
      process.env.E2E_FAKE_OMP_SCENARIO_PATH = fakeOmpScenarioPath;
    }
    // Worker-scoped fixture config lets a spec exercise provider discovery without
    // reading the developer's provider state or sharing configuration with other specs.
    // See writeWorkerDaemonConfig for why fakeOmpRuntime implies an enabled omp.
    await writeWorkerDaemonConfig(paseoHome, options.daemonConfig, options.fakeOmpRuntime);
    if (options.injectPaseoTools) {
      await enablePaseoTools(paseoHome);
    }
    // The fake OMP runtime lives in a standalone daemon entry
    // (e2e/support/fake-omp-daemon.mts) that builds a daemon with an injected
    // DeterministicOmpRuntime. Nothing launched it: the worker always spawned
    // the real supervisor, so a spec asking for the fake got a real
    // OmpCliRuntime spawning a real omp binary, which exits 1 in a temp home
    // with no credentials. Every OMP e2e spec failed in setup.
    //
    // The entry asserts the port it is about to bind, so the port is reserved
    // here and passed down rather than being picked inside the spawn.
    const fakeOmpEntry = options.fakeOmpRuntime
      ? "../app/e2e/support/fake-omp-daemon.mts"
      : undefined;
    const reservedPort = options.fakeOmpRuntime ? await reserveE2EDaemonPort() : undefined;
    const daemon = await startIsolatedHostDaemon(serverId, {
      paseoHome,
      preserveHome,
      entryScript: fakeOmpEntry,
      port: reservedPort,
      environment: {
        NODE_ENV: "development",
        PATH: `${fakeEditorBin}${path.delimiter}${process.env.PATH ?? ""}`,
        PASEO_E2E_EDITOR_RECORD_PATH: editorRecordPath,
        // The fake entry reads its scenario from this path and refuses to
        // start without it (fake-omp-daemon.mts:33).
        ...(options.fakeOmpRuntime ? { E2E_FAKE_OMP_SCENARIO_PATH: fakeOmpScenarioPath } : {}),
        ...options.environment,
      },
    });
    process.env.E2E_SERVER_ID = daemon.serverId;
    // For the *test* process. The spawn env already told the daemon; specs
    // and helpers read this one to build daemon URLs, so both are needed.
    process.env.E2E_DAEMON_PORT = String(daemon.port);
    process.env.E2E_PASEO_HOME = daemon.paseoHome;
    process.env.E2E_EDITOR_RECORD_PATH = editorRecordPath;
    delete process.env.E2E_RELAY_PORT;
    delete process.env.E2E_RELAY_DAEMON_PUBLIC_KEY;

    console.log(
      `[e2e] Worker ${workerIndex} daemon started on port ${daemon.port}, home: ${daemon.paseoHome}`,
    );
    return {
      close: async () => {
        await daemon.close();
        await rm(fakeEditorBin, { recursive: true, force: true });
        console.log(`[e2e] Worker ${workerIndex} daemon stopped`);
      },
    };
  } catch (error) {
    await rm(fakeEditorBin, { recursive: true, force: true });
    if (!preserveHome) await rm(paseoHome, { recursive: true, force: true });
    throw error;
  }
}

/**
 * Write the worker's config.json, or do nothing when there is nothing to write.
 *
 * `fakeOmpRuntime` implies `agents.providers.omp.enabled`: the fake runtime is
 * useless if the daemon refuses to start an omp agent, and omp is disabled by
 * default. Without this the omp-desktop-ui suite failed at
 * `seedOmpAgentWorkspace` with "Provider 'omp' is disabled" before reaching a
 * single assertion.
 *
 * The base is read from disk, not just from `options.daemonConfig`.
 * `applyMetadataFork` has already run by this point and may have written a
 * config; merging only the caller's object would silently drop everything
 * the fork put there. An explicit `options.daemonConfig.agents.providers.omp`
 * still wins, so a spec can turn the provider back off.
 */
async function writeWorkerDaemonConfig(
  paseoHome: string,
  daemonConfig: Record<string, unknown> | undefined,
  fakeOmpRuntime: boolean | undefined,
): Promise<void> {
  if (!daemonConfig && !fakeOmpRuntime) return;
  const configPath = path.join(paseoHome, "config.json");
  const onDisk = existsSync(configPath)
    ? (JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>)
    : null;
  const base: Record<string, unknown> = { version: 1, ...onDisk, ...daemonConfig };
  if (!fakeOmpRuntime) {
    await writeFile(configPath, `${JSON.stringify(base, null, 2)}\n`);
    return;
  }
  const agents = (base.agents ?? {}) as Record<string, unknown>;
  const providers = (agents.providers ?? {}) as Record<string, unknown>;
  await writeFile(
    configPath,
    `${JSON.stringify(
      {
        ...base,
        agents: {
          ...agents,
          providers: {
            ...providers,
            omp: { ...(providers.omp as Record<string, unknown> | undefined), enabled: true },
          },
        },
      },
      null,
      2,
    )}\n`,
  );
}

async function enablePaseoTools(paseoHome: string): Promise<void> {
  const configPath = path.join(paseoHome, "config.json");
  const existing = existsSync(configPath)
    ? JSON.parse(await readFile(configPath, "utf8"))
    : { version: 1 };
  await writeFile(
    configPath,
    `${JSON.stringify(
      {
        ...existing,
        daemon: {
          ...existing.daemon,
          mcp: {
            ...existing.daemon?.mcp,
            enabled: true,
            injectIntoAgents: true,
          },
        },
      },
      null,
      2,
    )}\n`,
  );
}
