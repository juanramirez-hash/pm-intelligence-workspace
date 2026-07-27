import type {
  DataRepository,
  PersistedSalesDataset,
} from './dataRepository'

import {
  getDataCenterDatabase,
  SALES_CHUNK_SIZE,
  SALES_METADATA_KEY,
  TARGET_METADATA_KEY,
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
        transaction.objectStore('salesChunks').put(chunk, chunk.chunkIndex),
      ),
    )
    await transaction.objectStore('salesMetadata').put(metadata, SALES_METADATA_KEY)
    await transaction.done
  },

  async loadSalesDataset() {
    const database = await getDataCenterDatabase()
    const metadata = await database.get('salesMetadata', SALES_METADATA_KEY)

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

  async saveTargetDataset(dataset) {
    const database = await getDataCenterDatabase()
    const metadata: PersistedTargetMetadata = {
      id: TARGET_METADATA_KEY,
      summary: dataset.summary,
      normalizedRows: dataset.normalizedRows,
      lastImportedFile: dataset.lastImportedFile,
      lastImportedAt: dataset.lastImportedAt,
      persistenceVersion: 1,
    }

    await database.put('targetMetadata', metadata, TARGET_METADATA_KEY)
  },

  async loadTargetDataset() {
    const database = await getDataCenterDatabase()
    const metadata = await database.get('targetMetadata', TARGET_METADATA_KEY)

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
      ['salesMetadata', 'salesChunks', 'targetMetadata'],
      'readwrite',
    )

    await Promise.all([
      transaction.objectStore('salesMetadata').clear(),
      transaction.objectStore('salesChunks').clear(),
      transaction.objectStore('targetMetadata').clear(),
    ])

    await transaction.done
  },
}
