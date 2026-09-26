import { z } from "zod";
import type {
  OmpHookStatusState,
  OmpHookTitleState,
  OmpHookWidgetPlacement,
  OmpHookWidgetState,
} from "@ohmypcode/protocol/messages";

// Mirror of the protocol's `OmpHookWidgetStateSchema` / etc. Re-declared with
// `zod` here so the client can validate the wire shape defensively (the
// server already validates before emitting, but the snapshot pipeline
// re-emits the value through `runtimeInfo.extra[stateKey]` where it can be
// `undefined` / null / a stale payload from a previous OMP version).
export const ompHookWidgetPlacementSchema: z.ZodType<OmpHookWidgetPlacement> = z.enum([
  "aboveEditor",
  "belowEditor",
]);

export const ompHookWidgetStateSchema: z.ZodType<OmpHookWidgetState> = z.object({
  widgetKey: z.string().min(1),
  widgetLines: z.array(z.string()).max(10),
  widgetPlacement: ompHookWidgetPlacementSchema.optional(),
});

export const ompHookStatusStateSchema: z.ZodType<OmpHookStatusState> = z.object({
  statusKey: z.string().min(1),
  statusText: z.string().nullable(),
});

export const ompHookTitleStateSchema: z.ZodType<OmpHookTitleState> = z.object({
  title: z.string(),
});

export function parseOmpHookWidgetState(value: unknown): OmpHookWidgetState | null {
  const parsed = ompHookWidgetStateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseOmpHookStatusState(value: unknown): OmpHookStatusState | null {
  const parsed = ompHookStatusStateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseOmpHookTitleState(value: unknown): OmpHookTitleState | null {
  const parsed = ompHookTitleStateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
