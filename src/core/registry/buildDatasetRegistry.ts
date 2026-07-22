import type {
  SalesDatasetSummary,
} from '../../features/data-center/types/reportTypes'

import {
  DATASET_DEFINITIONS,
} from '../datasets/datasetDefinitions'

import type {
  DatasetRegistryItem,
} from '../datasets/datasetTypes'

export interface BuildDatasetRegistryInput {
  salesSummary:
    SalesDatasetSummary | null

  lastImportedFile:
    string | null

  lastImportedAt:
    string | null
}

function createEmptyRegistryItem(
  definition:
    (typeof DATASET_DEFINITIONS)[number],
): DatasetRegistryItem {
  return {
    type: definition.type,
    label: definition.label,
    description:
      definition.description,

    status: 'not_loaded',
    storage: 'not_configured',

    totalRows: 0,
    ignoredRows: 0,

    periodStart: null,
    periodEnd: null,

    lastImportedFile: null,
    lastImportedAt: null,

    version: 0,

    updateFrequency:
      definition.updateFrequency,

    displayOrder:
      definition.displayOrder,
  }
}

export function buildDatasetRegistry({
  salesSummary,
  lastImportedFile,
  lastImportedAt,
}: BuildDatasetRegistryInput):
  DatasetRegistryItem[] {
  const registry =
    DATASET_DEFINITIONS.map(
      createEmptyRegistryItem,
    )

  if (salesSummary) {
    const salesIndex =
      registry.findIndex(
        (dataset) =>
          dataset.type === 'sales',
      )

    if (salesIndex >= 0) {
      registry[salesIndex] = {
        ...registry[salesIndex],

        status: 'active',
        storage: 'indexeddb',

        totalRows:
          salesSummary.processedRows,

        ignoredRows:
          salesSummary.ignoredRows,

        periodStart:
          salesSummary.periodStart,

        periodEnd:
          salesSummary.periodEnd,

        lastImportedFile,
        lastImportedAt,

        version: 1,
      }
    }
  }

  return registry.sort(
    (left, right) =>
      left.displayOrder -
      right.displayOrder,
  )
}