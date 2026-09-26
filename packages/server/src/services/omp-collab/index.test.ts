import { describe, expect, it } from "vitest";
import {
  createOmpCollabService,
  OMP_COLLAB_TIMEOUT_MS,
  OmpCollabError,
  type OmpCommandRunner,
} from "./index.js";

function runnerFor(
  stdout: string,
  stderr = "",
): {
  runner: OmpCommandRunner;
  calls: Array<{
    args: readonly string[];
    options: Parameters<OmpCommandRunner>[1];
  }>;
} {
  const calls: Array<{
    args: readonly string[];
    options: Parameters<OmpCommandRunner>[1];
  }> = [];
  const runner: OmpCommandRunner = async (args, options) => {
    calls.push({ args, options });
    return { stdout, stderr };
  };
  return { runner, calls };
}

describe("OMP collab command service", () => {
  it("lists validated host metadata and uses the safe command defaults", async () => {
    const { runner, calls } = runnerFor(
      JSON.stringify({ version: 1, hosts: [{ instanceId: "host-1", pid: 42 }] }),
    );

    await expect(createOmpCollabService(runner).listHosts()).resolves.toEqual([
      { instanceId: "host-1", pid: 42 },
    ]);
    expect(calls[0]).toMatchObject({
      args: ["collab", "list", "--json"],
      options: { timeout: OMP_COLLAB_TIMEOUT_MS, windowsHide: true },
    });
  });

  it("creates control and view links with validated HTTPS output", async () => {
    const { runner, calls } = runnerFor("https://relay.example.test/control#key\n");
    const service = createOmpCollabService(runner);

    await expect(service.createLink("instance-1")).resolves.toBe(
      "https://relay.example.test/control#key",
    );
    await expect(service.createLink("instance-1", true)).resolves.toBe(
      "https://relay.example.test/control#key",
    );
    expect(calls.map((call) => call.args)).toEqual([
      ["collab", "link", "instance-1"],
      ["collab", "link", "instance-1", "--view"],
    ]);
  });

  it("shares a saved session and supports the gist switch", async () => {
    const { runner, calls } = runnerFor("https://share.example.test/session#encrypted\n");
    const service = createOmpCollabService(runner);

    await expect(service.shareSession("session id")).resolves.toBe(
      "https://share.example.test/session#encrypted",
    );
    await expect(service.shareSession("session id", true)).resolves.toBe(
      "https://share.example.test/session#encrypted",
    );
    expect(calls.map((call) => call.args)).toEqual([
      ["share", "session id"],
      ["share", "session id", "--gist"],
    ]);
  });

  it.each(["", "   ", "-host", " --host"])(
    "rejects unsafe identifier %j before invoking the runner",
    async (identifier) => {
      const { runner, calls } = runnerFor("https://example.test/#key");
      const service = createOmpCollabService(runner);

      await expect(service.createLink(identifier)).rejects.toBeInstanceOf(OmpCollabError);
      await expect(service.shareSession(identifier)).rejects.toBeInstanceOf(OmpCollabError);
      expect(calls).toHaveLength(0);
    },
  );

  it("rejects malformed lists, non-HTTPS links, and command failures generically", async () => {
    const malformed = createOmpCollabService(runnerFor('{"version":1,"hosts":null}').runner);
    await expect(malformed.listHosts()).rejects.toEqual(new OmpCollabError());

    const insecure = createOmpCollabService(runnerFor("http://example.test/#key").runner);
    await expect(insecure.shareSession("session")).rejects.toEqual(new OmpCollabError());

    const commandFailure = createOmpCollabService(async () => {
      throw new Error("stderr contains a secret token: do-not-leak");
    });
    const error = await commandFailure.listHosts().catch((value: unknown) => value);
    expect(error).toBeInstanceOf(OmpCollabError);
    expect(error).not.toHaveProperty("stderr");
    expect(String(error)).not.toContain("do-not-leak");
  });

  it("rejects output containing extra text instead of returning an untrusted value", async () => {
    const service = createOmpCollabService(
      runnerFor("https://example.test/#key\nwarning: unexpected output").runner,
    );

    await expect(service.createLink("instance")).rejects.toBeInstanceOf(OmpCollabError);
  });
});
