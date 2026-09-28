/**
 * The composer's `!` arm.
 *
 * OMP's TUI parses this prefix in `input-controller.ts`: a leading `!` becomes
 * `handleBashCommand(command, isExcluded)` and sets `isBashMode`, which repaints
 * the editor border. `bashMode` in the generated theme is a *rendering* colour
 * key for the resulting execution frame, not a mode the host toggles -- so what
 * the composer owns is the text-prefix transform and the armed indicator.
 *
 * The daemon cannot execute a prefixed prompt, so an armed submission is
 * dispatched to the fork's `bash` RPC instead of the message path. Verified
 * against the bundled runtime: `prompt` with a `!`-prefixed message returns
 * success and runs nothing, while `bash` returns exit code 0 and the output.
 *
 * `!!` (exclude from context) is deliberately NOT armed. The fork's `bash` RPC
 * carries only `command` and has nowhere to put that flag, so arming it would
 * show a chip for something the host cannot express. It falls through to the
 * normal prompt path until OMP's wire is extended.
 */

export type OmpBashTrigger = "none" | "bash";

export interface OmpBashTriggerParse {
  /** Which arm the text is addressed to. */
  trigger: OmpBashTrigger;
  /**
   * The command to dispatch, with the sigil and surrounding whitespace removed.
   * Empty when the text is only the sigil, which arms nothing.
   */
  command: string;
  /**
   * True when the text addressed an arm the host cannot yet express (`!!`).
   * The caller should submit it as an ordinary prompt rather than silently
   * dropping it, so the text is never swallowed without the user noticing.
   */
  unsupported: boolean;
}

const NO_TRIGGER: OmpBashTriggerParse = Object.freeze({
  trigger: "none",
  command: "",
  unsupported: false,
});

/**
 * Parse a composer draft for a local-execution prefix.
 *
 * Mirrors the TUI's grammar: leading whitespace is insignificant, the sigil
 * must be followed by a command, and a bare sigil with nothing after it is not
 * an armed submission.
 */
export function parseOmpBashTrigger(text: string): OmpBashTriggerParse {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("!")) {
    return NO_TRIGGER;
  }

  // `!!` is a distinct arm, not a `!` whose command happens to start with `!`.
  if (trimmed.startsWith("!!")) {
    return { trigger: "none", command: "", unsupported: true };
  }

  const command = trimmed.slice(1).trim();
  if (command.length === 0) {
    return NO_TRIGGER;
  }
  return { trigger: "bash", command, unsupported: false };
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
  trigger: OmpBashTriggerParse;
  attachmentCount: number;
  isAgentRunning: boolean;
  forceSend?: boolean;
}): boolean {
  if (input.trigger.trigger !== "bash") {
    return false;
  }
  if (input.attachmentCount > 0) {
    return false;
  }
  return !(input.isAgentRunning && !input.forceSend);
}
