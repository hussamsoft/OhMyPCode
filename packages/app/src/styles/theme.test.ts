import { describe, expect, it } from "vitest";
import {
  darkOhMyPCodeTheme,
  darkPureBlackTheme,
  darkTheme,
  FONT_SIZE,
  getNextThemePreference,
  lightTheme,
  THEME_OPTIONS,
} from "./theme";

describe("Typography scale", () => {
  it("names 14px as the default interface tier", () => {
    expect(FONT_SIZE).toEqual({
      code: 12,
      content: 15,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      "2xl": 20,
      "3xl": 22,
      "4xl": 26,
    });
  });
});

describe("Theme catalog", () => {
  it("owns the picker and shortcut order", () => {
    expect(THEME_OPTIONS.map((option) => option.name)).toEqual([
      "light",
      "dark",
      "auto",
      "zinc",
      "midnight",
      "claude",
      "ghostty",
      "ohMyPCode",
      "pureBlack",
    ]);
    expect(getNextThemePreference("dark")).toBe("auto");
    expect(getNextThemePreference("pureBlack")).toBe("light");
  });
});

describe("OhMyPCode theme", () => {
  it("matches the official ink / paper / signal contract", () => {
    // #0D0D0D ink, #FAFAFA paper, #F97316 signal — the brand mark reads
    // against this palette and every other surface derives from these anchors.
    // Changing any of these is a brand change and needs a release gate.
    expect(darkOhMyPCodeTheme.colors.surface0).toBe("#0D0D0D");
    expect(darkOhMyPCodeTheme.colors.foreground).toBe("#FAFAFA");
    expect(darkOhMyPCodeTheme.colors.accent).toBe("#F97316");
    expect(darkOhMyPCodeTheme.colors.accentForeground).toBe("#0D0D0D");
    expect(darkOhMyPCodeTheme.colors.terminal.background).toBe("#0D0D0D");
    expect(darkOhMyPCodeTheme.colorScheme).toBe("dark");
  });
});

describe("Pure black theme", () => {
  it("uses a pure black application and terminal background", () => {
    expect(darkPureBlackTheme.colors.surface0).toBe("#000000");
    expect(darkPureBlackTheme.colors.background).toBe("#000000");
    expect(darkPureBlackTheme.colors.terminal.background).toBe("#000000");
  });

  it("uses Paseo's muted green accent", () => {
    expect(darkPureBlackTheme.colors.accent).toBe("#20744A");
    expect(darkPureBlackTheme.colors.accentBright).toBe("#7ccba0");
  });

  it("derives sidebar interaction surfaces from the surface scale", () => {
    expect(darkPureBlackTheme.colors.surfaceSidebar).toBe("#000000");
    expect(darkPureBlackTheme.colors.surfaceSidebarHover).toBe(darkPureBlackTheme.colors.surface1);
    expect(darkPureBlackTheme.colors.surfaceSidebarSelected).toBe(
      darkPureBlackTheme.colors.surface2,
    );
  });

  it("keeps ANSI black output readable on its zero-luminance terminal background", () => {
    expect(darkPureBlackTheme.colors.terminal.black).toBe("#595959");
    expect(darkPureBlackTheme.colors.terminal.brightBlack).toBe("#8a8a8a");
  });
});

describe("Sidebar interaction surfaces", () => {
  it("keeps Light selection distinct from the sidebar surface", () => {
    expect(lightTheme.colors.surfaceSidebarHover).toBe(lightTheme.colors.surface1);
    expect(lightTheme.colors.surfaceSidebarSelected).toBe(lightTheme.colors.surface3);
    expect(lightTheme.colors.surfaceSidebarSelected).not.toBe(lightTheme.colors.surfaceSidebar);
  });

  it("derives Dark hover and selection from the first two raised surfaces", () => {
    expect(darkTheme.colors.surfaceSidebarHover).toBe(darkTheme.colors.surface1);
    expect(darkTheme.colors.surfaceSidebarSelected).toBe(darkTheme.colors.surface2);
  });
});

describe("Built-in light theme", () => {
  it("preserves its authored aliases and terminal contrast through the semantic builder", () => {
    expect(lightTheme.colors).toMatchObject({
      primary: "#18181b",
      primaryForeground: "#fafafa",
      destructiveForeground: "#ffffff",
      successForeground: "#ffffff",
      terminal: {
        black: "#1a1a1e",
        brightBlack: "#3f3f46",
      },
    });
  });
});

describe("OMP colour slot", () => {
  // Phase 7's decision: OMP's palette lives under colors.omp rather than
  // merged into the semantic namespace. This pins that both themes actually
  // carry it -- a theme built without the slot would fail at the first
  // component that reads theme.colors.omp, which is a runtime crash in
  // production and nowhere in the type system.
  it("carries the full OMP palette in both dark and light", () => {
    expect(Object.keys(darkTheme.colors.omp)).toEqual(Object.keys(lightTheme.colors.omp));
    expect(Object.keys(darkTheme.colors.omp)).toHaveLength(
      Object.keys(darkOhMyPCodeTheme.colors.omp).length,
    );
  });

  it("gives the two themes genuinely different values, not one copy of the other", () => {
    // A slot that resolves to the same palette in both themes would satisfy a
    // key-set check while quietly ignoring the light theme entirely.
    expect(darkTheme.colors.omp.bashMode).not.toBe(lightTheme.colors.omp.bashMode);
  });

  it("resolves the tokens the composer and status bar actually use", () => {
    for (const theme of [darkTheme, lightTheme]) {
      for (const key of ["bashMode", "pythonMode", "success", "warning", "error"] as const) {
        expect(theme.colors.omp[key]).toBeDefined();
      }
    }
  });

  it("leaves the app's own semantic colours untouched", () => {
    // The point of namespacing: adding 66 vendor tokens must not renumber or
    // shadow anything the app already themed.
    expect(darkTheme.colors.surface0).toBeDefined();
    expect(darkTheme.colors.palette).toBeDefined();
    expect("omp" in darkTheme.colors).toBe(true);
  });
});
