#!/usr/bin/env npx tsx

import assert from "node:assert";
import path from "node:path";
import {
  getDaemonHost,
  normalizeDaemonHost,
  resolveDaemonPassword,
  resolveDaemonTarget,
} from "../src/utils/client.js";
import { selectDaemonTarget } from "../src/utils/daemon-target.js";
import { resolveCliVersion } from "../src/version.js";

console.log("=== CLI IPC Target Helpers ===\n");

{
  console.log("Test 1: unix hosts resolve to ws+unix URLs");
  const target = resolveDaemonTarget("unix:///tmp/paseo.sock");
  assert.deepStrictEqual(target, {
    type: "ipc",
    url: "ws+unix:///tmp/paseo.sock:/ws",
    socketPath: "/tmp/paseo.sock",
  });
  console.log("✓ unix hosts resolve to ws+unix URLs\n");
}

{
  console.log("Test 1b: bare unix socket paths resolve at the connection boundary");
  const target = resolveDaemonTarget("/tmp/paseo.sock");
  assert.deepStrictEqual(target, {
    type: "ipc",
    url: "ws+unix:///tmp/paseo.sock:/ws",
    socketPath: "/tmp/paseo.sock",
  });
  console.log("✓ bare unix socket paths resolve at the connection boundary\n");
}

{
  console.log("Test 2: pipe hosts preserve the Node socketPath transport form");
  const target = resolveDaemonTarget("pipe://\\\\.\\pipe\\paseo-managed-test");
  assert.deepStrictEqual(target, {
    type: "ipc",
    url: "ws://localhost/ws",
    socketPath: "\\\\.\\pipe\\paseo-managed-test",
  });
  console.log("✓ pipe hosts preserve Node socketPath transport form\n");
}

{
  console.log("Test 3: tcp URI host targets honor ssl=true");
  const target = resolveDaemonTarget("tcp://example.com:6767?ssl=true&password=query-secret");
  assert.deepStrictEqual(target, {
    type: "tcp",
    url: "wss://example.com:6767/ws",
  });
  console.log("✓ tcp URI host targets honor ssl=true\n");
}

{
  console.log("Test 4: tcp URI hosts normalize into canonical direct TCP targets");
  assert.strictEqual(
    normalizeDaemonHost("tcp://Example.com:6767?ssl=true&password=query-secret"),
    "tcp://Example.com:6767?ssl=true&password=query-secret",
  );
  console.log("✓ tcp URI hosts normalize into canonical direct TCP targets\n");
}

{
  console.log("Test 5: local unix socket paths normalize into IPC daemon targets");
  assert.strictEqual(normalizeDaemonHost("/tmp/paseo.sock"), "unix:///tmp/paseo.sock");
  console.log("✓ local unix socket paths normalize into IPC daemon targets\n");
}

{
  console.log("Test 5b: Windows absolute paths are NOT treated as unix sockets");
  assert.strictEqual(normalizeDaemonHost("C:\\Users\\foo\\.paseo\\paseo.sock"), null);
  assert.strictEqual(normalizeDaemonHost("D:\\project\\socket"), null);
  console.log("✓ Windows absolute paths are not treated as unix sockets\n");
}

{
  const target = selectDaemonTarget(
    { home: "/tmp/selected-home" },
    { PASEO_HOST: "ignored:12345", PASEO_LISTEN: "ignored:23456" },
  );
  const resolvedHome = path.resolve("/tmp/selected-home");
  assert.deepStrictEqual(target, { kind: "instance", home: resolvedHome });
  assert.strictEqual(getDaemonHost({ target }), `home ${resolvedHome}`);
  assert.throws(() => selectDaemonTarget({}, { PASEO_HOME: "/tmp/a", PASEO_HOST: "unused:12345" }));
}

{
  console.log("Test 8: CLI app version resolves for daemon hello compatibility");
  assert.match(resolveCliVersion(), /^\d+\.\d+\.\d+/);
  console.log("✓ CLI app version resolves for daemon hello compatibility\n");
}

{
  console.log("Test 10: daemon password resolution prefers TCP URI query, falls back to env");
  const previousPaseoEnv = process.env.PASEO_PASSWORD;
  const previousOmpcodeEnv = process.env.OMPCODE_PASSWORD;
  try {
    delete process.env.PASEO_PASSWORD;
    delete process.env.OMPCODE_PASSWORD;
    assert.strictEqual(
      resolveDaemonPassword("tcp://example.com:6767?ssl=true&password=query-secret"),
      "query-secret",
    );
    assert.strictEqual(resolveDaemonPassword("tcp://missing.example:6767"), undefined);
    assert.strictEqual(resolveDaemonPassword("example.com:6767"), undefined);

    process.env.PASEO_PASSWORD = "env-secret";
    assert.strictEqual(
      resolveDaemonPassword("tcp://example.com:6767?ssl=true&password=query-secret"),
      "query-secret",
      "URI password should take precedence over env var",
    );
    assert.strictEqual(
      resolveDaemonPassword("tcp://missing.example:6767"),
      "env-secret",
      "TCP host without query password should fall back to env var",
    );
    assert.strictEqual(
      resolveDaemonPassword("example.com:6767"),
      "env-secret",
      "Bare host should pick up env var password",
    );
    assert.strictEqual(resolveDaemonPassword("localhost:6767"), "env-secret");

    process.env.PASEO_PASSWORD = "";
    assert.strictEqual(
      resolveDaemonPassword("localhost:6767"),
      undefined,
      "Empty env var should be treated as unset",
    );
    delete process.env.PASEO_PASSWORD;

    process.env.OMPCODE_PASSWORD = "ompcode-secret";
    assert.strictEqual(
      resolveDaemonPassword("localhost:6767"),
      "ompcode-secret",
      "OMPCODE_PASSWORD should be read as the canonical env var",
    );

    process.env.PASEO_PASSWORD = "legacy-secret";
    assert.strictEqual(
      resolveDaemonPassword("localhost:6767"),
      "ompcode-secret",
      "OMPCODE_PASSWORD should take precedence over legacy PASEO_PASSWORD",
    );

    delete process.env.OMPCODE_PASSWORD;
    assert.strictEqual(
      resolveDaemonPassword("localhost:6767"),
      "legacy-secret",
      "PASEO_PASSWORD should still work as a COMPAT(paseoEnv) fallback",
    );

    process.env.OMPCODE_PASSWORD = "";
    assert.strictEqual(
      resolveDaemonPassword("localhost:6767"),
      "legacy-secret",
      "Blank OMPCODE_PASSWORD should fall back to legacy PASEO_PASSWORD, not shadow it",
    );
  } finally {
    if (previousPaseoEnv === undefined) {
      delete process.env.PASEO_PASSWORD;
    } else {
      process.env.PASEO_PASSWORD = previousPaseoEnv;
    }
    if (previousOmpcodeEnv === undefined) {
      delete process.env.OMPCODE_PASSWORD;
    } else {
      process.env.OMPCODE_PASSWORD = previousOmpcodeEnv;
    }
  }
  console.log("✓ daemon password resolution prefers TCP URI query, falls back to env\n");
}

console.log("=== All CLI IPC target tests passed ===");
