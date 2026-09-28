import { afterEach, describe, expect, it } from "vitest";
import os from "node:os";
import path from "node:path";
import { resolvePaseoHome } from "@ohmypcode/server/daemon-control";
import { initializeOhMyPCodeEnvironment } from "./product-bootstrap.js";

const originalHome = process.env.OHMYPCODE_HOME;

afterEach(() => {
  if (originalHome === undefined) delete process.env.OHMYPCODE_HOME;
  else process.env.OHMYPCODE_HOME = originalHome;
});

describe("product bootstrap", () => {
  it("sets OHMYPCODE_HOME to the same directory the daemon resolves by default", () => {
    // Regression: the packaged app failed to boot with "Desktop daemon did
    // not return a server id" and an endless "invalid daemon password" loop.
    // Cause: initializeOhMyPCodeEnvironment() existed but was never imported,
    // so OHMYPCODE_HOME stayed unset and resolvePaseoHome() fell through to
    // the legacy `~/.paseo` -- a directory holding a *different* server-id and
    // daemon password than `~/.ohmypcode`. The desktop expected one, the
    // daemon minted the other, and no handshake ever succeeded.
    delete process.env.OHMYPCODE_HOME;
    initializeOhMyPCodeEnvironment();

    expect(process.env.OHMYPCODE_HOME).toBe(path.join(os.homedir(), ".ohmypcode"));
    // The invariant that actually broke: the desktop's home and the daemon's
    // home must be the same path, or they disagree on identity and auth.
    expect(process.env.OHMYPCODE_HOME).toBe(resolvePaseoHome(process.env));
  });

  it("does not override an explicitly configured home", () => {
    process.env.OHMYPCODE_HOME = path.join(os.tmpdir(), "omp-explicit-home");
    initializeOhMyPCodeEnvironment();

    expect(process.env.OHMYPCODE_HOME).toBe(path.join(os.tmpdir(), "omp-explicit-home"));
  });
});
