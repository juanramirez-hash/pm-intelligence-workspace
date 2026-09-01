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

import type {
  CustomerMasterDatasetSummary,
  NormalizedCustomerMasterRow,
} from '../importers/customers/customerMasterTypes'

import {
  buildProjectBusinessModel,
} from '../importers/projects/projectBusinessModel'
import {
  buildProjectBillingBusinessModel,
} from '../importers/project-billings/projectBillingBusinessModel'
import {
  buildExchangeRateBusinessModel,
} from '../importers/exchange-rates/exchangeRateBusinessModel'
import {
  buildPricingBusinessModel,
} from '../importers/pricing/pricingBusinessModel'

import {
  buildCustomerMasterBusinessModel,
} from '../importers/customers/customerMasterBusinessModel'

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
  buildPurchaseRequestBusinessModel,
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

    customerMasterSummary:
    CustomerMasterDatasetSummary | null

  normalizedCustomerMaster:
    NormalizedCustomerMasterRow[]

  customerMasterLastImportedFile:
    string | null

  customerMasterLastImportedAt:
    string | null

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

  setCustomerMasterSummary: (
  summary:
    CustomerMasterDatasetSummary | null,
) => void

setNormalizedCustomerMaster: (
  rows: NormalizedCustomerMasterRow[],
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

      customerMasterSummary: null,

      normalizedCustomerMaster: [],

      customerMasterLastImportedFile:
        null,

      customerMasterLastImportedAt:
        null,

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
        const recordedAt =
          new Date().toISOString()

        const incomingModel =
          buildExchangeRateBusinessModel([
            {
              ...input,
              recordedAt,
            },
          ])

        set({
          activeReportType:
            'exchange-rates',

          importStatus:
            'processing',

          importErrors: [],

          isPersisting:
            true,

          persistenceError:
            null,
        })

        void apiDataRepository
          .saveExchangeRateDataset({
            summary:
              incomingModel.summary,

            normalizedRows:
              incomingModel.rates,

            lastImportedFile:
              'Registro manual',

            lastImportedAt:
              recordedAt,
          })
          .then(() =>
            apiDataRepository
              .loadExchangeRateDataset(),
          )
          .then((persistedDataset) => {
            if (!persistedDataset) {
              throw new Error(
                'PostgreSQL no devolvió el dataset de tipos de cambio.',
              )
            }

            set({
              exchangeRateSummary:
                persistedDataset.summary,

              normalizedExchangeRates:
                persistedDataset.normalizedRows,

              exchangeRateLastImportedFile:
                persistedDataset.lastImportedFile,

              exchangeRateLastImportedAt:
                persistedDataset.lastImportedAt,

              importStatus:
                'completed',

              isPersisting:
                false,

              persistenceError:
                null,
            })
          })
          .catch((persistenceError) => {
            set({
              importStatus:
                'error',

              isPersisting:
                false,

              persistenceError:
                getErrorMessage(
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

            setCustomerMasterSummary: (
        summary,
      ) =>
        set({
          customerMasterSummary:
            summary,
        }),

      setNormalizedCustomerMaster: (
        rows,
      ) =>
        set({
          normalizedCustomerMaster:
            rows,
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
                importStatus: 'processing',
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
                    importStatus: 'completed',
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    importStatus: 'error',
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
                importStatus: 'processing',
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
                    importStatus: 'completed',
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    importStatus: 'error',
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

  set({
    importStatus: 'processing',
    importErrors: [],
    isPersisting: true,
    persistenceError: null,
  })

  void apiDataRepository
    .savePurchaseOrderDataset({
      summary:
        result.summary,
      normalizedRows:
        result.normalizedRows,
      lastImportedFile:
        metadata.fileName,
      lastImportedAt:
        importedAt,
    })
    .then(async () => {
      const persistedPurchaseOrders =
        await apiDataRepository
          .loadPurchaseOrderDataset()

      if (!persistedPurchaseOrders) {
        throw new Error(
          'Las órdenes de compra se guardaron, pero no fue posible recuperar el dataset desde PostgreSQL.',
        )
      }

      set({
        purchaseOrderSummary:
          persistedPurchaseOrders.summary,

        normalizedPurchaseOrders:
          persistedPurchaseOrders.normalizedRows,

        purchaseOrderLastImportedFile:
          persistedPurchaseOrders.lastImportedFile,

        purchaseOrderLastImportedAt:
          persistedPurchaseOrders.lastImportedAt,

        importStatus: 'completed',
        isPersisting: false,
        persistenceError: null,
      })
    })
    .catch((persistenceError) => {
      set({
        importStatus: 'error',
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

  const incomingBusinessModel =
    buildPurchaseRequestBusinessModel(
      result.normalizedRows,
      result.ignoredRows,
    )

  set({
    importStatus: 'processing',
    importErrors: [],
    isPersisting: true,
    persistenceError: null,
  })

  void apiDataRepository
    .savePurchaseRequestDataset({
      summary:
        incomingBusinessModel.summary,

      normalizedRows:
        incomingBusinessModel.requests,

      lastImportedFile:
        metadata.fileName,

      lastImportedAt:
        importedAt,
    })
    .then(async () => {
      const persistedPurchaseRequests =
        await apiDataRepository
          .loadPurchaseRequestDataset()

      if (!persistedPurchaseRequests) {
        throw new Error(
          'Las solicitudes de compra se guardaron, pero no fue posible recuperar el dataset desde PostgreSQL.',
        )
      }

      set({
        purchaseRequestSummary:
          persistedPurchaseRequests.summary,

        normalizedPurchaseRequests:
          persistedPurchaseRequests.normalizedRows,

        purchaseRequestLastImportedFile:
          persistedPurchaseRequests.lastImportedFile,

        purchaseRequestLastImportedAt:
          persistedPurchaseRequests.lastImportedAt,

        importStatus: 'completed',
        isPersisting: false,
        persistenceError: null,
      })
    })
    .catch((persistenceError) => {
      set({
        importStatus: 'error',
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
                importStatus: 'processing',
                importErrors: [],
                isPersisting: true,
              })

              const persistenceOperations: Promise<void>[] = [
                apiDataRepository.saveProductMasterDataset({
                  summary: result.summary,
                  normalizedRows: result.normalizedRows,
                  lastImportedFile: metadata.fileName,
                  lastImportedAt: importedAt,
                }),
              ]

              void Promise.all(persistenceOperations)
                .then(() => {
                  set({
                    importStatus: 'completed',
                    isPersisting: false,
                    persistenceError: null,
                  })
                })
                .catch((persistenceError) => {
                  set({
                    importStatus: 'error',
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
  const importedAt =
    new Date().toISOString()

  const incomingBusinessModel =
    buildProjectBusinessModel(
      result.normalizedRows,
      result.ignoredRows,
    )

  set({
    importStatus: 'processing',
    importErrors: [],
    isPersisting: true,
    persistenceError: null,
  })

  void apiDataRepository
    .saveProjectDataset({
      summary:
        incomingBusinessModel.summary,

      normalizedRows:
        incomingBusinessModel.projects,

      lastImportedFile:
        metadata.fileName,

      lastImportedAt:
        importedAt,
    })
    .then(async () => {
      const persistedProjects =
        await apiDataRepository
          .loadProjectDataset()

      if (!persistedProjects) {
        throw new Error(
          'Los proyectos se guardaron, pero no fue posible recuperar el dataset desde PostgreSQL.',
        )
      }

      set({
        projectsSummary:
          persistedProjects.summary,

        normalizedProjects:
          persistedProjects.normalizedRows,

        projectsLastImportedFile:
          persistedProjects.lastImportedFile,

        projectsLastImportedAt:
          persistedProjects.lastImportedAt,

        importStatus: 'completed',
        isPersisting: false,
        persistenceError: null,
      })
    })
    .catch((persistenceError) => {
      set({
        importStatus: 'error',
        isPersisting: false,

        persistenceError:
          getErrorMessage(
            persistenceError,
            'No fue posible guardar el repositorio de proyectos.',
          ),
      })
    })

  break
}
            case 'project-billing': {
  const importedAt =
    new Date().toISOString()

  const incomingBusinessModel =
    buildProjectBillingBusinessModel(
      result.normalizedRows,
      result.ignoredRows,
    )

  set({
    importStatus: 'processing',
    importErrors: [],
    isPersisting: true,
    persistenceError: null,
  })

  void apiDataRepository
    .saveProjectBillingDataset({
      summary:
        incomingBusinessModel.summary,

      normalizedRows:
        incomingBusinessModel.lines,

      lastImportedFile:
        metadata.fileName,

      lastImportedAt:
        importedAt,
    })
    .then(async () => {
      const persistedProjectBillings =
        await apiDataRepository
          .loadProjectBillingDataset()

      if (!persistedProjectBillings) {
        throw new Error(
          'La facturacion de proyectos se guardo, pero no fue posible recuperar el dataset desde PostgreSQL.',
        )
      }

      set({
        projectBillingSummary:
          persistedProjectBillings.summary,

        normalizedProjectBillings:
          persistedProjectBillings.normalizedRows,

        projectBillingLastImportedFile:
          persistedProjectBillings.lastImportedFile,

        projectBillingLastImportedAt:
          persistedProjectBillings.lastImportedAt,

        importStatus: 'completed',
        isPersisting: false,
        persistenceError: null,
      })
    })
    .catch((persistenceError) => {
      set({
        importStatus: 'error',
        isPersisting: false,

        persistenceError:
          getErrorMessage(
            persistenceError,
            'No fue posible guardar la facturacion de proyectos.',
          ),
      })
    })

  break
}


                        case 'exchange-rates': {
              const importedAt =
                new Date().toISOString()

              const incomingBusinessModel =
                buildExchangeRateBusinessModel(
                  result.normalizedRows,
                  result.ignoredRows,
                )

              set({
                exchangeRateLastImportedFile:
                  metadata.fileName,

                exchangeRateLastImportedAt:
                  importedAt,

                importStatus:
                  'processing',

                importErrors: [],

                isPersisting:
                  true,

                persistenceError:
                  null,
              })

              void apiDataRepository
                .saveExchangeRateDataset({
                  summary:
                    incomingBusinessModel.summary,

                  normalizedRows:
                    incomingBusinessModel.rates,

                  lastImportedFile:
                    metadata.fileName,

                  lastImportedAt:
                    importedAt,
                })
                .then(() =>
                  apiDataRepository
                    .loadExchangeRateDataset(),
                )
                .then(
                  (persistedDataset) => {
                    if (!persistedDataset) {
                      throw new Error(
                        'Los tipos de cambio se guardaron, pero no fue posible recuperar el dataset desde PostgreSQL.',
                      )
                    }

                    set({
                      exchangeRateSummary:
                        persistedDataset.summary,

                      normalizedExchangeRates:
                        persistedDataset.normalizedRows,

                      exchangeRateLastImportedFile:
                        persistedDataset.lastImportedFile,

                      exchangeRateLastImportedAt:
                        persistedDataset.lastImportedAt,

                      importStatus:
                        'completed',

                      isPersisting:
                        false,

                      persistenceError:
                        null,
                    })
                  },
                )
                .catch(
                  (persistenceError) => {
                    set({
                      importStatus:
                        'error',

                      isPersisting:
                        false,

                      persistenceError:
                        getErrorMessage(
                          persistenceError,
                          'No fue posible guardar los tipos de cambio.',
                        ),
                    })
                  },
                )

              break
            }

                        case 'pricing': {
              const importedAt =
                new Date().toISOString()

              const businessModel =
                buildPricingBusinessModel(
                  result.normalizedRows,
                  result.ignoredRows,
                  get().normalizedProductMaster,
                )

              set({
                pricingSummary:
                  businessModel.summary,

                normalizedPricing:
                  businessModel.inputs,

                pricingLastImportedFile:
                  metadata.fileName,

                pricingLastImportedAt:
                  importedAt,

                importStatus:
                  'processing',

                importErrors: [],

                isPersisting:
                  true,

                persistenceError:
                  null,
              })

              void apiDataRepository
                .savePricingDataset({
                  summary:
                    businessModel.summary,

                  normalizedRows:
                    businessModel.inputs,

                  lastImportedFile:
                    metadata.fileName,

                  lastImportedAt:
                    importedAt,
                })
                .then(() =>
                  apiDataRepository
                    .loadPricingDataset(),
                )
                .then(
                  (persistedPricing) => {
                    if (!persistedPricing) {
                      throw new Error(
                        'Pricing se guardo, pero no fue posible recuperar el dataset desde PostgreSQL.',
                      )
                    }

                    const persistedBusinessModel =
                      buildPricingBusinessModel(
                        persistedPricing.normalizedRows,
                        persistedPricing.summary.ignoredRows,
                        get().normalizedProductMaster,
                      )

                    set({
                      pricingSummary:
                        persistedBusinessModel.summary,

                      normalizedPricing:
                        persistedBusinessModel.inputs,

                      pricingLastImportedFile:
                        persistedPricing.lastImportedFile,

                      pricingLastImportedAt:
                        persistedPricing.lastImportedAt,

                      importStatus:
                        'completed',

                      isPersisting:
                        false,

                      persistenceError:
                        null,
                    })
                  },
                )
                .catch(
                  (persistenceError) => {
                    set({
                      importStatus:
                        'error',

                      isPersisting:
                        false,

                      persistenceError:
                        getErrorMessage(
                          persistenceError,
                          'No fue posible guardar la fuente de Pricing.',
                        ),
                    })
                  },
                )

              break
            }

                        case 'customers': {
              const importedAt =
                new Date().toISOString()

              const businessModel =
                buildCustomerMasterBusinessModel(
                  result.normalizedRows,
                  result.ignoredRows,
                )

              set({
                customerMasterSummary:
                  businessModel.summary,

                normalizedCustomerMaster:
                  businessModel.customers,

                customerMasterLastImportedFile:
                  metadata.fileName,

                customerMasterLastImportedAt:
                  importedAt,

                importStatus:
                  'processing',

                importErrors: [],

                isPersisting:
                  true,

                persistenceError:
                  null,
              })

              void apiDataRepository
                .saveCustomerMasterDataset({
                  summary:
                    businessModel.summary,

                  normalizedRows:
                    businessModel.customers,

                  lastImportedFile:
                    metadata.fileName,

                  lastImportedAt:
                    importedAt,
                })
                .then(() =>
                  apiDataRepository
                    .loadCustomerMasterDataset(),
                )
                .then(
                  (persistedCustomers) => {
                    if (!persistedCustomers) {
                      throw new Error(
                        'Customer Master se guardo, pero no fue posible recuperar el dataset desde PostgreSQL.',
                      )
                    }

                    const persistedBusinessModel =
                      buildCustomerMasterBusinessModel(
                        persistedCustomers.normalizedRows,
                        persistedCustomers.summary.ignoredRows,
                      )

                    set({
                      customerMasterSummary:
                        persistedBusinessModel.summary,

                      normalizedCustomerMaster:
                        persistedBusinessModel.customers,

                      customerMasterLastImportedFile:
                        persistedCustomers.lastImportedFile,

                      customerMasterLastImportedAt:
                        persistedCustomers.lastImportedAt,

                      importStatus:
                        'completed',

                      isPersisting:
                        false,

                      persistenceError:
                        null,
                    })
                  },
                )
                .catch(
                  (persistenceError) => {
                    set({
                      importStatus:
                        'error',

                      isPersisting:
                        false,

                      persistenceError:
                        getErrorMessage(
                          persistenceError,
                          'No fue posible guardar el Customer Master.',
                        ),
                    })
                  },
                )

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
              persistedCustomers,
            ] = await Promise.all([
              apiDataRepository.loadSalesDataset(),
              apiDataRepository.loadTargetDataset(),
              apiDataRepository.loadProductMasterDataset(),
              apiDataRepository.loadInventoryDataset(),
              apiDataRepository.loadPurchaseOrderDataset(),
              apiDataRepository.loadPurchaseRequestDataset(),
              apiDataRepository.loadProjectDataset(),
              apiDataRepository.loadProjectBillingDataset(),
              apiDataRepository.loadExchangeRateDataset(),
              apiDataRepository.loadPricingDataset(),
              apiDataRepository.loadCustomerMasterDataset(),
            ])

            const hydratedPricing = persistedPricing
              ? buildPricingBusinessModel(
                  persistedPricing.normalizedRows,
                  persistedPricing.summary.ignoredRows,
                  persistedProductMaster?.normalizedRows ?? [],
                )
              : null

            set({
              activeReportType: persistedCustomers
              ? 'customers'
              : persistedPricing
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
                persistedPricing ||
                persistedCustomers
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
              pricingSummary:
                hydratedPricing?.summary ?? null,

              normalizedPricing:
                hydratedPricing?.inputs ?? [],

              pricingLastImportedFile:
                persistedPricing?.lastImportedFile ?? null,

              pricingLastImportedAt:
                persistedPricing?.lastImportedAt ?? null,

              customerMasterSummary:
                persistedCustomers?.summary ?? null,

              normalizedCustomerMaster:
                persistedCustomers?.normalizedRows ?? [],

              customerMasterLastImportedFile:
                persistedCustomers?.lastImportedFile ?? null,

              customerMasterLastImportedAt:
                persistedCustomers?.lastImportedAt ?? null,

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

                            customerMasterSummary:
                null,

              normalizedCustomerMaster:
                [],

              customerMasterLastImportedFile:
                null,

              customerMasterLastImportedAt:
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