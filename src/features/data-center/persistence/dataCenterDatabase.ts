import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
} from 'idb'

import type {
  SalesDatasetSummary,
} from '../types/reportTypes'
import type {
  NormalizedSalesRow,
} from '../importers/sales/salesTypes'
import type {
  NormalizedTargetRow,
  TargetDatasetSummary,
} from '../importers/targets/targetTypes'
import type {
  NormalizedProductMasterRow,
  ProductMasterDatasetSummary,
} from '../importers/products/productMasterTypes'
import type {
  InventoryDatasetSummary,
  NormalizedInventoryRow,
} from '../importers/inventory/inventoryTypes'
import type {
  NormalizedProjectRow,
  ProjectDatasetSummary,
} from '../importers/projects/projectTypes'
import type {
  NormalizedProjectBillingRow,
  ProjectBillingDatasetSummary,
} from '../importers/project-billings/projectBillingTypes'
import type {
  ExchangeRateDatasetSummary,
  NormalizedExchangeRateRow,
} from '../importers/exchange-rates/exchangeRateTypes'
import type {
  NormalizedPricingRow,
  PricingDatasetSummary,
} from '../importers/pricing/pricingTypes'

export const DATA_CENTER_DATABASE_NAME =
  'pm-intelligence-workspace'

export const DATA_CENTER_DATABASE_VERSION = 8

export const SALES_METADATA_KEY =
  'current-sales-dataset'
export const TARGET_METADATA_KEY =
  'current-target-dataset'
export const PRODUCT_METADATA_KEY =
  'current-product-master-dataset'
export const INVENTORY_METADATA_KEY =
  'current-inventory-dataset'
export const PROJECT_METADATA_KEY =
  'current-project-dataset'
export const PROJECT_BILLING_METADATA_KEY =
  'current-project-billing-dataset'
export const EXCHANGE_RATE_METADATA_KEY =
  'current-exchange-rate-dataset'
export const PRICING_METADATA_KEY =
  'current-pricing-dataset'

export const SALES_CHUNK_SIZE = 5_000
export const PROJECT_BILLING_CHUNK_SIZE = 2_500

export interface PersistedSalesMetadata {
  id: string
  summary: SalesDatasetSummary
  lastImportedFile: string
  lastImportedAt: string
  totalRows: number
  totalChunks: number
  persistenceVersion: number
}

export interface PersistedSalesChunk {
  chunkIndex: number
  rows: NormalizedSalesRow[]
}

export interface PersistedTargetMetadata {
  id: string
  summary: TargetDatasetSummary
  normalizedRows: NormalizedTargetRow[]
  lastImportedFile: string
  lastImportedAt: string
  persistenceVersion: number
}

export interface PersistedProductMasterMetadata {
  id: string
  summary: ProductMasterDatasetSummary
  normalizedRows: NormalizedProductMasterRow[]
  lastImportedFile: string
  lastImportedAt: string
  persistenceVersion: number
}

export interface PersistedInventoryMetadata {
  id: string
  summary: InventoryDatasetSummary
  normalizedRows: NormalizedInventoryRow[]
  lastImportedFile: string
  lastImportedAt: string
  persistenceVersion: number
}

export interface PersistedProjectMetadata {
  id: string
  summary: ProjectDatasetSummary
  normalizedRows: NormalizedProjectRow[]
  lastImportedFile: string
  lastImportedAt: string
  persistenceVersion: number
}

export interface PersistedProjectBillingMetadata {
  id: string
  summary: ProjectBillingDatasetSummary
  lastImportedFile: string
  lastImportedAt: string
  totalRows: number
  totalChunks: number
  persistenceVersion: number
}

export interface PersistedProjectBillingChunk {
  chunkIndex: number
  rows: NormalizedProjectBillingRow[]
}

export interface PersistedExchangeRateMetadata {
  id: string
  summary: ExchangeRateDatasetSummary
  normalizedRows: NormalizedExchangeRateRow[]
  lastImportedFile: string
  lastImportedAt: string
  persistenceVersion: number
}

export interface PersistedPricingMetadata {
  id: string
  summary: PricingDatasetSummary
  normalizedRows: NormalizedPricingRow[]
  lastImportedFile: string
  lastImportedAt: string
  persistenceVersion: number
}

interface DataCenterDatabaseSchema
  extends DBSchema {
  salesMetadata: {
    key: string
    value: PersistedSalesMetadata
  }

  salesChunks: {
    key: number
    value: PersistedSalesChunk
  }

  targetMetadata: {
    key: string
    value: PersistedTargetMetadata
  }

  productMetadata: {
    key: string
    value: PersistedProductMasterMetadata
  }

  inventoryMetadata: {
    key: string
    value: PersistedInventoryMetadata
  }

  projectMetadata: {
    key: string
    value: PersistedProjectMetadata
  }

  projectBillingMetadata: {
    key: string
    value: PersistedProjectBillingMetadata
  }

  projectBillingChunks: {
    key: number
    value: PersistedProjectBillingChunk
  }

  exchangeRateMetadata: {
    key: string
    value: PersistedExchangeRateMetadata
  }

  pricingMetadata: {
    key: string
    value: PersistedPricingMetadata
  }
}

let databasePromise:
  Promise<
    IDBPDatabase<DataCenterDatabaseSchema>
  > | null = null

export function getDataCenterDatabase():
  Promise<
    IDBPDatabase<DataCenterDatabaseSchema>
  > {
  if (!databasePromise) {
    databasePromise =
      openDB<DataCenterDatabaseSchema>(
        DATA_CENTER_DATABASE_NAME,
        DATA_CENTER_DATABASE_VERSION,
        {
          upgrade(database) {
            if (!database.objectStoreNames.contains('salesMetadata')) {
              database.createObjectStore('salesMetadata')
            }

            if (!database.objectStoreNames.contains('salesChunks')) {
              database.createObjectStore('salesChunks')
            }

            if (!database.objectStoreNames.contains('targetMetadata')) {
              database.createObjectStore('targetMetadata')
            }

            if (!database.objectStoreNames.contains('productMetadata')) {
              database.createObjectStore('productMetadata')
            }

            if (!database.objectStoreNames.contains('inventoryMetadata')) {
              database.createObjectStore('inventoryMetadata')
            }

            if (!database.objectStoreNames.contains('projectMetadata')) {
              database.createObjectStore('projectMetadata')
            }

            if (!database.objectStoreNames.contains('projectBillingMetadata')) {
              database.createObjectStore('projectBillingMetadata')
            }

            if (!database.objectStoreNames.contains('projectBillingChunks')) {
              database.createObjectStore('projectBillingChunks')
            }

            if (!database.objectStoreNames.contains('exchangeRateMetadata')) {
              database.createObjectStore('exchangeRateMetadata')
            }

            if (!database.objectStoreNames.contains('pricingMetadata')) {
              database.createObjectStore('pricingMetadata')
            }
          },
        },
      )
  }

  return databasePromise
}
