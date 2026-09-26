import type { ProviderSelectionModelRow } from "@/provider-selection/provider-selection";

export interface OmpGroupedModelRows {
  header: string;
  rows: ProviderSelectionModelRow[];
}

function getModelLabel(row: ProviderSelectionModelRow): string {
  const modelName = row.model?.metadata?.modelName;
  if (typeof modelName === "string") {
    return modelName;
  }
  return row.model?.label ?? row.modelLabel;
}

export function groupOmpModelRows(
  rows: readonly ProviderSelectionModelRow[],
  providerNames: ReadonlyMap<string, string>,
): OmpGroupedModelRows[] {
  const sections = new Map<string, OmpGroupedModelRows>();

  for (const row of rows) {
    const metadataProvider = row.model?.metadata?.provider;
    const providerId = typeof metadataProvider === "string" ? metadataProvider : row.provider;
    const header = providerNames.get(providerId) ?? providerId;
    const section = sections.get(header);
    if (section) {
      section.rows.push(row);
    } else {
      sections.set(header, { header, rows: [row] });
    }
  }

  return [...sections.values()]
    .map((section) => {
      const sortedRows = [...section.rows].sort((left, right) =>
        getModelLabel(left).localeCompare(getModelLabel(right)),
      );
      return { header: section.header, rows: sortedRows };
    })
    .sort((left, right) => left.header.localeCompare(right.header));
}
