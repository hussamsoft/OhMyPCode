import { writeFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";
import { daemonWsRoutePattern } from "./daemon-port";
import { openAgentRoute } from "./mock-agent";
import { seedWorkspace, type SeedDaemonClient } from "./seed-client";

export interface FakeOmpScenario {
  deliveries?: Array<"steered" | "started" | "queued">;
  failNextEnter?: boolean;
  failNextToolUpdate?: boolean;
}

export interface OmpAgentWorkspace {
  agentId: string;
  workspaceId: string;
  cwd: string;
  client: SeedDaemonClient;
  cleanup(): Promise<void>;
}

export interface OmpServerFixture {
  toolRequests(): string[][];
  /** Commands the composer dispatched to the fork's `bash` RPC, in order. */
  bashRequests(): Array<{ command: string; excludeFromContext: boolean }>;
  /** Code the composer dispatched to the fork's `python` RPC, in order. */
  pythonRequests(): Array<{ code: string; excludeFromContext: boolean }>;
  /** Text of every message sent down the ordinary prompt path, in order. */
  messageRequests(): string[];
  /** Every OMP setting write, in order -- the proof a control is not decorative. */
  settingWrites(): Array<{ path: string; value: unknown }>;
}

export function configureFakeOmpScenario(scenario: FakeOmpScenario): void {
  const scenarioPath = process.env.E2E_FAKE_OMP_SCENARIO_PATH;
  if (!scenarioPath) {
    throw new Error("E2E_FAKE_OMP_SCENARIO_PATH is not configured for the OMP browser fixture");
  }
  writeFileSync(scenarioPath, `${JSON.stringify(scenario, null, 2)}\n`, "utf8");
}

export async function seedOmpAgentWorkspace(options: {
  repoPrefix: string;
  title: string;
}): Promise<OmpAgentWorkspace> {
  const workspace = await seedWorkspace({
    repoPrefix: options.repoPrefix,
    title: options.title,
  });
  try {
    const agent = await workspace.client.createAgent({
      provider: "omp",
      cwd: workspace.repoPath,
      workspaceId: workspace.workspaceId,
      title: options.title,
      modeId: "full",
      model: "fixture-model",
    });
    return {
      agentId: agent.id,
      workspaceId: workspace.workspaceId,
      cwd: workspace.repoPath,
      client: workspace.client,
      cleanup: workspace.cleanup,
    };
  } catch (error) {
    await workspace.cleanup();
    throw error;
  }
}

export async function installOmpServerCapabilities(page: Page): Promise<OmpServerFixture> {
  const toolRequests: string[][] = [];
  const bashRequests: Array<{ command: string; excludeFromContext: boolean }> = [];
  const pythonRequests: Array<{ code: string; excludeFromContext: boolean }> = [];
  const messageRequests: string[] = [];
  const settingWrites: Array<{ path: string; value: unknown }> = [];
  await page.routeWebSocket(daemonWsRoutePattern(), (webSocket) => {
    const server = webSocket.connectToServer();
    webSocket.onMessage((message) => {
      const raw = typeof message === "string" ? message : message.toString("utf8");
      try {
        const envelope = JSON.parse(raw) as {
          message?: {
            type?: unknown;
            enabledTools?: unknown;
            command?: unknown;
            code?: unknown;
            excludeFromContext?: unknown;
            path?: unknown;
            value?: unknown;
            text?: unknown;
          };
        };
        if (
          envelope.message?.type === "set_agent_tools_request" &&
          Array.isArray(envelope.message.enabledTools)
        ) {
          toolRequests.push(envelope.message.enabledTools.map(String));
        }
        if (
          envelope.message?.type === "omp.bash.request" &&
          typeof envelope.message.command === "string"
        ) {
          bashRequests.push({
            command: envelope.message.command,
            excludeFromContext: envelope.message.excludeFromContext === true,
          });
        }
        if (
          envelope.message?.type === "omp.python.request" &&
          typeof envelope.message.code === "string"
        ) {
          pythonRequests.push({
            code: envelope.message.code,
            excludeFromContext: envelope.message.excludeFromContext === true,
          });
        }
        if (
          envelope.message?.type === "omp.settings.set.request" &&
          typeof envelope.message.path === "string"
        ) {
          settingWrites.push({ path: envelope.message.path, value: envelope.message.value });
        }
        if (
          envelope.message?.type === "send_agent_message_request" &&
          typeof envelope.message.text === "string"
        ) {
          messageRequests.push(envelope.message.text);
        }
      } catch {
        // Non-JSON frames pass through unchanged.
      }
      server.send(message);
    });
    server.onMessage((message) => {
      const raw = typeof message === "string" ? message : message.toString("utf8");
      try {
        const envelope = JSON.parse(raw) as {
          type?: unknown;
          message?: {
            type?: unknown;
            payload?: { status?: unknown; features?: Record<string, unknown> };
          };
        };
        const payload = envelope.message?.payload;
        if (
          envelope.type === "session" &&
          envelope.message?.type === "status" &&
          payload?.status === "server_info"
        ) {
          payload.features = {
            ...payload.features,
            // Mirror every OMP capability the real server advertises under
            // `ompRuntimeAvailable` (websocket-server.ts). A partial list is not
            // a stricter fixture, it is a broken one: a control gated on a
            // missing capability throws, and the test sees a control that
            // renders correctly and does nothing.
            ompCollab: true,
            ompVibe: true,
            ompToolSelection: true,
            ompSlashCommands: true,
            ompBash: true,
            ompPython: true,
            ompSettings: true,
            ompModes: true,
            ompKeybindings: true,
            ompAgentCatalog: true,
          };
          webSocket.send(JSON.stringify(envelope));
          return;
        }
      } catch {
        // Non-JSON frames pass through unchanged.
      }
      webSocket.send(message);
    });
  });
  return {
    toolRequests: () => toolRequests.map((request) => request.slice()),
    bashRequests: () => bashRequests.map((request) => ({ ...request })),
    pythonRequests: () => pythonRequests.map((request) => ({ ...request })),
    messageRequests: () => messageRequests.slice(),
    settingWrites: () => settingWrites.map((write) => ({ ...write })),
  };
}

export async function openOmpAgentRoute(
  page: Page,
  agent: OmpAgentWorkspace,
): Promise<OmpServerFixture> {
  const fixture = await installOmpServerCapabilities(page);
  await openAgentRoute(page, { workspaceId: agent.workspaceId, agentId: agent.agentId });
  await page.getByTestId("omp-control-deck").filter({ visible: true }).waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await expect(page.getByTestId("omp-mode-vibe")).toBeEnabled();
  await expect(page.getByTestId("omp-tools-control")).toBeEnabled();
  return fixture;
}

export async function focusByKeyboard(page: Page, testId: string, limit = 120): Promise<void> {
  for (let index = 0; index < limit; index += 1) {
    const activeTestId = await page.evaluate(
      () => document.activeElement?.getAttribute("data-testid") ?? null,
    );
    if (activeTestId === testId) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Keyboard focus did not reach [data-testid="${testId}"] within ${limit} tabs`);
}
