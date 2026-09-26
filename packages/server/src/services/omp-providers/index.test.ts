import { expect, test, vi } from "vitest";
import { createTestLogger } from "../../test-utils/test-logger.js";
import { FakeOmp } from "../../server/agent/providers/omp/test-utils/fake-omp.js";
import { createOmpProvidersService, OmpProvidersError } from "./index.js";

function deferred() {
  return Promise.withResolvers<void>();
}

test("lists providers with connected providers first", async () => {
  const runtime = new FakeOmp();
  runtime.loginProviders = [
    { id: "z", name: "Zulu", available: true },
    { id: "a", name: "Alpha", authenticated: true },
  ];
  const service = createOmpProvidersService({ logger: createTestLogger(), runtime });

  await expect(service.listProviders()).resolves.toEqual([
    { id: "a", name: "Alpha", authenticated: true, available: false },
    { id: "z", name: "Zulu", authenticated: false, available: true },
  ]);
});

test("maps login extension UI requests and drops non-http URLs", async () => {
  const runtime = new FakeOmp();
  const login = deferred();
  runtime.nextLoginPromise = login.promise;
  const service = createOmpProvidersService({ logger: createTestLogger(), runtime });
  const events: unknown[] = [];
  const handle = await service.startLogin("deepseek", (event) => events.push(event));
  const session = runtime.latestSession();
  session.emit({
    type: "extension_ui_request",
    id: "url",
    method: "open_url",
    url: "https://platform.deepseek.com/api_keys",
    instructions: "Open the page",
  });
  session.emit({
    type: "extension_ui_request",
    id: "input",
    method: "input",
    title: "Paste your DeepSeek API key",
    placeholder: "sk-…",
  });
  session.emit({
    type: "extension_ui_request",
    id: "bad",
    method: "open_url",
    url: "file:///secret",
  });
  session.emit({
    type: "extension_ui_request",
    id: "notify",
    method: "notify",
    message: "Use this device code",
    notifyType: "warning",
  });

  expect(events).toEqual([
    {
      kind: "open_url",
      uiRequestId: "url",
      url: "https://platform.deepseek.com/api_keys",
      instructions: "Open the page",
    },
    {
      kind: "input",
      uiRequestId: "input",
      title: "Paste your DeepSeek API key",
      placeholder: "sk-…",
      secret: true,
    },
    { kind: "notify", message: "Use this device code", level: "warning" },
  ]);
  handle.respond("input", { value: "never-log-me" });
  expect(session.extensionUiResponses).toEqual([
    { id: "input", response: { value: "never-log-me" } },
  ]);
  await handle.cancel();
  login.resolve();
});

test("emits completion and failures, validates IDs, and runs logout", async () => {
  const runtime = new FakeOmp();
  const execute = vi.fn(async () => ({ stdout: "", stderr: "" }));
  const service = createOmpProvidersService({ logger: createTestLogger(), runtime, execute });
  const completed: unknown[] = [];
  await service.startLogin("kimi-code", (event) => completed.push(event));
  await new Promise((resolve) => setImmediate(resolve));
  expect(completed).toContainEqual({ kind: "completed" });

  runtime.nextLoginError = new Error("provider refused sign-in");
  const failed: unknown[] = [];
  await service.startLogin("deepseek", (event) => failed.push(event));
  await new Promise((resolve) => setImmediate(resolve));
  expect(failed).toContainEqual({ kind: "failed", error: "provider refused sign-in" });

  await expect(service.startLogin("../bad", () => {})).rejects.toEqual(
    new OmpProvidersError("invalid_provider"),
  );
  await service.logout("deepseek");
  expect(execute).toHaveBeenCalledWith(
    process.env.OMP_COMMAND ?? "omp",
    ["auth-broker", "logout", "deepseek"],
    { timeout: 30_000, maxBuffer: 1024 * 1024 },
  );
});
