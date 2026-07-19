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

export const DATA_CENTER_DATABASE_NAME =
  'pm-intelligence-workspace'

export const DATA_CENTER_DATABASE_VERSION = 1

export const SALES_METADATA_KEY =
  'current-sales-dataset'

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
            if (
              !database.objectStoreNames.contains(
                'salesMetadata',
              )
            ) {
              database.createObjectStore(
                'salesMetadata',
              )
            }

            if (
              !database.objectStoreNames.contains(
                'salesChunks',
              )
            ) {
              database.createObjectStore(
                'salesChunks',
              )
            }
          },
        },
      )
  }

  return databasePromise
}