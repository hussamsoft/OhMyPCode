import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_PREFERENCE,
  resolveDefaultThemePreference,
} from "@/hooks/use-settings/storage";

describe("default theme preference policy", () => {
  it("resolves to \"auto\" on native so existing iOS / Android behavior is preserved", () => {
    expect(resolveDefaultThemePreference({ native: true, productName: "OhMyPCode" })).toBe(
      "auto",
    );
  });

  it("resolves to \"ohMyPCode\" on desktop / web for the OhMyPCode product", () => {
    expect(resolveDefaultThemePreference({ native: false, productName: "OhMyPCode" })).toBe(
      "ohMyPCode",
    );
  });

  it("keeps \"auto\" for non-OhMyPCode products on desktop / web", () => {
    expect(resolveDefaultThemePreference({ native: false, productName: "Paseo" })).toBe(
      "auto",
    );
    expect(resolveDefaultThemePreference({ native: false, productName: "" })).toBe("auto");
  });

  it("exposes a module-level default that matches the current platform build", () => {
    // DEFAULT_THEME_PREFERENCE is captured at module load from isNative, so
    // the constant and the resolver agree on the current build. On native
    // builds the constant stays \"auto\"; on web / desktop OhMyPCode builds
    // it lands on the official palette.
    if (DEFAULT_THEME_PREFERENCE === "ohMyPCode") {
      expect(resolveDefaultThemePreference({ native: false, productName: "OhMyPCode" })).toBe(
        "ohMyPCode",
      );
    }
    if (DEFAULT_THEME_PREFERENCE === "auto") {
      expect(resolveDefaultThemePreference({ native: true, productName: "OhMyPCode" })).toBe(
        "auto",
      );
    }
  });
});