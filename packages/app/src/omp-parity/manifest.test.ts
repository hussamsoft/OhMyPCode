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
  "omp-tools-control",
  "omp_vibe",
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

  it("derives a non-empty VALID_PROTOCOL_CAPABILITIES set from messages.ts (guards against the anchor regex silently matching nothing)", () => {
    expect(VALID_PROTOCOL_CAPABILITIES.size).toBeGreaterThan(0);
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
