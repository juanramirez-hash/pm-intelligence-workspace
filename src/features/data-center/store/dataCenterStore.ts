import { create } from 'zustand'

import type {
  FileMetadata,
  ImportError,
} from '../types/commonTypes'
import type {
  ImportStatus,
} from '../types/importTypes'
import type {
  ReportType,
  SalesDatasetSummary,
  TargetDatasetSummary,
} from '../types/reportTypes'
import type {
  SpreadsheetRow,
} from '../parsers/spreadsheetParser'
import type {
  DataCenterImportResult,
} from '../services/importService'
import type {
  NormalizedSalesRow,
} from '../importers/sales/salesTypes'
import type {
  NormalizedTargetRow,
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
  NormalizedPurchaseOrderRow,
  PurchaseOrderDatasetSummary,
} from '../importers/purchases/purchaseOrderTypes'
import type {
  NormalizedPurchaseRequestRow,
  PurchaseRequestDatasetSummary,
} from '../importers/purchase-requests/purchaseRequestTypes'

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
import {
  buildProjectBusinessModel,
  upsertProjectRows,
} from '../importers/projects/projectBusinessModel'
import {
  buildProjectBillingBusinessModel,
  mergeProjectBillingRows,
} from '../importers/project-billings/projectBillingBusinessModel'
import {
  buildExchangeRateBusinessModel,
  upsertExchangeRateRows,
} from '../importers/exchange-rates/exchangeRateBusinessModel'
import {
  buildPricingBusinessModel,
} from '../importers/pricing/pricingBusinessModel'

import {
  runDataCenterImport,
} from '../services/importService'
import {
  indexedDbDataRepository,
} from '../repositories/indexedDbDataRepository'

import {
  apiDataRepository,
} from '../repositories/apiDataRepository'

import {
  buildPurchaseOrderBusinessModel,
  mergePurchaseOrderRows,
} from '../importers/purchases/purchaseOrderBusinessModel'
import {
  buildPurchaseRequestBusinessModel,
  mergePurchaseRequestRows,
} from '../importers/purchase-requests/purchaseRequestBusinessModel'

export interface DataCenterState {
  activeReportType: ReportType | null

  importStatus: ImportStatus

  fileMetadata: FileMetadata | null

  importErrors: ImportError[]

  lastImportedFile: string | null

  lastImportedAt: string | null

  salesSummary:
    SalesDatasetSummary | null

  normalizedSales:
    NormalizedSalesRow[]

  targetSummary:
    TargetDatasetSummary | null

  normalizedTargets:
    NormalizedTargetRow[]

  targetsLastImportedFile: string | null

  targetsLastImportedAt: string | null

  productMasterSummary:
    ProductMasterDatasetSummary | null

  normalizedProductMaster:
    NormalizedProductMasterRow[]

  productMasterLastImportedFile:
    string | null

  productMasterLastImportedAt:
    string | null

  inventorySummary: InventoryDatasetSummary | null

  normalizedInventory: NormalizedInventoryRow[]

  inventoryLastImportedFile: string | null

  inventoryLastImportedAt: string | null

  purchaseOrderSummary:
    PurchaseOrderDatasetSummary | null

  normalizedPurchaseOrders:
    NormalizedPurchaseOrderRow[]

  purchaseOrderLastImportedFile:
    string | null

  purchaseOrderLastImportedAt:
    string | null

  purchaseRequestSummary:
    PurchaseRequestDatasetSummary | null

  normalizedPurchaseRequests:
    NormalizedPurchaseRequestRow[]

  purchaseRequestLastImportedFile:
    string | null

  purchaseRequestLastImportedAt:
    string | null

  projectsSummary: ProjectDatasetSummary | null

  normalizedProjects: NormalizedProjectRow[]

  projectsLastImportedFile: string | null

  projectsLastImportedAt: string | null

  projectBillingSummary: ProjectBillingDatasetSummary | null

  normalizedProjectBillings: NormalizedProjectBillingRow[]

  projectBillingLastImportedFile: string | null

  projectBillingLastImportedAt: string | null

  exchangeRateSummary: ExchangeRateDatasetSummary | null

  normalizedExchangeRates: NormalizedExchangeRateRow[]

  exchangeRateLastImportedFile: string | null

  exchangeRateLastImportedAt: string | null

  pricingSummary: PricingDatasetSummary | null

  normalizedPricing: NormalizedPricingRow[]

  pricingLastImportedFile: string | null

  pricingLastImportedAt: string | null

  forecastSummary: unknown | null

  quotaSummary: unknown | null

  customersSummary: unknown | null

  isHydrating: boolean

  isHydrated: boolean

  isPersisting: boolean

  persistenceError: string | null

  setReportType: (
    report: ReportType | null,
  ) => void

  setImportStatus: (
    status: ImportStatus,
  ) => void

  setFileMetadata: (
    metadata: FileMetadata | null,
  ) => void

  setImportErrors: (
    errors: ImportError[],
  ) => void

  setSalesSummary: (
    summary:
      SalesDatasetSummary | null,
  ) => void

  setNormalizedSales: (
    rows: NormalizedSalesRow[],
  ) => void

  setTargetSummary: (
    summary: TargetDatasetSummary | null,
  ) => void

  setNormalizedTargets: (
    rows: NormalizedTargetRow[],
  ) => void

  setProductMasterSummary: (
    summary: ProductMasterDatasetSummary | null,
  ) => void

  setNormalizedProductMaster: (
    rows: NormalizedProductMasterRow[],
  ) => void

  setInventorySummary: (
    summary: InventoryDatasetSummary | null,
  ) => void

  setNormalizedInventory: (
    rows: NormalizedInventoryRow[],
  ) => void

  setPurchaseOrderSummary: (
    summary:
      PurchaseOrderDatasetSummary | null,
  ) => void

  setNormalizedPurchaseOrders: (
    rows: NormalizedPurchaseOrderRow[],
  ) => void

  setPurchaseRequestSummary: (
    summary:
      PurchaseRequestDatasetSummary | null,
  ) => void

  setNormalizedPurchaseRequests: (
    rows: NormalizedPurchaseRequestRow[],
  ) => void

  setForecastSummary: (
    summary: unknown | null,
  ) => void

  setQuotaSummary: (
    summary: unknown | null,
  ) => void

  setProjectsSummary: (
    summary: ProjectDatasetSummary | null,
  ) => void

  setNormalizedProjects: (
    rows: NormalizedProjectRow[],
  ) => void

  setProjectBillingSummary: (
    summary: ProjectBillingDatasetSummary | null,
  ) => void

  setNormalizedProjectBillings: (
    rows: NormalizedProjectBillingRow[],
  ) => void

  setExchangeRateSummary: (
    summary: ExchangeRateDatasetSummary | null,
  ) => void

  setNormalizedExchangeRates: (
    rows: NormalizedExchangeRateRow[],
  ) => void

  upsertExchangeRate: (
    input: Omit<NormalizedExchangeRateRow, 'recordedAt'>,
  ) => void

  setPricingSummary: (
    summary: PricingDatasetSummary | null,
  ) => void

  setNormalizedPricing: (
    rows: NormalizedPricingRow[],
  ) => void

  setCustomersSummary: (
    summary: unknown | null,
  ) => void

  executeImport: (
    rows: SpreadsheetRow[],
    metadata: FileMetadata,
    selectedReportType?: ReportType,
    importScope?: 'full-periods' | 'partial',
  ) => DataCenterImportResult | null

  hydratePersistedData:
    () => Promise<void>

  clearPersistedData:
    () => Promise<void>

  completeImport: (
    fileName: string,
  ) => void

  resetCurrentImport: () => void

  resetAllData: () => Promise<void>
}

function getErrorMessage(
  caughtError: unknown,
  fallbackMessage: string,
): string {
  return caughtError instanceof Error
    ? caughtError.message
    : fallbackMessage
}

export const useDataCenterStore =
  create<DataCenterState>(
    (set, get) => ({
      activeReportType: null,

      importStatus: 'idle',

      fileMetadata: null,

      importErrors: [],

      lastImportedFile: null,

      lastImportedAt: null,

      salesSummary: null,

      normalizedSales: [],

      targetSummary: null,

      normalizedTargets: [],

      targetsLastImportedFile: null,

      targetsLastImportedAt: null,

      productMasterSummary: null,

      normalizedProductMaster: [],

      productMasterLastImportedFile: null,

      productMasterLastImportedAt: null,

      inventorySummary: null,

      normalizedInventory: [],

      inventoryLastImportedFile: null,

      inventoryLastImportedAt: null,

      purchaseOrderSummary: null,

      normalizedPurchaseOrders: [],

      purchaseOrderLastImportedFile: null,

      purchaseOrderLastImportedAt: null,

      purchaseRequestSummary: null,

      normalizedPurchaseRequests: [],

      purchaseRequestLastImportedFile: null,

      purchaseRequestLastImportedAt: null,

      projectsSummary: null,

      normalizedProjects: [],

      projectsLastImportedFile: null,

      projectsLastImportedAt: null,

      projectBillingSummary: null,

      normalizedProjectBillings: [],

      projectBillingLastImportedFile: null,

      projectBillingLastImportedAt: null,

      exchangeRateSummary: null,

      normalizedExchangeRates: [],

      exchangeRateLastImportedFile: null,

      exchangeRateLastImportedAt: null,

      pricingSummary: null,

      normalizedPricing: [],

      pricingLastImportedFile: null,

      pricingLastImportedAt: null,

      forecastSummary: null,

      quotaSummary: null,

      customersSummary: null,

      isHydrating: false,

      isHydrated: false,

      isPersisting: false,

      persistenceError: null,

      setReportType: (report) =>
        set({
          activeReportType: report,
        }),

      setImportStatus: (status) =>
        set({
          importStatus: status,
        }),

      setFileMetadata: (metadata) =>
        set({
          fileMetadata: metadata,
        }),

      setImportErrors: (errors) =>
        set({
          importErrors: errors,
        }),

      setSalesSummary: (summary) =>
        set({
          salesSummary: summary,
        }),

      setNormalizedSales: (rows) =>
        set({
          normalizedSales: rows,
        }),

      setTargetSummary: (summary) =>
        set({
          targetSummary: summary,
        }),

      setNormalizedTargets: (rows) =>
        set({
          normalizedTargets: rows,
        }),

      setProductMasterSummary: (summary) =>
        set({
          productMasterSummary: summary,
        }),

      setNormalizedProductMaster: (rows) =>
        set({
          normalizedProductMaster: rows,
        }),

      setInventorySummary: (
        summary,
      ) =>
        set({
          inventorySummary: summary,
        }),

      setNormalizedInventory: (rows) =>
        set({ normalizedInventory: rows }),

      setPurchaseOrderSummary: (summary) =>
        set({
          purchaseOrderSummary: summary,
        }),

      setNormalizedPurchaseOrders: (rows) =>
        set({
          normalizedPurchaseOrders: rows,
        }),

      setPurchaseRequestSummary: (summary) =>
        set({
          purchaseRequestSummary: summary,
        }),

      setNormalizedPurchaseRequests: (rows) =>
        set({
          normalizedPurchaseRequests: rows,
        }),

      setForecastSummary: (
        summary,
      ) =>
        set({
          forecastSummary: summary,
        }),

      setQuotaSummary: (summary) =>
        set({
          quotaSummary: summary,
        }),

      setProjectsSummary: (summary) =>
        set({ projectsSummary: summary }),

      setNormalizedProjects: (rows) =>
        set({ normalizedProjects: rows }),

      setProjectBillingSummary: (summary) =>
        set({ projectBillingSummary: summary }),

      setNormalizedProjectBillings: (rows) =>
        set({ normalizedProjectBillings: rows }),

      setExchangeRateSummary: (summary) =>
        set({ exchangeRateSummary: summary }),

      setNormalizedExchangeRates: (rows) =>
        set({ normalizedExchangeRates: rows }),

      upsertExchangeRate: (input) => {
        const recordedAt = new Date().toISOString()
        const currentRows = get().normalizedExchangeRates
        const normalizedRows = upsertExchangeRateRows(
          currentRows,
          [{ ...input, recordedAt }],
        )
        const businessModel = buildExchangeRateBusinessModel(
          normalizedRows,
        )

        set({
          activeReportType: 'exchange-rates',
          exchangeRateSummary: businessModel.summary,
          normalizedExchangeRates: businessModel.rates,
          exchangeRateLastImportedFile: 'Registro manual',
          exchangeRateLastImportedAt: recordedAt,
          importStatus: 'completed',
          importErrors: [],
          isPersisting: true,
        })

        void apiDataRepository
          .saveExchangeRateDataset({
            summary: businessModel.summary,
            normalizedRows: businessModel.rates,
            lastImportedFile: 'Registro manual',
            lastImportedAt: recordedAt,
          })
          .then(() => {
            set({
              isPersisting: false,
              persistenceError: null,
            })
          })
          .catch((persistenceError) => {
            set({
              isPersisting: false,
              persistenceError: getErrorMessage(
                persistenceError,
                'No fue posible guardar el tipo de cambio.',
              ),
            })
          })
      },

      setPricingSummary: (summary) =>
        set({ pricingSummary: summary }),

      setNormalizedPricing: (rows) =>
        set({ normalizedPricing: rows }),

      setCustomersSummary: (
        summary,
      ) =>
        set({
          customersSummary: summary,
        }),

      executeImport: (
        rows,
        metadata,
        selectedReportType,
        importScope,
      ) => {
        set({
          activeReportType: null,

          importStatus:
            'validating',

          fileMetadata: metadata,

          importErrors: [],

          persistenceError: null,
        })

        try {
          const result =
            runDataCenterImport(
              rows,
              selectedReportType,
            )

          set({
            activeReportType:
              result.reportType,
          })

          if (!result.valid) {
            set({
              importStatus: 'error',

              importErrors:
                result.validation
                  .errors,
            })

            return result
          }

          set({
            importStatus:
              'processing',
          })

          switch (
            result.reportType
          ) {
            case 'sales': {
              const importedAt =
                new Date()
                  .toISOString()

              set({
                salesSummary:
                  result.summary,

                normalizedSales:
                  result.normalizedRows,

                importStatus:
                   'processing',

                importErrors: [],

                lastImportedFile:
                  metadata.fileName,

                lastImportedAt:
                  importedAt,

                isPersisting: true,
              })

              void apiDataRepository
                .saveSalesDataset({
                  summary:
                    result.summary,

                  normalizedRows:
                    result.normalizedRows,

                  lastImportedFile:
                    metadata.fileName,

                  lastImportedAt:
                    importedAt,

                  importScope:
                    importScope ?? 'partial',
                })
                .then(() => {
                  set({

                      importStatus:
                      'completed', 

                    isPersisting:
                      false,

                    persistenceError:
                      null,
                  })
                })
                .catch(
                  (
                    persistenceError,
                  ) => {
                    set({

                      importStatus:
                       'error',

                      isPersisting:
                        false,

                      persistenceError:
                        getErrorMessage(
                          persistenceError,
                          'No fue posible guardar la información en el almacenamiento local.',
                        ),
                    })
                  },
                )

              break
            }

            case 'quota': {
              const importedAt = new Date().toISOString()

              set({
                targetSummary: result.summary,
                normalizedTargets: result.normalizedRows,
                targetsLastImportedFile: metadata.fileName,
                targetsLastImportedAt: importedAt,
                importStatus: 'completed',
                importErrors: [],
                isPersisting: true,
              })

              void apiDataRepository
                .saveTargetDataset({
                  summary: result.summary,
                  normalizedRows: result.normalizedRows,
                  lastImportedFile: metadata.fileName,
                  lastImportedAt: importedAt,
                })
                .then(() => {
                  set({
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    isPersisting: false,
                    persistenceError: getErrorMessage(
                      persistenceError,
                      'No fue posible guardar los objetivos comerciales.',
                    ),
                  })
                })

              break
            }

            case 'inventory': {
              const importedAt = new Date().toISOString()

              set({
                inventorySummary: result.summary,
                normalizedInventory: result.normalizedRows,
                inventoryLastImportedFile: metadata.fileName,
                inventoryLastImportedAt: importedAt,
                importStatus: 'completed',
                importErrors: [],
                isPersisting: true,
              })

              void apiDataRepository
                .saveInventoryDataset({
                  summary: result.summary,
                  normalizedRows: result.normalizedRows,
                  lastImportedFile: metadata.fileName,
                  lastImportedAt: importedAt,
                })
                .then(() => {
                  set({
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    isPersisting: false,
                    persistenceError: getErrorMessage(
                      persistenceError,
                      'No fue posible guardar el inventario.',
                    ),
                  })
                })

              break
            }

            case 'purchases': {
              const importedAt =
                new Date().toISOString()

              const mergedRows =
                mergePurchaseOrderRows(
                  get().normalizedPurchaseOrders,
                  result.normalizedRows,
                )

              const businessModel =
                buildPurchaseOrderBusinessModel(
                  mergedRows,
                  result.ignoredRows,
                )

              set({
                purchaseOrderSummary:
                  businessModel.summary,
                normalizedPurchaseOrders:
                  businessModel.lines,
                purchaseOrderLastImportedFile:
                  metadata.fileName,
                purchaseOrderLastImportedAt:
                  importedAt,
                importStatus: 'completed',
                importErrors: [],
                isPersisting: true,
              })

              void indexedDbDataRepository
                .savePurchaseOrderDataset({
                  summary:
                    businessModel.summary,
                  normalizedRows:
                    businessModel.lines,
                  lastImportedFile:
                    metadata.fileName,
                  lastImportedAt:
                    importedAt,
                })
                .then(() => {
                  set({
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    isPersisting: false,
                    persistenceError:
                      getErrorMessage(
                        persistenceError,
                        'No fue posible guardar las órdenes de compra.',
                      ),
                  })
                })

              break
            }

            case 'purchase-requests': {
              const importedAt =
                new Date().toISOString()

              const mergedRows =
                mergePurchaseRequestRows(
                  get().normalizedPurchaseRequests,
                  result.normalizedRows,
                )

              const businessModel =
                buildPurchaseRequestBusinessModel(
                  mergedRows,
                  result.ignoredRows,
                )

              set({
                purchaseRequestSummary:
                  businessModel.summary,
                normalizedPurchaseRequests:
                  businessModel.requests,
                purchaseRequestLastImportedFile:
                  metadata.fileName,
                purchaseRequestLastImportedAt:
                  importedAt,
                importStatus: 'completed',
                importErrors: [],
                isPersisting: true,
              })

              void indexedDbDataRepository
                .savePurchaseRequestDataset({
                  summary:
                    businessModel.summary,
                  normalizedRows:
                    businessModel.requests,
                  lastImportedFile:
                    metadata.fileName,
                  lastImportedAt:
                    importedAt,
                })
                .then(() => {
                  set({
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    isPersisting: false,
                    persistenceError:
                      getErrorMessage(
                        persistenceError,
                        'No fue posible guardar las solicitudes de compra.',
                      ),
                  })
                })

              break
            }

            case 'products': {
              const importedAt = new Date().toISOString()
              const currentPricingRows = get().normalizedPricing
              const currentPricingSummary = get().pricingSummary
              const pricingLastImportedFile = get().pricingLastImportedFile
              const pricingLastImportedAt = get().pricingLastImportedAt
              const pricingBusinessModel = currentPricingRows.length > 0
                ? buildPricingBusinessModel(
                    currentPricingRows,
                    currentPricingSummary?.ignoredRows ?? 0,
                    result.normalizedRows,
                  )
                : null

              set({
                productMasterSummary: result.summary,
                normalizedProductMaster: result.normalizedRows,
                productMasterLastImportedFile: metadata.fileName,
                productMasterLastImportedAt: importedAt,
                pricingSummary:
                  pricingBusinessModel?.summary ?? currentPricingSummary,
                importStatus: 'completed',
                importErrors: [],
                isPersisting: true,
              })

              const persistenceOperations: Promise<void>[] = [
                indexedDbDataRepository.saveProductMasterDataset({
                  summary: result.summary,
                  normalizedRows: result.normalizedRows,
                  lastImportedFile: metadata.fileName,
                  lastImportedAt: importedAt,
                }),
              ]

              if (
                pricingBusinessModel &&
                pricingLastImportedFile &&
                pricingLastImportedAt
              ) {
                persistenceOperations.push(
                  indexedDbDataRepository.savePricingDataset({
                    summary: pricingBusinessModel.summary,
                    normalizedRows: pricingBusinessModel.inputs,
                    lastImportedFile: pricingLastImportedFile,
                    lastImportedAt: pricingLastImportedAt,
                  }),
                )
              }

              void Promise.all(persistenceOperations)
                .then(() => {
                  set({
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    isPersisting: false,
                    persistenceError: getErrorMessage(
                      persistenceError,
                      'No fue posible guardar el Product Master o actualizar la conciliación de Pricing.',
                    ),
                  })
                })

              break
            }

            case 'projects': {
              const importedAt = new Date().toISOString()
              const mergedRows = upsertProjectRows(
                get().normalizedProjects,
                result.normalizedRows,
              )
              const businessModel = buildProjectBusinessModel(
                mergedRows,
                result.ignoredRows,
              )

              set({
                projectsSummary: businessModel.summary,
                normalizedProjects: businessModel.projects,
                projectsLastImportedFile: metadata.fileName,
                projectsLastImportedAt: importedAt,
                importStatus: 'completed',
                importErrors: [],
                isPersisting: true,
              })

              void indexedDbDataRepository
                .saveProjectDataset({
                  summary: businessModel.summary,
                  normalizedRows: businessModel.projects,
                  lastImportedFile: metadata.fileName,
                  lastImportedAt: importedAt,
                })
                .then(() => {
                  set({
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    isPersisting: false,
                    persistenceError: getErrorMessage(
                      persistenceError,
                      'No fue posible guardar el repositorio de proyectos.',
                    ),
                  })
                })

              break
            }

            case 'project-billing': {
              const importedAt = new Date().toISOString()
              const mergedRows = mergeProjectBillingRows(
                get().normalizedProjectBillings,
                result.normalizedRows,
              )
              const businessModel = buildProjectBillingBusinessModel(
                mergedRows,
                result.ignoredRows,
              )

              set({
                projectBillingSummary: businessModel.summary,
                normalizedProjectBillings: businessModel.lines,
                projectBillingLastImportedFile: metadata.fileName,
                projectBillingLastImportedAt: importedAt,
                importStatus: 'completed',
                importErrors: [],
                isPersisting: true,
              })

              void indexedDbDataRepository
                .saveProjectBillingDataset({
                  summary: businessModel.summary,
                  normalizedRows: businessModel.lines,
                  lastImportedFile: metadata.fileName,
                  lastImportedAt: importedAt,
                })
                .then(() => {
                  set({
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    isPersisting: false,
                    persistenceError: getErrorMessage(
                      persistenceError,
                      'No fue posible guardar la facturación de proyectos.',
                    ),
                  })
                })

              break
            }

            case 'exchange-rates': {
              const importedAt = new Date().toISOString()
              const mergedRows = upsertExchangeRateRows(
                get().normalizedExchangeRates,
                result.normalizedRows,
              )
              const businessModel = buildExchangeRateBusinessModel(
                mergedRows,
                result.ignoredRows,
              )

              set({
                exchangeRateSummary: businessModel.summary,
                normalizedExchangeRates: businessModel.rates,
                exchangeRateLastImportedFile: metadata.fileName,
                exchangeRateLastImportedAt: importedAt,
                importStatus: 'completed',
                importErrors: [],
                isPersisting: true,
              })

              void indexedDbDataRepository
                .saveExchangeRateDataset({
                  summary: businessModel.summary,
                  normalizedRows: businessModel.rates,
                  lastImportedFile: metadata.fileName,
                  lastImportedAt: importedAt,
                })
                .then(() => {
                  set({
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    isPersisting: false,
                    persistenceError: getErrorMessage(
                      persistenceError,
                      'No fue posible guardar los tipos de cambio.',
                    ),
                  })
                })

              break
            }

            case 'pricing': {
              const importedAt = new Date().toISOString()
              const businessModel = buildPricingBusinessModel(
                result.normalizedRows,
                result.ignoredRows,
                get().normalizedProductMaster,
              )

              set({
                pricingSummary: businessModel.summary,
                normalizedPricing: businessModel.inputs,
                pricingLastImportedFile: metadata.fileName,
                pricingLastImportedAt: importedAt,
                importStatus: 'completed',
                importErrors: [],
                isPersisting: true,
              })

              void indexedDbDataRepository
                .savePricingDataset({
                  summary: businessModel.summary,
                  normalizedRows: businessModel.inputs,
                  lastImportedFile: metadata.fileName,
                  lastImportedAt: importedAt,
                })
                .then(() => {
                  set({
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    isPersisting: false,
                    persistenceError: getErrorMessage(
                      persistenceError,
                      'No fue posible guardar la fuente de Pricing.',
                    ),
                  })
                })

              break
            }

            default:
              throw new Error(
                'No existe un destino de almacenamiento para el reporte detectado.',
              )
          }

          return result
        } catch (caughtError) {
          const message =
            getErrorMessage(
              caughtError,
              'Ocurrió un error inesperado durante la importación.',
            )

          set({
            activeReportType:
              null,

            importStatus: 'error',

            importErrors: [
              {
                message,
              },
            ],
          })

          return null
        }
      },

      hydratePersistedData:
        async () => {
          const currentState = get()

          if (currentState.isHydrating || currentState.isHydrated) {
            return
          }

          set({
            isHydrating: true,
            persistenceError: null,
          })

          try {
            const [
              persistedSales,
              persistedTargets,
              persistedProductMaster,
              persistedInventory,
              persistedPurchaseOrders,
              persistedPurchaseRequests,
              persistedProjects,
              persistedProjectBillings,
              persistedExchangeRates,
              persistedPricing,
            ] = await Promise.all([
              apiDataRepository.loadSalesDataset(),
              apiDataRepository.loadTargetDataset(),
              indexedDbDataRepository.loadProductMasterDataset(),
              apiDataRepository.loadInventoryDataset(),
              indexedDbDataRepository.loadPurchaseOrderDataset(),
              indexedDbDataRepository.loadPurchaseRequestDataset(),
              indexedDbDataRepository.loadProjectDataset(),
              indexedDbDataRepository.loadProjectBillingDataset(),
              indexedDbDataRepository.loadExchangeRateDataset(),
              indexedDbDataRepository.loadPricingDataset(),
            ])

            const hydratedPricing = persistedPricing
              ? buildPricingBusinessModel(
                  persistedPricing.normalizedRows,
                  persistedPricing.summary.ignoredRows,
                  persistedProductMaster?.normalizedRows ?? [],
                )
              : null

            set({
              activeReportType: persistedPricing
                ? 'pricing'
                : persistedExchangeRates
                  ? 'exchange-rates'
                  : persistedProjectBillings
                    ? 'project-billing'
                    : persistedProjects
                      ? 'projects'
                      : persistedPurchaseRequests
                        ? 'purchase-requests'
                        : persistedPurchaseOrders
                          ? 'purchases'
                          : persistedInventory
                            ? 'inventory'
                            : persistedProductMaster
                              ? 'products'
                              : persistedTargets
                                ? 'quota'
                                : persistedSales
                                  ? 'sales'
                                  : null,

              importStatus:
                persistedSales ||
                persistedTargets ||
                persistedProductMaster ||
                persistedInventory ||
                persistedPurchaseOrders ||
                persistedPurchaseRequests ||
                persistedProjects ||
                persistedProjectBillings ||
                persistedExchangeRates ||
                persistedPricing
                  ? 'completed'
                  : 'idle',
              fileMetadata: null,
              importErrors: [],
              salesSummary: persistedSales?.summary ?? null,
              normalizedSales: persistedSales?.normalizedRows ?? [],
              lastImportedFile: persistedSales?.lastImportedFile ?? null,
              lastImportedAt: persistedSales?.lastImportedAt ?? null,
              targetSummary: persistedTargets?.summary ?? null,
              normalizedTargets: persistedTargets?.normalizedRows ?? [],
              targetsLastImportedFile: persistedTargets?.lastImportedFile ?? null,
              targetsLastImportedAt: persistedTargets?.lastImportedAt ?? null,
              productMasterSummary: persistedProductMaster?.summary ?? null,
              normalizedProductMaster: persistedProductMaster?.normalizedRows ?? [],
              productMasterLastImportedFile: persistedProductMaster?.lastImportedFile ?? null,
              productMasterLastImportedAt: persistedProductMaster?.lastImportedAt ?? null,
              inventorySummary: persistedInventory?.summary ?? null,
              normalizedInventory: persistedInventory?.normalizedRows ?? [],
              inventoryLastImportedFile: persistedInventory?.lastImportedFile ?? null,
              inventoryLastImportedAt: persistedInventory?.lastImportedAt ?? null,

              purchaseOrderSummary:
                persistedPurchaseOrders?.summary ?? null,
              normalizedPurchaseOrders:
                persistedPurchaseOrders?.normalizedRows ?? [],
              purchaseOrderLastImportedFile:
                persistedPurchaseOrders?.lastImportedFile ?? null,
              purchaseOrderLastImportedAt:
                persistedPurchaseOrders?.lastImportedAt ?? null,

              purchaseRequestSummary:
                persistedPurchaseRequests?.summary ?? null,
              normalizedPurchaseRequests:
                persistedPurchaseRequests?.normalizedRows ?? [],
              purchaseRequestLastImportedFile:
                persistedPurchaseRequests?.lastImportedFile ?? null,
              purchaseRequestLastImportedAt:
                persistedPurchaseRequests?.lastImportedAt ?? null,

              projectsSummary: persistedProjects?.summary ?? null,
              normalizedProjects: persistedProjects?.normalizedRows ?? [],
              projectsLastImportedFile: persistedProjects?.lastImportedFile ?? null,
              projectsLastImportedAt: persistedProjects?.lastImportedAt ?? null,
              projectBillingSummary: persistedProjectBillings?.summary ?? null,
              normalizedProjectBillings: persistedProjectBillings?.normalizedRows ?? [],
              projectBillingLastImportedFile: persistedProjectBillings?.lastImportedFile ?? null,
              projectBillingLastImportedAt: persistedProjectBillings?.lastImportedAt ?? null,
              exchangeRateSummary: persistedExchangeRates?.summary ?? null,
              normalizedExchangeRates: persistedExchangeRates?.normalizedRows ?? [],
              exchangeRateLastImportedFile: persistedExchangeRates?.lastImportedFile ?? null,
              exchangeRateLastImportedAt: persistedExchangeRates?.lastImportedAt ?? null,
              pricingSummary: hydratedPricing?.summary ?? null,
              normalizedPricing: hydratedPricing?.inputs ?? [],
              pricingLastImportedFile: persistedPricing?.lastImportedFile ?? null,
              pricingLastImportedAt: persistedPricing?.lastImportedAt ?? null,
              isHydrating: false,
              isHydrated: true,
              persistenceError: null,
            })
          } catch (caughtError) {
            set({
              isHydrating: false,
              isHydrated: true,
              persistenceError: getErrorMessage(
                caughtError,
                'No fue posible recuperar la información almacenada localmente.',
              ),
            })
          }
        },

      clearPersistedData:
        async () => {
          set({
            isPersisting: true,

            persistenceError:
              null,
          })

          try {
            await indexedDbDataRepository
              .clearAllData()

            set({
              isPersisting: false,

              persistenceError:
                null,
            })
          } catch (caughtError) {
            set({
              isPersisting: false,

              persistenceError:
                getErrorMessage(
                  caughtError,
                  'No fue posible eliminar la información persistida.',
                ),
            })

            throw caughtError
          }
        },

      completeImport: (
        fileName,
      ) =>
        set({
          importStatus:
            'completed',

          lastImportedFile:
            fileName,

          lastImportedAt:
            new Date()
              .toISOString(),
        }),

      resetCurrentImport: () =>
        set({
          activeReportType:
            null,

          importStatus: 'idle',

          fileMetadata: null,

          importErrors: [],
        }),

      resetAllData:
        async () => {
          set({
            isPersisting: true,

            persistenceError:
              null,
          })

          try {
            await indexedDbDataRepository
              .clearAllData()

            set({
              activeReportType:
                null,

              importStatus: 'idle',

              fileMetadata: null,

              importErrors: [],

              lastImportedFile:
                null,

              lastImportedAt:
                null,

              salesSummary: null,

              normalizedSales: [],

              targetSummary: null,

              normalizedTargets: [],

              targetsLastImportedFile: null,

              targetsLastImportedAt: null,

              productMasterSummary: null,

              normalizedProductMaster: [],

              productMasterLastImportedFile: null,

              productMasterLastImportedAt: null,

              inventorySummary:
                null,

              normalizedInventory: [],

              inventoryLastImportedFile: null,

              inventoryLastImportedAt: null,

              purchaseOrderSummary: null,

              normalizedPurchaseOrders: [],

              purchaseOrderLastImportedFile: null,

              purchaseOrderLastImportedAt: null,

              purchaseRequestSummary: null,

              normalizedPurchaseRequests: [],

              purchaseRequestLastImportedFile: null,

              purchaseRequestLastImportedAt: null,

              projectsSummary: null,

              normalizedProjects: [],

              projectsLastImportedFile: null,

              projectsLastImportedAt: null,

              projectBillingSummary: null,

              normalizedProjectBillings: [],

              projectBillingLastImportedFile: null,

              projectBillingLastImportedAt: null,

              exchangeRateSummary: null,

              normalizedExchangeRates: [],

              exchangeRateLastImportedFile: null,

              exchangeRateLastImportedAt: null,

              forecastSummary:
                null,

              quotaSummary: null,

              pricingSummary: null,

              normalizedPricing: [],

              pricingLastImportedFile: null,

              pricingLastImportedAt: null,

              customersSummary:
                null,

              isPersisting: false,

              persistenceError:
                null,
            })
          } catch (caughtError) {
            set({
              isPersisting: false,

              persistenceError:
                getErrorMessage(
                  caughtError,
                  'No fue posible eliminar toda la información almacenada.',
                ),
            })
          }
        },
    }),
  )