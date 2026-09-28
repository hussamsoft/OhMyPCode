import { spawn, execFileSync, type ChildProcess, type SpawnOptions } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { withDisabledE2ESpeechEnv } from "./speech-env";
import { killProcessTree, spawnTsx } from "./spawn-node";

export interface IsolatedHostDaemon {
  serverId: string;
  port: number;
  paseoHome: string;
  getPid(): number | undefined;
  restart(): Promise<void>;
  close(): Promise<void>;
}

export interface IsolatedHostDaemonOptions {
  environment?: NodeJS.ProcessEnv;
  mutableRelay?: {
    enabled: boolean;
    endpoint?: string;
  };
  paseoHome?: string;
  preserveHome?: boolean;
  publishedVersion?: string;
  /**
   * Reserve this port instead of picking one. A fixture entry that has to know
   * the port before it starts (the fake OMP daemon asserts on
   * `E2E_FAKE_OMP_DAEMON_PORT` matching the listen address) cannot be handed a
   * port chosen inside the spawn, so the caller reserves it first and passes
   * it in.
   */
  port?: number;
  /**
   * Replace the daemon entry point, for fixtures that need a daemon built
   * from injected components rather than the real runtime. Resolved by tsx
   * against `serverDir`. Only available in the unpublished path: a published
   * build has no sources to run, so asking for one there is a configuration
   * error rather than something to ignore.
   */
  entryScript?: string;
}

async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Failed to acquire an isolated daemon port")));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForServer(port: number, child: ChildProcess): Promise<void> {
  const deadline = Date.now() + 90_000;
  let lastError: unknown = null;

  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Isolated host daemon exited before listening (code ${String(child.exitCode)}, signal ${String(child.signalCode)})`,
      );
    }
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(port, "127.0.0.1", () => {
          socket.end();
          resolve();
        });
        socket.setTimeout(1_000, () => {
          socket.destroy();
          reject(new Error(`Connection timed out to isolated daemon port ${port}`));
        });
        socket.on("error", reject);
      });
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(
    `Isolated host daemon did not listen on ${port}: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

/**
 * The port an isolated daemon should bind.
 *
 * A caller may reserve one — a fixture entry that asserts the port it is about
 * to bind cannot be handed a port chosen inside the spawn. Otherwise one is
 * picked, skipping the ports that must stay free (6767/6768 belong to the real
 * app and its dev daemon, and E2E_DAEMON_PORT belongs to the primary worker).
 */
async function resolveDaemonPort(reserved: number | undefined): Promise<number> {
  const primaryPort = Number(process.env.E2E_DAEMON_PORT ?? 0);
  const isReserved = (port: number) => port === 6767 || port === 6768 || port === primaryPort;
  if (reserved !== undefined) {
    if (isReserved(reserved)) {
      throw new Error(`Reserved e2e daemon port ${reserved} must stay free`);
    }
    return reserved;
  }
  let port = await getAvailablePort();
  while (isReserved(port)) port = await getAvailablePort();
  return port;
}

export async function startIsolatedHostDaemon(
  serverId: string,
  options: IsolatedHostDaemonOptions = {},
): Promise<IsolatedHostDaemon> {
  const port = await resolveDaemonPort(options.port);

  const metroPort = process.env.E2E_METRO_PORT;
  if (!metroPort) throw new Error("E2E_METRO_PORT is required to start an isolated host daemon");

  const paseoHome =
    options.paseoHome ?? (await mkdtemp(path.join(tmpdir(), "paseo-e2e-secondary-host-")));
  let publishedPackageRoot: string | null = null;
  if (options.publishedVersion) {
    publishedPackageRoot = await mkdtemp(path.join(tmpdir(), "paseo-e2e-published-server-"));
    await writeFile(
      path.join(publishedPackageRoot, "package.json"),
      `${JSON.stringify({ private: true })}\n`,
    );
    try {
      const npmCli = process.env.npm_execpath;
      if (!npmCli || path.basename(npmCli).toLowerCase() !== "npm-cli.js") {
        throw new Error(
          "Published-version E2E requires npm_execpath from npm. Start it through `npm run test:e2e`.",
        );
      }
      execFileSync(
        process.execPath,
        [
          npmCli,
          "install",
          "--no-audit",
          "--no-fund",
          "--no-package-lock",
          `@ohmypcode/server@${options.publishedVersion}`,
        ],
        { cwd: publishedPackageRoot, stdio: "ignore" },
      );
    } catch (error) {
      if (!options.preserveHome) {
        await rm(paseoHome, { recursive: true, force: true });
      }
      await rm(publishedPackageRoot, { recursive: true, force: true });
      throw error;
    }
  }
  if (options.mutableRelay) {
    const endpoint =
      options.mutableRelay.endpoint ??
      (process.env.E2E_RELAY_PORT ? `127.0.0.1:${process.env.E2E_RELAY_PORT}` : "127.0.0.1:9");
    await writeFile(
      path.join(paseoHome, "config.json"),
      `${JSON.stringify({
        version: 1,
        daemon: {
          relay: {
            enabled: options.mutableRelay.enabled,
            endpoint,
            publicEndpoint: endpoint,
            useTls: false,
            publicUseTls: false,
          },
        },
      })}\n`,
    );
  }
  const serverDir = publishedPackageRoot
    ? path.join(publishedPackageRoot, "node_modules", "@ohmypcode", "server")
    : path.resolve(__dirname, "../../../../server");
  const spawnDaemon = async (): Promise<ChildProcess> => {
    const spawnOptions: SpawnOptions = {
      cwd: serverDir,
      env: withDisabledE2ESpeechEnv({
        ...process.env,
        ...options.environment,
        PASEO_HOME: paseoHome,
        // The OhMyPCode name for the same directory. `resolvePaseoHome` reads
        // OHMYPCODE_HOME first, so a fixture entry resolving its home through
        // the modern name was getting only the legacy one — and the fake OMP
        // daemon refuses to start without it.
        OHMYPCODE_HOME: paseoHome,
        PASEO_SERVER_ID: serverId,
        PASEO_LISTEN: `127.0.0.1:${port}`,
        PASEO_CORS_ORIGINS: `http://localhost:${metroPort}`,
        PASEO_RELAY_ENABLED: options.mutableRelay ? undefined : "0",
        PASEO_NODE_ENV: "development",
        NODE_ENV: "development",
        // A fixture entry asserts the port it is about to bind, so it has to
        // be told before the spawn, not learned from it afterwards.
        E2E_DAEMON_PORT: String(port),
        ...(options.entryScript ? { E2E_FAKE_OMP_DAEMON_PORT: String(port) } : {}),
      }),
      stdio: ["ignore", "ignore", "pipe"],
      detached: false,
    };
    if (publishedPackageRoot && options.entryScript) {
      throw new Error(
        `entryScript (${options.entryScript}) cannot be used with a published build; ` +
          "fixture daemon entries only exist as sources in the repo.",
      );
    }
    const child = publishedPackageRoot
      ? spawn(process.execPath, ["dist/scripts/supervisor-entrypoint.js"], spawnOptions)
      : spawnTsx(
          options.entryScript ?? "scripts/supervisor-entrypoint.ts",
          ["--dev"],
          spawnOptions,
        );

    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
      stderr = stderr.split("\n").slice(-40).join("\n");
    });

    try {
      await waitForServer(port, child);
      return child;
    } catch (error) {
      await killProcessTree(child);
      throw new Error(
        `${error instanceof Error ? error.message : String(error)}\nDaemon stderr:\n${stderr}`,
        { cause: error },
      );
    }
  };

  let child: ChildProcess;
  try {
    child = await spawnDaemon();
  } catch (error) {
    if (!options.preserveHome) {
      await rm(paseoHome, { recursive: true, force: true });
    }
    if (publishedPackageRoot) {
      await rm(publishedPackageRoot, { recursive: true, force: true });
    }
    throw error;
  }
  let closed = false;

  return {
    serverId,
    port,
    paseoHome,
    getPid: () => child.pid,
    restart: async () => {
      if (closed) throw new Error(`Cannot restart closed isolated daemon ${serverId}`);
      await killProcessTree(child);
      child = await spawnDaemon();
    },
    close: async () => {
      if (closed) return;
      closed = true;
      await killProcessTree(child);
      if (!options.preserveHome) {
        await rm(paseoHome, { recursive: true, force: true });
      }
      if (publishedPackageRoot) {
        await rm(publishedPackageRoot, { recursive: true, force: true });
      }
    },
  };
}
