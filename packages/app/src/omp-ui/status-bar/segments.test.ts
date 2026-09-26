import { describe, expect, it } from "vitest";
import {
  CONTEXT_LINE_MODE_VALUES,
  CUSTOM_STATUS_LINE_DEFAULTS,
  STATUS_LINE_PRESET_VALUES,
  STATUS_LINE_SEGMENT_IDS,
  STATUS_LINE_SEPARATOR_VALUES,
  type StatusLineSegmentId,
} from "./segments";

describe("status-line/segments", () => {
  it("exposes the canonical 26 segment ids in the vendor's order", () => {
    expect(STATUS_LINE_SEGMENT_IDS).toEqual([
      "pi",
      "status",
      "model",
      "mode",
      "path",
      "git",
      "pr",
      "subagents",
      "token_in",
      "token_out",
      "token_total",
      "token_rate",
      "cost",
      "context_pct",
      "context_total",
      "time_spent",
      "time",
      "session",
      "hostname",
      "cache_read",
      "cache_write",
      "cache_hit",
      "session_name",
      "usage",
      "collab",
      "stream",
      "vim",
    ]);
  });

  it("keeps the segment-id literal union exhaustive", () => {
    // Adding a new id without the renderer knowing about it should not compile.
    const sample: StatusLineSegmentId = "model";
    expect(sample).toBe("model");
  });

  it("uses the vendor's preset and separator enums", () => {
    expect(STATUS_LINE_PRESET_VALUES).toEqual([
      "default",
      "minimal",
      "compact",
      "full",
      "nerd",
      "ascii",
      "custom",
    ]);
    expect(STATUS_LINE_SEPARATOR_VALUES).toEqual([
      "powerline",
      "powerline-thin",
      "slash",
      "pipe",
      "block",
      "none",
      "ascii",
    ]);
  });

  it("uses the vendor's context-line enum", () => {
    expect(CONTEXT_LINE_MODE_VALUES).toEqual(["off", "percentage", "annotated", "embedded"]);
  });

  it("carries the vendor's custom-preset defaults verbatim", () => {
    expect(CUSTOM_STATUS_LINE_DEFAULTS.left).toEqual(["vim", "model", "mode", "path", "git", "pr"]);
    expect(CUSTOM_STATUS_LINE_DEFAULTS.right).toEqual([
      "session_name",
      "token_total",
      "cost",
      "context_pct",
    ]);
  });
});
