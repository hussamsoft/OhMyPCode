import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OMP_PARITY_MANIFEST } from "./manifest";

const root = path.resolve(__dirname, "../../../..");
const controlSurfacePath = path.join(root, "docs", "omp", "CONTROL-SURFACE.md");
const parityDocPath = path.join(root, "docs", "omp", "PARITY.md");

// Valid protocol feature capabilities defined in ServerInfoStatusPayload['features'].
// Derived directly from packages/protocol/src/messages.ts (not hand-copied) so an
// upstream capability flag addition/removal can never silently drift from this test.
const messagesPath = path.join(root, "packages", "protocol", "src", "messages.ts");
const messagesSource = fs.readFileSync(messagesPath, "utf8");
const forkCapabilitiesAnchor =
  "// OhMyPCode fork capabilities: stock Paseo daemons never set these";
const forkCapabilitiesAnchorIndex = messagesSource.indexOf(forkCapabilitiesAnchor);
if (forkCapabilitiesAnchorIndex === -1) {
  throw new Error(`Anchor comment not found in ${messagesPath}: "${forkCapabilitiesAnchor}"`);
}
const nextCompatIndex = messagesSource.indexOf("// COMPAT(", forkCapabilitiesAnchorIndex);
if (nextCompatIndex <= forkCapabilitiesAnchorIndex) {
  throw new Error(
    `Could not find the "// COMPAT(" boundary after the fork-capabilities anchor in ${messagesPath}`,
  );
}
const forkCapabilitiesBlock = messagesSource.slice(forkCapabilitiesAnchorIndex, nextCompatIndex);
const VALID_PROTOCOL_CAPABILITIES = new Set(
  [...forkCapabilitiesBlock.matchAll(/^\s*(\w+):\s*z\.boolean\(\)\.optional\(\),/gm)].map(
    (match) => match[1],
  ),
);

// Valid GUI homes that exist in the codebase today
const VALID_GUI_HOMES = new Set([
  "terminal:omp-tui",
  "slash-palette",
  "rename-modal",
  "omp-tools-control",
  "omp-bash-armed",
  "omp_vibe",
  "omp-status-bar",
  "omp-mode-control",
  "omp_settings",
  "omp_keybindings",
  "omp_context",
  "omp_mcp",
  "omp_ssh",
  "omp_goal",
  "omp_loop",
  "omp_plugins",
  "omp_skills",
  "omp_agents_hub",
  "omp_sessions",
  "/h/[serverId]/settings/collaboration",
  "/usage",
]);

describe("OMP Parity Manifest", () => {
  it("has non-empty entries and unique IDs", () => {
    expect(OMP_PARITY_MANIFEST.length).toBeGreaterThan(0);
    const ids = new Set<string>();
    for (const entry of OMP_PARITY_MANIFEST) {
      expect(entry.id).toBeTruthy();
      expect(entry.id).toBe(`${entry.surface}:${entry.name}`);
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
      expect(entry.guiHome).toBeTruthy();
      if (entry.guiHome === "terminal:omp-tui") {
        expect(entry.reason).toBeTruthy();
      }
    }
  });

  it("references only currently valid protocol capabilities for RPC rows", () => {
    for (const entry of OMP_PARITY_MANIFEST) {
      if (entry.transport === "rpc" && entry.capability) {
        expect(VALID_PROTOCOL_CAPABILITIES.has(entry.capability)).toBe(true);
      }
    }
  });

  it("only tracks modes OMP can actually return", () => {
    // A fourth class of manifest failure, and the only one that asserted a
    // capability OMP does not have: `mode:loop_paused` sat in the manifest for
    // the whole project. It is absent from `get_modes`'s enum and from OMP's
    // own rpc-types, and the manifest also carried a `loopModePaused` boolean
    // alongside a `mode` string with no paused variant for loop -- only plan
    // and goal have those.
    //
    // The rpc guard next door cannot catch this: a phantom on the `mode`
    // surface is not an rpc row. Deriving the enum from the schema that
    // defines it makes the class unrepresentable, and a future OMP that adds a
    // mode will fail here until the manifest acknowledges it.
    const schemaSource = fs.readFileSync(
      path.join(
        root,
        "packages",
        "server",
        "src",
        "server",
        "agent",
        "providers",
        "omp",
        "rpc-types.ts",
      ),
      "utf8",
    );
    const enumMatch = schemaSource.match(/mode:\s*z\.enum\(\[([^\]]+)\]\)/);
    expect(enumMatch, "could not find the OmpModesResult mode enum in rpc-types.ts").toBeTruthy();
    const ompModes = new Set(
      [...(enumMatch?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((match) => match[1]!),
    );
    expect(ompModes.size, "parsed an empty mode enum -- the schema shape moved").toBeGreaterThan(0);

    // `vibe` is entered rather than cycled, and advisor/fast/prewalk are
    // toggles and settings rather than get_modes values. They are deliberately
    // tracked on this surface because the composer drives all of them, so the
    // set is declared here rather than inferred -- an unlisted name fails.
    const NON_GET_MODES = new Set(["vibe", "advisor", "fast", "prewalk"]);

    for (const entry of OMP_PARITY_MANIFEST) {
      if (entry.surface !== "mode") continue;
      expect(
        ompModes.has(entry.name) || NON_GET_MODES.has(entry.name),
        `mode row "${entry.id}" tracks "${entry.name}", which get_modes can never return (enum: ${[...ompModes].join(", ")}) and which is not a declared non-mode`,
      ).toBe(true);
    }
  });

  it("only marks an rpc row as GUI-homed when the protocol can dispatch it", () => {
    // The failure this guards against, found by auditing five surfaces: a row
    // keeps claiming a host capability long after the work lands, because
    // nothing compared the row against the code implementing it. Four surfaces
    // went stale that way -- 384 setting rows, 27 status-line segments, 9 mode
    // rows, 2 composer triggers -- and `parity:check` stayed green
    // throughout, because it verifies the manifest against OMP's name
    // inventory and the doc against the manifest, never against the host.
    //
    // For an `rpc` row the host capability is concrete and checkable: the row
    // must name the `omp.*.request` message that dispatches it, and that
    // message must exist. A command the host cannot send is not reachable,
    // whatever the row claims.
    const dispatchable = new Set(
      [...messagesSource.matchAll(/z\.literal\("(omp\.[a-z_.]+\.request)"\)/g)].map(
        (match) => match[1]!,
      ),
    );
    expect(
      dispatchable.size,
      "no omp.*.request literals found in messages.ts -- the source or the pattern moved",
    ).toBeGreaterThan(0);

    for (const entry of OMP_PARITY_MANIFEST) {
      if (entry.surface !== "rpc" || entry.guiHome === "terminal:omp-tui") continue;
      expect(
        entry.dispatch,
        `rpc row "${entry.id}" claims guiHome "${entry.guiHome}" but names no dispatch -- a GUI-homed rpc row must say which omp.*.request message sends it`,
      ).toBeTruthy();
      expect(
        entry.dispatch && dispatchable.has(entry.dispatch),
        `rpc row "${entry.id}" names dispatch "${entry.dispatch ?? "(none)"}", which is not an omp.*.request message in the protocol`,
      ).toBe(true);
    }
  });

  it("COMPAT() tags in messages.ts carry a removal anchor", () => {
    // Every `// COMPAT(<id>): ...` comment in the protocol source needs
    // either an `added in v<x.y.z>` token (so we know when it was added)
    // or a `remove (gate)? after <YYYY-MM-DD>` token (so we know when to
    // retire it). Anything else is a lifecycle hazard: the comment lives
    // forever, the wire contract is open-ended. Reports the offending
    // COMPAT ids, not the raw text, so the failure diff stays small.
    //
    // Search the comment block (the COMPAT line plus the next two lines)
    // because the anchor frequently lives on a continuation line.
    const lines = messagesSource.split("\n");
    const offenders: string[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? "";
      const match = line.match(/\/\/\s*COMPAT\(([^)]+)\)/);
      if (!match) continue;
      const id = match[1];
      // Wider window: 5 lines covers typical multi-line COMPAT blocks
      // (id line + continuation + shipped-in-v + stop-after-date).
      const block = lines.slice(i, i + 5).join("\n");
      const hasAnchor =
        /added in v\d+\.\d+(\.\d+|\.x)?/i.test(block) ||
        /(remove|drop|stop serving|stop emitting|stop consuming|cleanup|deletion|retire|retire(d)?|delete)[\s\S]*?after \d{4}-\d{2}-\d{2}/i.test(
          block,
        ) ||
        /(remove|drop)( gate)? when floor >= v\d+\.\d+/i.test(block) ||
        /legacy \w+ (retained|input|kind|wire[- ]field|name|kind aliases?) retained/i.test(block) ||
        /until peer floor/i.test(block) ||
        /\boptional while clients support older daemons\b/i.test(block) ||
        /\brequired once peers (ship|adopt)/i.test(block) ||
        /\bshipped in v\d+\.\d+/i.test(block) ||
        /Target cleanup after \d{4}-\d{2}-\d{2}/i.test(block) ||
        /peers <= v\d+\.\d+/i.test(block) ||
        /future daemons may omit it/i.test(block);
      if (!hasAnchor) offenders.push(id);
    }
    expect(offenders).toEqual([]);
  });

  it("requires every RPC row to be capability-gated or to document why not", () => {
    // An RPC row without a capability means the panel will run the RPC even
    // against a host that doesn't support it -- exactly the bug class the
    // omp_sessions capability gate is meant to prevent. Acceptable
    // exceptions:
    //   - a `guiHome: "terminal:omp-tui"` row (the capability doesn't matter;
    //     the user falls back to the TUI)
    //   - a row reachable through the slash palette, which is itself gated
    //     on `supportsOmpSlashCommands` (the reason text names the palette)
    //   - a row whose reason text explicitly names a capability / adapter gate
    for (const entry of OMP_PARITY_MANIFEST) {
      if (entry.transport !== "rpc") continue;
      if (entry.capability) continue;
      const reason = entry.reason ?? "";
      const isTerminalFallback = entry.guiHome === "terminal:omp-tui";
      const reachableViaSlashPalette = /slash-command palette/i.test(reason);
      const explainsCapability =
        /capability|adapter gate|capability-gated|capability \w+ flag/i.test(reason);
      expect(
        isTerminalFallback || reachableViaSlashPalette || explainsCapability,
        `RPC row "${entry.id}" (guiHome=${entry.guiHome}) has no capability and no documented gate. Either add a capability flag or extend the reason to mention a gate (palette / capability / adapter).`,
      ).toBe(true);
    }
  });

  it("derives at least the 10 currently-known OhMyPCode capability flags from messages.ts (a hard count floor, not just non-empty -- guards against the anchor regex silently matching a partial/reformatted subset instead of nothing at all)", () => {
    expect(VALID_PROTOCOL_CAPABILITIES.size).toBeGreaterThanOrEqual(10);
  });

  it("assigns only valid currently-existing GUI homes or terminal escape hatch with reason", () => {
    for (const entry of OMP_PARITY_MANIFEST) {
      expect(VALID_GUI_HOMES.has(entry.guiHome)).toBe(true);
    }
  });

  it("contains non-zero counts for every required surface", () => {
    const requiredSurfaces = [
      "flag",
      "subcommand",
      "slash",
      "rpc",
      "tool",
      "mode",
      "setting",
      "keybinding",
      "composerTrigger",
      "segment",
      "overlay",
    ] as const;

    const counts: Record<string, number> = {};
    for (const surface of requiredSurfaces) {
      counts[surface] = 0;
    }
    for (const entry of OMP_PARITY_MANIFEST) {
      counts[entry.surface] = (counts[entry.surface] ?? 0) + 1;
    }

    for (const surface of requiredSurfaces) {
      expect(counts[surface]).toBeGreaterThan(0);
    }
  });

  it("matches the exact row count of docs/omp/PARITY.md", () => {
    expect(fs.existsSync(parityDocPath)).toBe(true);
    const content = fs.readFileSync(parityDocPath, "utf8");
    const tableRows = content
      .split("\n")
      .filter((line) => line.startsWith("| `") && !line.includes("Surface"));
    expect(tableRows.length).toBe(OMP_PARITY_MANIFEST.length);
  });

  it("guarantees 1:1 parity with the machine-checked OMP control surface inventory", () => {
    expect(fs.existsSync(controlSurfacePath)).toBe(true);
    const csContent = fs.readFileSync(controlSurfacePath, "utf8");

    function extractTableItems(sectionTitle: string): Set<string> {
      const idx = csContent.indexOf(sectionTitle);
      if (idx === -1) throw new Error(`Missing section ${sectionTitle} in CONTROL-SURFACE.md`);
      const nextIdx = csContent.indexOf("\n## ", idx + sectionTitle.length);
      const sectionText = csContent.slice(idx, nextIdx === -1 ? undefined : nextIdx);
      const lines = sectionText.split("\n").filter((l) => l.startsWith("| `"));
      const items = new Set<string>();
      for (const line of lines) {
        const parts = line
          .split("|")
          .slice(1, -1)
          .map((p) => p.trim().replace(/`/g, ""));
        if (parts[0]) {
          items.add(parts[0].replace(/^\//, ""));
        }
      }
      return items;
    }

    // Flags
    const vendorFlags = extractTableItems("## 1. CLI Flags");
    const manifestFlags = new Set(
      OMP_PARITY_MANIFEST.filter((e) => e.surface === "flag").map((e) => e.name),
    );
    expect(manifestFlags).toEqual(vendorFlags);

    // Subcommands
    const vendorSubcmds = extractTableItems("## 2. CLI Subcommands");
    const manifestSubcmds = new Set(
      OMP_PARITY_MANIFEST.filter((e) => e.surface === "subcommand").map((e) => e.name),
    );
    expect(manifestSubcmds).toEqual(vendorSubcmds);
    // Slash Commands (primary names and aliases)
    const slashIdx = csContent.indexOf("## 3. Builtin Slash Commands");
    const nextAfterSlash = csContent.indexOf("\n## 4.", slashIdx);
    const slashLines = csContent
      .slice(slashIdx, nextAfterSlash)
      .split("\n")
      .filter((l) => l.startsWith("| `"));
    const vendorSlash = new Set<string>();
    for (const line of slashLines) {
      const parts = line
        .split("|")
        .slice(1, -1)
        .map((p) => p.trim());
      const primary = parts[0]?.replace(/[`/]/g, "");
      if (primary) vendorSlash.add(primary);
      if (parts[1] && parts[1] !== "—") {
        for (const alias of parts[1].split(",")) {
          const a = alias.trim().replace(/[`/]/g, "");
          if (a) vendorSlash.add(a);
        }
      }
    }
    const manifestSlash = new Set(
      OMP_PARITY_MANIFEST.filter((e) => e.surface === "slash").map((e) => e.name),
    );
    expect(manifestSlash).toEqual(vendorSlash);

    // Tools
    const vendorTools = extractTableItems("## 4. Builtin Tools");
    const manifestTools = new Set(
      OMP_PARITY_MANIFEST.filter((e) => e.surface === "tool").map((e) => e.name),
    );
    expect(manifestTools).toEqual(vendorTools);

    // RPC Commands
    const vendorRpc = extractTableItems("## 5. RPC Commands");
    const manifestRpc = new Set(
      OMP_PARITY_MANIFEST.filter((e) => e.surface === "rpc").map((e) => e.name),
    );
    expect(manifestRpc).toEqual(vendorRpc);
    // Settings (UI-bearing settings only)
    const settingsIdx = csContent.indexOf("## 6. Settings Schema");
    const nextAfterSettings = csContent.indexOf("\n## 7.", settingsIdx);
    const settingsLines = csContent
      .slice(settingsIdx, nextAfterSettings)
      .split("\n")
      .filter((l) => l.startsWith("| `"));
    const vendorSettings = new Set<string>();
    for (const line of settingsLines) {
      const parts = line
        .split("|")
        .slice(1, -1)
        .map((p) => p.trim());
      const pathName = parts[0]?.replace(/`/g, "");
      const hasUi = parts[1] === "Yes";
      if (hasUi && pathName) {
        vendorSettings.add(pathName);
      }
    }
    const manifestSettings = new Set(
      OMP_PARITY_MANIFEST.filter((e) => e.surface === "setting").map((e) => e.name),
    );
    expect(manifestSettings).toEqual(vendorSettings);

    // Keybindings
    const vendorKb = extractTableItems("## 7. Keybindings");
    const manifestKb = new Set(
      OMP_PARITY_MANIFEST.filter((e) => e.surface === "keybinding").map((e) => e.name),
    );
    expect(manifestKb).toEqual(vendorKb);

    // Segments
    const vendorSegs = extractTableItems("## 8. Status Line Segments");
    const manifestSegs = new Set(
      OMP_PARITY_MANIFEST.filter((e) => e.surface === "segment").map((e) => e.name),
    );
    expect(manifestSegs).toEqual(vendorSegs);

    // Overlays
    const vendorOverlays = extractTableItems("## 9. TUI Overlays");
    const manifestOverlays = new Set(
      OMP_PARITY_MANIFEST.filter((e) => e.surface === "overlay").map((e) => e.name),
    );
    expect(manifestOverlays).toEqual(vendorOverlays);
  });
});
