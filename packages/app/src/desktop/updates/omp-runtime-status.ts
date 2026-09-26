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
