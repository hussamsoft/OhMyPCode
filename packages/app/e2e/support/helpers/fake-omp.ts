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
  await page.routeWebSocket(daemonWsRoutePattern(), (webSocket) => {
    const server = webSocket.connectToServer();
    webSocket.onMessage((message) => {
      const raw = typeof message === "string" ? message : message.toString("utf8");
      try {
        const envelope = JSON.parse(raw) as {
          message?: { type?: unknown; enabledTools?: unknown };
        };
        if (
          envelope.message?.type === "set_agent_tools_request" &&
          Array.isArray(envelope.message.enabledTools)
        ) {
          toolRequests.push(envelope.message.enabledTools.map(String));
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
            ompVibe: true,
            ompToolSelection: true,
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
  return { toolRequests: () => toolRequests.map((request) => request.slice()) };
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
