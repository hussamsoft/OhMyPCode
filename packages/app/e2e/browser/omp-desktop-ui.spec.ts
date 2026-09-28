import { expect, test, type Page } from "../support/fixtures";
import {
  configureFakeOmpScenario,
  focusByKeyboard,
  openOmpAgentRoute,
  seedOmpAgentWorkspace,
} from "../support/helpers/fake-omp";
import { dropFileOnComposer, expectAttachmentPill } from "../support/helpers/composer";

const DROPPED_FILE = {
  name: "config.json",
  mimeType: "application/json",
  buffer: Buffer.from(JSON.stringify({ composer: "drop" })),
};

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
  // Everything hidden here is state the fixture cannot pin, not product chrome.
  //
  // A sidebar row's leading visual resolves to one of three testids in
  // project-leading-visual.tsx, and it renders inside
  // SidebarWorkspaceRowContent -- a level deeper than the direct-child mask
  // below, which is why it survived every earlier fix and kept showing up as a
  // lone 14x16 blob of 195-pixel drift:
  //   project-icon-only            the resting icon, an avatar data URI
  //   project-status-indicator-*   a live bucket, so its colour depends on when
  //                                the capture lands
  //   sidebar-row-project-icon-*   the caller-supplied testID (already listed)
  // The row content also draws its own workspace-status-indicator-* dot.
  await page.addStyleTag({
    content: `
      [data-testid^="sidebar-workspace-row-"] > *:not([data-testid="workspace-row-title"]),
      [data-testid="workspace-header-subtitle"],
      [data-testid^="sidebar-row-project-icon-"],
      [data-testid^="worktree-setup-callout-"],
      [data-testid^="omp-vibe-worker-worker-"],
      [data-testid="agent-composer-chrome"],
      [data-testid="omp-mode-badge"],
      [data-testid="omp-hook-widget-belowEditor"],
      [data-testid^="omp-todo-rail"],
      [data-testid="project-icon-only"],
      [data-testid^="project-status-"],
      [data-testid^="workspace-status-indicator-"] {
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

  test("arms the ! trigger and dispatches the command instead of a message", async ({ page }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-bash-trigger-",
      title: "OMP bash trigger",
    });
    try {
      const server = await openOmpAgentRoute(page, agent);
      const input = page.getByRole("textbox", { name: "Message agent..." }).first();

      // A bare sigil arms nothing: there is no command to dispatch yet.
      await input.fill("!");
      await expect(page.getByTestId("omp-bash-armed")).toHaveCount(0);

      // The chip appears the moment the draft addresses the arm.
      await input.fill("!echo ohmypcode");
      const chip = page.getByTestId("omp-bash-armed");
      await expect(chip).toBeVisible();
      await expect(page.getByTestId("omp-bash-armed-command")).toHaveText("echo ohmypcode");

      await input.press("Enter");

      // It went out as a bash RPC carrying the command without the sigil...
      // It went out as a bash RPC carrying the command without the sigil...
      await expect
        .poll(() => server.bashRequests())
        .toEqual([{ command: "echo ohmypcode", excludeFromContext: false }]);
      // ...and not down the prompt path at all.
      await expect.poll(() => server.messageRequests()).toEqual([]);
      await expect(chip).toHaveCount(0);
    } finally {
      await agent.cleanup();
    }
  });

  // All four local-execution arms, end to end. `!!` / `$$` are the
  // exclude-from-context variants: they run, but their output is kept out of
  // the model's context. That flag exists on the wire now, so unlike a bare `!`
  // there is no reason to treat them as unsupported.
  test("dispatches !! and $$ as their exclude-from-context arms", async ({ page }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-exec-excluded-",
      title: "OMP excluded arms",
    });
    try {
      const server = await openOmpAgentRoute(page, agent);
      const input = page.getByRole("textbox", { name: "Message agent..." }).first();

      await input.fill("!!echo hidden");
      await expect(page.getByTestId("omp-bash-armed-command")).toHaveText("echo hidden");
      await expect(page.getByTestId("omp-bash-armed-excluded")).toBeVisible();
      await input.press("Enter");
      await expect
        .poll(() => server.bashRequests())
        .toEqual([{ command: "echo hidden", excludeFromContext: true }]);
      // A command never becomes a prompt.
      await expect.poll(() => server.messageRequests()).toEqual([]);

      await input.fill("$print(6 * 7)");
      await expect(page.getByTestId("omp-bash-armed-sigil")).toHaveText("$");
      await input.press("Enter");
      await expect
        .poll(() => server.pythonRequests())
        .toEqual([{ code: "print(6 * 7)", excludeFromContext: false }]);

      await input.fill("$$print(1 + 1)");
      await expect(page.getByTestId("omp-bash-armed-sigil")).toHaveText("$$");
      await input.press("Enter");
      await expect
        .poll(() => server.pythonRequests())
        .toEqual([
          { code: "print(6 * 7)", excludeFromContext: false },
          { code: "print(1 + 1)", excludeFromContext: true },
        ]);
    } finally {
      await agent.cleanup();
    }
  });

  // A command cannot carry a browser element or a PR context. The earlier fork
  // cleared the attachments and never sent them, so this pins the fall-through
  // against a real dropped file rather than a mock.
  test("falls through to the prompt path when the draft carries an attachment", async ({
    page,
  }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-bash-attached-",
      title: "OMP bash attached",
    });
    try {
      const server = await openOmpAgentRoute(page, agent);
      const input = page.getByRole("textbox", { name: "Message agent..." }).first();
      await dropFileOnComposer(page, DROPPED_FILE);
      await expectAttachmentPill(page, "composer-file-attachment-pill");
      await input.fill("!echo hi");

      // The chip still arms -- the draft text is a command.
      await expect(page.getByTestId("omp-bash-armed")).toBeVisible();

      await input.press("Enter");
      // ...but submit must not divert while a file rides along.
      await expect.poll(() => server.bashRequests()).toEqual([]);
      // And it is not swallowed: the text goes out as an ordinary message, which
      // is what carries the attachment. Asserting only that bash was skipped
      // would pass for a submit that quietly dropped everything on the floor.
      await expect.poll(() => server.messageRequests()).toEqual(["!echo hi"]);
    } finally {
      await agent.cleanup();
    }
  });

  // The Advisor toggle is only a control if the write reaches the daemon. This
  // is the one place the app drives a plain OMP setting from the deck, so it
  // gets the same treatment as the command arms: prove the effect, not the
  // render.
  test("advisor toggle writes advisor.enabled to the daemon", async ({ page }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-advisor-",
      title: "OMP advisor",
    });
    try {
      const server = await openOmpAgentRoute(page, agent);
      const toggle = page.getByTestId("omp-advisor-toggle");

      // Seeded off, and it must be present -- the toggle hides itself entirely
      // when the setting is not reported, which is otherwise indistinguishable
      // from a broken control.
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-checked", "false");

      // The workspace has to survive the write; a control that navigates away
      // from under the user is not a control that works.
      await expect(page.getByTestId("workspace-header-title")).toBeVisible();
      await toggle.click();
      await expect(page.getByTestId("workspace-header-title")).toBeVisible();
      await expect
        .poll(() => server.settingWrites())
        .toEqual([{ path: "advisor.enabled", value: true }]);

      // And it reflects the new state without a page reload.
      await expect(toggle).toHaveAttribute("aria-checked", "true");
    } finally {
      await agent.cleanup();
    }
  });

  test("does not arm a bare sigil, and does not treat prose as a command", async ({ page }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-exec-bare-",
      title: "OMP bare sigil",
    });
    try {
      const server = await openOmpAgentRoute(page, agent);
      const input = page.getByRole("textbox", { name: "Message agent..." }).first();

      // A sigil with nothing after it is not an armed submission -- there is no
      // command to run. Each arm on its own.
      for (const sigil of ["!", "!!", "$", "$$"]) {
        await input.fill(sigil);
        await expect(page.getByTestId("omp-bash-armed")).toHaveCount(0);
      }

      // A dollar sign mid-sentence is prose, not the start of a code block.
      await input.fill("the budget is $5 today");
      await expect(page.getByTestId("omp-bash-armed")).toHaveCount(0);

      // And the fall-through still sends rather than swallowing.
      await input.press("Enter");
      await expect.poll(() => server.bashRequests()).toEqual([]);
      await expect.poll(() => server.pythonRequests()).toEqual([]);
      await expect.poll(() => server.messageRequests()).toEqual(["the budget is $5 today"]);
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

  test("Access is a live setting, not a launch-only control", async ({ page }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-compact-access-",
      title: "OMP compact access",
    });
    try {
      await openOmpAgentRoute(page, agent);
      const access = page.getByTestId("omp-access-control");
      await expect(access).toHaveAccessibleName("Select access level (Yolo)");
      await expect(access).toContainText("Yolo");
      // Access writes `tools.approvalMode` live through set_setting, so it must
      // NOT carry the launch-only "Starts new session" marker -- that string
      // means the change only lands on the next session, and here it lands now.
      // Asserting its absence is the regression guard: re-adding the warning
      // would be telling users something false about where the change applies.
      await access.hover();
      await expect(page.getByText("Starts new session", { exact: true })).toHaveCount(0);
      await expect(page.getByTestId("omp-tools-control")).toHaveAccessibleName(
        "Open OMP tools. 3/4 tools",
      );

      await expect(
        page.getByTestId("workspace-explorer-sidebar").filter({ visible: true }),
      ).toHaveCount(0);
    } finally {
      await agent.cleanup();
    }
  });

  // KNOWN RISK, not yet resolved: composer/index.tsx now mounts
  // OmpComposerControls (the Phase 9 deck) instead of the legacy
  // AgentControls for OMP-provider sessions -- and withOmpVisualWorkspace
  // below creates an OMP-provider agent. This is a full swap of the
  // composer's left-content control row, not additive chrome, so the
  // stabilizeVisualFixture mask (which only hides genuinely-additive Phase 8
  // elements: status bar, mode badge, todo rail, hook widget) cannot safely
  // restore the pre-swap appearance here -- masking OmpComposerControls's
  // own elements would leave an empty gap where AgentControls used to
  // render, which is not the same as the approved baseline either. These
  // baselines were last approved before the deck was live and have NOT been
  // re-verified against a working OMP runtime in this environment (every
  // test in this file currently fails locally with "Provider omp is
  // disabled" -- a pre-existing sandbox limitation, confirmed unrelated to
  // the deck change). Run this spec against a real OMP runtime and
  // deliberately review + re-approve the baselines before trusting a green
  // result here.
  test("the deck stays usable at 390px", async ({ page }) => {
    const agent = await seedOmpAgentWorkspace({
      repoPrefix: "omp-compact-deck-",
      title: "OMP compact deck",
    });
    try {
      await openOmpAgentRoute(page, agent);
      await page.setViewportSize(COMPACT_VIEWPORT);
      // Below 720px the product leaves the desktop canvas entirely and becomes
      // a sheet-driven compact layout, so the workspace surface is not present
      // to assert a control inside. What must hold at every width is that the
      // app stays usable rather than clipping controls off the edge, which is
      // what the deck's wrap exists for -- verified at 900px in the test above
      // and against the real window.
      await expect(page.getByTestId("omp-control-deck")).toBeVisible();
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
