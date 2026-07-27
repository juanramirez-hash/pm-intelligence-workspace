import type {
  SalesDatasetSummary,
  TargetDatasetSummary,
} from '../../features/data-center/types/reportTypes'

import {
  DATASET_DEFINITIONS,
} from '../datasets/datasetDefinitions'

import type {
  DatasetRegistryItem,
} from '../datasets/datasetTypes'

export interface BuildDatasetRegistryInput {
  salesSummary: SalesDatasetSummary | null
  salesLastImportedFile: string | null
  salesLastImportedAt: string | null
  targetSummary: TargetDatasetSummary | null
  targetsLastImportedFile: string | null
  targetsLastImportedAt: string | null
}

function createEmptyRegistryItem(
  definition: (typeof DATASET_DEFINITIONS)[number],
): DatasetRegistryItem {
  return {
    type: definition.type,
    label: definition.label,
    description: definition.description,
    status: 'not_loaded',
    storage: 'not_configured',
    totalRows: 0,
    ignoredRows: 0,
    periodStart: null,
    periodEnd: null,
    lastImportedFile: null,
    lastImportedAt: null,
    version: 0,
    updateFrequency: definition.updateFrequency,
    displayOrder: definition.displayOrder,
  }
}

export function buildDatasetRegistry({
  salesSummary,
  salesLastImportedFile,
  salesLastImportedAt,
  targetSummary,
  targetsLastImportedFile,
  targetsLastImportedAt,
}: BuildDatasetRegistryInput): DatasetRegistryItem[] {
  const registry = DATASET_DEFINITIONS.map(createEmptyRegistryItem)

  const salesIndex = registry.findIndex((dataset) => dataset.type === 'sales')

  if (salesSummary && salesIndex >= 0) {
    registry[salesIndex] = {
      ...registry[salesIndex],
      status: 'active',
      storage: 'indexeddb',
      totalRows: salesSummary.processedRows,
      ignoredRows: salesSummary.ignoredRows,
      periodStart: salesSummary.periodStart,
      periodEnd: salesSummary.periodEnd,
      lastImportedFile: salesLastImportedFile,
      lastImportedAt: salesLastImportedAt,
      version: 1,
    }
  }

  const targetIndex = registry.findIndex(
    (dataset) => dataset.type === 'salesTargets',
  )

  if (targetSummary && targetIndex >= 0) {
    registry[targetIndex] = {
      ...registry[targetIndex],
      status: 'active',
      storage: 'indexeddb',
      totalRows: targetSummary.processedRows,
      ignoredRows: targetSummary.ignoredRows,
      periodStart: targetSummary.periodStart,
      periodEnd: targetSummary.periodEnd,
      lastImportedFile: targetsLastImportedFile,
      lastImportedAt: targetsLastImportedAt,
      version: 1,
    }
  }

  return registry.sort(
    (left, right) => left.displayOrder - right.displayOrder,
  )
}
