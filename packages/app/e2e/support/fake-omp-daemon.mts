import { readFileSync, writeFileSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import pino from "pino";
import { OmpAgentClient } from "../../../server/src/server/agent/providers/omp/agent.js";
import { FakeOmpSession } from "../../../server/src/server/agent/providers/omp/test-utils/fake-omp.js";
import {
  buildOmpLaunch,
  type OmpRuntime,
  type OmpRuntimeLaunch,
  type OmpStartSessionInput,
} from "../../../server/src/server/agent/providers/omp/runtime.js";
import type {
  OmpAgentMessage,
  OmpRuntimeEvent,
  OmpToolCatalogEntry,
  VibeEnterResult,
  VibeExitResult,
  VibeKillResult,
  VibeSendResult,
  VibeSpawnResult,
  VibeWaitResult,
} from "../../../server/src/server/agent/providers/omp/rpc-types.js";
import { createPaseoDaemon } from "../../../server/src/server/bootstrap.js";

interface FakeOmpScenario {
  deliveries?: Array<"steered" | "started" | "queued">;
  failNextEnter?: boolean;
  failNextToolUpdate?: boolean;
}

const scenarioPath = process.env.E2E_FAKE_OMP_SCENARIO_PATH ?? "";
if (!scenarioPath) {
  throw new Error("E2E_FAKE_OMP_SCENARIO_PATH is required by the fake OMP daemon fixture");
}

const toolCatalog: OmpToolCatalogEntry[] = [
  {
    name: "read",
    label: "Read",
    description: "Read files from the workspace",
    source: "native",
    enabled: true,
    required: false,
  },
  {
    name: "write",
    label: "Write",
    description: "Write files in the workspace",
    source: "native",
    enabled: true,
    required: false,
  },
  {
    name: "bash",
    label: "Shell",
    description: "Run shell commands",
    source: "native",
    enabled: false,
    required: false,
  },
  {
    name: "create_agent",
    label: "Create agent",
    description: "Create a collaborating agent",
    source: "paseo",
    enabled: true,
    required: true,
  },
];

function readScenario(): FakeOmpScenario {
  try {
    return JSON.parse(readFileSync(scenarioPath, "utf8")) as FakeOmpScenario;
  } catch {
    return {};
  }
}

function writeScenario(scenario: FakeOmpScenario): void {
  writeFileSync(scenarioPath, `${JSON.stringify(scenario, null, 2)}\n`, "utf8");
}

function consumeFlag(name: "failNextEnter" | "failNextToolUpdate"): boolean {
  const scenario = readScenario();
  const value = scenario[name] === true;
  if (value) {
    delete scenario[name];
    writeScenario(scenario);
  }
  return value;
}

function consumeDelivery(): "steered" | "started" | "queued" {
  const scenario = readScenario();
  const delivery = scenario.deliveries?.shift();
  if (delivery) writeScenario(scenario);
  return delivery ?? "queued";
}

class DeterministicOmpSession extends FakeOmpSession {
  private nextWorkerId = 1;
  private toolsetBeforeVibe: string[] | null = null;

  constructor(launch: OmpRuntimeLaunch) {
    super(launch);
    this.models = [
      {
        provider: "fixture",
        id: "fixture-model",
        name: "Fixture Model",
        reasoning: true,
        thinking: { defaultLevel: "medium", efforts: ["low", "medium", "high"] },
        contextWindow: 128_000,
        maxTokens: 16_384,
      },
    ];
    this.toolCatalog = structuredClone(toolCatalog);
    this.state = {
      ...this.state,
      model: this.models[0],
    };
  }

  override async enterVibe(prompt?: string): Promise<VibeEnterResult> {
    this.vibeRequests.push({ type: "vibe_enter", ...(prompt === undefined ? {} : { prompt }) });
    if (consumeFlag("failNextEnter")) {
      throw new Error("Fixture Vibe entry failed");
    }
    this.toolsetBeforeVibe ??= this.toolCatalog
      .filter((tool) => tool.enabled)
      .map((tool) => tool.name);
    this.vibeState = {
      ...this.vibeState,
      revision: this.vibeState.revision + 1,
      enabled: true,
    };
    return { enabled: true, accepted: prompt !== undefined };
  }

  override async exitVibe(): Promise<VibeExitResult> {
    this.vibeRequests.push({ type: "vibe_exit" });
    if (this.toolsetBeforeVibe) {
      const selected = new Set(this.toolsetBeforeVibe);
      this.toolCatalog = this.toolCatalog.map((tool) => ({
        ...tool,
        enabled: tool.required || selected.has(tool.name),
      }));
      this.toolsetBeforeVibe = null;
    }
    const killedWorkers = this.vibeState.workers.filter((worker) => worker.state !== "dead").length;
    this.vibeState = {
      ...this.vibeState,
      revision: this.vibeState.revision + 1,
      enabled: false,
      workers: [],
    };
    return { enabled: false, killedWorkers };
  }

  override async spawnVibeWorker(input: {
    cli: "fast" | "good";
    name?: string;
    prompt: string;
  }): Promise<VibeSpawnResult> {
    const id = `worker-${this.nextWorkerId++}`;
    const name = input.name ?? `Worker ${id}`;
    this.vibeRequests.push({ type: "vibe_spawn", ...input });
    const worker = {
      id,
      cli: input.cli,
      name,
      state: "running" as const,
      turnCount: 1,
      queuedMessages: 0,
      resolvedModel: "fixture-model",
      lastActivity: input.prompt,
      outputTail: [`${name} accepted the brief`],
      lastTurnStatus: "running" as const,
      createdAt: 1,
      lastActivityAt: 1,
    };
    this.vibeState = {
      ...this.vibeState,
      revision: this.vibeState.revision + 1,
      workers: [...this.vibeState.workers, worker],
    };
    this.emitWorkerEvent(id, name, input.prompt, "running");
    this.emit({
      type: "subagent_progress",
      payload: {
        index: this.vibeState.workers.length - 1,
        agent: input.cli,
        task: input.prompt,
        progress: { id, status: "running", description: input.prompt },
        sessionFile: `${id}.jsonl`,
      },
    });
    const messages: OmpAgentMessage[] = [
      { role: "user", content: input.prompt },
      {
        role: "assistant",
        content: [{ type: "text", text: `${name} completed the projected brief` }],
        responseId: `${id}-assistant-1`,
      },
    ];
    for (const message of messages) {
      this.emit({ type: "subagent_event", payload: { id, event: { type: "message_end", message } } });
    }
    return worker;
  }

  override async sendVibeWorkerMessage(session: string, message: string): Promise<VibeSendResult> {
    this.vibeRequests.push({ type: "vibe_send", session, message });
    return { delivery: consumeDelivery() };
  }

  override async waitForVibeWorkers(
    sessions?: string[],
    timeoutMs?: number,
  ): Promise<VibeWaitResult> {
    this.vibeRequests.push({
      type: "vibe_wait",
      ...(sessions === undefined ? {} : { sessions }),
      ...(timeoutMs === undefined ? {} : { timeoutMs }),
    });
    const selected = new Set(sessions ?? this.vibeState.workers.map((worker) => worker.id));
    const settled = this.vibeState.workers
      .filter((worker) => selected.has(worker.id) && worker.state !== "dead")
      .map((worker) => ({ id: worker.id, jobId: `${worker.id}-turn`, status: "completed" as const, resultText: "Fixture worker settled" }));
    this.vibeState = {
      ...this.vibeState,
      revision: this.vibeState.revision + 1,
      workers: this.vibeState.workers.map((worker) =>
        selected.has(worker.id) && worker.state !== "dead"
          ? {
              ...worker,
              state: "idle" as const,
              lastTurnStatus: "completed" as const,
              lastActivity: "Fixture worker settled",
            }
          : worker,
      ),
    };
    return { settled, stillRunning: [], timedOut: false };
  }

  override async killVibeWorker(session: string): Promise<VibeKillResult> {
    const worker = await super.killVibeWorker(session);
    this.vibeState = { ...this.vibeState, revision: this.vibeState.revision + 1 };
    this.emit({
      type: "subagent_progress",
      payload: {
        index: 0,
        agent: worker.cli,
        task: "Fixture worker",
        progress: { id: worker.id, status: "aborted" },
        sessionFile: `${worker.id}.jsonl`,
      },
    });
    return worker;
  }

  override async setTools(enabledTools: string[]): Promise<OmpToolCatalogEntry[]> {
    if (consumeFlag("failNextToolUpdate")) {
      throw new Error("Fixture tool update failed");
    }
    return await super.setTools(enabledTools);
  }

  private emitWorkerEvent(id: string, name: string, prompt: string, status: "running" | "aborted"): void {
    const event: OmpRuntimeEvent =
      status === "running"
        ? {
            type: "subagent_lifecycle",
            payload: { id, index: 0, agent: name, status: "started", description: prompt },
          }
        : {
            type: "subagent_lifecycle",
            payload: { id, index: 0, agent: name, status: "aborted" },
          };
    this.emit(event);
  }
}

class DeterministicOmpRuntime implements OmpRuntime {
  async startSession(input: OmpStartSessionInput): Promise<DeterministicOmpSession> {
    return new DeterministicOmpSession(
      buildOmpLaunch({
        command: ["omp"],
        session: input,
      }),
    );
  }
}

async function main(): Promise<void> {
  writeScenario({});
  const reservedPortText = process.env.E2E_FAKE_OMP_DAEMON_PORT ?? "";
  const reservedPort = Number(reservedPortText);
  const expectedListen = `127.0.0.1:${reservedPortText}`;
  if (!/^\d+$/.test(reservedPortText) || reservedPort <= 0) {
    throw new Error(`Fake OMP daemon requires a concrete reserved port, received ${reservedPortText}`);
  }
  if (
    process.env.E2E_DAEMON_PORT !== reservedPortText ||
    process.env.PASEO_LISTEN !== expectedListen
  ) {
    throw new Error(
      `Fake OMP daemon port environment mismatch: E2E_DAEMON_PORT=${process.env.E2E_DAEMON_PORT}, PASEO_LISTEN=${process.env.PASEO_LISTEN}`,
    );
  }
  const metroPort = process.env.E2E_METRO_PORT ?? "";
  if (!/^\d+$/.test(metroPort)) {
    throw new Error(`Fake OMP daemon requires a concrete Metro port, received ${metroPort}`);
  }
  const paseoHome = process.env.OHMYPCODE_HOME ?? "";
  if (!paseoHome) throw new Error("OHMYPCODE_HOME is required by the fake OMP daemon fixture");
  await mkdir(paseoHome, { recursive: true });
  const staticDir = await mkdtemp(path.join(tmpdir(), "paseo-fake-omp-static-"));
  const logger = pino({ level: "silent" });
  const daemon = await createPaseoDaemon(
    {
      listen: expectedListen,
      paseoHome,
      corsAllowedOrigins: [`http://localhost:${metroPort}`],
      hostnames: true,
      mcpEnabled: false,
      mcpDebug: false,
      staticDir,
      isDev: true,
      desktopManaged: true,
      agentClients: {
        omp: new OmpAgentClient({ logger, runtime: new DeterministicOmpRuntime() }),
      },
      providerOverrides: { omp: { enabled: true } },
      agentStoragePath: path.join(paseoHome, "agents"),
      relayEnabled: false,
      relayEndpoint: "127.0.0.1:9",
      appBaseUrl: "https://app.paseo.sh",
      trustedProxies: [],
    },
    logger,
  );
  try {
    await daemon.start();
  } catch (error) {
    await daemon.stop().catch(() => undefined);
    await rm(staticDir, { recursive: true, force: true });
    throw error;
  }
  const boundTarget = daemon.getListenTarget();
  if (boundTarget?.type !== "tcp" || boundTarget.port !== reservedPort) {
    await daemon.stop().catch(() => undefined);
    await rm(staticDir, { recursive: true, force: true });
    throw new Error(`Fake OMP daemon did not bind reserved port ${reservedPortText}`);
  }

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await daemon.stop().catch(() => undefined);
    await daemon.agentManager.flush().catch(() => undefined);
    await rm(staticDir, { recursive: true, force: true });
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

void main().catch((error: unknown) => {
  console.error(error, error instanceof Error ? error.cause : null);
  process.exit(1);
});
