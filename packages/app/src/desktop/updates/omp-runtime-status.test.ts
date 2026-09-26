import { describe, expect, it } from "vitest";
import { parseOmpRuntimeStatus } from "./omp-runtime-status";

describe("parseOmpRuntimeStatus", () => {
  it("parses a bundled, up-to-date status", () => {
    expect(
      parseOmpRuntimeStatus({
        kind: "bundled",
        ompVersion: "18.3.1",
        sourceCommit: "e5d1b5d886387793b8a56835de463a23c68a8d19",
        liveProbedVersion: "18.3.1",
        isStale: false,
      }),
    ).toEqual({
      kind: "bundled",
      ompVersion: "18.3.1",
      sourceCommit: "e5d1b5d886387793b8a56835de463a23c68a8d19",
      liveProbedVersion: "18.3.1",
      isStale: false,
    });
  });

  it("parses a bundled, stale status", () => {
    const result = parseOmpRuntimeStatus({
      kind: "bundled",
      ompVersion: "18.3.0",
      sourceCommit: "abc",
      liveProbedVersion: "18.3.1",
      isStale: true,
    });
    expect(result.isStale).toBe(true);
  });

  it("parses a system runtime with no source commit", () => {
    const result = parseOmpRuntimeStatus({
      kind: "system",
      ompVersion: "18.3.1",
      sourceCommit: null,
      liveProbedVersion: "18.3.1",
      isStale: false,
    });
    expect(result.kind).toBe("system");
    expect(result.sourceCommit).toBeNull();
  });

  it("parses an unavailable runtime", () => {
    expect(
      parseOmpRuntimeStatus({
        kind: "unavailable",
        ompVersion: null,
        sourceCommit: null,
        liveProbedVersion: null,
        isStale: false,
      }),
    ).toEqual({
      kind: "unavailable",
      ompVersion: null,
      sourceCommit: null,
      liveProbedVersion: null,
      isStale: false,
    });
  });

  it("falls back to unavailable for malformed IPC responses", () => {
    const unavailable = {
      kind: "unavailable",
      ompVersion: null,
      sourceCommit: null,
      liveProbedVersion: null,
      isStale: false,
    };
    expect(parseOmpRuntimeStatus(undefined)).toEqual(unavailable);
    expect(parseOmpRuntimeStatus(null)).toEqual(unavailable);
    expect(parseOmpRuntimeStatus("garbage")).toEqual(unavailable);
    expect(parseOmpRuntimeStatus({ kind: "not-a-real-kind" })).toEqual(unavailable);
  });
});
