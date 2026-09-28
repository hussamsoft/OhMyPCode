import { describe, expect, it } from "vitest";
import { parseOmpLocalExecution, shouldDispatchAsBashCommand } from "./omp-local-execution";

describe("parseOmpLocalExecution", () => {
  it("arms bash for a single sigil and returns the command without it", () => {
    expect(parseOmpLocalExecution("!git status")).toEqual({
      trigger: "bash",
      command: "git status",
      excludeFromContext: false,
    });
  });

  it("arms bash for the excluded-from-context double sigil", () => {
    expect(parseOmpLocalExecution("!!git log")).toEqual({
      trigger: "bash",
      command: "git log",
      excludeFromContext: true,
    });
  });

  it("arms python for a single sigil", () => {
    expect(parseOmpLocalExecution("$print(6 * 7)")).toEqual({
      trigger: "python",
      command: "print(6 * 7)",
      excludeFromContext: false,
    });
  });

  it("arms python for the excluded-from-context double sigil", () => {
    expect(parseOmpLocalExecution("$$print(1 + 1)")).toEqual({
      trigger: "python",
      command: "print(1 + 1)",
      excludeFromContext: true,
    });
  });

  it("trims whitespace after the sigil and around the payload", () => {
    expect(parseOmpLocalExecution("!   ls -la  ").command).toBe("ls -la");
    expect(parseOmpLocalExecution("$   1 + 1  ").command).toBe("1 + 1");
  });

  it("ignores leading whitespace, matching the TUI's trimStart", () => {
    expect(parseOmpLocalExecution("   !pwd").trigger).toBe("bash");
    expect(parseOmpLocalExecution("   $$pwd").trigger).toBe("python");
  });

  it("keeps a leading dash on the payload rather than eating it", () => {
    expect(parseOmpLocalExecution("!  --version").command).toBe("--version");
  });

  it("does not arm on a bare sigil", () => {
    for (const text of ["!", "!!", "$", "$$", "!   ", "$  "]) {
      expect(parseOmpLocalExecution(text)).toEqual({
        trigger: "none",
        command: "",
        excludeFromContext: false,
      });
    }
  });

  it("does not arm on ordinary prose", () => {
    for (const text of ["git status", "why does ! fail", "", "   ", "cost is $5", "a$ b"]) {
      expect(parseOmpLocalExecution(text)).toEqual({
        trigger: "none",
        command: "",
        excludeFromContext: false,
      });
    }
  });

  // `$` only introduces a code block at the start of the draft. Prose that
  // happens to contain a dollar sign must stay prose, or ordinary sentences
  // about money would be executed.
  it("does not treat a mid-sentence dollar sign as python", () => {
    expect(parseOmpLocalExecution("costs $5 today").trigger).toBe("none");
  });
});

describe("shouldDispatchAsBashCommand", () => {
  const armedBash = parseOmpLocalExecution("!echo hi");
  const armedPython = parseOmpLocalExecution("$print(1)");

  it.each([
    ["bash", armedBash],
    ["python", armedPython],
  ])("dispatches a bare armed %s draft", (_label, trigger) => {
    expect(
      shouldDispatchAsBashCommand({
        trigger,
        attachmentCount: 0,
        isAgentRunning: false,
      }),
    ).toBe(true);
  });

  // A command cannot carry a browser element or a PR context. Diverting would
  // clear the attachments without ever sending them.
  it("falls through when the draft carries attachments", () => {
    expect(
      shouldDispatchAsBashCommand({
        trigger: armedBash,
        attachmentCount: 1,
        isAgentRunning: false,
      }),
    ).toBe(false);
  });

  // Ordering and queueing belong to the message path.
  it("falls through while the agent is streaming, unless the send is forced", () => {
    expect(
      shouldDispatchAsBashCommand({
        trigger: armedBash,
        attachmentCount: 0,
        isAgentRunning: true,
      }),
    ).toBe(false);
    expect(
      shouldDispatchAsBashCommand({
        trigger: armedBash,
        attachmentCount: 0,
        isAgentRunning: true,
        forceSend: true,
      }),
    ).toBe(true);
  });

  it("never dispatches an untriggered draft", () => {
    for (const text of ["hello", "!", "$", "costs $5"]) {
      expect(
        shouldDispatchAsBashCommand({
          trigger: parseOmpLocalExecution(text),
          attachmentCount: 0,
          isAgentRunning: false,
        }),
      ).toBe(false);
    }
  });
});
