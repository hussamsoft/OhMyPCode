import { describe, expect, test } from "vitest";

import { configurationEnvironment, daemonLaunchEnvironment } from "./config-environment.js";

describe("configurationEnvironment", () => {
  test("reads the canonical OMPCODE_* name when set", () => {
    const env = configurationEnvironment({ OMPCODE_LISTEN: "127.0.0.1:7000" });
    expect(env.OMPCODE_LISTEN).toBe("127.0.0.1:7000");
  });

  test("falls back to the legacy PASEO_* name when OMPCODE_* is unset", () => {
    const env = configurationEnvironment({ PASEO_LISTEN: "127.0.0.1:7000" });
    expect(env.OMPCODE_LISTEN).toBe("127.0.0.1:7000");
  });

  test("OMPCODE_* takes priority when both are set", () => {
    const env = configurationEnvironment({
      OMPCODE_LISTEN: "127.0.0.1:7000",
      PASEO_LISTEN: "127.0.0.1:9999",
    });
    expect(env.OMPCODE_LISTEN).toBe("127.0.0.1:7000");
  });

  test("blank canonical value falls back to legacy PASEO_* name, not shadows it", () => {
    const env = configurationEnvironment({ OMPCODE_LISTEN: "", PASEO_LISTEN: "127.0.0.1:7000" });
    expect(env.OMPCODE_LISTEN).toBe("127.0.0.1:7000");
  });

  test("does not fabricate a value when neither name is set", () => {
    const env = configurationEnvironment({});
    expect(env.OMPCODE_LISTEN).toBeUndefined();
  });

  test("leaves non-daemon-setting keys alone", () => {
    const env = configurationEnvironment({ PASEO_UNRELATED_KEY: "x" } as NodeJS.ProcessEnv);
    expect((env as Record<string, unknown>).OMPCODE_UNRELATED_KEY).toBeUndefined();
  });
});

describe("daemonLaunchEnvironment", () => {
  test("strips both canonical and legacy daemon setting keys in managed mode", () => {
    const env = daemonLaunchEnvironment({
      env: {
        OMPCODE_LISTEN: "127.0.0.1:7000",
        PASEO_PASSWORD: "secret",
        UNRELATED: "kept",
      },
      home: "/tmp/home",
      mode: "managed",
    });
    expect(env.OMPCODE_LISTEN).toBeUndefined();
    expect(env.PASEO_PASSWORD).toBeUndefined();
    expect(env.UNRELATED).toBe("kept");
  });

  test("keeps daemon setting keys in deployment mode", () => {
    const env = daemonLaunchEnvironment({
      env: { OMPCODE_LISTEN: "127.0.0.1:7000" },
      home: "/tmp/home",
      mode: "deployment",
    });
    expect(env.OMPCODE_LISTEN).toBe("127.0.0.1:7000");
  });

  test("always strips PASEO_HOST and OMPCODE_HOST regardless of mode", () => {
    const managed = daemonLaunchEnvironment({
      env: { PASEO_HOST: "old:1", OMPCODE_HOST: "new:1" },
      home: "/tmp/home",
      mode: "managed",
    });
    expect(managed.PASEO_HOST).toBeUndefined();
    expect(managed.OMPCODE_HOST).toBeUndefined();

    const deployment = daemonLaunchEnvironment({
      env: { PASEO_HOST: "old:1", OMPCODE_HOST: "new:1" },
      home: "/tmp/home",
      mode: "deployment",
    });
    expect(deployment.PASEO_HOST).toBeUndefined();
    expect(deployment.OMPCODE_HOST).toBeUndefined();
  });
});
