/**
 * Map a server-reported OMP command overlay name to a workspace target that
 * we can open with the existing layout-store helpers. `name` is the slash
 * command's own canonical name (`spec.name` in the fork's `rpc-slash.ts`,
 * passed through verbatim by `omp-parity-session-controller.ts`) — e.g.
 * `/vibe` reports `"vibe"`, `/settings` reports `"settings"`, `/hotkeys`
 * reports `"hotkeys"` — NOT our
 * `omp_*` panel-kind strings. When no panel kind currently owns the overlay
 * (e.g. a Phase-10 screen hasn't landed yet), callers must fall back to
 * surfacing `output` directly.
 */
export function resolveOmpCommandOverlayTarget(input: {
  name: string;
  agentId: string;
}):
  | { kind: "omp_vibe"; agentId: string; workerId: string | null }
  | { kind: "omp_settings"; agentId: string }
  | { kind: "omp_keybindings"; agentId: string }
  | null {
  if (input.name === "vibe") {
    return { kind: "omp_vibe", agentId: input.agentId, workerId: null };
  }
  if (input.name === "settings") {
    return { kind: "omp_settings", agentId: input.agentId };
  }
  if (input.name === "hotkeys") {
    return { kind: "omp_keybindings", agentId: input.agentId };
  }
  return null;
}
