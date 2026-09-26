import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { parseManifest, parseProbedVersion } from "./omp-runtime-status";

describe("parseProbedVersion", () => {
  it("strips the omp/ prefix from a real --version output", () => {
    expect(parseProbedVersion("omp/18.3.1\n")).toBe("18.3.1");
  });

  it("returns the trimmed value verbatim when there is no omp/ prefix", () => {
    expect(parseProbedVersion("18.3.1")).toBe("18.3.1");
  });

  it("returns null for empty or whitespace-only output", () => {
    expect(parseProbedVersion("")).toBeNull();
    expect(parseProbedVersion("   \n")).toBeNull();
  });
});

describe("parseManifest", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "omp-runtime-status-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("parses a well-formed manifest", () => {
    const manifestPath = path.join(dir, "manifest.json");
    writeFileSync(
      manifestPath,
      JSON.stringify({ ompVersion: "18.3.1", sourceCommit: "e5d1b5d886" }),
    );
    expect(parseManifest(manifestPath)).toEqual({
      ompVersion: "18.3.1",
      sourceCommit: "e5d1b5d886",
    });
  });

  it("returns null when the manifest file does not exist", () => {
    expect(parseManifest(path.join(dir, "missing.json"))).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    const manifestPath = path.join(dir, "manifest.json");
    writeFileSync(manifestPath, "{not json");
    expect(parseManifest(manifestPath)).toBeNull();
  });

  it("returns null when ompVersion or sourceCommit is missing or the wrong type", () => {
    const manifestPath = path.join(dir, "manifest.json");
    writeFileSync(manifestPath, JSON.stringify({ ompVersion: "18.3.1" }));
    expect(parseManifest(manifestPath)).toBeNull();

    writeFileSync(manifestPath, JSON.stringify({ ompVersion: 18, sourceCommit: "abc" }));
    expect(parseManifest(manifestPath)).toBeNull();
  });
});
