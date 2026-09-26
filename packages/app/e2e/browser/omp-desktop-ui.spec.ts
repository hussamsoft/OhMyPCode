import { expect, test, type Page } from "../support/fixtures";
import {
  configureFakeOmpScenario,
  focusByKeyboard,
  openOmpAgentRoute,
  seedOmpAgentWorkspace,
} from "../support/helpers/fake-omp";

const WIDE_VIEWPORT = { width: 1280, height: 900 };
const HALF_WIDTH_VIEWPORT = { width: 900, height: 700 };
const COMPACT_VIEWPORT = { width: 390, height: 844 };

// Keep the visual contract strict while allowing only small font/antialias rasterization drift.
const VISUAL_SCREENSHOT_OPTIONS = {
  animations: "disabled" as const,
  caret: "hide" as const,
  maxDiffPixels: 32,
};
async function setOmpTheme(page: Page, theme: "ohMyPCode" | "light"): Promise<void> {
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem("@ohmypcode:app-settings", JSON.stringify({ theme: selectedTheme }));
  }, theme);
}

async function stabilizeVisualFixture(page: Page, projectLabel: string): Promise<void> {
  await page.addStyleTag({
    content: `
      [data-testid^="sidebar-workspace-row-"] > *:not([data-testid="workspace-row-title"]),
      [data-testid="workspace-header-subtitle"],
      [data-testid^="sidebar-row-project-icon-"],
      [data-testid^="worktree-setup-callout-"],
      [data-testid^="omp-vibe-worker-worker-"] {
        display: none !important;
      }
    `,
  });
  await page.evaluate((label) => {
    const headerTitle = document.querySelector('[data-testid="workspace-header-title"]');
    if (headerTitle) headerTitle.textContent = label;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim() ?? "";
      if (text.startsWith("omp-visual-") && text !== label) {
        const element = node.parentElement;
        if (element) element.style.visibility = "hidden";
      }
    }
  }, projectLabel);
}

async function enterVibe(page: Page): Promise<void> {
  await focusByKeyboard(page, "omp-mode-vibe");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("omp-vibe-strip")).toBeVisible();
}

async function openVibeTeam(page: Page): Promise<void> {
  const openTeam = page.getByRole("button", { name: /Open Vibe team/ });
  await expect(openTeam).toBeVisible();
  await openTeam.click();
  await expect(page.getByTestId("omp-vibe-panel")).toBeVisible();
}

async function spawnScreenshotWorker(page: Page): Promise<void> {
  await page.getByTestId("omp-vibe-spawn-worker").click();
  await page.getByTestId("omp-vibe-worker-name").fill("Fast scout");
  await page.getByRole("radio", { name: "Fast", exact: true }).click();
  await page.getByTestId("omp-vibe-worker-brief").fill("Inspect the desktop contract");
  await page.getByTestId("omp-vibe-spawn-submit").click();
  await expect(page.getByTestId("omp-vibe-worker-worker-1")).toBeAttached();
}

async function withOmpVisualWorkspace(
  page: Page,
  input: {
    repoPrefix: string;
    title: string;
    projectLabel: string;
    theme: "ohMyPCode" | "light";
    setup?: () => Promise<void>;
    capture: () => Promise<void>;
  },
): Promise<void> {
  const agent = await seedOmpAgentWorkspace({
    repoPrefix: input.repoPrefix,
    title: input.title,
  });
  try {
    await setOmpTheme(page, input.theme);
    await openOmpAgentRoute(page, agent);
    await stabilizeVisualFixture(page, input.projectLabel);
    await expect(page.getByTestId("workspace-header-title")).toHaveText(input.projectLabel);
    await input.setup?.();
    await input.capture();
  } finally {
    await agent.cleanup();
  }
}

test.use({ e2eOmpRuntime: true, viewport: WIDE_VIEWPORT });

test.describe("OMP desktop control deck", () => {
  test.beforeEach(() => {
    configureFakeOmpScenario({});
  });

  test("selects Build and Vibe and rolls a failed entry back to Build", async ({ page }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-mode-rollback-",
      title: "OMP mode rollback",
    });
    try {
      await openOmpAgentRoute(page, agent);
      const build = page.getByRole("radio", { name: "Select OMP mode (Build)", exact: true });
      const vibe = page.getByRole("radio", { name: "Select OMP mode (Vibe)", exact: true });
      await expect(build).toHaveAttribute("aria-checked", "true");
      await expect(vibe).toHaveAttribute("aria-checked", "false");

      configureFakeOmpScenario({ failNextEnter: true });
      await vibe.focus();
      await vibe.press("Enter");
      await expect(
        page.getByRole("alert").filter({ hasText: "Fixture Vibe entry failed" }),
      ).toBeVisible();
      await expect(build).toHaveAttribute("aria-checked", "true");
      await expect(vibe).toHaveAttribute("aria-checked", "false");
      await expect(page.getByTestId("omp-vibe-strip")).toHaveCount(0);

      await vibe.focus();
      await vibe.press("Enter");
      await expect(vibe).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("omp-vibe-strip")).toHaveCount(1);
      await expect(page.getByTestId("omp-vibe-strip")).toContainText("0/0");
    } finally {
      await agent.cleanup();
    }
  });

  test("updates the tool count atomically on success and rolls back a failed toggle", async ({
    page,
  }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-tools-atomic-",
      title: "OMP tools atomic",
    });
    try {
      const server = await openOmpAgentRoute(page, agent);
      await page.getByTestId("omp-tools-control").click();
      const sheet = page.getByTestId("omp-tools-sheet");
      const count = sheet.getByRole("status");
      const read = sheet.getByRole("switch", { name: "Read tool", exact: true });
      const shell = sheet.getByRole("switch", { name: "Shell tool", exact: true });
      const required = sheet.getByRole("switch", { name: "Create agent tool", exact: true });
      await expect(sheet).toBeVisible();
      await expect(count).toHaveText("3/4 tools");
      await expect(required).toHaveAttribute("aria-checked", "true");
      await expect(required).toHaveAttribute("aria-disabled", "true");

      await read.click();
      await expect(count).toHaveText("2/4 tools");
      await expect.poll(() => server.toolRequests()).toEqual([["write", "create_agent"]]);
      await expect(read).toHaveAttribute("aria-checked", "false");

      configureFakeOmpScenario({ failNextToolUpdate: true });
      await shell.click();
      await expect(sheet.getByRole("alert")).toContainText("Fixture tool update failed");
      await expect
        .poll(() => server.toolRequests())
        .toEqual([
          ["write", "create_agent"],
          ["write", "bash", "create_agent"],
        ]);
      await expect(count).toHaveText("2/4 tools");
      await expect(shell).toHaveAttribute("aria-checked", "false");
      await expect(read).toHaveAttribute("aria-checked", "false");
    } finally {
      await agent.cleanup();
    }
  });

  test("marks Access as launch-only and keeps the deck usable in compact layout", async ({
    page,
  }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-compact-access-",
      title: "OMP compact access",
    });
    try {
      await openOmpAgentRoute(page, agent);
      const access = page.getByTestId("access-control");
      await expect(access).toHaveAccessibleName("Select access level (Full access)");
      await expect(access).toContainText("Full access");
      await access.hover();
      await expect(page.getByText("Starts new session", { exact: true })).toBeVisible();
      await expect(page.getByTestId("omp-tools-control")).toHaveAccessibleName(
        "Open OMP tools. 3/4 tools",
      );

      await page.setViewportSize(COMPACT_VIEWPORT);
      await expect(page.getByTestId("omp-control-deck")).toBeHidden();
      const compactModelSelector = page
        .getByTestId("combined-model-selector")
        .filter({ visible: true });
      await expect(compactModelSelector).toBeVisible();
      await compactModelSelector.click();
      const compactSheet = page.getByTestId("agent-controls-model-sheet");
      await expect(compactSheet).toBeVisible();
      const compactAccess = page.getByTestId("access-control").filter({ visible: true });
      await expect(compactAccess).toHaveCount(1);
      await expect(compactAccess).toHaveAccessibleName("Select access level (Full access)");
      await expect(compactAccess).toContainText("Full access");
      await expect(
        page.getByTestId("workspace-explorer-sidebar").filter({ visible: true }),
      ).toHaveCount(0);
    } finally {
      await agent.cleanup();
    }
  });

  test("captures the approved OMP desktop visual baselines", async ({ page }) => {
    await withOmpVisualWorkspace(page, {
      repoPrefix: "omp-visual-dark-",
      title: "OMP workspace dark",
      projectLabel: "omp-visual-dark",
      theme: "ohMyPCode",
      capture: async () => {
        await expect(page).toHaveScreenshot("omp-workspace-dark.png", {
          ...VISUAL_SCREENSHOT_OPTIONS,
          fullPage: true,
        });
      },
    });

    await withOmpVisualWorkspace(page, {
      repoPrefix: "omp-visual-light-",
      projectLabel: "omp-visual-light",
      title: "OMP workspace light",
      theme: "light",
      capture: async () => {
        await expect(page).toHaveScreenshot("omp-workspace-light.png", {
          ...VISUAL_SCREENSHOT_OPTIONS,
          fullPage: true,
        });
      },
    });

    await withOmpVisualWorkspace(page, {
      repoPrefix: "omp-visual-vibe-",
      projectLabel: "omp-visual-vibe",
      title: "OMP Vibe visual",
      theme: "ohMyPCode",
      setup: async () => {
        await enterVibe(page);
        await openVibeTeam(page);
        await spawnScreenshotWorker(page);
      },
      capture: async () => {
        await expect(page).toHaveScreenshot("omp-vibe-panel-dark.png", {
          ...VISUAL_SCREENSHOT_OPTIONS,
          fullPage: true,
        });
      },
    });

    await withOmpVisualWorkspace(page, {
      repoPrefix: "omp-visual-half-width-",
      projectLabel: "omp-visual-half-width",
      title: "OMP half width",
      theme: "ohMyPCode",
      setup: async () => {
        await page.setViewportSize(HALF_WIDTH_VIEWPORT);
        await expect(page.getByTestId("workspace-header-title")).toHaveText(
          "omp-visual-half-width",
        );
      },
      capture: async () => {
        await expect(page).toHaveScreenshot("omp-half-width.png", {
          ...VISUAL_SCREENSHOT_OPTIONS,
          fullPage: true,
        });
      },
    });
  });
});
