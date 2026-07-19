import type {
  DataRepository,
  PersistedSalesDataset,
} from './dataRepository'

import {
  getDataCenterDatabase,
  SALES_CHUNK_SIZE,
  SALES_METADATA_KEY,
  type PersistedSalesChunk,
  type PersistedSalesMetadata,
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
    const chunkIndex =
      Math.floor(
        startIndex / SALES_CHUNK_SIZE,
      )

    chunks.push({
      chunkIndex,
      rows: rows.slice(
        startIndex,
        startIndex + SALES_CHUNK_SIZE,
      ),
    })
  }

  return chunks
}

export const indexedDbDataRepository:
  DataRepository = {
  async saveSalesDataset(
    dataset,
  ): Promise<void> {
    const database =
      await getDataCenterDatabase()

    const chunks =
      createSalesChunks(
        dataset.normalizedRows,
      )

    const metadata:
      PersistedSalesMetadata = {
      id: SALES_METADATA_KEY,

      summary: dataset.summary,

      lastImportedFile:
        dataset.lastImportedFile,

      lastImportedAt:
        dataset.lastImportedAt,

      totalRows:
        dataset.normalizedRows.length,

      totalChunks: chunks.length,

      persistenceVersion: 1,
    }

    const transaction =
      database.transaction(
        [
          'salesMetadata',
          'salesChunks',
        ],
        'readwrite',
      )

    const metadataStore =
      transaction.objectStore(
        'salesMetadata',
      )

    const chunksStore =
      transaction.objectStore(
        'salesChunks',
      )

    await chunksStore.clear()

    const chunkWrites =
      chunks.map((chunk) =>
        chunksStore.put(
          chunk,
          chunk.chunkIndex,
        ),
      )

    await Promise.all(chunkWrites)

    await metadataStore.put(
      metadata,
      SALES_METADATA_KEY,
    )

    await transaction.done
  },

  async loadSalesDataset():
    Promise<
      PersistedSalesDataset | null
    > {
    const database =
      await getDataCenterDatabase()

    const metadata =
      await database.get(
        'salesMetadata',
        SALES_METADATA_KEY,
      )

    if (!metadata) {
      return null
    }

    const chunks =
      await database.getAll(
        'salesChunks',
      )

    const sortedChunks =
      [...chunks].sort(
        (left, right) =>
          left.chunkIndex -
          right.chunkIndex,
      )

    const normalizedRows =
      sortedChunks.flatMap(
        (chunk) => chunk.rows,
      )

    if (
      normalizedRows.length !==
      metadata.totalRows
    ) {
      throw new Error(
        `La información persistida está incompleta. Se esperaban ${metadata.totalRows.toLocaleString()} registros y se recuperaron ${normalizedRows.length.toLocaleString()}.`,
      )
    }

    return {
      summary: metadata.summary,

      normalizedRows,

      lastImportedFile:
        metadata.lastImportedFile,

      lastImportedAt:
        metadata.lastImportedAt,
    }
  },

  async clearAllData():
    Promise<void> {
    const database =
      await getDataCenterDatabase()

    const transaction =
      database.transaction(
        [
          'salesMetadata',
          'salesChunks',
        ],
        'readwrite',
      )

    await Promise.all([
      transaction
        .objectStore('salesMetadata')
        .clear(),

      transaction
        .objectStore('salesChunks')
        .clear(),
    ])

    await transaction.done
  },
}