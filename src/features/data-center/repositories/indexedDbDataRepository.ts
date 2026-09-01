import type {
  DataRepository,
  PersistedCustomerMasterDataset,
  PersistedExchangeRateDataset,
  PersistedInventoryDataset,
  PersistedProductMasterDataset,
  PersistedProjectBillingDataset,
  PersistedProjectDataset,
  PersistedPricingDataset,
  PersistedPurchaseOrderDataset,
  PersistedPurchaseRequestDataset,
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
  PRICING_METADATA_KEY,
  PURCHASE_ORDER_CHUNK_SIZE,
  PURCHASE_ORDER_METADATA_KEY,
  PURCHASE_REQUEST_METADATA_KEY,
  SALES_CHUNK_SIZE,
  SALES_METADATA_KEY,
  TARGET_METADATA_KEY,
  type PersistedExchangeRateMetadata,
  type PersistedInventoryMetadata,
  type PersistedProductMasterMetadata,
  type PersistedProjectBillingChunk,
  type PersistedProjectBillingMetadata,
  type PersistedProjectMetadata,
  type PersistedPricingMetadata,
  type PersistedPurchaseOrderChunk,
  type PersistedPurchaseOrderMetadata,
  type PersistedPurchaseRequestMetadata,
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

function createPurchaseOrderChunks(
  rows: PersistedPurchaseOrderDataset['normalizedRows'],
): PersistedPurchaseOrderChunk[] {
  const chunks: PersistedPurchaseOrderChunk[] = []

  for (
    let startIndex = 0;
    startIndex < rows.length;
    startIndex += PURCHASE_ORDER_CHUNK_SIZE
  ) {
    const chunkIndex = Math.floor(
      startIndex / PURCHASE_ORDER_CHUNK_SIZE,
    )

    chunks.push({
      chunkIndex,
      rows: rows.slice(
        startIndex,
        startIndex + PURCHASE_ORDER_CHUNK_SIZE,
      ),
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

  async savePurchaseOrderDataset(
    dataset: PersistedPurchaseOrderDataset,
  ) {
    const database =
      await getDataCenterDatabase()

    const chunks =
      createPurchaseOrderChunks(
        dataset.normalizedRows,
      )

    const metadata:
      PersistedPurchaseOrderMetadata = {
      id: PURCHASE_ORDER_METADATA_KEY,
      summary: dataset.summary,
      lastImportedFile:
        dataset.lastImportedFile,
      lastImportedAt:
        dataset.lastImportedAt,
      totalRows:
        dataset.normalizedRows.length,
      totalChunks:
        chunks.length,
      persistenceVersion: 1,
    }

    const transaction =
      database.transaction(
        [
          'purchaseOrderMetadata',
          'purchaseOrderChunks',
        ],
        'readwrite',
      )

    await transaction
      .objectStore('purchaseOrderChunks')
      .clear()

    await Promise.all(
      chunks.map((chunk) =>
        transaction
          .objectStore(
            'purchaseOrderChunks',
          )
          .put(
            chunk,
            chunk.chunkIndex,
          ),
      ),
    )

    await transaction
      .objectStore(
        'purchaseOrderMetadata',
      )
      .put(
        metadata,
        PURCHASE_ORDER_METADATA_KEY,
      )

    await transaction.done
  },

  async loadPurchaseOrderDataset() {
    const database =
      await getDataCenterDatabase()

    const metadata =
      await database.get(
        'purchaseOrderMetadata',
        PURCHASE_ORDER_METADATA_KEY,
      )

    if (!metadata) {
      return null
    }

    const chunks =
      await database.getAll(
        'purchaseOrderChunks',
      )

    const normalizedRows =
      [...chunks]
        .sort(
          (left, right) =>
            left.chunkIndex -
            right.chunkIndex,
        )
        .flatMap(
          (chunk) => chunk.rows,
        )

    if (
      normalizedRows.length !==
      metadata.totalRows
    ) {
      throw new Error(
        `Las órdenes de compra persistidas están incompletas. Se esperaban ${metadata.totalRows.toLocaleString()} líneas y se recuperaron ${normalizedRows.length.toLocaleString()}.`,
      )
    }

    return {
      summary:
        metadata.summary,
      normalizedRows,
      lastImportedFile:
        metadata.lastImportedFile,
      lastImportedAt:
        metadata.lastImportedAt,
    }
  },

  async savePurchaseRequestDataset(
    dataset: PersistedPurchaseRequestDataset,
  ) {
    const database =
      await getDataCenterDatabase()

    const metadata:
      PersistedPurchaseRequestMetadata = {
      id: PURCHASE_REQUEST_METADATA_KEY,
      summary: dataset.summary,
      normalizedRows:
        dataset.normalizedRows,
      lastImportedFile:
        dataset.lastImportedFile,
      lastImportedAt:
        dataset.lastImportedAt,
      persistenceVersion: 1,
    }

    await database.put(
      'purchaseRequestMetadata',
      metadata,
      PURCHASE_REQUEST_METADATA_KEY,
    )
  },

  async loadPurchaseRequestDataset() {
    const database =
      await getDataCenterDatabase()

    const metadata =
      await database.get(
        'purchaseRequestMetadata',
        PURCHASE_REQUEST_METADATA_KEY,
      )

    if (!metadata) {
      return null
    }

    return {
      summary:
        metadata.summary,
      normalizedRows:
        metadata.normalizedRows,
      lastImportedFile:
        metadata.lastImportedFile,
      lastImportedAt:
        metadata.lastImportedAt,
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

  async savePricingDataset(
    dataset: PersistedPricingDataset,
  ) {
    const database = await getDataCenterDatabase()
    const metadata: PersistedPricingMetadata = {
      id: PRICING_METADATA_KEY,
      summary: dataset.summary,
      normalizedRows: dataset.normalizedRows,
      lastImportedFile: dataset.lastImportedFile,
      lastImportedAt: dataset.lastImportedAt,
      persistenceVersion: 1,
    }

    await database.put(
      'pricingMetadata',
      metadata,
      PRICING_METADATA_KEY,
    )
  },

  async loadPricingDataset() {
    const database = await getDataCenterDatabase()
    const metadata = await database.get(
      'pricingMetadata',
      PRICING_METADATA_KEY,
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

    async saveCustomerMasterDataset(
    _dataset: PersistedCustomerMasterDataset,
  ): Promise<void> {
    throw new Error(
      'Customer Master is persisted exclusively in PostgreSQL.',
    )
  },

  async loadCustomerMasterDataset():
    Promise<PersistedCustomerMasterDataset | null> {
    return null
  },


   async clearAllData() {
    const database =
      await getDataCenterDatabase()

    const transaction =
      database.transaction(
        [
          'salesMetadata',
          'salesChunks',
          'targetMetadata',
          'productMetadata',
          'inventoryMetadata',
          'purchaseOrderMetadata',
          'purchaseOrderChunks',
          'purchaseRequestMetadata',
          'projectMetadata',
          'projectBillingMetadata',
          'projectBillingChunks',
          'exchangeRateMetadata',
          'pricingMetadata',
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
      transaction
        .objectStore('targetMetadata')
        .clear(),
      transaction
        .objectStore('productMetadata')
        .clear(),
      transaction
        .objectStore('inventoryMetadata')
        .clear(),
      transaction
        .objectStore('purchaseOrderMetadata')
        .clear(),
      transaction
        .objectStore('purchaseOrderChunks')
        .clear(),
      transaction
        .objectStore('purchaseRequestMetadata')
        .clear(),
      transaction
        .objectStore('projectMetadata')
        .clear(),
      transaction
        .objectStore('projectBillingMetadata')
        .clear(),
      transaction
        .objectStore('projectBillingChunks')
        .clear(),
      transaction
        .objectStore('exchangeRateMetadata')
        .clear(),
      transaction
        .objectStore('pricingMetadata')
        .clear(),
    ])

    await transaction.done
  },
}