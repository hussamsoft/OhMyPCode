import { describe, expect, it } from "vitest";
import {
  LANGUAGE_OPTIONS,
  formatLanguageOptionLabel,
  parseAppLanguage,
  resolveSupportedLocale,
} from "./locales";

describe("parseAppLanguage", () => {
  it("accepts system and all supported language locales", () => {
    expect(["system", "en"].map(parseAppLanguage)).toEqual(["system", "en"]);
  });

  it("returns null for unknown values", () => {
    expect(parseAppLanguage("de")).toBeNull();
    expect(parseAppLanguage(null)).toBeNull();
  });

  it("offers system plus all supported languages", () => {
    expect(LANGUAGE_OPTIONS.map((option) => option.value)).toEqual(["system", "en"]);
  });
});

describe("formatLanguageOptionLabel", () => {
  it("uses a single label when both language names match", () => {
    const english = LANGUAGE_OPTIONS.find((option) => option.value === "en");

    expect(formatLanguageOptionLabel(english!, "en", "System")).toBe("English");
  });

  it("uses the active-language name for System", () => {
    const system = LANGUAGE_OPTIONS.find((option) => option.value === "system");

    expect(formatLanguageOptionLabel(system!, "en", "System")).toBe("System");
  });
});

describe("resolveSupportedLocale", () => {
  it("respects explicit language choices", () => {
    expect(resolveSupportedLocale("en", ["en-US"])).toBe("en");
  });

  it("keeps English when an unsupported language is a secondary system language", () => {
    expect(resolveSupportedLocale("system", ["en-US", "es-GB"])).toBe("en");
  });

  it("maps unsupported or missing system locales to English", () => {
    expect(resolveSupportedLocale("system", ["de-DE"])).toBe("en");
    expect(resolveSupportedLocale("system", [])).toBe("en");
  });
});
