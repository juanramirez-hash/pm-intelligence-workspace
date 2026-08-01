import type {
  DataRepository,
  PersistedExchangeRateDataset,
  PersistedInventoryDataset,
  PersistedProductMasterDataset,
  PersistedProjectBillingDataset,
  PersistedProjectDataset,
  PersistedSalesDataset,
  PersistedTargetDataset,
} from './dataRepository'

import {
  EXCHANGE_RATE_METADATA_KEY,
  getDataCenterDatabase,
  INVENTORY_METADATA_KEY,
  PRODUCT_METADATA_KEY,
  PROJECT_BILLING_CHUNK_SIZE,
  PROJECT_BILLING_METADATA_KEY,
  PROJECT_METADATA_KEY,
  SALES_CHUNK_SIZE,
  SALES_METADATA_KEY,
  TARGET_METADATA_KEY,
  type PersistedExchangeRateMetadata,
  type PersistedInventoryMetadata,
  type PersistedProductMasterMetadata,
  type PersistedProjectBillingChunk,
  type PersistedProjectBillingMetadata,
  type PersistedProjectMetadata,
  type PersistedSalesChunk,
  type PersistedSalesMetadata,
  type PersistedTargetMetadata,
} from '../persistence/dataCenterDatabase'

function createSalesChunks(
  rows: PersistedSalesDataset['normalizedRows'],
): PersistedSalesChunk[] {
  const chunks: PersistedSalesChunk[] = []

  for (
    let startIndex = 0;
    startIndex < rows.length;
    startIndex += SALES_CHUNK_SIZE
  ) {
    const chunkIndex = Math.floor(startIndex / SALES_CHUNK_SIZE)

    chunks.push({
      chunkIndex,
      rows: rows.slice(startIndex, startIndex + SALES_CHUNK_SIZE),
    })
  }

  return chunks
}

function createProjectBillingChunks(
  rows: PersistedProjectBillingDataset['normalizedRows'],
): PersistedProjectBillingChunk[] {
  const chunks: PersistedProjectBillingChunk[] = []

  for (
    let startIndex = 0;
    startIndex < rows.length;
    startIndex += PROJECT_BILLING_CHUNK_SIZE
  ) {
    const chunkIndex = Math.floor(
      startIndex / PROJECT_BILLING_CHUNK_SIZE,
    )

    chunks.push({
      chunkIndex,
      rows: rows.slice(
        startIndex,
        startIndex + PROJECT_BILLING_CHUNK_SIZE,
      ),
    })
  }

  return chunks
}

export const indexedDbDataRepository:
  DataRepository = {
  async saveSalesDataset(dataset) {
    const database = await getDataCenterDatabase()
    const chunks = createSalesChunks(dataset.normalizedRows)
    const metadata: PersistedSalesMetadata = {
      id: SALES_METADATA_KEY,
      summary: dataset.summary,
      lastImportedFile: dataset.lastImportedFile,
      lastImportedAt: dataset.lastImportedAt,
      totalRows: dataset.normalizedRows.length,
      totalChunks: chunks.length,
      persistenceVersion: 1,
    }

    const transaction = database.transaction(
      ['salesMetadata', 'salesChunks'],
      'readwrite',
    )

    await transaction.objectStore('salesChunks').clear()
    await Promise.all(
      chunks.map((chunk) =>
        transaction.objectStore('salesChunks').put(
          chunk,
          chunk.chunkIndex,
        ),
      ),
    )
    await transaction
      .objectStore('salesMetadata')
      .put(metadata, SALES_METADATA_KEY)
    await transaction.done
  },

  async loadSalesDataset() {
    const database = await getDataCenterDatabase()
    const metadata = await database.get(
      'salesMetadata',
      SALES_METADATA_KEY,
    )

    if (!metadata) {
      return null
    }

    const chunks = await database.getAll('salesChunks')
    const normalizedRows = [...chunks]
      .sort((left, right) => left.chunkIndex - right.chunkIndex)
      .flatMap((chunk) => chunk.rows)

    if (normalizedRows.length !== metadata.totalRows) {
      throw new Error(
        `La información persistida está incompleta. Se esperaban ${metadata.totalRows.toLocaleString()} registros y se recuperaron ${normalizedRows.length.toLocaleString()}.`,
      )
    }

    return {
      summary: metadata.summary,
      normalizedRows,
      lastImportedFile: metadata.lastImportedFile,
      lastImportedAt: metadata.lastImportedAt,
    }
  },

  async saveTargetDataset(dataset: PersistedTargetDataset) {
    const database = await getDataCenterDatabase()
    const metadata: PersistedTargetMetadata = {
      id: TARGET_METADATA_KEY,
      summary: dataset.summary,
      normalizedRows: dataset.normalizedRows,
      lastImportedFile: dataset.lastImportedFile,
      lastImportedAt: dataset.lastImportedAt,
      persistenceVersion: 1,
    }

    await database.put(
      'targetMetadata',
      metadata,
      TARGET_METADATA_KEY,
    )
  },

  async loadTargetDataset() {
    const database = await getDataCenterDatabase()
    const metadata = await database.get(
      'targetMetadata',
      TARGET_METADATA_KEY,
    )

    if (!metadata) {
      return null
    }

    return {
      summary: metadata.summary,
      normalizedRows: metadata.normalizedRows,
      lastImportedFile: metadata.lastImportedFile,
      lastImportedAt: metadata.lastImportedAt,
    }
  },

  async saveProductMasterDataset(
    dataset: PersistedProductMasterDataset,
  ) {
    const database = await getDataCenterDatabase()
    const metadata: PersistedProductMasterMetadata = {
      id: PRODUCT_METADATA_KEY,
      summary: dataset.summary,
      normalizedRows: dataset.normalizedRows,
      lastImportedFile: dataset.lastImportedFile,
      lastImportedAt: dataset.lastImportedAt,
      persistenceVersion: 1,
    }

    await database.put(
      'productMetadata',
      metadata,
      PRODUCT_METADATA_KEY,
    )
  },

  async loadProductMasterDataset() {
    const database = await getDataCenterDatabase()
    const metadata = await database.get(
      'productMetadata',
      PRODUCT_METADATA_KEY,
    )

    if (!metadata) {
      return null
    }

    return {
      summary: metadata.summary,
      normalizedRows: metadata.normalizedRows,
      lastImportedFile: metadata.lastImportedFile,
      lastImportedAt: metadata.lastImportedAt,
    }
  },

  async saveInventoryDataset(
    dataset: PersistedInventoryDataset,
  ) {
    const database = await getDataCenterDatabase()
    const metadata: PersistedInventoryMetadata = {
      id: INVENTORY_METADATA_KEY,
      summary: dataset.summary,
      normalizedRows: dataset.normalizedRows,
      lastImportedFile: dataset.lastImportedFile,
      lastImportedAt: dataset.lastImportedAt,
      persistenceVersion: 1,
    }

    await database.put(
      'inventoryMetadata',
      metadata,
      INVENTORY_METADATA_KEY,
    )
  },

  async loadInventoryDataset() {
    const database = await getDataCenterDatabase()
    const metadata = await database.get(
      'inventoryMetadata',
      INVENTORY_METADATA_KEY,
    )

    if (!metadata) {
      return null
    }

    return {
      summary: metadata.summary,
      normalizedRows: metadata.normalizedRows,
      lastImportedFile: metadata.lastImportedFile,
      lastImportedAt: metadata.lastImportedAt,
    }
  },

  async saveProjectDataset(
    dataset: PersistedProjectDataset,
  ) {
    const database = await getDataCenterDatabase()
    const metadata: PersistedProjectMetadata = {
      id: PROJECT_METADATA_KEY,
      summary: dataset.summary,
      normalizedRows: dataset.normalizedRows,
      lastImportedFile: dataset.lastImportedFile,
      lastImportedAt: dataset.lastImportedAt,
      persistenceVersion: 1,
    }

    await database.put(
      'projectMetadata',
      metadata,
      PROJECT_METADATA_KEY,
    )
  },

  async loadProjectDataset() {
    const database = await getDataCenterDatabase()
    const metadata = await database.get(
      'projectMetadata',
      PROJECT_METADATA_KEY,
    )

    if (!metadata) {
      return null
    }

    return {
      summary: metadata.summary,
      normalizedRows: metadata.normalizedRows,
      lastImportedFile: metadata.lastImportedFile,
      lastImportedAt: metadata.lastImportedAt,
    }
  },

  async saveProjectBillingDataset(
    dataset: PersistedProjectBillingDataset,
  ) {
    const database = await getDataCenterDatabase()
    const chunks = createProjectBillingChunks(
      dataset.normalizedRows,
    )
    const metadata: PersistedProjectBillingMetadata = {
      id: PROJECT_BILLING_METADATA_KEY,
      summary: dataset.summary,
      lastImportedFile: dataset.lastImportedFile,
      lastImportedAt: dataset.lastImportedAt,
      totalRows: dataset.normalizedRows.length,
      totalChunks: chunks.length,
      persistenceVersion: 1,
    }

    const transaction = database.transaction(
      ['projectBillingMetadata', 'projectBillingChunks'],
      'readwrite',
    )

    await transaction
      .objectStore('projectBillingChunks')
      .clear()
    await Promise.all(
      chunks.map((chunk) =>
        transaction
          .objectStore('projectBillingChunks')
          .put(chunk, chunk.chunkIndex),
      ),
    )
    await transaction
      .objectStore('projectBillingMetadata')
      .put(metadata, PROJECT_BILLING_METADATA_KEY)
    await transaction.done
  },

  async loadProjectBillingDataset() {
    const database = await getDataCenterDatabase()
    const metadata = await database.get(
      'projectBillingMetadata',
      PROJECT_BILLING_METADATA_KEY,
    )

    if (!metadata) {
      return null
    }

    const chunks = await database.getAll(
      'projectBillingChunks',
    )
    const normalizedRows = [...chunks]
      .sort((left, right) => left.chunkIndex - right.chunkIndex)
      .flatMap((chunk) => chunk.rows)

    if (normalizedRows.length !== metadata.totalRows) {
      throw new Error(
        `La facturación de proyectos persistida está incompleta. Se esperaban ${metadata.totalRows.toLocaleString()} líneas y se recuperaron ${normalizedRows.length.toLocaleString()}.`,
      )
    }

    return {
      summary: metadata.summary,
      normalizedRows,
      lastImportedFile: metadata.lastImportedFile,
      lastImportedAt: metadata.lastImportedAt,
    }
  },

  async saveExchangeRateDataset(
    dataset: PersistedExchangeRateDataset,
  ) {
    const database = await getDataCenterDatabase()
    const metadata: PersistedExchangeRateMetadata = {
      id: EXCHANGE_RATE_METADATA_KEY,
      summary: dataset.summary,
      normalizedRows: dataset.normalizedRows,
      lastImportedFile: dataset.lastImportedFile,
      lastImportedAt: dataset.lastImportedAt,
      persistenceVersion: 1,
    }

    await database.put(
      'exchangeRateMetadata',
      metadata,
      EXCHANGE_RATE_METADATA_KEY,
    )
  },

  async loadExchangeRateDataset() {
    const database = await getDataCenterDatabase()
    const metadata = await database.get(
      'exchangeRateMetadata',
      EXCHANGE_RATE_METADATA_KEY,
    )

    if (!metadata) {
      return null
    }

    return {
      summary: metadata.summary,
      normalizedRows: metadata.normalizedRows,
      lastImportedFile: metadata.lastImportedFile,
      lastImportedAt: metadata.lastImportedAt,
    }
  },

  async clearAllData() {
    const database = await getDataCenterDatabase()
    const transaction = database.transaction(
      [
        'salesMetadata',
        'salesChunks',
        'targetMetadata',
        'productMetadata',
        'inventoryMetadata',
        'projectMetadata',
        'projectBillingMetadata',
        'projectBillingChunks',
        'exchangeRateMetadata',
      ],
      'readwrite',
    )

    await Promise.all([
      transaction.objectStore('salesMetadata').clear(),
      transaction.objectStore('salesChunks').clear(),
      transaction.objectStore('targetMetadata').clear(),
      transaction.objectStore('productMetadata').clear(),
      transaction.objectStore('inventoryMetadata').clear(),
      transaction.objectStore('projectMetadata').clear(),
      transaction.objectStore('projectBillingMetadata').clear(),
      transaction.objectStore('projectBillingChunks').clear(),
      transaction.objectStore('exchangeRateMetadata').clear(),
    ])

    await transaction.done
  },
}
