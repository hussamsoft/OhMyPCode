import { z } from "zod";
import { invokeDesktopCommand } from "@/desktop/electron/invoke";

const OmpRuntimeStatusSchema = z.object({
  kind: z.enum(["bundled", "system", "unavailable"]).catch("unavailable"),
  ompVersion: z.string().nullable().catch(null),
  sourceCommit: z.string().nullable().catch(null),
  liveProbedVersion: z.string().nullable().catch(null),
  isStale: z.boolean().catch(false),
});

export type OmpRuntimeStatus = z.infer<typeof OmpRuntimeStatusSchema>;

const UNAVAILABLE_STATUS: OmpRuntimeStatus = {
  kind: "unavailable",
  ompVersion: null,
  sourceCommit: null,
  liveProbedVersion: null,
  isStale: false,
};

export function parseOmpRuntimeStatus(raw: unknown): OmpRuntimeStatus {
  const result = OmpRuntimeStatusSchema.safeParse(raw);
  return result.success ? result.data : UNAVAILABLE_STATUS;
}

export async function getOmpRuntimeStatus(): Promise<OmpRuntimeStatus> {
  const result = await invokeDesktopCommand<unknown>("desktop_get_omp_runtime_status");
  return parseOmpRuntimeStatus(result);
}

/** Absolute path to the bundled OMP runtime binary this desktop build ships,
 * or null when no bundled runtime is present (dev build without one, or the
 * `resourcesPath/omp/<platform>-<arch>/...` lookup failed in a packaged app).
 * Used by the workspace terminal overflow menu's "Open OMP TUI" escape hatch
 * to spawn the bundled `omp` binary inside a workspace terminal. Outside the
 * Electron shell this resolves to `invokeDesktopCommand` throwing -- callers
 * gate on `isElectronRuntime()` first. */
export async function getOmpRuntimePath(): Promise<string | null> {
  const result = await invokeDesktopCommand<unknown>("desktop_get_omp_runtime_path");
  if (typeof result !== "string" || result.length === 0) {
    return null;
  }
  return result;
}
