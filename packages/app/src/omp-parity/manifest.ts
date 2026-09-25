/**
 * OMP Parity Manifest — Machine-checked contract between OhMyPCode and OMP.
 * Hand-owned contract.
 */

export interface OmpParityEntry {
  /** Unique identifier: "<surface>:<name>" */
  id: string;
  /** Surface category */
  surface:
    | "flag"
    | "subcommand"
    | "slash"
    | "rpc"
    | "tool"
    | "mode"
    | "setting"
    | "keybinding"
    | "composerTrigger"
    | "overlay"
    | "segment";
  /** Exact OMP identifier */
  name: string;
  /** Transport binding */
  transport: "rpc" | "session" | "settings" | "none" | "terminal";
  /** Application location (route, panel kind, or control ID) */
  guiHome: string;
  /** Server capability feature flag required for RPC transport */
  capability?: string;
  /** Rationale when mapped to terminal:omp-tui escape hatch */
  reason?: string;
}

export const OMP_PARITY_MANIFEST: readonly OmpParityEntry[] = [
  {
    id: "composerTrigger:!",
    surface: "composerTrigger",
    name: "!",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Composer prompt trigger; escape hatch via bundled OMP TUI terminal until Phase 9 input deck triggers land",
  },
  {
    id: "composerTrigger:!!",
    surface: "composerTrigger",
    name: "!!",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Composer prompt trigger; escape hatch via bundled OMP TUI terminal until Phase 9 input deck triggers land",
  },
  {
    id: "composerTrigger:#",
    surface: "composerTrigger",
    name: "#",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Composer prompt trigger; escape hatch via bundled OMP TUI terminal until Phase 9 input deck triggers land",
  },
  {
    id: "composerTrigger:#<number>",
    surface: "composerTrigger",
    name: "#<number>",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Composer prompt trigger; escape hatch via bundled OMP TUI terminal until Phase 9 input deck triggers land",
  },
  {
    id: "composerTrigger:$",
    surface: "composerTrigger",
    name: "$",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Composer prompt trigger; escape hatch via bundled OMP TUI terminal until Phase 9 input deck triggers land",
  },
  {
    id: "composerTrigger:$$",
    surface: "composerTrigger",
    name: "$$",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Composer prompt trigger; escape hatch via bundled OMP TUI terminal until Phase 9 input deck triggers land",
  },
  {
    id: "composerTrigger:/",
    surface: "composerTrigger",
    name: "/",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Composer prompt trigger; escape hatch via bundled OMP TUI terminal until Phase 9 input deck triggers land",
  },
  {
    id: "composerTrigger:@file",
    surface: "composerTrigger",
    name: "@file",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Composer prompt trigger; escape hatch via bundled OMP TUI terminal until Phase 9 input deck triggers land",
  },
  {
    id: "flag:--add-dir",
    surface: "flag",
    name: "--add-dir",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--advisor",
    surface: "flag",
    name: "--advisor",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--allow-home",
    surface: "flag",
    name: "--allow-home",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--api-key",
    surface: "flag",
    name: "--api-key",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--append-system-prompt",
    surface: "flag",
    name: "--append-system-prompt",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--approval-mode",
    surface: "flag",
    name: "--approval-mode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--auto-approve",
    surface: "flag",
    name: "--auto-approve",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--config",
    surface: "flag",
    name: "--config",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--continue",
    surface: "flag",
    name: "--continue",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--cwd",
    surface: "flag",
    name: "--cwd",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--export",
    surface: "flag",
    name: "--export",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--extension",
    surface: "flag",
    name: "--extension",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--external-thinking",
    surface: "flag",
    name: "--external-thinking",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--fork",
    surface: "flag",
    name: "--fork",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--from-claude",
    surface: "flag",
    name: "--from-claude",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--from-codex",
    surface: "flag",
    name: "--from-codex",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--help",
    surface: "flag",
    name: "--help",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI informational flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--hide-thinking",
    surface: "flag",
    name: "--hide-thinking",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--hook",
    surface: "flag",
    name: "--hook",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--max-time",
    surface: "flag",
    name: "--max-time",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--mode",
    surface: "flag",
    name: "--mode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--model",
    surface: "flag",
    name: "--model",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--models",
    surface: "flag",
    name: "--models",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--no-extensions",
    surface: "flag",
    name: "--no-extensions",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--no-lsp",
    surface: "flag",
    name: "--no-lsp",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--no-prewalk",
    surface: "flag",
    name: "--no-prewalk",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--no-pty",
    surface: "flag",
    name: "--no-pty",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--no-rules",
    surface: "flag",
    name: "--no-rules",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--no-session",
    surface: "flag",
    name: "--no-session",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--no-skills",
    surface: "flag",
    name: "--no-skills",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--no-title",
    surface: "flag",
    name: "--no-title",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--no-tools",
    surface: "flag",
    name: "--no-tools",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--no-ui",
    surface: "flag",
    name: "--no-ui",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Launch-only CLI flag (headless extension mode); escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--plan",
    surface: "flag",
    name: "--plan",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--plan-yolo",
    surface: "flag",
    name: "--plan-yolo",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--plan-yolo-into",
    surface: "flag",
    name: "--plan-yolo-into",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--plugin-dir",
    surface: "flag",
    name: "--plugin-dir",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--prewalk",
    surface: "flag",
    name: "--prewalk",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--prewalk-into",
    surface: "flag",
    name: "--prewalk-into",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--print",
    surface: "flag",
    name: "--print",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--print-thoughts",
    surface: "flag",
    name: "--print-thoughts",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--prompt-cache-key",
    surface: "flag",
    name: "--prompt-cache-key",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--provider",
    surface: "flag",
    name: "--provider",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--provider-session-id",
    surface: "flag",
    name: "--provider-session-id",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--resume",
    surface: "flag",
    name: "--resume",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--service-tier",
    surface: "flag",
    name: "--service-tier",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--session",
    surface: "flag",
    name: "--session",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--session-dir",
    surface: "flag",
    name: "--session-dir",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--skills",
    surface: "flag",
    name: "--skills",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--slow",
    surface: "flag",
    name: "--slow",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--smol",
    surface: "flag",
    name: "--smol",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--system-prompt",
    surface: "flag",
    name: "--system-prompt",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--system-prompt-template",
    surface: "flag",
    name: "--system-prompt-template",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--thinking",
    surface: "flag",
    name: "--thinking",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--tools",
    surface: "flag",
    name: "--tools",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "flag:--trusted-extension",
    surface: "flag",
    name: "--trusted-extension",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--version",
    surface: "flag",
    name: "--version",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI informational flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:--yolo",
    surface: "flag",
    name: "--yolo",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:-e",
    surface: "flag",
    name: "-e",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "flag:-r",
    surface: "flag",
    name: "-r",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "Launch-only CLI flag; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "keybinding:app.agents.hub",
    surface: "keybinding",
    name: "app.agents.hub",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.clear",
    surface: "keybinding",
    name: "app.clear",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.clipboard.copyLine",
    surface: "keybinding",
    name: "app.clipboard.copyLine",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.clipboard.copyPrompt",
    surface: "keybinding",
    name: "app.clipboard.copyPrompt",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.clipboard.pasteImage",
    surface: "keybinding",
    name: "app.clipboard.pasteImage",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.clipboard.pasteTextRaw",
    surface: "keybinding",
    name: "app.clipboard.pasteTextRaw",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.display.reset",
    surface: "keybinding",
    name: "app.display.reset",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.editor.external",
    surface: "keybinding",
    name: "app.editor.external",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.exit",
    surface: "keybinding",
    name: "app.exit",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.history.search",
    surface: "keybinding",
    name: "app.history.search",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.interrupt",
    surface: "keybinding",
    name: "app.interrupt",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.live.toggle",
    surface: "keybinding",
    name: "app.live.toggle",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.message.dequeue",
    surface: "keybinding",
    name: "app.message.dequeue",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.message.followUp",
    surface: "keybinding",
    name: "app.message.followUp",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.model.cycleBackward",
    surface: "keybinding",
    name: "app.model.cycleBackward",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.model.cycleForward",
    surface: "keybinding",
    name: "app.model.cycleForward",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.model.select",
    surface: "keybinding",
    name: "app.model.select",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.model.selectTemporary",
    surface: "keybinding",
    name: "app.model.selectTemporary",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.plan.toggle",
    surface: "keybinding",
    name: "app.plan.toggle",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.retry",
    surface: "keybinding",
    name: "app.retry",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.session.delete",
    surface: "keybinding",
    name: "app.session.delete",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.session.deleteNoninvasive",
    surface: "keybinding",
    name: "app.session.deleteNoninvasive",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.session.fork",
    surface: "keybinding",
    name: "app.session.fork",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.session.new",
    surface: "keybinding",
    name: "app.session.new",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.session.observe",
    surface: "keybinding",
    name: "app.session.observe",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.session.rename",
    surface: "keybinding",
    name: "app.session.rename",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.session.resume",
    surface: "keybinding",
    name: "app.session.resume",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.session.togglePath",
    surface: "keybinding",
    name: "app.session.togglePath",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.session.toggleSort",
    surface: "keybinding",
    name: "app.session.toggleSort",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.session.tree",
    surface: "keybinding",
    name: "app.session.tree",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.stt.toggle",
    surface: "keybinding",
    name: "app.stt.toggle",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.suspend",
    surface: "keybinding",
    name: "app.suspend",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.thinking.cycle",
    surface: "keybinding",
    name: "app.thinking.cycle",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.thinking.toggle",
    surface: "keybinding",
    name: "app.thinking.toggle",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.tools.expand",
    surface: "keybinding",
    name: "app.tools.expand",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.tools.toggleVisibility",
    surface: "keybinding",
    name: "app.tools.toggleVisibility",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.tree.foldOrUp",
    surface: "keybinding",
    name: "app.tree.foldOrUp",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:app.tree.unfoldOrDown",
    surface: "keybinding",
    name: "app.tree.unfoldOrDown",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.cursorDown",
    surface: "keybinding",
    name: "tui.editor.cursorDown",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.cursorLeft",
    surface: "keybinding",
    name: "tui.editor.cursorLeft",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.cursorLineEnd",
    surface: "keybinding",
    name: "tui.editor.cursorLineEnd",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.cursorLineStart",
    surface: "keybinding",
    name: "tui.editor.cursorLineStart",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.cursorRight",
    surface: "keybinding",
    name: "tui.editor.cursorRight",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.cursorUp",
    surface: "keybinding",
    name: "tui.editor.cursorUp",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.cursorWordLeft",
    surface: "keybinding",
    name: "tui.editor.cursorWordLeft",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.cursorWordRight",
    surface: "keybinding",
    name: "tui.editor.cursorWordRight",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.deleteCharBackward",
    surface: "keybinding",
    name: "tui.editor.deleteCharBackward",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.deleteCharForward",
    surface: "keybinding",
    name: "tui.editor.deleteCharForward",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.deleteToLineEnd",
    surface: "keybinding",
    name: "tui.editor.deleteToLineEnd",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.deleteToLineStart",
    surface: "keybinding",
    name: "tui.editor.deleteToLineStart",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.deleteWordBackward",
    surface: "keybinding",
    name: "tui.editor.deleteWordBackward",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.deleteWordForward",
    surface: "keybinding",
    name: "tui.editor.deleteWordForward",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.jumpBackward",
    surface: "keybinding",
    name: "tui.editor.jumpBackward",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.jumpForward",
    surface: "keybinding",
    name: "tui.editor.jumpForward",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.pageDown",
    surface: "keybinding",
    name: "tui.editor.pageDown",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.pageUp",
    surface: "keybinding",
    name: "tui.editor.pageUp",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.spellingSuggestions",
    surface: "keybinding",
    name: "tui.editor.spellingSuggestions",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.undo",
    surface: "keybinding",
    name: "tui.editor.undo",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.yank",
    surface: "keybinding",
    name: "tui.editor.yank",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.editor.yankPop",
    surface: "keybinding",
    name: "tui.editor.yankPop",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.input.copy",
    surface: "keybinding",
    name: "tui.input.copy",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.input.newLine",
    surface: "keybinding",
    name: "tui.input.newLine",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.input.submit",
    surface: "keybinding",
    name: "tui.input.submit",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.input.tab",
    surface: "keybinding",
    name: "tui.input.tab",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.select.cancel",
    surface: "keybinding",
    name: "tui.select.cancel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.select.confirm",
    surface: "keybinding",
    name: "tui.select.confirm",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.select.down",
    surface: "keybinding",
    name: "tui.select.down",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.select.pageDown",
    surface: "keybinding",
    name: "tui.select.pageDown",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.select.pageUp",
    surface: "keybinding",
    name: "tui.select.pageUp",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "keybinding:tui.select.up",
    surface: "keybinding",
    name: "tui.select.up",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP keybinding; escape hatch via bundled OMP TUI terminal until Phase 10 keybindings editor lands",
  },
  {
    id: "mode:advisor",
    surface: "mode",
    name: "advisor",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode transition; escape hatch via bundled OMP TUI terminal until Phase 3 RPC and Phase 9 deck modes land",
  },
  {
    id: "mode:fast",
    surface: "mode",
    name: "fast",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode transition; escape hatch via bundled OMP TUI terminal until Phase 3 RPC and Phase 9 deck modes land",
  },
  {
    id: "mode:goal",
    surface: "mode",
    name: "goal",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode transition; escape hatch via bundled OMP TUI terminal until Phase 3 RPC and Phase 9 deck modes land",
  },
  {
    id: "mode:goal_paused",
    surface: "mode",
    name: "goal_paused",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode transition; escape hatch via bundled OMP TUI terminal until Phase 3 RPC and Phase 9 deck modes land",
  },
  {
    id: "mode:loop",
    surface: "mode",
    name: "loop",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode transition; escape hatch via bundled OMP TUI terminal until Phase 3 RPC and Phase 9 deck modes land",
  },
  {
    id: "mode:loop_paused",
    surface: "mode",
    name: "loop_paused",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode transition; escape hatch via bundled OMP TUI terminal until Phase 3 RPC and Phase 9 deck modes land",
  },
  {
    id: "mode:none",
    surface: "mode",
    name: "none",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode transition; escape hatch via bundled OMP TUI terminal until Phase 3 RPC and Phase 9 deck modes land",
  },
  {
    id: "mode:plan",
    surface: "mode",
    name: "plan",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode transition; escape hatch via bundled OMP TUI terminal until Phase 3 RPC and Phase 9 deck modes land",
  },
  {
    id: "mode:plan_paused",
    surface: "mode",
    name: "plan_paused",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode transition; escape hatch via bundled OMP TUI terminal until Phase 3 RPC and Phase 9 deck modes land",
  },
  {
    id: "mode:prewalk",
    surface: "mode",
    name: "prewalk",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode transition; escape hatch via bundled OMP TUI terminal until Phase 3 RPC and Phase 9 deck modes land",
  },
  {
    id: "mode:vibe",
    surface: "mode",
    name: "vibe",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "overlay:advisor-config",
    surface: "overlay",
    name: "advisor-config",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:agent-activity",
    surface: "overlay",
    name: "agent-activity",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:agent-hub",
    surface: "overlay",
    name: "agent-hub",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:agent-hub-projection",
    surface: "overlay",
    name: "agent-hub-projection",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:agent-hub-renderer",
    surface: "overlay",
    name: "agent-hub-renderer",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:agent-hub-types",
    surface: "overlay",
    name: "agent-hub-types",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:agent-transcript-viewer",
    surface: "overlay",
    name: "agent-transcript-viewer",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:agents-hub",
    surface: "overlay",
    name: "agents-hub",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:annotation-overlay",
    surface: "overlay",
    name: "annotation-overlay",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:annotation-types",
    surface: "overlay",
    name: "annotation-types",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay support module; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:ask-dialog",
    surface: "overlay",
    name: "ask-dialog",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:bordered-loader",
    surface: "overlay",
    name: "bordered-loader",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:btw-history",
    surface: "overlay",
    name: "btw-history",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:btw-history-panel",
    surface: "overlay",
    name: "btw-history-panel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:btw-panel",
    surface: "overlay",
    name: "btw-panel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:cleanse-panel",
    surface: "overlay",
    name: "cleanse-panel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:codex-reset-fireworks",
    surface: "overlay",
    name: "codex-reset-fireworks",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:composer-shape-preview",
    surface: "overlay",
    name: "composer-shape-preview",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:composer-shape-registry",
    surface: "overlay",
    name: "composer-shape-registry",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:copy-selector",
    surface: "overlay",
    name: "copy-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:copy-targets",
    surface: "overlay",
    name: "copy-targets",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:error-banner",
    surface: "overlay",
    name: "error-banner",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:extensions",
    surface: "overlay",
    name: "extensions",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:history-search",
    surface: "overlay",
    name: "history-search",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:hook-editor",
    surface: "overlay",
    name: "hook-editor",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:hook-input",
    surface: "overlay",
    name: "hook-input",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:hook-selector",
    surface: "overlay",
    name: "hook-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:hub-frame",
    surface: "overlay",
    name: "hub-frame",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:login-dialog",
    surface: "overlay",
    name: "login-dialog",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:logout-account-selector",
    surface: "overlay",
    name: "logout-account-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:mcp-add-wizard",
    surface: "overlay",
    name: "mcp-add-wizard",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:model-browser",
    surface: "overlay",
    name: "model-browser",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:model-hub",
    surface: "overlay",
    name: "model-hub",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:model-picker",
    surface: "overlay",
    name: "model-picker",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:model-selector",
    surface: "overlay",
    name: "model-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:move-overlay",
    surface: "overlay",
    name: "move-overlay",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:oauth-selector",
    surface: "overlay",
    name: "oauth-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:omfg-panel",
    surface: "overlay",
    name: "omfg-panel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:pause-screen",
    surface: "overlay",
    name: "pause-screen",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:plan-review-overlay",
    surface: "overlay",
    name: "plan-review-overlay",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:plan-save-overlay",
    surface: "overlay",
    name: "plan-save-overlay",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:plan-toc",
    surface: "overlay",
    name: "plan-toc",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:plugin-selector",
    surface: "overlay",
    name: "plugin-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:plugin-settings",
    surface: "overlay",
    name: "plugin-settings",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:queue-mode-selector",
    surface: "overlay",
    name: "queue-mode-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:reset-usage-selector",
    surface: "overlay",
    name: "reset-usage-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:rewind-selector",
    surface: "overlay",
    name: "rewind-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:running-subagent-badge",
    surface: "overlay",
    name: "running-subagent-badge",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:session-account-selector",
    surface: "overlay",
    name: "session-account-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:session-info-overlay",
    surface: "overlay",
    name: "session-info-overlay",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:session-observer-registry",
    surface: "overlay",
    name: "session-observer-registry",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:session-selector",
    surface: "overlay",
    name: "session-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:settings-defs",
    surface: "overlay",
    name: "settings-defs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:settings-selector",
    surface: "overlay",
    name: "settings-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:show-images-selector",
    surface: "overlay",
    name: "show-images-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:snapcompact-shape-preview",
    surface: "overlay",
    name: "snapcompact-shape-preview",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:theme-selector",
    surface: "overlay",
    name: "theme-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:thinking-selector",
    surface: "overlay",
    name: "thinking-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:tiny-title-download-progress",
    surface: "overlay",
    name: "tiny-title-download-progress",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:tree-selector",
    surface: "overlay",
    name: "tree-selector",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:usage-dashboard",
    surface: "overlay",
    name: "usage-dashboard",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:usage-display",
    surface: "overlay",
    name: "usage-display",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "overlay:usage-row",
    surface: "overlay",
    name: "usage-row",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "TUI overlay screen; escape hatch via bundled OMP TUI terminal until Phase 10 screens land",
  },
  {
    id: "rpc:abort",
    surface: "rpc",
    name: "abort",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:abort_and_prompt",
    surface: "rpc",
    name: "abort_and_prompt",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:abort_bash",
    surface: "rpc",
    name: "abort_bash",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:abort_retry",
    surface: "rpc",
    name: "abort_retry",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:bash",
    surface: "rpc",
    name: "bash",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:branch",
    surface: "rpc",
    name: "branch",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:compact",
    surface: "rpc",
    name: "compact",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:cycle_model",
    surface: "rpc",
    name: "cycle_model",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:cycle_thinking_level",
    surface: "rpc",
    name: "cycle_thinking_level",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:export_html",
    surface: "rpc",
    name: "export_html",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:follow_up",
    surface: "rpc",
    name: "follow_up",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_available_commands",
    surface: "rpc",
    name: "get_available_commands",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_available_models",
    surface: "rpc",
    name: "get_available_models",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_available_thinking_levels",
    surface: "rpc",
    name: "get_available_thinking_levels",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_branch_messages",
    surface: "rpc",
    name: "get_branch_messages",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_entries",
    surface: "rpc",
    name: "get_entries",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_last_assistant_text",
    surface: "rpc",
    name: "get_last_assistant_text",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_login_providers",
    surface: "rpc",
    name: "get_login_providers",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_messages",
    surface: "rpc",
    name: "get_messages",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_messages_page",
    surface: "rpc",
    name: "get_messages_page",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_modes",
    surface: "rpc",
    name: "get_modes",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode control; escape hatch via bundled OMP TUI terminal until the Phase 9 mode deck lands",
  },
  {
    id: "rpc:get_session_stats",
    surface: "rpc",
    name: "get_session_stats",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_state",
    surface: "rpc",
    name: "get_state",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_subagent_messages",
    surface: "rpc",
    name: "get_subagent_messages",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_subagents",
    surface: "rpc",
    name: "get_subagents",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:get_tool_catalog",
    surface: "rpc",
    name: "get_tool_catalog",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "rpc:get_tree",
    surface: "rpc",
    name: "get_tree",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:handoff",
    surface: "rpc",
    name: "handoff",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:login",
    surface: "rpc",
    name: "login",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:negotiate_protocol",
    surface: "rpc",
    name: "negotiate_protocol",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:new_session",
    surface: "rpc",
    name: "new_session",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:open_session",
    surface: "rpc",
    name: "open_session",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:prompt",
    surface: "rpc",
    name: "prompt",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_auto_compaction",
    surface: "rpc",
    name: "set_auto_compaction",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_auto_retry",
    surface: "rpc",
    name: "set_auto_retry",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_event_filter",
    surface: "rpc",
    name: "set_event_filter",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_fast_mode",
    surface: "rpc",
    name: "set_fast_mode",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_follow_up_mode",
    surface: "rpc",
    name: "set_follow_up_mode",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_host_tools",
    surface: "rpc",
    name: "set_host_tools",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_host_uri_schemes",
    surface: "rpc",
    name: "set_host_uri_schemes",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_interrupt_mode",
    surface: "rpc",
    name: "set_interrupt_mode",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_mode",
    surface: "rpc",
    name: "set_mode",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "Mode control; escape hatch via bundled OMP TUI terminal until the Phase 9 mode deck lands",
  },
  {
    id: "rpc:set_model",
    surface: "rpc",
    name: "set_model",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_session_name",
    surface: "rpc",
    name: "set_session_name",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_steering_mode",
    surface: "rpc",
    name: "set_steering_mode",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_subagent_subscription",
    surface: "rpc",
    name: "set_subagent_subscription",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_thinking_level",
    surface: "rpc",
    name: "set_thinking_level",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_todos",
    surface: "rpc",
    name: "set_todos",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:set_tool_selection",
    surface: "rpc",
    name: "set_tool_selection",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "rpc:steer",
    surface: "rpc",
    name: "steer",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:switch_session",
    surface: "rpc",
    name: "switch_session",
    transport: "rpc",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP RPC command; escape hatch via bundled OMP TUI terminal until native host dispatch lands",
  },
  {
    id: "rpc:vibe_enter",
    surface: "rpc",
    name: "vibe_enter",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "rpc:vibe_exit",
    surface: "rpc",
    name: "vibe_exit",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "rpc:vibe_kill",
    surface: "rpc",
    name: "vibe_kill",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "rpc:vibe_list",
    surface: "rpc",
    name: "vibe_list",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "rpc:vibe_send",
    surface: "rpc",
    name: "vibe_send",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "rpc:vibe_spawn",
    surface: "rpc",
    name: "vibe_spawn",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "rpc:vibe_status",
    surface: "rpc",
    name: "vibe_status",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "rpc:vibe_wait",
    surface: "rpc",
    name: "vibe_wait",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "segment:cache_hit",
    surface: "segment",
    name: "cache_hit",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:cache_read",
    surface: "segment",
    name: "cache_read",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:cache_write",
    surface: "segment",
    name: "cache_write",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:collab",
    surface: "segment",
    name: "collab",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:context_pct",
    surface: "segment",
    name: "context_pct",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:context_total",
    surface: "segment",
    name: "context_total",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:cost",
    surface: "segment",
    name: "cost",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:git",
    surface: "segment",
    name: "git",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:hostname",
    surface: "segment",
    name: "hostname",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:mode",
    surface: "segment",
    name: "mode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:model",
    surface: "segment",
    name: "model",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:path",
    surface: "segment",
    name: "path",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:pi",
    surface: "segment",
    name: "pi",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:pr",
    surface: "segment",
    name: "pr",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:session",
    surface: "segment",
    name: "session",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:session_name",
    surface: "segment",
    name: "session_name",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:status",
    surface: "segment",
    name: "status",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:stream",
    surface: "segment",
    name: "stream",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:subagents",
    surface: "segment",
    name: "subagents",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:time",
    surface: "segment",
    name: "time",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:time_spent",
    surface: "segment",
    name: "time_spent",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:token_in",
    surface: "segment",
    name: "token_in",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:token_out",
    surface: "segment",
    name: "token_out",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:token_rate",
    surface: "segment",
    name: "token_rate",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:token_total",
    surface: "segment",
    name: "token_total",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:usage",
    surface: "segment",
    name: "usage",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "segment:vim",
    surface: "segment",
    name: "vim",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Status line segment; escape hatch via bundled OMP TUI terminal until Phase 8 status bar lands",
  },
  {
    id: "setting:advisor.enabled",
    surface: "setting",
    name: "advisor.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:advisor.immuneTurns",
    surface: "setting",
    name: "advisor.immuneTurns",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:advisor.maxNotesPerUpdate",
    surface: "setting",
    name: "advisor.maxNotesPerUpdate",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:advisor.syncBacklog",
    surface: "setting",
    name: "advisor.syncBacklog",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ask.enabled",
    surface: "setting",
    name: "ask.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ask.notify",
    surface: "setting",
    name: "ask.notify",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ask.timeout",
    surface: "setting",
    name: "ask.timeout",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:astEdit.enabled",
    surface: "setting",
    name: "astEdit.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:astGrep.enabled",
    surface: "setting",
    name: "astGrep.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:async.enabled",
    surface: "setting",
    name: "async.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:autoResume",
    surface: "setting",
    name: "autoResume",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:autocompleteMaxVisible",
    surface: "setting",
    name: "autocompleteMaxVisible",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:autolearn.autoContinue",
    surface: "setting",
    name: "autolearn.autoContinue",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:autolearn.enabled",
    surface: "setting",
    name: "autolearn.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:bash.allowCompoundCommands",
    surface: "setting",
    name: "bash.allowCompoundCommands",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:bash.autoBackground.enabled",
    surface: "setting",
    name: "bash.autoBackground.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:bash.direnv",
    surface: "setting",
    name: "bash.direnv",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:bash.direnvLoadTimeoutMs",
    surface: "setting",
    name: "bash.direnvLoadTimeoutMs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:bash.enabled",
    surface: "setting",
    name: "bash.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:bash.patterns",
    surface: "setting",
    name: "bash.patterns",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:bashInterceptor.enabled",
    surface: "setting",
    name: "bashInterceptor.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:branchSummary.enabled",
    surface: "setting",
    name: "branchSummary.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:browser.cdpUrl",
    surface: "setting",
    name: "browser.cdpUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:browser.cmux",
    surface: "setting",
    name: "browser.cmux",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:browser.enabled",
    surface: "setting",
    name: "browser.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:browser.freezeOnTurnEnd",
    surface: "setting",
    name: "browser.freezeOnTurnEnd",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:browser.headless",
    surface: "setting",
    name: "browser.headless",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:browser.idleCloseSec",
    surface: "setting",
    name: "browser.idleCloseSec",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:browser.relay",
    surface: "setting",
    name: "browser.relay",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:browser.relayUrl",
    surface: "setting",
    name: "browser.relayUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:browser.screenshotDir",
    surface: "setting",
    name: "browser.screenshotDir",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:checkpoint.enabled",
    surface: "setting",
    name: "checkpoint.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:claudeResets.autoRedeem",
    surface: "setting",
    name: "claudeResets.autoRedeem",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:claudeResets.keepCredits",
    surface: "setting",
    name: "claudeResets.keepCredits",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:claudeResets.minBlockedMinutes",
    surface: "setting",
    name: "claudeResets.minBlockedMinutes",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:claudeResets.salvageHorizonHours",
    surface: "setting",
    name: "claudeResets.salvageHorizonHours",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:codexResets.autoRedeem",
    surface: "setting",
    name: "codexResets.autoRedeem",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:codexResets.keepCredits",
    surface: "setting",
    name: "codexResets.keepCredits",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:codexResets.minBlockedMinutes",
    surface: "setting",
    name: "codexResets.minBlockedMinutes",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:codexResets.salvageHorizonHours",
    surface: "setting",
    name: "codexResets.salvageHorizonHours",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:collab.autoStart",
    surface: "setting",
    name: "collab.autoStart",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:collab.displayName",
    surface: "setting",
    name: "collab.displayName",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:collab.relayUrl",
    surface: "setting",
    name: "collab.relayUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:collab.webUrl",
    surface: "setting",
    name: "collab.webUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:colorBlindMode",
    surface: "setting",
    name: "colorBlindMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:commands.enableClaudeProject",
    surface: "setting",
    name: "commands.enableClaudeProject",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:commands.enableClaudeUser",
    surface: "setting",
    name: "commands.enableClaudeUser",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:commands.enableOpencodeProject",
    surface: "setting",
    name: "commands.enableOpencodeProject",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:commands.enableOpencodeUser",
    surface: "setting",
    name: "commands.enableOpencodeUser",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.asyncEnabled",
    surface: "setting",
    name: "compaction.asyncEnabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.dropUseless",
    surface: "setting",
    name: "compaction.dropUseless",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.enabled",
    surface: "setting",
    name: "compaction.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.experimentalContextManagement",
    surface: "setting",
    name: "compaction.experimentalContextManagement",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.handoffSaveToDisk",
    surface: "setting",
    name: "compaction.handoffSaveToDisk",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.idleEnabled",
    surface: "setting",
    name: "compaction.idleEnabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.idleThresholdTokens",
    surface: "setting",
    name: "compaction.idleThresholdTokens",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.idleTimeoutSeconds",
    surface: "setting",
    name: "compaction.idleTimeoutSeconds",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.methodOrder",
    surface: "setting",
    name: "compaction.methodOrder",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.midTurnEnabled",
    surface: "setting",
    name: "compaction.midTurnEnabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.remoteStreamingV2Enabled",
    surface: "setting",
    name: "compaction.remoteStreamingV2Enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.supersedeReads",
    surface: "setting",
    name: "compaction.supersedeReads",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.thresholdPercent",
    surface: "setting",
    name: "compaction.thresholdPercent",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:compaction.thresholdTokens",
    surface: "setting",
    name: "compaction.thresholdTokens",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:completion.notify",
    surface: "setting",
    name: "completion.notify",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:composer.recallClearedDrafts",
    surface: "setting",
    name: "composer.recallClearedDrafts",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:composer.shape",
    surface: "setting",
    name: "composer.shape",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:composer.tokenRate",
    surface: "setting",
    name: "composer.tokenRate",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:computer.display",
    surface: "setting",
    name: "computer.display",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:computer.enabled",
    surface: "setting",
    name: "computer.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:computer.maxHeight",
    surface: "setting",
    name: "computer.maxHeight",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:computer.maxWidth",
    surface: "setting",
    name: "computer.maxWidth",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:contextPromotion.enabled",
    surface: "setting",
    name: "contextPromotion.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:debug.enabled",
    surface: "setting",
    name: "debug.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:defaultThinkingLevel",
    surface: "setting",
    name: "defaultThinkingLevel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:dev.autoqa",
    surface: "setting",
    name: "dev.autoqa",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:dev.autoqaPush.endpoint",
    surface: "setting",
    name: "dev.autoqaPush.endpoint",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:display.cacheMissMarker",
    surface: "setting",
    name: "display.cacheMissMarker",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:display.collapseCompacted",
    surface: "setting",
    name: "display.collapseCompacted",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:display.hideToolActivity",
    surface: "setting",
    name: "display.hideToolActivity",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:display.pinnedAgents",
    surface: "setting",
    name: "display.pinnedAgents",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:display.shimmer",
    surface: "setting",
    name: "display.shimmer",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:display.showTokenUsage",
    surface: "setting",
    name: "display.showTokenUsage",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:display.showTurnTime",
    surface: "setting",
    name: "display.showTurnTime",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:display.smoothStreaming",
    surface: "setting",
    name: "display.smoothStreaming",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:doubleEscapeAction",
    surface: "setting",
    name: "doubleEscapeAction",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:edit.autoRepair.enabled",
    surface: "setting",
    name: "edit.autoRepair.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:edit.blackbox.enabled",
    surface: "setting",
    name: "edit.blackbox.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:edit.blockAutoGenerated",
    surface: "setting",
    name: "edit.blockAutoGenerated",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:edit.enforceSeenLines",
    surface: "setting",
    name: "edit.enforceSeenLines",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:edit.fuzzyMatch",
    surface: "setting",
    name: "edit.fuzzyMatch",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:edit.fuzzyThreshold",
    surface: "setting",
    name: "edit.fuzzyThreshold",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:edit.mode",
    surface: "setting",
    name: "edit.mode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:edit.recoverInlineEdits",
    surface: "setting",
    name: "edit.recoverInlineEdits",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:edit.streamingAbort",
    surface: "setting",
    name: "edit.streamingAbort",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:emojiAutocomplete",
    surface: "setting",
    name: "emojiAutocomplete",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:error.notify",
    surface: "setting",
    name: "error.notify",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:eval.autoBackground.enabled",
    surface: "setting",
    name: "eval.autoBackground.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:eval.autoProvision",
    surface: "setting",
    name: "eval.autoProvision",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:eval.js",
    surface: "setting",
    name: "eval.js",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:eval.py",
    surface: "setting",
    name: "eval.py",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:eval.tools.enabled",
    surface: "setting",
    name: "eval.tools.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:eval.workpool.freshAgents",
    surface: "setting",
    name: "eval.workpool.freshAgents",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:exa.enabled",
    surface: "setting",
    name: "exa.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:exa.searchDelayMs",
    surface: "setting",
    name: "exa.searchDelayMs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:extendedContext",
    surface: "setting",
    name: "extendedContext",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:extensionHandlers.toolCallTimeoutMs",
    surface: "setting",
    name: "extensionHandlers.toolCallTimeoutMs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:externalThinking",
    surface: "setting",
    name: "externalThinking",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:features.unexpectedStopDetection",
    surface: "setting",
    name: "features.unexpectedStopDetection",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:fetch.enabled",
    surface: "setting",
    name: "fetch.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:find.enabled",
    surface: "setting",
    name: "find.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:followUpMode",
    surface: "setting",
    name: "followUpMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:generate_image.enabled",
    surface: "setting",
    name: "generate_image.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:git.enabled",
    surface: "setting",
    name: "git.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:github.cache.enabled",
    surface: "setting",
    name: "github.cache.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:github.cache.hardTtlSec",
    surface: "setting",
    name: "github.cache.hardTtlSec",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:github.cache.softTtlSec",
    surface: "setting",
    name: "github.cache.softTtlSec",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:github.enabled",
    surface: "setting",
    name: "github.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:glob.enabled",
    surface: "setting",
    name: "glob.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:goal.continuationModes",
    surface: "setting",
    name: "goal.continuationModes",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:goal.enabled",
    surface: "setting",
    name: "goal.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:goal.statusInFooter",
    surface: "setting",
    name: "goal.statusInFooter",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:grep.contextAfter",
    surface: "setting",
    name: "grep.contextAfter",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:grep.contextBefore",
    surface: "setting",
    name: "grep.contextBefore",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:grep.enabled",
    surface: "setting",
    name: "grep.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:hideThinkingBlock",
    surface: "setting",
    name: "hideThinkingBlock",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:hindsight.apiToken",
    surface: "setting",
    name: "hindsight.apiToken",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:hindsight.apiUrl",
    surface: "setting",
    name: "hindsight.apiUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:hindsight.autoRecall",
    surface: "setting",
    name: "hindsight.autoRecall",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:hindsight.autoRetain",
    surface: "setting",
    name: "hindsight.autoRetain",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:hindsight.bankId",
    surface: "setting",
    name: "hindsight.bankId",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:hindsight.mentalModelAutoSeed",
    surface: "setting",
    name: "hindsight.mentalModelAutoSeed",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:hindsight.mentalModelsEnabled",
    surface: "setting",
    name: "hindsight.mentalModelsEnabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:hindsight.retainMode",
    surface: "setting",
    name: "hindsight.retainMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:hindsight.scoping",
    surface: "setting",
    name: "hindsight.scoping",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ida.enabled",
    surface: "setting",
    name: "ida.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ida.idleCloseSec",
    surface: "setting",
    name: "ida.idleCloseSec",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ida.installDir",
    surface: "setting",
    name: "ida.installDir",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ida.maxOpen",
    surface: "setting",
    name: "ida.maxOpen",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ida.python",
    surface: "setting",
    name: "ida.python",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.autoResize",
    surface: "setting",
    name: "images.autoResize",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.blockImages",
    surface: "setting",
    name: "images.blockImages",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.describeForTextModels",
    surface: "setting",
    name: "images.describeForTextModels",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.questionTimeoutMs",
    surface: "setting",
    name: "images.questionTimeoutMs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.urls.backends",
    surface: "setting",
    name: "images.urls.backends",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.urls.bindHost",
    surface: "setting",
    name: "images.urls.bindHost",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.urls.command",
    surface: "setting",
    name: "images.urls.command",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.urls.enabled",
    surface: "setting",
    name: "images.urls.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.urls.publicBaseUrl",
    surface: "setting",
    name: "images.urls.publicBaseUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.urls.sshRemotePort",
    surface: "setting",
    name: "images.urls.sshRemotePort",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.urls.sshTarget",
    surface: "setting",
    name: "images.urls.sshTarget",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:images.urls.ttlHours",
    surface: "setting",
    name: "images.urls.ttlHours",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:includeModelInPrompt",
    surface: "setting",
    name: "includeModelInPrompt",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:includeWorkspaceTree",
    surface: "setting",
    name: "includeWorkspaceTree",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:inlineToolDescriptors",
    surface: "setting",
    name: "inlineToolDescriptors",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:interruptMode",
    surface: "setting",
    name: "interruptMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:isolation.backend",
    surface: "setting",
    name: "isolation.backend",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:launch.enabled",
    surface: "setting",
    name: "launch.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:live.voice",
    surface: "setting",
    name: "live.voice",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:loop.conditionTimeoutMs",
    surface: "setting",
    name: "loop.conditionTimeoutMs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:loop.mode",
    surface: "setting",
    name: "loop.mode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:lsp.diagnosticsDeduplicate",
    surface: "setting",
    name: "lsp.diagnosticsDeduplicate",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:lsp.diagnosticsOnEdit",
    surface: "setting",
    name: "lsp.diagnosticsOnEdit",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:lsp.diagnosticsOnWrite",
    surface: "setting",
    name: "lsp.diagnosticsOnWrite",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:lsp.enabled",
    surface: "setting",
    name: "lsp.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:lsp.formatOnWrite",
    surface: "setting",
    name: "lsp.formatOnWrite",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:lsp.lazy",
    surface: "setting",
    name: "lsp.lazy",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:lsp.shared",
    surface: "setting",
    name: "lsp.shared",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:magicKeywords.enabled",
    surface: "setting",
    name: "magicKeywords.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:magicKeywords.jevify",
    surface: "setting",
    name: "magicKeywords.jevify",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:magicKeywords.orchestrate",
    surface: "setting",
    name: "magicKeywords.orchestrate",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:magicKeywords.ultrathink",
    surface: "setting",
    name: "magicKeywords.ultrathink",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:magicKeywords.workflow",
    surface: "setting",
    name: "magicKeywords.workflow",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:marketplace.autoUpdate",
    surface: "setting",
    name: "marketplace.autoUpdate",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mcp.enableProjectConfig",
    surface: "setting",
    name: "mcp.enableProjectConfig",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mcp.notificationDebounceMs",
    surface: "setting",
    name: "mcp.notificationDebounceMs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mcp.notifications",
    surface: "setting",
    name: "mcp.notifications",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mcp.renderMarkdownResults",
    surface: "setting",
    name: "mcp.renderMarkdownResults",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mcp.startupTimeoutMs",
    surface: "setting",
    name: "mcp.startupTimeoutMs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:memory.backend",
    surface: "setting",
    name: "memory.backend",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:minP",
    surface: "setting",
    name: "minP",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.autoRecall",
    surface: "setting",
    name: "mnemopi.autoRecall",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.autoRetain",
    surface: "setting",
    name: "mnemopi.autoRetain",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.bank",
    surface: "setting",
    name: "mnemopi.bank",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.dbPath",
    surface: "setting",
    name: "mnemopi.dbPath",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.embeddingApiKey",
    surface: "setting",
    name: "mnemopi.embeddingApiKey",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.embeddingApiUrl",
    surface: "setting",
    name: "mnemopi.embeddingApiUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.embeddingModel",
    surface: "setting",
    name: "mnemopi.embeddingModel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.embeddingVariant",
    surface: "setting",
    name: "mnemopi.embeddingVariant",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.enhancedRecall",
    surface: "setting",
    name: "mnemopi.enhancedRecall",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.llmApiKey",
    surface: "setting",
    name: "mnemopi.llmApiKey",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.llmBaseUrl",
    surface: "setting",
    name: "mnemopi.llmBaseUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.llmMode",
    surface: "setting",
    name: "mnemopi.llmMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.llmModel",
    surface: "setting",
    name: "mnemopi.llmModel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.noEmbeddings",
    surface: "setting",
    name: "mnemopi.noEmbeddings",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.polyphonicRecall",
    surface: "setting",
    name: "mnemopi.polyphonicRecall",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.proactiveLinking",
    surface: "setting",
    name: "mnemopi.proactiveLinking",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:mnemopi.scoping",
    surface: "setting",
    name: "mnemopi.scoping",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:model.loopGuard.checkAssistantContent",
    surface: "setting",
    name: "model.loopGuard.checkAssistantContent",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:model.loopGuard.enabled",
    surface: "setting",
    name: "model.loopGuard.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:model.loopGuard.toolCallReminder",
    surface: "setting",
    name: "model.loopGuard.toolCallReminder",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:model.toolCallLoopGuard.enabled",
    surface: "setting",
    name: "model.toolCallLoopGuard.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:model.toolCallLoopGuard.exemptTools",
    surface: "setting",
    name: "model.toolCallLoopGuard.exemptTools",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:model.toolCallLoopGuard.threshold",
    surface: "setting",
    name: "model.toolCallLoopGuard.threshold",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:modelRoleStorage",
    surface: "setting",
    name: "modelRoleStorage",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:omitThinking",
    surface: "setting",
    name: "omitThinking",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:paste.largeMenuThreshold",
    surface: "setting",
    name: "paste.largeMenuThreshold",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:personality",
    surface: "setting",
    name: "personality",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:plan.autosave",
    surface: "setting",
    name: "plan.autosave",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:plan.autosaveDir",
    surface: "setting",
    name: "plan.autosaveDir",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:plan.defaultOnStartup",
    surface: "setting",
    name: "plan.defaultOnStartup",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:plan.enabled",
    surface: "setting",
    name: "plan.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:power.sleepPrevention",
    surface: "setting",
    name: "power.sleepPrevention",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:presencePenalty",
    surface: "setting",
    name: "presencePenalty",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:prewalk.enabled",
    surface: "setting",
    name: "prewalk.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:proseOnlyThinking",
    surface: "setting",
    name: "proseOnlyThinking",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:provider.appendOnlyContext",
    surface: "setting",
    name: "provider.appendOnlyContext",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.anthropic.serverSideFallback",
    surface: "setting",
    name: "providers.anthropic.serverSideFallback",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.antigravityEndpoint",
    surface: "setting",
    name: "providers.antigravityEndpoint",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.autoThinkingMaxEffort",
    surface: "setting",
    name: "providers.autoThinkingMaxEffort",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.cacheRetention",
    surface: "setting",
    name: "providers.cacheRetention",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.fetch",
    surface: "setting",
    name: "providers.fetch",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.fireworksTier",
    surface: "setting",
    name: "providers.fireworksTier",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.kimiApiFormat",
    surface: "setting",
    name: "providers.kimiApiFormat",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.maxInFlightRequests",
    surface: "setting",
    name: "providers.maxInFlightRequests",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.ollama-cloud.maxConcurrency",
    surface: "setting",
    name: "providers.ollama-cloud.maxConcurrency",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.openai-codex.codeMode",
    surface: "setting",
    name: "providers.openai-codex.codeMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.openai-codex.codeModeDirectTools",
    surface: "setting",
    name: "providers.openai-codex.codeModeDirectTools",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.openaiLiveSteering",
    surface: "setting",
    name: "providers.openaiLiveSteering",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.openaiWebsockets",
    surface: "setting",
    name: "providers.openaiWebsockets",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.openrouterVariant",
    surface: "setting",
    name: "providers.openrouterVariant",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.streamFirstEventTimeoutSeconds",
    surface: "setting",
    name: "providers.streamFirstEventTimeoutSeconds",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.streamIdleTimeoutSeconds",
    surface: "setting",
    name: "providers.streamIdleTimeoutSeconds",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.tinyModelDevice",
    surface: "setting",
    name: "providers.tinyModelDevice",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.tinyModelDtype",
    surface: "setting",
    name: "providers.tinyModelDtype",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:providers.webSearchTimeoutSeconds",
    surface: "setting",
    name: "providers.webSearchTimeoutSeconds",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:python.interpreter",
    surface: "setting",
    name: "python.interpreter",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:python.kernelMode",
    surface: "setting",
    name: "python.kernelMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:read.defaultLimit",
    surface: "setting",
    name: "read.defaultLimit",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:read.renderMarkdown",
    surface: "setting",
    name: "read.renderMarkdown",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:read.summarize.enabled",
    surface: "setting",
    name: "read.summarize.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:read.summarize.minBodyLines",
    surface: "setting",
    name: "read.summarize.minBodyLines",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:read.summarize.minCommentLines",
    surface: "setting",
    name: "read.summarize.minCommentLines",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:read.summarize.minTotalLines",
    surface: "setting",
    name: "read.summarize.minTotalLines",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:read.summarize.prose",
    surface: "setting",
    name: "read.summarize.prose",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:read.summarize.unfoldLimit",
    surface: "setting",
    name: "read.summarize.unfoldLimit",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:read.summarize.unfoldUntil",
    surface: "setting",
    name: "read.summarize.unfoldUntil",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:read.toolResultPreview",
    surface: "setting",
    name: "read.toolResultPreview",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:readLineNumbers",
    surface: "setting",
    name: "readLineNumbers",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:recap.enabled",
    surface: "setting",
    name: "recap.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:recap.idleSeconds",
    surface: "setting",
    name: "recap.idleSeconds",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:repetitionPenalty",
    surface: "setting",
    name: "repetitionPenalty",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:retry.fallbackChains",
    surface: "setting",
    name: "retry.fallbackChains",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:retry.fallbackRevertPolicy",
    surface: "setting",
    name: "retry.fallbackRevertPolicy",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:retry.maxDelayMs",
    surface: "setting",
    name: "retry.maxDelayMs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:retry.maxRetries",
    surface: "setting",
    name: "retry.maxRetries",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:retry.modelFallback",
    surface: "setting",
    name: "retry.modelFallback",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:retry.usageAwareFallback",
    surface: "setting",
    name: "retry.usageAwareFallback",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:retry.usageReservePct",
    surface: "setting",
    name: "retry.usageReservePct",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:retry.usageReservePolicy",
    surface: "setting",
    name: "retry.usageReservePolicy",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:retry.waitForUsageReset",
    surface: "setting",
    name: "retry.waitForUsageReset",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:searxng.endpoint",
    surface: "setting",
    name: "searxng.endpoint",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:secrets.enabled",
    surface: "setting",
    name: "secrets.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:security.enabled",
    surface: "setting",
    name: "security.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:share.redactSecrets",
    surface: "setting",
    name: "share.redactSecrets",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:share.serverUrl",
    surface: "setting",
    name: "share.serverUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:share.store",
    surface: "setting",
    name: "share.store",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:sharpshooter.model",
    surface: "setting",
    name: "sharpshooter.model",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:shellMinimizer.enabled",
    surface: "setting",
    name: "shellMinimizer.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:shellMinimizer.sourceOutlineLevel",
    surface: "setting",
    name: "shellMinimizer.sourceOutlineLevel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:showHardwareCursor",
    surface: "setting",
    name: "showHardwareCursor",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:skillful",
    surface: "setting",
    name: "skillful",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:skills.enableSkillCommands",
    surface: "setting",
    name: "skills.enableSkillCommands",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:skills.registryUrl",
    surface: "setting",
    name: "skills.registryUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:snapcompact.shape",
    surface: "setting",
    name: "snapcompact.shape",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:snapcompact.systemPrompt",
    surface: "setting",
    name: "snapcompact.systemPrompt",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:snapcompact.toolResults",
    surface: "setting",
    name: "snapcompact.toolResults",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:speech.enabled",
    surface: "setting",
    name: "speech.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:speech.enhanced",
    surface: "setting",
    name: "speech.enhanced",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:speech.mode",
    surface: "setting",
    name: "speech.mode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:speech.voice",
    surface: "setting",
    name: "speech.voice",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:speechgen.enabled",
    surface: "setting",
    name: "speechgen.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:spelling.autocomplete",
    surface: "setting",
    name: "spelling.autocomplete",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:spelling.autocorrect",
    surface: "setting",
    name: "spelling.autocorrect",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:spelling.typoDetection",
    surface: "setting",
    name: "spelling.typoDetection",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:startup.changelogMode",
    surface: "setting",
    name: "startup.changelogMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:startup.checkUpdate",
    surface: "setting",
    name: "startup.checkUpdate",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:startup.quiet",
    surface: "setting",
    name: "startup.quiet",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:startup.setupWizard",
    surface: "setting",
    name: "startup.setupWizard",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:startup.showSplash",
    surface: "setting",
    name: "startup.showSplash",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:statusLine.compactThinkingLevel",
    surface: "setting",
    name: "statusLine.compactThinkingLevel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:statusLine.contextLine",
    surface: "setting",
    name: "statusLine.contextLine",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:statusLine.preset",
    surface: "setting",
    name: "statusLine.preset",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:statusLine.separator",
    surface: "setting",
    name: "statusLine.separator",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:statusLine.sessionAccent",
    surface: "setting",
    name: "statusLine.sessionAccent",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:statusLine.showHookStatus",
    surface: "setting",
    name: "statusLine.showHookStatus",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:statusLine.transparent",
    surface: "setting",
    name: "statusLine.transparent",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:steeringMode",
    surface: "setting",
    name: "steeringMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:stream.redactPatterns",
    surface: "setting",
    name: "stream.redactPatterns",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:stream.serverUrl",
    surface: "setting",
    name: "stream.serverUrl",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:stt.enabled",
    surface: "setting",
    name: "stt.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:stt.submitTrigger",
    surface: "setting",
    name: "stt.submitTrigger",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:symbolPreset",
    surface: "setting",
    name: "symbolPreset",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.agentIdleTtlMs",
    surface: "setting",
    name: "task.agentIdleTtlMs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.batch",
    surface: "setting",
    name: "task.batch",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.eager",
    surface: "setting",
    name: "task.eager",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.enableEffort",
    surface: "setting",
    name: "task.enableEffort",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.enableLsp",
    surface: "setting",
    name: "task.enableLsp",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.isolation.apply",
    surface: "setting",
    name: "task.isolation.apply",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.isolation.commits",
    surface: "setting",
    name: "task.isolation.commits",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.isolation.enabled",
    surface: "setting",
    name: "task.isolation.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.isolation.merge",
    surface: "setting",
    name: "task.isolation.merge",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.maxConcurrency",
    surface: "setting",
    name: "task.maxConcurrency",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.maxEffort",
    surface: "setting",
    name: "task.maxEffort",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.maxRecursionDepth",
    surface: "setting",
    name: "task.maxRecursionDepth",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.maxRuntimeMs",
    surface: "setting",
    name: "task.maxRuntimeMs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.prewalk",
    surface: "setting",
    name: "task.prewalk",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.showResolvedModelBadge",
    surface: "setting",
    name: "task.showResolvedModelBadge",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.softRequestBudget",
    surface: "setting",
    name: "task.softRequestBudget",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:task.softRequestBudgetNotice",
    surface: "setting",
    name: "task.softRequestBudgetNotice",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tasks.todoClearDelay",
    surface: "setting",
    name: "tasks.todoClearDelay",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:temperature",
    surface: "setting",
    name: "temperature",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:terminal.showImages",
    surface: "setting",
    name: "terminal.showImages",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:terminal.showProgress",
    surface: "setting",
    name: "terminal.showProgress",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:textVerbosity",
    surface: "setting",
    name: "textVerbosity",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:theme.dark",
    surface: "setting",
    name: "theme.dark",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:theme.light",
    surface: "setting",
    name: "theme.light",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tier.advisor",
    surface: "setting",
    name: "tier.advisor",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tier.anthropic",
    surface: "setting",
    name: "tier.anthropic",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tier.google",
    surface: "setting",
    name: "tier.google",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tier.openai",
    surface: "setting",
    name: "tier.openai",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tier.subagent",
    surface: "setting",
    name: "tier.subagent",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:title.refreshOnReplan",
    surface: "setting",
    name: "title.refreshOnReplan",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:todo.eager",
    surface: "setting",
    name: "todo.eager",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:todo.enabled",
    surface: "setting",
    name: "todo.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:todo.reminders",
    surface: "setting",
    name: "todo.reminders",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:todo.remindersMax",
    surface: "setting",
    name: "todo.remindersMax",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.abortOnFabricatedResult",
    surface: "setting",
    name: "tools.abortOnFabricatedResult",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.approval",
    surface: "setting",
    name: "tools.approval",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.approvalMode",
    surface: "setting",
    name: "tools.approvalMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.artifactHeadBytes",
    surface: "setting",
    name: "tools.artifactHeadBytes",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.artifactSpillThreshold",
    surface: "setting",
    name: "tools.artifactSpillThreshold",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.artifactTailBytes",
    surface: "setting",
    name: "tools.artifactTailBytes",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.artifactTailLines",
    surface: "setting",
    name: "tools.artifactTailLines",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.format",
    surface: "setting",
    name: "tools.format",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.intentTracing",
    surface: "setting",
    name: "tools.intentTracing",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.maxTimeout",
    surface: "setting",
    name: "tools.maxTimeout",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.outputMaxColumns",
    surface: "setting",
    name: "tools.outputMaxColumns",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.speculativeExecution.enabled",
    surface: "setting",
    name: "tools.speculativeExecution.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.speculativeExecution.maxInFlight",
    surface: "setting",
    name: "tools.speculativeExecution.maxInFlight",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.xdev",
    surface: "setting",
    name: "tools.xdev",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.xdevDocs",
    surface: "setting",
    name: "tools.xdevDocs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tools.xdevInlineDevices",
    surface: "setting",
    name: "tools.xdevInlineDevices",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:topK",
    surface: "setting",
    name: "topK",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:topP",
    surface: "setting",
    name: "topP",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:treeFilterMode",
    surface: "setting",
    name: "treeFilterMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tts.localVoice",
    surface: "setting",
    name: "tts.localVoice",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ttsr.builtinRules",
    surface: "setting",
    name: "ttsr.builtinRules",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ttsr.contextMode",
    surface: "setting",
    name: "ttsr.contextMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ttsr.disabledRules",
    surface: "setting",
    name: "ttsr.disabledRules",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ttsr.enabled",
    surface: "setting",
    name: "ttsr.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ttsr.interruptMode",
    surface: "setting",
    name: "ttsr.interruptMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ttsr.judge",
    surface: "setting",
    name: "ttsr.judge",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ttsr.repeatGap",
    surface: "setting",
    name: "ttsr.repeatGap",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:ttsr.repeatMode",
    surface: "setting",
    name: "ttsr.repeatMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.codexResetFireworks",
    surface: "setting",
    name: "tui.codexResetFireworks",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.hyperlinks",
    surface: "setting",
    name: "tui.hyperlinks",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.imeSafeCursor",
    surface: "setting",
    name: "tui.imeSafeCursor",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.mouse",
    surface: "setting",
    name: "tui.mouse",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.reactions",
    surface: "setting",
    name: "tui.reactions",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.renderMermaid",
    surface: "setting",
    name: "tui.renderMermaid",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.resizeScrollback",
    surface: "setting",
    name: "tui.resizeScrollback",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.textSizing",
    surface: "setting",
    name: "tui.textSizing",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.tight",
    surface: "setting",
    name: "tui.tight",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.titleSpinner",
    surface: "setting",
    name: "tui.titleSpinner",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.titleState",
    surface: "setting",
    name: "tui.titleState",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.vimMode",
    surface: "setting",
    name: "tui.vimMode",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:tui.vimModeDisplay",
    surface: "setting",
    name: "tui.vimModeDisplay",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:update.channel",
    surface: "setting",
    name: "update.channel",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:vault.enabled",
    surface: "setting",
    name: "vault.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:web_search.enabled",
    surface: "setting",
    name: "web_search.enabled",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:workspace.additionalDirectories",
    surface: "setting",
    name: "workspace.additionalDirectories",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:worktree.base",
    surface: "setting",
    name: "worktree.base",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:worktree.cleanSource",
    surface: "setting",
    name: "worktree.cleanSource",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "setting:worktree.clone",
    surface: "setting",
    name: "worktree.clone",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "OMP UI setting; escape hatch via bundled OMP TUI terminal until Phase 9/10 settings form lands",
  },
  {
    id: "slash:add-dir",
    surface: "slash",
    name: "add-dir",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:advisor",
    surface: "slash",
    name: "advisor",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:agents",
    surface: "slash",
    name: "agents",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:branch",
    surface: "slash",
    name: "branch",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:browser",
    surface: "slash",
    name: "browser",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:btw",
    surface: "slash",
    name: "btw",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:changelog",
    surface: "slash",
    name: "changelog",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:cleanse",
    surface: "slash",
    name: "cleanse",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:clear",
    surface: "slash",
    name: "clear",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:collab",
    surface: "slash",
    name: "collab",
    transport: "rpc",
    guiHome: "/h/[serverId]/settings/collaboration",
    capability: "ompCollab",
  },
  {
    id: "slash:compact",
    surface: "slash",
    name: "compact",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:computer",
    surface: "slash",
    name: "computer",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:context",
    surface: "slash",
    name: "context",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:copy",
    surface: "slash",
    name: "copy",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:debug",
    surface: "slash",
    name: "debug",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:delete",
    surface: "slash",
    name: "delete",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:dirs",
    surface: "slash",
    name: "dirs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:dump",
    surface: "slash",
    name: "dump",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:exit",
    surface: "slash",
    name: "exit",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:export",
    surface: "slash",
    name: "export",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:extended-context",
    surface: "slash",
    name: "extended-context",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:extensions",
    surface: "slash",
    name: "extensions",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:fast",
    surface: "slash",
    name: "fast",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:force",
    surface: "slash",
    name: "force",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:force:",
    surface: "slash",
    name: "force:",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:fork",
    surface: "slash",
    name: "fork",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:fresh",
    surface: "slash",
    name: "fresh",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:git",
    surface: "slash",
    name: "git",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:goal",
    surface: "slash",
    name: "goal",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:guided-goal",
    surface: "slash",
    name: "guided-goal",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:handoff",
    surface: "slash",
    name: "handoff",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:hotkeys",
    surface: "slash",
    name: "hotkeys",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:hub",
    surface: "slash",
    name: "hub",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:jobs",
    surface: "slash",
    name: "jobs",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:join",
    surface: "slash",
    name: "join",
    transport: "rpc",
    guiHome: "/h/[serverId]/settings/collaboration",
    capability: "ompCollab",
  },
  {
    id: "slash:leave",
    surface: "slash",
    name: "leave",
    transport: "rpc",
    guiHome: "/h/[serverId]/settings/collaboration",
    capability: "ompCollab",
  },
  {
    id: "slash:live",
    surface: "slash",
    name: "live",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:login",
    surface: "slash",
    name: "login",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:logout",
    surface: "slash",
    name: "logout",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:loop",
    surface: "slash",
    name: "loop",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:marketplace",
    surface: "slash",
    name: "marketplace",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:mcp",
    surface: "slash",
    name: "mcp",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:memory",
    surface: "slash",
    name: "memory",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:model",
    surface: "slash",
    name: "model",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:models",
    surface: "slash",
    name: "models",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:move",
    surface: "slash",
    name: "move",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:new",
    surface: "slash",
    name: "new",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:omfg",
    surface: "slash",
    name: "omfg",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:open",
    surface: "slash",
    name: "open",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:pause",
    surface: "slash",
    name: "pause",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:pin",
    surface: "slash",
    name: "pin",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:plan",
    surface: "slash",
    name: "plan",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:plan-review",
    surface: "slash",
    name: "plan-review",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:plugin",
    surface: "slash",
    name: "plugin",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:plugins",
    surface: "slash",
    name: "plugins",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:prewalk",
    surface: "slash",
    name: "prewalk",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:providers",
    surface: "slash",
    name: "providers",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:q",
    surface: "slash",
    name: "q",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:queue",
    surface: "slash",
    name: "queue",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:quit",
    surface: "slash",
    name: "quit",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:record",
    surface: "slash",
    name: "record",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:reload-plugins",
    surface: "slash",
    name: "reload-plugins",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:remove-dir",
    surface: "slash",
    name: "remove-dir",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:rename",
    surface: "slash",
    name: "rename",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:restart",
    surface: "slash",
    name: "restart",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:resume",
    surface: "slash",
    name: "resume",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:retry",
    surface: "slash",
    name: "retry",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:rewind",
    surface: "slash",
    name: "rewind",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:security",
    surface: "slash",
    name: "security",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:session",
    surface: "slash",
    name: "session",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:settings",
    surface: "slash",
    name: "settings",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:setup",
    surface: "slash",
    name: "setup",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:shake",
    surface: "slash",
    name: "shake",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:share",
    surface: "slash",
    name: "share",
    transport: "rpc",
    guiHome: "/h/[serverId]/settings/collaboration",
    capability: "ompCollab",
  },
  {
    id: "slash:skillful",
    surface: "slash",
    name: "skillful",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:skills",
    surface: "slash",
    name: "skills",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:slow",
    surface: "slash",
    name: "slow",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 9 model role controls land",
  },
  {
    id: "slash:ssh",
    surface: "slash",
    name: "ssh",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:stats",
    surface: "slash",
    name: "stats",
    transport: "session",
    guiHome: "/usage",
  },
  {
    id: "slash:status",
    surface: "slash",
    name: "status",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:switch",
    surface: "slash",
    name: "switch",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:tan",
    surface: "slash",
    name: "tan",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:todo",
    surface: "slash",
    name: "todo",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:tools",
    surface: "slash",
    name: "tools",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "slash:trace",
    surface: "slash",
    name: "trace",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:tree",
    surface: "slash",
    name: "tree",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:usage",
    surface: "slash",
    name: "usage",
    transport: "session",
    guiHome: "/usage",
  },
  {
    id: "slash:vibe",
    surface: "slash",
    name: "vibe",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "slash:worktree",
    surface: "slash",
    name: "worktree",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "slash:wt",
    surface: "slash",
    name: "wt",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason:
      "Builtin slash command; escape hatch via bundled OMP TUI terminal until Phase 10 GUI screens land",
  },
  {
    id: "subcommand:__complete",
    surface: "subcommand",
    name: "__complete",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:acp",
    surface: "subcommand",
    name: "acp",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:agents",
    surface: "subcommand",
    name: "agents",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:auth-broker",
    surface: "subcommand",
    name: "auth-broker",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:auth-gateway",
    surface: "subcommand",
    name: "auth-gateway",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:bench",
    surface: "subcommand",
    name: "bench",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:browser-relay",
    surface: "subcommand",
    name: "browser-relay",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:cleanse",
    surface: "subcommand",
    name: "cleanse",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:clip",
    surface: "subcommand",
    name: "clip",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:collab",
    surface: "subcommand",
    name: "collab",
    transport: "rpc",
    guiHome: "/h/[serverId]/settings/collaboration",
    capability: "ompCollab",
  },
  {
    id: "subcommand:commit",
    surface: "subcommand",
    name: "commit",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:completions",
    surface: "subcommand",
    name: "completions",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:compress",
    surface: "subcommand",
    name: "compress",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:config",
    surface: "subcommand",
    name: "config",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:dry-balance",
    surface: "subcommand",
    name: "dry-balance",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:find",
    surface: "subcommand",
    name: "find",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:gallery",
    surface: "subcommand",
    name: "gallery",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:gc",
    surface: "subcommand",
    name: "gc",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:git",
    surface: "subcommand",
    name: "git",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:grep",
    surface: "subcommand",
    name: "grep",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:grievances",
    surface: "subcommand",
    name: "grievances",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:if-bench",
    surface: "subcommand",
    name: "if-bench",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:images",
    surface: "subcommand",
    name: "images",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:install",
    surface: "subcommand",
    name: "install",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:join",
    surface: "subcommand",
    name: "join",
    transport: "rpc",
    guiHome: "/h/[serverId]/settings/collaboration",
    capability: "ompCollab",
  },
  {
    id: "subcommand:launch",
    surface: "subcommand",
    name: "launch",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:login",
    surface: "subcommand",
    name: "login",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI login subcommand; the app uses the OMP providers login sheet instead",
  },
  {
    id: "subcommand:models",
    surface: "subcommand",
    name: "models",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:play",
    surface: "subcommand",
    name: "play",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:plugin",
    surface: "subcommand",
    name: "plugin",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:ps",
    surface: "subcommand",
    name: "ps",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:read",
    surface: "subcommand",
    name: "read",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:render",
    surface: "subcommand",
    name: "render",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:say",
    surface: "subcommand",
    name: "say",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:search",
    surface: "subcommand",
    name: "search",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:setup",
    surface: "subcommand",
    name: "setup",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:share",
    surface: "subcommand",
    name: "share",
    transport: "rpc",
    guiHome: "/h/[serverId]/settings/collaboration",
    capability: "ompCollab",
  },
  {
    id: "subcommand:shell",
    surface: "subcommand",
    name: "shell",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:skill",
    surface: "subcommand",
    name: "skill",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:ssh",
    surface: "subcommand",
    name: "ssh",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:stats",
    surface: "subcommand",
    name: "stats",
    transport: "session",
    guiHome: "/usage",
  },
  {
    id: "subcommand:stream",
    surface: "subcommand",
    name: "stream",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:tiny-models",
    surface: "subcommand",
    name: "tiny-models",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:token",
    surface: "subcommand",
    name: "token",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:toks",
    surface: "subcommand",
    name: "toks",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:ttsr",
    surface: "subcommand",
    name: "ttsr",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:update",
    surface: "subcommand",
    name: "update",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "subcommand:usage",
    surface: "subcommand",
    name: "usage",
    transport: "session",
    guiHome: "/usage",
  },
  {
    id: "subcommand:worktree",
    surface: "subcommand",
    name: "worktree",
    transport: "terminal",
    guiHome: "terminal:omp-tui",
    reason: "CLI subcommand; escape hatch via bundled OMP TUI terminal",
  },
  {
    id: "tool:ask",
    surface: "tool",
    name: "ask",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:ast_edit",
    surface: "tool",
    name: "ast_edit",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:ast_grep",
    surface: "tool",
    name: "ast_grep",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:bash",
    surface: "tool",
    name: "bash",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:checkpoint",
    surface: "tool",
    name: "checkpoint",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:context_notes",
    surface: "tool",
    name: "context_notes",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:debug",
    surface: "tool",
    name: "debug",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:edit",
    surface: "tool",
    name: "edit",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:eval",
    surface: "tool",
    name: "eval",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:find",
    surface: "tool",
    name: "find",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:github",
    surface: "tool",
    name: "github",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:glob",
    surface: "tool",
    name: "glob",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:goal",
    surface: "tool",
    name: "goal",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:grep",
    surface: "tool",
    name: "grep",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:ida",
    surface: "tool",
    name: "ida",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:learn",
    surface: "tool",
    name: "learn",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:lsp",
    surface: "tool",
    name: "lsp",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:manage_skill",
    surface: "tool",
    name: "manage_skill",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:memory_edit",
    surface: "tool",
    name: "memory_edit",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:new_context",
    surface: "tool",
    name: "new_context",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:read",
    surface: "tool",
    name: "read",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:recall",
    surface: "tool",
    name: "recall",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:reflect",
    surface: "tool",
    name: "reflect",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:retain",
    surface: "tool",
    name: "retain",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:rewind",
    surface: "tool",
    name: "rewind",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:security_scan",
    surface: "tool",
    name: "security_scan",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:task",
    surface: "tool",
    name: "task",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:think",
    surface: "tool",
    name: "think",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:todo",
    surface: "tool",
    name: "todo",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:vibe_kill",
    surface: "tool",
    name: "vibe_kill",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "tool:vibe_list",
    surface: "tool",
    name: "vibe_list",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "tool:vibe_send",
    surface: "tool",
    name: "vibe_send",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "tool:vibe_spawn",
    surface: "tool",
    name: "vibe_spawn",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "tool:vibe_wait",
    surface: "tool",
    name: "vibe_wait",
    transport: "rpc",
    guiHome: "omp_vibe",
    capability: "ompVibe",
  },
  {
    id: "tool:wait",
    surface: "tool",
    name: "wait",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:web_search",
    surface: "tool",
    name: "web_search",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:write",
    surface: "tool",
    name: "write",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
  {
    id: "tool:yield",
    surface: "tool",
    name: "yield",
    transport: "rpc",
    guiHome: "omp-tools-control",
    capability: "ompToolSelection",
  },
] as const;
