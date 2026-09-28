import { describe, expect, it } from "vitest";
import { parseOmpBashTrigger } from "./omp-bash-trigger";

describe("parseOmpBashTrigger", () => {
  it("arms bash for a single sigil and returns the command without it", () => {
    const parsed = parseOmpBashTrigger("!git status");
    expect(parsed).toEqual({ trigger: "bash", command: "git status", unsupported: false });
  });

  it("trims whitespace after the sigil and around the command", () => {
    expect(parseOmpBashTrigger("!   ls -la  ").command).toBe("ls -la");
  });

  it("ignores leading whitespace, matching the TUI's trimStart", () => {
    expect(parseOmpBashTrigger("   !pwd").trigger).toBe("bash");
  });

  it("keeps a leading dash on the command rather than eating it", () => {
    expect(parseOmpBashTrigger("!  --version").command).toBe("--version");
  });

  it("does not arm on a bare sigil", () => {
    expect(parseOmpBashTrigger("!")).toEqual({ trigger: "none", command: "", unsupported: false });
    expect(parseOmpBashTrigger("!   ")).toEqual({
      trigger: "none",
      command: "",
      unsupported: false,
    });
  });

  it("does not arm on ordinary prose", () => {
    for (const text of ["git status", "why does ! fail", "", "   ", "hello world"]) {
      expect(parseOmpBashTrigger(text)).toEqual({
        trigger: "none",
        command: "",
        unsupported: false,
      });
    }
  });

  // The fork's bash RPC carries only `command`, so `!!` cannot be expressed
  // over the wire yet. It must be reported as unsupported rather than armed,
  // or the composer would offer a chip for a submission it cannot dispatch.
  it("reports the excluded-from-context arm as unsupported instead of arming it", () => {
    const parsed = parseOmpBashTrigger("!!git log");
    expect(parsed.trigger).toBe("none");
    expect(parsed.unsupported).toBe(true);
    expect(parsed.command).toBe("");
  });
});
