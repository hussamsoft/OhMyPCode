/**
 * The composer's local-execution arms.
 *
 * OMP's TUI parses these prefixes in `input-controller.ts`: a leading `!` or
 * `!!` becomes `handleBashCommand(command, isExcluded)`, `$` or `$$` becomes
 * the Python equivalent, and each sets an armed flag that repaints the editor
 * border. `bashMode` / `pythonMode` in the generated theme are *rendering*
 * colour keys for the resulting execution frame, not modes the host toggles --
 * so what the composer owns is the text-prefix transform and the indicator.
 *
 * None of this can travel as a prompt. The daemon accepts a prefixed message as
 * prose and runs nothing, so an armed submission is dispatched to the fork's
 * `bash` / `python` RPCs instead. Verified against the bundled runtime.
 *
 * The double sigil is the "exclude from context" arm in both languages: the
 * command runs, but its output is kept out of the model's context. That flag
 * now exists on the wire -- the vendored fork carries `excludeFromContext` on
 * both RPCs -- so unlike an earlier revision these arms are fully expressible.
 */

export type OmpLocalExecutionArm = "none" | "bash" | "python";

export interface OmpLocalExecutionParse {
  /** Which arm the text is addressed to. */
  trigger: OmpLocalExecutionArm;
  /** The command or code to dispatch, sigil and surrounding whitespace removed. */
  command: string;
  /** The `!!` / `$$` arm: run it, but keep the output out of the model's context. */
  excludeFromContext: boolean;
}

const NO_TRIGGER: OmpLocalExecutionParse = Object.freeze({
  trigger: "none",
  command: "",
  excludeFromContext: false,
});

/**
 * Parse a composer draft for a local-execution prefix.
 *
 * Mirrors the TUI's grammar: leading whitespace is insignificant, the sigil
 * must be followed by content, and a bare sigil is not an armed submission.
 * The double sigil is its own arm rather than a single sigil whose command
 * happens to start with the same character.
 */
export function parseOmpLocalExecution(text: string): OmpLocalExecutionParse {
  const trimmed = text.trimStart();
  if (trimmed.length === 0) {
    return NO_TRIGGER;
  }

  if (trimmed.startsWith("!")) {
    const excludeFromContext = trimmed.startsWith("!!");
    const command = (excludeFromContext ? trimmed.slice(2) : trimmed.slice(1)).trim();
    return command.length === 0
      ? NO_TRIGGER
      : { trigger: "bash", command, excludeFromContext };
  }

  if (trimmed.startsWith("$")) {
    const excludeFromContext = trimmed.startsWith("$$");
    const command = (excludeFromContext ? trimmed.slice(2) : trimmed.slice(1)).trim();
    return command.length === 0
      ? NO_TRIGGER
      : { trigger: "python", command, excludeFromContext };
  }

  return NO_TRIGGER;
}

/**
 * Whether a parsed draft should actually be dispatched as a command.
 *
 * The arm is a pure text transform, so it only takes the draft when nothing else
 * is riding along:
 *
 * - attachments: a command cannot carry a browser element or a PR context, and
 *   diverting would clear them without ever sending them -- silent data loss.
 * - a live turn: ordering and queueing belong to the message path, so the
 *   command is not run beside an in-flight turn.
 *
 * Both cases fall through to the ordinary prompt path, where the text is
 * preserved rather than swallowed.
 */
export function shouldDispatchAsBashCommand(input: {
  trigger: OmpLocalExecutionParse;
  attachmentCount: number;
  isAgentRunning: boolean;
  forceSend?: boolean;
}): boolean {
  if (input.trigger.trigger === "none") {
    return false;
  }
  if (input.attachmentCount > 0) {
    return false;
  }
  return !(input.isAgentRunning && !input.forceSend);
}
