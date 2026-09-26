import { describe, expect, test } from "vitest";
import type { ProviderSelectionModelRow } from "@/provider-selection/provider-selection";
import { groupOmpModelRows } from "./model";

function modelRow(input: {
  provider: string;
  modelId: string;
  label: string;
  modelName?: string;
}): ProviderSelectionModelRow {
  return {
    favoriteKey: `${input.provider}:${input.modelId}`,
    provider: "omp",
    providerLabel: "OMP",
    modelId: `${input.provider}/${input.modelId}`,
    modelLabel: `${input.provider}/${input.label}`,
    model: {
      provider: "omp",
      id: `${input.provider}/${input.modelId}`,
      label: `${input.provider}/${input.label}`,
      metadata: {
        provider: input.provider,
        ...(input.modelName ? { modelName: input.modelName } : {}),
      },
    },
  };
}

describe("groupOmpModelRows", () => {
  test("groups models by provider and sorts sections and models by display name", () => {
    const rows = [
      modelRow({ provider: "openai", modelId: "gpt-5", label: "GPT-5", modelName: "GPT-5" }),
      modelRow({ provider: "anthropic", modelId: "sonnet", label: "Sonnet", modelName: "Sonnet" }),
      modelRow({ provider: "anthropic", modelId: "haiku", label: "Haiku", modelName: "Haiku" }),
    ];

    const result = groupOmpModelRows(
      rows,
      new Map([
        ["openai", "OpenAI"],
        ["anthropic", "Anthropic"],
      ]),
    );

    expect(result.map((section) => section.header)).toEqual(["Anthropic", "OpenAI"]);
    expect(result[0]?.rows.map((row) => row.modelId)).toEqual([
      "anthropic/haiku",
      "anthropic/sonnet",
    ]);
  });

  test("uses the provider id when no provider name is available", () => {
    const rows = [modelRow({ provider: "custom-provider", modelId: "model", label: "Model" })];

    const result = groupOmpModelRows(rows, new Map());

    expect(result[0]?.header).toBe("custom-provider");
  });
});
