import type {
  DataRepository,
  PersistedExchangeRateDataset,
  PersistedInventoryDataset,
  PersistedPricingDataset,
  PersistedProductMasterDataset,
  PersistedProjectBillingDataset,
  PersistedProjectDataset,
  PersistedPurchaseOrderDataset,
  PersistedPurchaseRequestDataset,
  PersistedSalesDataset,
  PersistedTargetDataset,
} from './dataRepository'

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(
    input,
    {
      credentials: 'include',
      ...init,
    },
  )

  const payload =
    await response.json()
      .catch(() => null)

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return payload as T
}

async function cancelSalesImport(
  importId: number,
  reason: string,
): Promise<void> {
  await requestJson(
    `/api/data/sales/imports/${importId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        reason,
      }),
    },
  )
}

function cancelSalesImportOnPageExit(
  importId: number,
): void {
  navigator.sendBeacon(
    `/api/data/sales/imports/${importId}/cancel`,
  )
}

export const apiDataRepository:
  DataRepository = {
    async saveSalesDataset(
      dataset: PersistedSalesDataset,
    ): Promise<void> {
      const chunkSize = 500

      const startResponse =
        await requestJson<{
          ok: true
          import: {
            id: number
          }
        }>(
          '/api/data/sales/imports/start',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              fileName:
                dataset.lastImportedFile,
              sourceRowCount:
                dataset.normalizedRows.length,
              importScope:
                dataset.importScope ??
                'partial',
            }),
          },
        )

      const importId =
        startResponse.import.id

      let importCompleted = false

      const handlePageHide =
        () => {
          if (importCompleted) {
            return
          }

          cancelSalesImportOnPageExit(
            importId,
          )
        }

      window.addEventListener(
        'pagehide',
        handlePageHide,
      )

      try {
        for (
          let offset = 0;
          offset <
            dataset.normalizedRows.length;
          offset += chunkSize
        ) {
          const chunkIndex =
            Math.floor(
              offset / chunkSize,
            )

          const rows =
            dataset.normalizedRows.slice(
              offset,
              offset + chunkSize,
            )

          await requestJson(
            `/api/data/sales/imports/${importId}/chunks`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                chunkIndex,
                sourceRowOffset:
                  offset,
                rows,
              }),
            },
          )
        }

        await requestJson(
          `/api/data/sales/imports/${importId}/finalize`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              ignoredRows:
                dataset.summary
                  .ignoredRows,
            }),
          },
        )

        importCompleted = true
      } catch (error) {
        try {
          await cancelSalesImport(
            importId,
            'Import cancelled after upload failure',
          )
        } catch {
          // Preserve the original import error.
        }

        throw error
      } finally {
        window.removeEventListener(
          'pagehide',
          handlePageHide,
        )
      }
    },

    async loadSalesDataset():
      Promise<PersistedSalesDataset | null> {
      const response =
        await requestJson<{
          ok: true
          dataset: 'sales'
          data: {
            normalizedRows:
              PersistedSalesDataset['normalizedRows']
            lastImportedFile: string
            lastImportedAt: string
          } | null
        }>(
          '/api/data/sales',
          {
            method: 'GET',
          },
        )

      if (!response.data) {
        return null
      }

      const {
        buildSalesBusinessModel,
      } = await import(
        '../importers/sales/salesBusinessModel'
      )

      const {
        processSalesBusinessModel,
      } = await import(
        '../importers/sales/salesProcessor'
      )

      const model =
        buildSalesBusinessModel(
          response.data.normalizedRows,
          0,
        )

      return {
        normalizedRows:
          response.data.normalizedRows,

        summary:
          processSalesBusinessModel(
            model,
          ),

        lastImportedFile:
          response.data.lastImportedFile,

        lastImportedAt:
          response.data.lastImportedAt,

        importScope:
          'partial',
      }
    },
    async saveTargetDataset(
      _dataset: PersistedTargetDataset,
    ): Promise<void> {
      throw new Error(
        'Remote Target persistence is not implemented yet',
      )
    },

    async loadTargetDataset():
      Promise<PersistedTargetDataset | null> {
      throw new Error(
        'Remote Target loading is not implemented yet',
      )
    },

    async saveProductMasterDataset(
      _dataset: PersistedProductMasterDataset,
    ): Promise<void> {
      throw new Error(
        'Remote Product Master persistence is not implemented yet',
      )
    },

    async loadProductMasterDataset():
      Promise<PersistedProductMasterDataset | null> {
      throw new Error(
        'Remote Product Master loading is not implemented yet',
      )
    },

     async saveInventoryDataset(
      dataset: PersistedInventoryDataset,
): Promise<void> {
      await requestJson(
        '/api/data/inventory/import',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
        },
        body: JSON.stringify({
          rows:
            dataset.normalizedRows,
          fileName:
            dataset.lastImportedFile,
          ignoredRows:
            dataset.summary
            .ignoredRows,
      }),
    },
  )
},

    async loadInventoryDataset():
  Promise<PersistedInventoryDataset | null> {
  const response =
    await requestJson<{
      ok: true
      dataset: 'inventory'
      data: {
        normalizedRows:
          PersistedInventoryDataset['normalizedRows']
        lastImportedFile: string
        lastImportedAt: string
      } | null
    }>(
      '/api/data/inventory',
      {
        method: 'GET',
      },
    )

  if (!response.data) {
    return null
  }

  const {
    buildInventoryBusinessModel,
  } = await import(
    '../importers/inventory/inventoryBusinessModel'
  )

  const model =
    buildInventoryBusinessModel(
      response.data.normalizedRows,
      0,
    )

  return {
    normalizedRows:
      response.data.normalizedRows,

    summary:
      model.summary,

    lastImportedFile:
      response.data.lastImportedFile,

    lastImportedAt:
      response.data.lastImportedAt,
  }
},

    async savePurchaseOrderDataset(
      _dataset: PersistedPurchaseOrderDataset,
    ): Promise<void> {
      throw new Error(
        'Remote Purchase Order persistence is not implemented yet',
      )
    },

    async loadPurchaseOrderDataset():
      Promise<PersistedPurchaseOrderDataset | null> {
      throw new Error(
        'Remote Purchase Order loading is not implemented yet',
      )
    },

    async savePurchaseRequestDataset(
      _dataset: PersistedPurchaseRequestDataset,
    ): Promise<void> {
      throw new Error(
        'Remote Purchase Request persistence is not implemented yet',
      )
    },

    async loadPurchaseRequestDataset():
      Promise<PersistedPurchaseRequestDataset | null> {
      throw new Error(
        'Remote Purchase Request loading is not implemented yet',
      )
    },

    async saveProjectDataset(
      _dataset: PersistedProjectDataset,
    ): Promise<void> {
      throw new Error(
        'Remote Project persistence is not implemented yet',
      )
    },

    async loadProjectDataset():
      Promise<PersistedProjectDataset | null> {
      throw new Error(
        'Remote Project loading is not implemented yet',
      )
    },

    async saveProjectBillingDataset(
      _dataset: PersistedProjectBillingDataset,
    ): Promise<void> {
      throw new Error(
        'Remote Project Billing persistence is not implemented yet',
      )
    },

    async loadProjectBillingDataset():
      Promise<PersistedProjectBillingDataset | null> {
      throw new Error(
        'Remote Project Billing loading is not implemented yet',
      )
    },

    async saveExchangeRateDataset(
      _dataset: PersistedExchangeRateDataset,
    ): Promise<void> {
      throw new Error(
        'Remote Exchange Rate persistence is not implemented yet',
      )
    },

    async loadExchangeRateDataset():
      Promise<PersistedExchangeRateDataset | null> {
      throw new Error(
        'Remote Exchange Rate loading is not implemented yet',
      )
    },

    async savePricingDataset(
      _dataset: PersistedPricingDataset,
    ): Promise<void> {
      throw new Error(
        'Remote Pricing persistence is not implemented yet',
      )
    },

    async loadPricingDataset():
      Promise<PersistedPricingDataset | null> {
      throw new Error(
        'Remote Pricing loading is not implemented yet',
      )
    },

    async clearAllData():
      Promise<void> {
      throw new Error(
        'Remote data clearing is not implemented yet',
      )
    },
  }
