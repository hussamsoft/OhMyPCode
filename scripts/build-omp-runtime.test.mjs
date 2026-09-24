import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("OMP runtime source commit metadata", () => {
  it("uses an explicit commit override before git metadata", () => {
    const source = readFileSync(resolve("scripts/build-omp-runtime.mjs"), "utf8");
    expect(source).toContain("process.env.OMP_SOURCE_COMMIT");
    expect(source).toContain('git", ["-C", vendor, "rev-parse", "HEAD"');
    expect(source.indexOf("process.env.OMP_SOURCE_COMMIT")).toBeLessThan(source.indexOf("sourceCommit,"));
  });
});
