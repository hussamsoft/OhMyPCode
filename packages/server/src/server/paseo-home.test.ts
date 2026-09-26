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

  test("defaults to ~/.paseo when neither is set", () => {
    expect(resolvePaseoHome({})).toBe(path.join(homedir(), ".paseo"));
  });
});
