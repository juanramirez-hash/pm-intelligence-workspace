import type {
  SalesDatasetSummary,
  TargetDatasetSummary,
} from '../../features/data-center/types/reportTypes'
import type {
  ProductMasterDatasetSummary,
} from '../../features/data-center/importers/products/productMasterTypes'
import type {
  InventoryDatasetSummary,
} from '../../features/data-center/importers/inventory/inventoryTypes'
import type {
  ProjectDatasetSummary,
} from '../../features/data-center/importers/projects/projectTypes'
import type {
  ProjectBillingDatasetSummary,
} from '../../features/data-center/importers/project-billings/projectBillingTypes'
import type {
  ExchangeRateDatasetSummary,
} from '../../features/data-center/importers/exchange-rates/exchangeRateTypes'

import {
  DATASET_DEFINITIONS,
} from '../datasets/datasetDefinitions'

import type {
  DatasetRegistryItem,
  DatasetType,
} from '../datasets/datasetTypes'

export interface BuildDatasetRegistryInput {
  salesSummary: SalesDatasetSummary | null
  salesLastImportedFile: string | null
  salesLastImportedAt: string | null
  targetSummary: TargetDatasetSummary | null
  targetsLastImportedFile: string | null
  targetsLastImportedAt: string | null
  productMasterSummary: ProductMasterDatasetSummary | null
  productMasterLastImportedFile: string | null
  productMasterLastImportedAt: string | null
  inventorySummary: InventoryDatasetSummary | null
  inventoryLastImportedFile: string | null
  inventoryLastImportedAt: string | null
  projectsSummary?: ProjectDatasetSummary | null
  projectsLastImportedFile?: string | null
  projectsLastImportedAt?: string | null
  projectBillingSummary?: ProjectBillingDatasetSummary | null
  projectBillingLastImportedFile?: string | null
  projectBillingLastImportedAt?: string | null
  exchangeRateSummary?: ExchangeRateDatasetSummary | null
  exchangeRateLastImportedFile?: string | null
  exchangeRateLastImportedAt?: string | null
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

function activateDataset(
  registry: DatasetRegistryItem[],
  type: DatasetType,
  input: {
    totalRows: number
    ignoredRows: number
    periodStart: string | null
    periodEnd: string | null
    lastImportedFile: string | null
    lastImportedAt: string | null
  },
): void {
  const index = registry.findIndex((dataset) => dataset.type === type)

  if (index < 0) {
    return
  }

  registry[index] = {
    ...registry[index],
    status: 'active',
    storage: 'indexeddb',
    totalRows: input.totalRows,
    ignoredRows: input.ignoredRows,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    lastImportedFile: input.lastImportedFile,
    lastImportedAt: input.lastImportedAt,
    version: 1,
  }
}

export function buildDatasetRegistry(
  input: BuildDatasetRegistryInput,
): DatasetRegistryItem[] {
  const registry = DATASET_DEFINITIONS.map(createEmptyRegistryItem)

  if (input.salesSummary) {
    activateDataset(registry, 'sales', {
      totalRows: input.salesSummary.processedRows,
      ignoredRows: input.salesSummary.ignoredRows,
      periodStart: input.salesSummary.periodStart,
      periodEnd: input.salesSummary.periodEnd,
      lastImportedFile: input.salesLastImportedFile,
      lastImportedAt: input.salesLastImportedAt,
    })
  }

  if (input.targetSummary) {
    activateDataset(registry, 'salesTargets', {
      totalRows: input.targetSummary.processedRows,
      ignoredRows: input.targetSummary.ignoredRows,
      periodStart: input.targetSummary.periodStart,
      periodEnd: input.targetSummary.periodEnd,
      lastImportedFile: input.targetsLastImportedFile,
      lastImportedAt: input.targetsLastImportedAt,
    })
  }

  if (input.inventorySummary) {
    activateDataset(registry, 'inventory', {
      totalRows: input.inventorySummary.processedRows,
      ignoredRows: input.inventorySummary.ignoredRows,
      periodStart: input.inventorySummary.periodStart,
      periodEnd: input.inventorySummary.periodEnd,
      lastImportedFile: input.inventoryLastImportedFile,
      lastImportedAt: input.inventoryLastImportedAt,
    })
  }

  if (input.productMasterSummary) {
    activateDataset(registry, 'products', {
      totalRows: input.productMasterSummary.processedRows,
      ignoredRows: input.productMasterSummary.ignoredRows,
      periodStart: null,
      periodEnd: null,
      lastImportedFile: input.productMasterLastImportedFile,
      lastImportedAt: input.productMasterLastImportedAt,
    })
  }

  if (input.projectsSummary) {
    activateDataset(registry, 'projects', {
      totalRows: input.projectsSummary.processedRows,
      ignoredRows: input.projectsSummary.ignoredRows,
      periodStart: input.projectsSummary.periodStart,
      periodEnd: input.projectsSummary.periodEnd,
      lastImportedFile: input.projectsLastImportedFile ?? null,
      lastImportedAt: input.projectsLastImportedAt ?? null,
    })
  }

  if (input.projectBillingSummary) {
    activateDataset(registry, 'projectBillings', {
      totalRows: input.projectBillingSummary.processedRows,
      ignoredRows: input.projectBillingSummary.ignoredRows,
      periodStart: input.projectBillingSummary.periodStart,
      periodEnd: input.projectBillingSummary.periodEnd,
      lastImportedFile: input.projectBillingLastImportedFile ?? null,
      lastImportedAt: input.projectBillingLastImportedAt ?? null,
    })
  }

  if (input.exchangeRateSummary) {
    activateDataset(registry, 'exchangeRates', {
      totalRows: input.exchangeRateSummary.processedRows,
      ignoredRows: input.exchangeRateSummary.ignoredRows,
      periodStart: input.exchangeRateSummary.periodStart,
      periodEnd: input.exchangeRateSummary.periodEnd,
      lastImportedFile: input.exchangeRateLastImportedFile ?? null,
      lastImportedAt: input.exchangeRateLastImportedAt ?? null,
    })
  }

  return registry.sort(
    (left, right) => left.displayOrder - right.displayOrder,
  )
}
