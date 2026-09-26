import { describe, expect, test } from "vitest";

import {
  OMP_DARK_APP_ONLY_SURFACES,
  OMP_DARK_THEME_PALETTE,
  OMP_LIGHT_APP_ONLY_SURFACES,
  OMP_LIGHT_THEME_PALETTE,
} from "./theme";
import {
  OMP_DARK_EXPORT_TOKENS,
  OMP_DARK_TOKENS,
  OMP_LIGHT_EXPORT_TOKENS,
  OMP_LIGHT_TOKENS,
} from "./tokens.generated";

describe("OMP theme palette", () => {
  test("dark palette has exactly 66 keys: 67 vendor-schema keys (60 ThemeColor + 7 ThemeBg) minus the one always-optional key, thinkingMax", () => {
    expect(Object.keys(OMP_DARK_THEME_PALETTE)).toHaveLength(66);
  });

  test("light palette has exactly the same 66 keys as the dark palette", () => {
    expect(Object.keys(OMP_LIGHT_THEME_PALETTE).sort()).toEqual(
      Object.keys(OMP_DARK_THEME_PALETTE).sort(),
    );
  });

  test("every palette value matches the generated token one-to-one by name", () => {
    for (const key of Object.keys(OMP_DARK_THEME_PALETTE)) {
      expect(OMP_DARK_THEME_PALETTE[key as keyof typeof OMP_DARK_THEME_PALETTE]).toBe(
        OMP_DARK_TOKENS[key],
      );
      expect(OMP_LIGHT_THEME_PALETTE[key as keyof typeof OMP_LIGHT_THEME_PALETTE]).toBe(
        OMP_LIGHT_TOKENS[key],
      );
    }
  });

  test("excludes the vestigial 'link' key present in dark.json but absent from the vendor schema", () => {
    expect(OMP_DARK_TOKENS.link).toBeDefined();
    expect("link" in OMP_DARK_THEME_PALETTE).toBe(false);
  });

  test("excludes the always-optional 'thinkingMax' key, unpopulated in both theme JSONs", () => {
    expect(OMP_DARK_TOKENS.thinkingMax).toBeUndefined();
    expect("thinkingMax" in OMP_DARK_THEME_PALETTE).toBe(false);
  });

  test("statusLineSep genuinely differs in runtime type between presets (number in dark, string in light) -- regression guard for a real bug an earlier version of this module had: splitting keys into fixed string/number buckets inferred from sample data instead of using OMP's own string|number ColorValue type uniformly", () => {
    expect(typeof OMP_DARK_THEME_PALETTE.statusLineSep).toBe("number");
    expect(typeof OMP_LIGHT_THEME_PALETTE.statusLineSep).toBe("string");
  });
});

describe("OMP app-only surfaces", () => {
  test("paneBackground and hover come from the export tokens, not the main palette", () => {
    expect(OMP_DARK_APP_ONLY_SURFACES.paneBackground).toBe(OMP_DARK_EXPORT_TOKENS.pageBg);
    expect(OMP_DARK_APP_ONLY_SURFACES.hover).toBe(OMP_DARK_EXPORT_TOKENS.cardBg);
    expect(OMP_LIGHT_APP_ONLY_SURFACES.paneBackground).toBe(OMP_LIGHT_EXPORT_TOKENS.pageBg);
    expect(OMP_LIGHT_APP_ONLY_SURFACES.hover).toBe(OMP_LIGHT_EXPORT_TOKENS.cardBg);
  });

  test("focusRing and scrollbarGutterBorder both reuse statusLineBg from the main palette", () => {
    expect(OMP_DARK_APP_ONLY_SURFACES.focusRing).toBe(OMP_DARK_THEME_PALETTE.statusLineBg);
    expect(OMP_DARK_APP_ONLY_SURFACES.scrollbarGutterBorder).toBe(
      OMP_DARK_THEME_PALETTE.statusLineBg,
    );
    expect(OMP_LIGHT_APP_ONLY_SURFACES.focusRing).toBe(OMP_LIGHT_THEME_PALETTE.statusLineBg);
    expect(OMP_LIGHT_APP_ONLY_SURFACES.scrollbarGutterBorder).toBe(
      OMP_LIGHT_THEME_PALETTE.statusLineBg,
    );
  });
});
