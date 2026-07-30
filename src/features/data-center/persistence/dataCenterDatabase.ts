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

export const DATA_CENTER_DATABASE_NAME =
  'pm-intelligence-workspace'

export const DATA_CENTER_DATABASE_VERSION = 4

export const SALES_METADATA_KEY =
  'current-sales-dataset'
export const TARGET_METADATA_KEY =
  'current-target-dataset'
export const PRODUCT_METADATA_KEY =
  'current-product-master-dataset'
export const INVENTORY_METADATA_KEY =
  'current-inventory-dataset'

export const SALES_CHUNK_SIZE = 5_000

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
          },
        },
      )
  }

  return databasePromise
}
