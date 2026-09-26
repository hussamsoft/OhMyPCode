import { expect, test, type Page } from "../support/fixtures";
import {
  configureFakeOmpScenario,
  focusByKeyboard,
  openOmpAgentRoute,
  seedOmpAgentWorkspace,
} from "../support/helpers/fake-omp";

const WIDE_VIEWPORT = { width: 1280, height: 900 };

async function focusByKeyboardName(page: Page, name: string, limit = 120): Promise<void> {
  for (let index = 0; index < limit; index += 1) {
    const activeName = await page.evaluate(
      () => document.activeElement?.getAttribute("aria-label") ?? null,
    );
    if (activeName === name) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Keyboard focus did not reach "${name}" within ${limit} tabs`);
}

async function openVibeTeam(page: Page): Promise<void> {
  const openTeam = page.getByRole("button", { name: /Open Vibe team/ });
  await expect(openTeam).toBeVisible();
  await openTeam.click();
  await expect(page.getByTestId("omp-vibe-panel")).toBeVisible();
}

async function spawnWorker(
  page: Page,
  input: { name: string; brief: string; tier: "Fast" | "Good" },
): Promise<void> {
  await page.getByTestId("omp-vibe-spawn-worker").click();
  await page.getByTestId("omp-vibe-worker-name").fill(input.name);
  if (input.tier === "Fast") {
    await page.getByRole("radio", { name: "Fast", exact: true }).click();
  }
  await page.getByTestId("omp-vibe-worker-brief").fill(input.brief);
  await page.getByTestId("omp-vibe-spawn-submit").click();
  await expect(page.getByTestId("omp-vibe-worker-name")).toHaveCount(0);
}

test.use({ e2eOmpRuntime: true, viewport: WIDE_VIEWPORT });

test.describe("OMP Vibe browser workflow", () => {
  test.beforeEach(() => {
    configureFakeOmpScenario({});
  });

  test("covers spawn, delivery outcomes, wait, kill, projected transcript, and toolset restore", async ({
    page,
  }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-vibe-lifecycle-",
      title: "OMP Vibe lifecycle",
    });
    try {
      const server = await openOmpAgentRoute(page, agent);
      await page.getByTestId("omp-tools-control").click();
      const initialTools = page.getByTestId("omp-tools-sheet");
      await initialTools.getByRole("switch", { name: "Write tool", exact: true }).click();
      await expect.poll(() => server.toolRequests()).toEqual([["read", "create_agent"]]);
      await expect(initialTools.getByRole("status")).toHaveText("2/4 tools");
      await page.keyboard.press("Escape");

      const vibe = page.getByRole("radio", { name: "Select OMP mode (Vibe)", exact: true });
      await vibe.focus();
      await vibe.press("Enter");
      await expect(page.getByTestId("omp-vibe-strip")).toBeVisible();
      await openVibeTeam(page);
      await spawnWorker(page, {
        name: "Fast scout",
        brief: "Inspect the desktop contract",
        tier: "Fast",
      });
      await expect(page.getByTestId("omp-vibe-worker-worker-1")).toContainText("Fast scout");
      await spawnWorker(page, {
        name: "Good reviewer",
        brief: "Review the restored toolset",
        tier: "Good",
      });
      await expect(page.getByTestId("omp-vibe-worker-worker-2")).toContainText("Good reviewer");

      await page.getByTestId("omp-vibe-worker-worker-1").click();
      const workerDetail = page
        .getByTestId("omp-vibe-worker-detail")
        .filter({ visible: true })
        .first();
      await expect(workerDetail).toContainText("Fast scout");
      await expect(page.getByTestId("omp-vibe-worker-transcript")).toContainText(
        "Fast scout accepted the brief",
      );

      await expect(page.getByTestId("omp-vibe-send-worker")).toBeEnabled();
      configureFakeOmpScenario({ deliveries: ["steered", "started", "queued"] });
      for (const [message, delivery] of [
        ["Steer now", "steered"],
        ["Start this", "started"],
        ["Queue this", "queued"],
      ] as const) {
        const workerMessage = workerDetail.getByTestId("omp-vibe-worker-message");
        const send = workerDetail.getByTestId("omp-vibe-send-message");
        await workerMessage.focus();
        await page.keyboard.insertText(message);
        await page.waitForTimeout(100);
        if (!(await send.isEnabled())) {
          await workerMessage.fill("");
          await page.keyboard.type(message);
        }
        await expect(workerMessage).toHaveValue(message);
        await expect(send).toBeEnabled();
        await send.click();
        await expect(workerDetail).toContainText(delivery);
      }

      await page.getByTestId("omp-vibe-wait").click();
      await expect(page.getByTestId("omp-vibe-worker-detail")).toContainText("Completed");
      await openVibeTeam(page);
      await expect(page.getByTestId("omp-vibe-worker-worker-1")).toContainText("Completed");
      await expect(page.getByTestId("omp-vibe-worker-worker-2")).toContainText("Completed");

      await page.getByTestId("omp-vibe-worker-worker-2").click();
      const worker2Detail = page
        .getByTestId("omp-vibe-worker-detail")
        .filter({ hasText: "Good reviewer" })
        .filter({ visible: true })
        .first();
      const killButton = worker2Detail.getByTestId("omp-vibe-kill-worker");
      let killDialogMessage = "";
      page.once("dialog", (dialog) => {
        killDialogMessage = dialog.message();
        void dialog.accept();
      });
      await killButton.click();
      expect(killDialogMessage).toContain("Kill Good reviewer?");
      await expect(worker2Detail).toContainText("Killed");
      await openVibeTeam(page);
      await expect(page.getByTestId("omp-vibe-worker-worker-2")).toContainText("Killed");

      const panel = page.getByTestId("omp-vibe-panel");
      await panel.getByTestId("omp-vibe-end").click();
      await expect(page.getByTestId("omp-vibe-strip")).toHaveCount(0);
      await expect(page.getByTestId("omp-mode-build")).toHaveAttribute("aria-checked", "true");
      await page.getByTestId("omp-tools-control").click();
      const restoredTools = page.getByTestId("omp-tools-sheet");
      await expect(restoredTools.getByRole("status")).toHaveText("2/4 tools");
      await expect(
        restoredTools.getByRole("switch", { name: "Read tool", exact: true }),
      ).toHaveAttribute("aria-checked", "true");
      await expect(
        restoredTools.getByRole("switch", { name: "Write tool", exact: true }),
      ).toHaveAttribute("aria-checked", "false");
    } finally {
      await agent.cleanup();
    }
  });

  test("operates Vibe entry and worker selection with only the keyboard", async ({ page }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-vibe-keyboard-",
      title: "OMP Vibe keyboard",
    });
    try {
      await openOmpAgentRoute(page, agent);
      await focusByKeyboard(page, "omp-mode-vibe");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("omp-mode-vibe")).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("omp-vibe-strip")).toBeVisible();

      await focusByKeyboardName(page, "Open Vibe team. 0 of 0 Vibe workers running");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("omp-vibe-panel")).toBeVisible();

      await focusByKeyboard(page, "omp-vibe-spawn-worker");
      await page.keyboard.press("Enter");
      await focusByKeyboardName(page, "Worker name");
      await page.keyboard.type("Keyboard worker");
      await focusByKeyboard(page, "omp-vibe-worker-brief");
      await page.keyboard.type("Prove keyboard operation");
      await focusByKeyboard(page, "omp-vibe-spawn-submit");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("omp-vibe-worker-worker-1")).toBeVisible();

      await focusByKeyboard(page, "omp-vibe-worker-worker-1");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("omp-vibe-worker-detail")).toContainText("Keyboard worker");
      await expect(page.getByTestId("omp-vibe-worker-transcript")).toContainText(
        "Keyboard worker accepted the brief",
      );
    } finally {
      await agent.cleanup();
    }
  });
});
