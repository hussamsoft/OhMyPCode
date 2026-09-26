import { describe, expect, test } from "vitest";

import { buildOmpDraftFeatures, parseOmpToggleStatus } from "./feature-definitions.js";
import { resolveOmpFeatureLaunch, resolveOmpLaunchMode } from "./provider-config.js";

describe("OMP feature definitions", () => {
  test.each([
    ["Advisor is disabled.", false],
    ["Skill listing: on (12 installed skills)", true],
    ["Extended context is off.", false],
    ["Computer use: enabled · Desktop control available", true],
    ["Fast mode is off.", false],
    ["Unknown", null],
  ])("parses slash-toggle status %s", (text, expected) => {
    expect(parseOmpToggleStatus(text)).toBe(expected);
  });

  test("builds draft controls including role-model selects", () => {
    const features = buildOmpDraftFeatures(
      {
        fast_mode: true,
        omp_advisor: "on",
        omp_plan_yolo: true,
        omp_prewalk: "off",
        omp_smol_model: "provider/smol",
      },
      [{ id: "provider/smol", label: "Smol" }],
    );

    expect(features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "fast_mode", value: true }),
        expect.objectContaining({ id: "omp_advisor", type: "select", value: "on" }),
        expect.objectContaining({ id: "omp_plan_yolo", value: true }),
        expect.objectContaining({ id: "omp_prewalk", value: "off" }),
        expect.objectContaining({ id: "omp_smol_model", value: "provider/smol" }),
        expect.objectContaining({ id: "omp_slow_model", value: "default" }),
        expect.objectContaining({ id: "omp_plan_model", value: "default" }),
      ]),
    );
  });

  test("maps launch-only feature values to OMP arguments and model roles", () => {
    expect(
      resolveOmpFeatureLaunch({
        omp_plan_yolo: true,
        omp_prewalk: "on",
        omp_smol_model: "provider/smol",
        omp_slow_model: "provider/slow",
        omp_plan_model: "provider/plan",
      }),
    ).toEqual({
      args: ["--plan-yolo", "--prewalk"],
      roleOverrides: {
        smolModel: "provider/smol",
        slowModel: "provider/slow",
        planModel: "provider/plan",
      },
    });
    expect(
      resolveOmpFeatureLaunch({
        omp_prewalk: "off",
        omp_smol_model: "default",
        omp_slow_model: "default",
        omp_plan_model: "default",
      }),
    ).toEqual({ args: ["--no-prewalk"], roleOverrides: {} });
    expect(
      resolveOmpFeatureLaunch({
        omp_smol_model: "default",
        omp_slow_model: "default",
        omp_plan_model: "default",
      }),
    ).toEqual({ args: [], roleOverrides: {} });
  });

  test("appends feature arguments after session role overrides", () => {
    const featureLaunch = resolveOmpFeatureLaunch({
      omp_plan_yolo: true,
      omp_smol_model: "provider/session-smol",
    });

    expect(
      resolveOmpLaunchMode("ask", { smolModel: "provider/session-smol" }, featureLaunch.args),
    ).toEqual({
      modeId: "ask",
      extraArgs: [
        "--approval-mode",
        "always-ask",
        "--smol",
        "provider/session-smol",
        "--plan-yolo",
      ],
    });
  });
});
