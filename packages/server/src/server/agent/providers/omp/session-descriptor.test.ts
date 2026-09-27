import { mkdtemp, mkdir, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import {
  listOmpImportableSessions,
  readOmpImportSessionConfig,
  resolveOmpSessionPathByHandle,
} from "./session-descriptor.js";

async function writeSession(root: string, relativePath: string, lines: unknown[]): Promise<string> {
  const filePath = path.join(root, "sessions", relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`, "utf8");
  return filePath;
}

async function expectAllHandlesResolve(handles: string[], sessionDir: string): Promise<void> {
  for (const handle of handles) {
    const resolved = await resolveOmpSessionPathByHandle(handle, { sessionDir });
    expect(path.resolve(resolved)).toBe(path.resolve(handle));
  }
}

async function setupSymmetryFixture(): Promise<{ sessionsDir: string; targetHandle: string }> {
  const root = await mkdtemp(path.join(tmpdir(), "paseo-omp-resolve-symmetry-"));
  const sessionsDir = path.join(root, "sessions");
  const target = await writeSession(root, "audit/run.jsonl", [
    { type: "session", id: "audit-run", timestamp: "2026-06-10", cwd: "/tmp/cwd" },
  ]);
  await writeSession(root, "noise/other.jsonl", [
    { type: "session", id: "noise", timestamp: "2026-05-01", cwd: "/tmp/other" },
  ]);
  return { sessionsDir, targetHandle: target };
}

describe("OMP session descriptor", () => {
  test("cwd filtering continues past the global candidate overscan", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "paseo-omp-session-cwd-limit-"));
    const sessionsDir = path.join(root, "sessions");
    const requestedCwd = path.join(root, "requested");
    const otherCwd = path.join(root, "other");
    const requestedFile = await writeSession(root, "requested/requested.jsonl", [
      {
        type: "session",
        id: "requested-session",
        timestamp: "2026-06-01T00:00:00.000Z",
        cwd: requestedCwd,
      },
    ]);
    await utimes(requestedFile, new Date("2026-06-01"), new Date("2026-06-01"));

    await Promise.all(
      Array.from({ length: 400 }, async (_, index) => {
        const file = await writeSession(root, `other/${index}.jsonl`, [
          {
            type: "session",
            id: `other-${index}`,
            timestamp: "2026-06-02T00:00:00.000Z",
            cwd: otherCwd,
          },
        ]);
        await utimes(file, new Date("2026-06-02"), new Date("2026-06-02"));
      }),
    );

    await expect(
      listOmpImportableSessions({ sessionDir: sessionsDir, cwd: requestedCwd, limit: 1 }),
    ).resolves.toEqual([
      expect.objectContaining({ providerHandleId: requestedFile, cwd: requestedCwd }),
    ]);
  });

  test("reads title-first sessions and OMP combined model identifiers", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "paseo-omp-session-title-first-"));
    const cwd = path.join(root, "repo");
    const sessionFile = await writeSession(root, "project/session.jsonl", [
      {
        type: "title",
        id: "title-1",
        timestamp: "2026-06-09T00:00:00.000Z",
        title: "Deploy Paseo and verify",
      },
      {
        type: "session",
        version: 3,
        id: "session-title-first",
        timestamp: "2026-06-09T00:00:00.100Z",
        cwd,
      },
      {
        type: "model_change",
        id: "model-1",
        timestamp: "2026-06-09T00:00:00.200Z",
        model: "openai-codex/gpt-5.1",
      },
      {
        type: "message",
        id: "user-1",
        timestamp: "2026-06-09T00:00:01.000Z",
        message: { role: "user", content: [{ type: "text", text: "import me" }] },
      },
    ]);

    await expect(
      listOmpImportableSessions({ sessionDir: path.join(root, "sessions") }),
    ).resolves.toEqual([
      expect.objectContaining({
        providerHandleId: sessionFile,
        cwd,
        title: "Deploy Paseo and verify",
        firstPromptPreview: "import me",
      }),
    ]);
    await expect(readOmpImportSessionConfig(sessionFile)).resolves.toEqual({
      model: "openai-codex/gpt-5.1",
    });
  });

  test("keeps recent nested OMP subagent sessions importable", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "paseo-omp-session-nested-"));
    const cwd = path.join(root, "repo");
    const parent = await writeSession(root, "project/parent.jsonl", [
      { type: "session", id: "parent", timestamp: "2026-06-10T00:00:00.000Z", cwd },
      {
        type: "message",
        id: "parent-user",
        timestamp: "2026-06-10T00:00:01.000Z",
        message: { role: "user", content: "parent prompt" },
      },
    ]);
    const child = await writeSession(root, "project/parent/Explore.jsonl", [
      { type: "session", id: "child", timestamp: "2026-06-09T00:00:00.000Z", cwd },
      {
        type: "message",
        id: "child-user",
        timestamp: "2026-06-09T00:00:01.000Z",
        message: { role: "user", content: "child prompt" },
      },
    ]);
    await utimes(parent, new Date("2026-06-08"), new Date("2026-06-08"));
    await utimes(child, new Date("2026-06-09"), new Date("2026-06-09"));

    await expect(
      listOmpImportableSessions({ sessionDir: path.join(root, "sessions"), limit: 1 }),
    ).resolves.toEqual([
      expect.objectContaining({
        providerHandleId: child,
        title: "Explore",
        firstPromptPreview: "child prompt",
      }),
    ]);
  });

  test("uses OMP's own default session directory", async () => {
    const home = await mkdtemp(path.join(tmpdir(), "paseo-omp-session-home-"));
    const cwd = path.join(home, "repo");
    const sessionFile = path.join(home, ".omp", "agent", "sessions", "project", "session.jsonl");
    await mkdir(path.dirname(sessionFile), { recursive: true });
    await writeFile(
      sessionFile,
      `${JSON.stringify({ type: "session", id: "default-dir", timestamp: "2026-06-09", cwd })}\n`,
      "utf8",
    );

    await expect(listOmpImportableSessions({ homeDir: home, env: {} })).resolves.toEqual([
      expect.objectContaining({ providerHandleId: sessionFile, cwd }),
    ]);
  });
});

describe("resolveOmpSessionPathByHandle", () => {
  test("returns the realpath of a session file under the configured dir", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "paseo-omp-resolve-ok-"));
    const sessionsDir = path.join(root, "sessions");
    const sessionFile = await writeSession(root, "ops/repo.jsonl", [
      { type: "session", id: "ops-repo", timestamp: "2026-06-10", cwd: "/tmp/cwd" },
    ]);

    const resolved = await resolveOmpSessionPathByHandle(sessionFile, {
      sessionDir: sessionsDir,
    });
    // realpath can normalize separators on Windows; compare resolved paths.
    expect(path.resolve(resolved)).toBe(path.resolve(sessionFile));
  });

  test("rejects a path outside the configured sessions dir", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "paseo-omp-resolve-outside-"));
    const sessionsDir = path.join(root, "sessions");
    await mkdir(sessionsDir, { recursive: true });
    // File lives in `<root>/elsewhere.jsonl` -- outside the configured
    // sessionsDir -- even though the test creates a separate sessionsDir.
    const outside = path.join(root, "elsewhere.jsonl");
    await writeFile(
      outside,
      `${JSON.stringify({ type: "session", id: "evil", timestamp: "2026-06-10" })}\n`,
      "utf8",
    );

    await expect(
      resolveOmpSessionPathByHandle(outside, { sessionDir: sessionsDir }),
    ).rejects.toThrow(/not a session under the configured dir/);
  });

  test("rejects an empty handle", async () => {
    await expect(
      resolveOmpSessionPathByHandle("", { sessionDir: "/tmp/anything" }),
    ).rejects.toThrow(/session handle is required/);
  });

  test("agrees with listImportableSessions when both use the same sessionDir", async () => {
    // Regression for the asymmetry where listing used sessionDir but the
    // resolver ignored it -- agents with an explicit sessionDir had the
    // panel list sessions that the switch then rejected. Now both paths
    // use the same configured dir.
    const { sessionsDir, targetHandle } = await setupSymmetryFixture();
    const listed = await listOmpImportableSessions({ sessionDir: sessionsDir });
    const handles = listed.map((s) => s.providerHandleId);
    expect(handles).toContain(targetHandle);

    await expectAllHandlesResolve(handles, sessionsDir);
  });
});
