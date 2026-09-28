import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { resolvePaseoHome } from "./paseo-home.js";
describe("resolvePaseoHome", () => {
  test("resolves OHMYPCODE_HOME without creating it", () => {
    const parent = mkdtempSync(path.join(tmpdir(), "paseo-home-parent-"));
    const paseoHome = path.join(parent, "home");
    try {
      expect(resolvePaseoHome({ OHMYPCODE_HOME: paseoHome })).toBe(paseoHome);
      expect(existsSync(paseoHome)).toBe(false);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  test("falls back to PASEO_HOME when OHMYPCODE_HOME is unset", () => {
    const parent = mkdtempSync(path.join(tmpdir(), "paseo-home-parent-"));
    const paseoHome = path.join(parent, "home");
    try {
      expect(resolvePaseoHome({ PASEO_HOME: paseoHome })).toBe(paseoHome);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  test("OHMYPCODE_HOME takes priority when both are set", () => {
    const parent = mkdtempSync(path.join(tmpdir(), "paseo-home-parent-"));
    const canonical = path.join(parent, "canonical");
    const stale = path.join(parent, "stale");
    try {
      expect(resolvePaseoHome({ OHMYPCODE_HOME: canonical, PASEO_HOME: stale })).toBe(canonical);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });

  test("defaults to ~/.ohmypcode when neither is set", () => {
    // The desktop resolves the same directory via
    // packages/desktop/src/product-bootstrap.ts. If these two disagree the
    // daemon mints a different server-id than the desktop expects, and every
    // handshake fails with "invalid daemon password" -- the failure the
    // packaged app showed before both sides were renamed together.
    expect(resolvePaseoHome({})).toBe(path.join(homedir(), ".ohmypcode"));
  });

  test("empty or whitespace-only env values are treated as unset, not resolved to cwd", () => {
    // Regression: path.resolve("") returns process.cwd(), so OHMYPCODE_HOME/
    // PASEO_HOME set to an empty string (rather than truly unset) silently
    // made the daemon operate out of whatever directory it was launched
    // from instead of the intended ~/.ohmypcode default.
    expect(resolvePaseoHome({ OHMYPCODE_HOME: "" })).toBe(path.join(homedir(), ".ohmypcode"));
    expect(resolvePaseoHome({ OHMYPCODE_HOME: "   " })).toBe(path.join(homedir(), ".ohmypcode"));
    const parent = mkdtempSync(path.join(tmpdir(), "paseo-home-parent-"));
    const paseoHome = path.join(parent, "home");
    try {
      expect(resolvePaseoHome({ OHMYPCODE_HOME: "", PASEO_HOME: paseoHome })).toBe(paseoHome);
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
});
