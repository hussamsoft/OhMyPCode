import { test, expect } from "vitest";
import path from "node:path";
import { selectDaemonTarget, describeDaemonTarget } from "./daemon-target.js";

test("explicit selectors win over both environment selectors", () => {
  const env = { PASEO_HOME: "/tmp/a", PASEO_HOST: "unused:12345" };
  expect(selectDaemonTarget({ home: "/tmp/b" }, env)).toEqual({
    kind: "instance",
    home: path.resolve("/tmp/b"),
  });
  expect(selectDaemonTarget({ host: "chosen:23456" }, env)).toEqual({
    kind: "endpoint",
    host: "chosen:23456",
  });
  expect(() => selectDaemonTarget({}, env)).toThrow();
  expect(() => selectDaemonTarget({ home: "/tmp/b", host: "chosen:23456" }, {})).toThrow();
});

test("OMPCODE_HOST is canonical; PASEO_HOST is a COMPAT(paseoEnv) fallback", () => {
  expect(selectDaemonTarget({}, { OMPCODE_HOST: "canonical:12345" })).toEqual({
    kind: "endpoint",
    host: "canonical:12345",
  });
  expect(selectDaemonTarget({}, { PASEO_HOST: "legacy:23456" })).toEqual({
    kind: "endpoint",
    host: "legacy:23456",
  });
  expect(
    selectDaemonTarget({}, { OMPCODE_HOST: "canonical:12345", PASEO_HOST: "legacy:23456" }),
  ).toEqual({ kind: "endpoint", host: "canonical:12345" });
  expect(() =>
    selectDaemonTarget({}, { OHMYPCODE_HOME: "/tmp/a", OMPCODE_HOST: "unused:12345" }),
  ).toThrow(/OHMYPCODE_HOME and OMPCODE_HOST are both set/);
  expect(() =>
    selectDaemonTarget({}, { PASEO_HOME: "/tmp/a", PASEO_HOST: "unused:12345" }),
  ).toThrow(/PASEO_HOME and PASEO_HOST are both set/);
  expect(() =>
    selectDaemonTarget({}, { OHMYPCODE_HOME: "/tmp/a", PASEO_HOST: "unused:12345" }),
  ).toThrow(/OHMYPCODE_HOME and PASEO_HOST are both set/);
});

test("empty or whitespace-only PASEO_HOST/OMPCODE_HOST are treated as unset, not an endpoint", () => {
  // Regression: PASEO_HOST: "" (e.g. a test explicitly clearing an ambient
  // override) previously satisfied `!== undefined` and produced
  // { kind: "endpoint", host: "" }, silently routing status/stop commands
  // through the endpoint path instead of falling back to home resolution.
  expect(selectDaemonTarget({}, { PASEO_HOME: "/tmp/a", PASEO_HOST: "" })).toEqual({
    kind: "instance",
    home: path.resolve("/tmp/a"),
  });
  expect(selectDaemonTarget({}, { PASEO_HOME: "/tmp/a", PASEO_HOST: "   " })).toEqual({
    kind: "instance",
    home: path.resolve("/tmp/a"),
  });
  expect(selectDaemonTarget({}, { OMPCODE_HOST: "", PASEO_HOST: "legacy:1" })).toEqual({
    kind: "endpoint",
    host: "legacy:1",
  });
});

test("empty or whitespace-only OHMYPCODE_HOME/PASEO_HOME are treated as unset, not ambiguous", () => {
  // Regression: PASEO_HOME: "" previously satisfied `!== undefined` and made
  // resolveHomeEnvKey() report "PASEO_HOME" as set, spuriously throwing
  // TARGET_AMBIGUOUS against a genuinely-set PASEO_HOST instead of routing to
  // the endpoint. Same class of bug as the PASEO_HOST case above, in the
  // sibling home-side resolver.
  expect(selectDaemonTarget({}, { PASEO_HOME: "", PASEO_HOST: "legacy:1" })).toEqual({
    kind: "endpoint",
    host: "legacy:1",
  });
  expect(selectDaemonTarget({}, { OHMYPCODE_HOME: "   ", PASEO_HOST: "legacy:1" })).toEqual({
    kind: "endpoint",
    host: "legacy:1",
  });
});

test("local operations ignore routing environment but reject an explicit endpoint", () => {
  expect(
    selectDaemonTarget({}, { PASEO_HOME: "/tmp/b", PASEO_HOST: "unused:12345" }, true),
  ).toEqual({ kind: "instance", home: path.resolve("/tmp/b") });
  expect(() => selectDaemonTarget({ host: "chosen:23456" }, {}, true)).toThrow();
});

test("endpoint descriptions redact pairing material and credentials", () => {
  expect(
    describeDaemonTarget({
      kind: "endpoint",
      host: "tcp://user:private@example.test:23456?password=secret",
    }),
  ).not.toMatch(/private|secret/);
  expect(
    describeDaemonTarget({ kind: "endpoint", host: "https://app.paseo.sh/#offer=private" }),
  ).not.toContain("private");
});
