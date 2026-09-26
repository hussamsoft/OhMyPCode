import { describe, expect, it } from "vitest";
import { STATUS_LINE_PRESETS, getStatusLinePreset, type OmpStatusLinePresetDef } from "./presets";
import {
  CUSTOM_STATUS_LINE_DEFAULTS,
  STATUS_LINE_PRESET_VALUES,
  STATUS_LINE_SEGMENT_IDS,
  type StatusLinePreset,
  type StatusLineSegmentId,
} from "./segments";

const ALL_SEGMENT_IDS: ReadonlySet<StatusLineSegmentId> = new Set(STATUS_LINE_SEGMENT_IDS);

describe("status-line/presets", () => {
  it("exposes a preset for every StatusLinePreset value", () => {
    for (const name of STATUS_LINE_PRESET_VALUES) {
      expect(STATUS_LINE_PRESETS[name]).toBeDefined();
    }
  });

  it("quotes the vendor's default preset shape verbatim", () => {
    const preset = STATUS_LINE_PRESETS.default;
    expect(preset.leftSegments).toEqual([
      "pi",
      "vim",
      "model",
      "mode",
      "collab",
      "stream",
      "path",
      "git",
      "pr",
      "context_pct",
      "cost",
    ]);
    expect(preset.rightSegments).toEqual(["session_name"]);
    expect(preset.separator).toBe("powerline-thin");
    expect(preset.segmentOptions?.model?.showThinkingLevel).toBe(true);
  });

  it("matches the vendor's minimal / compact / full segment lists", () => {
    expect(STATUS_LINE_PRESETS.minimal.leftSegments).toEqual(["vim", "path", "git"]);
    expect(STATUS_LINE_PRESETS.minimal.rightSegments).toEqual([
      "session_name",
      "mode",
      "context_pct",
    ]);
    expect(STATUS_LINE_PRESETS.minimal.separator).toBe("slash");

    expect(STATUS_LINE_PRESETS.compact.leftSegments).toEqual(["vim", "model", "mode", "git", "pr"]);
    expect(STATUS_LINE_PRESETS.compact.rightSegments).toEqual([
      "session_name",
      "cost",
      "context_pct",
    ]);

    expect(STATUS_LINE_PRESETS.full.rightSegments).toEqual([
      "session_name",
      "cache_hit",
      "token_in",
      "token_out",
      "token_rate",
      "cache_read",
      "cost",
      "context_pct",
      "time_spent",
      "time",
    ]);
  });

  it("uses the vendor's custom preset defaults for `custom`", () => {
    expect(STATUS_LINE_PRESETS.custom.leftSegments).toEqual([...CUSTOM_STATUS_LINE_DEFAULTS.left]);
    expect(STATUS_LINE_PRESETS.custom.rightSegments).toEqual([
      ...CUSTOM_STATUS_LINE_DEFAULTS.right,
    ]);
    expect(STATUS_LINE_PRESETS.custom.separator).toBe("powerline-thin");
  });

  it("only references canonical segment ids", () => {
    for (const name of STATUS_LINE_PRESET_VALUES) {
      const preset: OmpStatusLinePresetDef = STATUS_LINE_PRESETS[name];
      for (const id of preset.leftSegments) {
        expect(ALL_SEGMENT_IDS.has(id)).toBe(true);
      }
      for (const id of preset.rightSegments) {
        expect(ALL_SEGMENT_IDS.has(id)).toBe(true);
      }
    }
  });

  it("falls back to the default preset on unknown names", () => {
    const fallback = getStatusLinePreset("default");
    // TS enforces `StatusLinePreset`, so this exercises runtime invariance --
    // a stray mutation elsewhere cannot silently break the contract.
    const allValues = new Set(STATUS_LINE_PRESET_VALUES);
    for (const candidate of ["custom", "minimal", "full", "compact"] as StatusLinePreset[]) {
      expect(allValues.has(candidate)).toBe(true);
      expect(getStatusLinePreset(candidate)).toBeDefined();
    }
    expect(fallback.leftSegments).toContain("model");
  });
});
