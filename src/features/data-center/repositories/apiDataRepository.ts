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
  dataset: PersistedTargetDataset,
): Promise<void> {
  await requestJson(
    '/api/data/targets/import',
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
          dataset.summary.ignoredRows,
      }),
    },
  )
},

async loadTargetDataset():
  Promise<PersistedTargetDataset | null> {
  const response =
    await requestJson<{
      ok: true
      dataset: 'salesTargets'
      data: {
        normalizedRows:
          PersistedTargetDataset['normalizedRows']
        ignoredRows: number
        lastImportedFile: string
        lastImportedAt: string
      } | null
    }>(
      '/api/data/targets',
      {
        method: 'GET',
      },
    )

  if (!response.data) {
    return null
  }

  const {
    buildTargetBusinessModel,
  } = await import(
    '../importers/targets/targetBusinessModel'
  )

  const model =
    buildTargetBusinessModel(
      response.data.normalizedRows,
      response.data.ignoredRows,
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

    async saveProductMasterDataset(
  dataset: PersistedProductMasterDataset,
): Promise<void> {
  const chunkSize = 500

  const startResponse =
    await requestJson<{
      ok: true
      import: {
        id: number
      }
    }>(
      '/api/data/products/imports/start',
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

      navigator.sendBeacon(
        `/api/data/products/imports/${importId}/cancel`,
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
        `/api/data/products/imports/${importId}/chunks`,
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
      `/api/data/products/imports/${importId}/finalize`,
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
      await requestJson(
        `/api/data/products/imports/${importId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            reason:
              'Import cancelled after upload failure',
          }),
        },
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

async loadProductMasterDataset():
  Promise<PersistedProductMasterDataset | null> {
  const response =
    await requestJson<{
      ok: true
      dataset: 'products'
      data: {
        normalizedRows:
          PersistedProductMasterDataset['normalizedRows']
        ignoredRows: number
        lastImportedFile: string | null
        lastImportedAt: string | null
      } | null
    }>(
      '/api/data/products',
      {
        method: 'GET',
      },
    )

  if (!response.data) {
    return null
  }

  const {
    buildProductMasterBusinessModel,
  } = await import(
    '../importers/products/productMasterBusinessModel'
  )

  const model =
    buildProductMasterBusinessModel(
      response.data.normalizedRows,
      response.data.ignoredRows,
    )

  return {
    normalizedRows:
      response.data.normalizedRows,

    summary:
      model.summary,

    lastImportedFile:
      response.data.lastImportedFile ?? '',

    lastImportedAt:
      response.data.lastImportedAt ?? '',
  }
},

async saveInventoryDataset(
  dataset: PersistedInventoryDataset,
): Promise<void> {
  const chunkSize = 500

  const startResponse =
    await requestJson<{
      ok: true
      import: {
        id: number
      }
    }>(
      '/api/data/inventory/imports/start',
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

      navigator.sendBeacon(
        `/api/data/inventory/imports/${importId}/cancel`,
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
        `/api/data/inventory/imports/${importId}/chunks`,
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
      `/api/data/inventory/imports/${importId}/finalize`,
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
      await requestJson(
        `/api/data/inventory/imports/${importId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            reason:
              'Import cancelled after upload failure',
          }),
        },
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
  dataset: PersistedPurchaseOrderDataset,
): Promise<void> {
  const chunkSize = 500

  const startResponse =
    await requestJson<{
      ok: true
      import: {
        id: number
      }
    }>(
      '/api/data/purchases/imports/start',
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

      navigator.sendBeacon(
        `/api/data/purchases/imports/${importId}/cancel`,
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
        `/api/data/purchases/imports/${importId}/chunks`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            chunkIndex,
            rows,
          }),
        },
      )
    }

    await requestJson(
      `/api/data/purchases/imports/${importId}/finalize`,
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
      await requestJson(
        `/api/data/purchases/imports/${importId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            reason:
              'Import cancelled after upload failure',
          }),
        },
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

async loadPurchaseOrderDataset():
  Promise<PersistedPurchaseOrderDataset | null> {
  const response =
    await requestJson<{
      ok: true
      dataset: 'purchases'
      data: {
        normalizedRows:
          PersistedPurchaseOrderDataset['normalizedRows']
        ignoredRows: number
        lastImportedFile: string | null
        lastImportedAt: string | null
      } | null
    }>(
      '/api/data/purchases',
      {
        method: 'GET',
      },
    )

  if (!response.data) {
    return null
  }

  const {
    buildPurchaseOrderBusinessModel,
  } = await import(
    '../importers/purchases/purchaseOrderBusinessModel'
  )

  const model =
    buildPurchaseOrderBusinessModel(
      response.data.normalizedRows,
      response.data.ignoredRows,
    )

  return {
    normalizedRows:
      model.lines,

    summary:
      model.summary,

    lastImportedFile:
      response.data.lastImportedFile ?? '',

    lastImportedAt:
      response.data.lastImportedAt ?? '',
  }
},

    async savePurchaseRequestDataset(
  dataset: PersistedPurchaseRequestDataset,
): Promise<void> {
  const chunkSize = 500

  const startResponse =
    await requestJson<{
      ok: true
      import: {
        id: number
      }
    }>(
      '/api/data/purchase-requests/imports/start',
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

      navigator.sendBeacon(
        `/api/data/purchase-requests/imports/${importId}/cancel`,
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
        `/api/data/purchase-requests/imports/${importId}/chunks`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            chunkIndex,
            rows,
          }),
        },
      )
    }

    await requestJson(
      `/api/data/purchase-requests/imports/${importId}/finalize`,
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
      await requestJson(
        `/api/data/purchase-requests/imports/${importId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            reason:
              'Import cancelled after upload failure',
          }),
        },
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

    async loadPurchaseRequestDataset():
  Promise<PersistedPurchaseRequestDataset | null> {
  const response =
    await requestJson<{
      ok: true
      dataset: 'purchaseRequests'
      data: {
        normalizedRows:
          PersistedPurchaseRequestDataset['normalizedRows']
        ignoredRows: number
        lastImportedFile: string | null
        lastImportedAt: string | null
      } | null
    }>(
      '/api/data/purchase-requests',
      {
        method: 'GET',
      },
    )

  if (!response.data) {
    return null
  }

  const {
    buildPurchaseRequestBusinessModel,
  } = await import(
    '../importers/purchase-requests/purchaseRequestBusinessModel'
  )

  const model =
    buildPurchaseRequestBusinessModel(
      response.data.normalizedRows,
      response.data.ignoredRows,
    )

  return {
    normalizedRows:
      model.requests,

    summary:
      model.summary,

    lastImportedFile:
      response.data.lastImportedFile ?? '',

    lastImportedAt:
      response.data.lastImportedAt ?? '',
  }
},

    async saveProjectDataset(
  dataset: PersistedProjectDataset,
): Promise<void> {
  const chunkSize = 500

  const startResponse =
    await requestJson<{
      ok: true
      import: {
        id: number
      }
    }>(
      '/api/data/projects/imports/start',
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

      navigator.sendBeacon(
        `/api/data/projects/imports/${importId}/cancel`,
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
        `/api/data/projects/imports/${importId}/chunks`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            chunkIndex,
            rows,
          }),
        },
      )
    }

    await requestJson(
      `/api/data/projects/imports/${importId}/finalize`,
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
      await requestJson(
        `/api/data/projects/imports/${importId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            reason:
              'Import cancelled after upload failure',
          }),
        },
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

    async loadProjectDataset():
  Promise<PersistedProjectDataset | null> {
  const response =
    await requestJson<{
      ok: true
      dataset: 'projects'
      data: {
        normalizedRows:
          PersistedProjectDataset['normalizedRows']
        ignoredRows: number
        lastImportedFile: string | null
        lastImportedAt: string | null
      } | null
    }>(
      '/api/data/projects',
      {
        method: 'GET',
      },
    )

  if (!response.data) {
    return null
  }

  const {
    buildProjectBusinessModel,
  } = await import(
    '../importers/projects/projectBusinessModel'
  )

  const model =
    buildProjectBusinessModel(
      response.data.normalizedRows,
      response.data.ignoredRows,
    )

  return {
    normalizedRows:
      model.projects,

    summary:
      model.summary,

    lastImportedFile:
      response.data.lastImportedFile ?? '',

    lastImportedAt:
      response.data.lastImportedAt ?? '',
  }
},

    async saveProjectBillingDataset(
  dataset: PersistedProjectBillingDataset,
): Promise<void> {
  const chunkSize = 500

  const startResponse =
    await requestJson<{
      ok: true
      import: {
        id: number
      }
    }>(
      '/api/data/project-billings/imports/start',
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

      navigator.sendBeacon(
        `/api/data/project-billings/imports/${importId}/cancel`,
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
        `/api/data/project-billings/imports/${importId}/chunks`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            chunkIndex,
            rows,
          }),
        },
      )
    }

    await requestJson(
      `/api/data/project-billings/imports/${importId}/finalize`,
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
      await requestJson(
        `/api/data/project-billings/imports/${importId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            reason:
              'Import cancelled after upload failure',
          }),
        },
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

async loadProjectBillingDataset():
  Promise<PersistedProjectBillingDataset | null> {
  const response =
    await requestJson<{
      ok: true
      dataset: 'projectBillings'
      data: {
        normalizedRows:
          PersistedProjectBillingDataset['normalizedRows']
        ignoredRows: number
        lastImportedFile: string | null
        lastImportedAt: string | null
      } | null
    }>(
      '/api/data/project-billings',
      {
        method: 'GET',
      },
    )

  if (!response.data) {
    return null
  }

  const {
    buildProjectBillingBusinessModel,
  } = await import(
    '../importers/project-billings/projectBillingBusinessModel'
  )

  const model =
    buildProjectBillingBusinessModel(
      response.data.normalizedRows,
      response.data.ignoredRows,
    )

  return {
    normalizedRows:
      model.lines,

    summary:
      model.summary,

    lastImportedFile:
      response.data.lastImportedFile ?? '',

    lastImportedAt:
      response.data.lastImportedAt ?? '',
  }
},

        async saveExchangeRateDataset(
      dataset: PersistedExchangeRateDataset,
    ): Promise<void> {
      await requestJson(
        '/api/data/exchange-rates',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            fileName:
              dataset.lastImportedFile,
            rows:
              dataset.normalizedRows,
            ignoredRows:
              dataset.summary
                .ignoredRows,
          }),
        },
      )
    },

    async loadExchangeRateDataset():
      Promise<PersistedExchangeRateDataset | null> {
      const response =
        await requestJson<{
          ok: true
          dataset: 'exchangeRates'
          data: {
            normalizedRows:
              PersistedExchangeRateDataset['normalizedRows']
            ignoredRows: number
            lastImportedFile: string | null
            lastImportedAt: string | null
          } | null
        }>(
          '/api/data/exchange-rates',
          {
            method: 'GET',
          },
        )

      if (!response.data) {
        return null
      }

      const {
        buildExchangeRateBusinessModel,
      } = await import(
        '../importers/exchange-rates/exchangeRateBusinessModel'
      )

      const model =
        buildExchangeRateBusinessModel(
          response.data.normalizedRows,
          response.data.ignoredRows,
        )

      return {
        normalizedRows:
          model.rates,

        summary:
          model.summary,

        lastImportedFile:
          response.data
            .lastImportedFile ?? '',

        lastImportedAt:
          response.data
            .lastImportedAt ?? '',
      }
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
