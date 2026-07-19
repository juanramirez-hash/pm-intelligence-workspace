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

import {
  runDataCenterImport,
} from '../services/importService'
import {
  indexedDbDataRepository,
} from '../repositories/indexedDbDataRepository'

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

  inventorySummary: unknown | null

  forecastSummary: unknown | null

  quotaSummary: unknown | null

  projectsSummary: unknown | null

  pricingSummary: unknown | null

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

  setInventorySummary: (
    summary: unknown | null,
  ) => void

  setForecastSummary: (
    summary: unknown | null,
  ) => void

  setQuotaSummary: (
    summary: unknown | null,
  ) => void

  setProjectsSummary: (
    summary: unknown | null,
  ) => void

  setPricingSummary: (
    summary: unknown | null,
  ) => void

  setCustomersSummary: (
    summary: unknown | null,
  ) => void

  executeImport: (
    rows: SpreadsheetRow[],
    metadata: FileMetadata,
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

      inventorySummary: null,

      forecastSummary: null,

      quotaSummary: null,

      projectsSummary: null,

      pricingSummary: null,

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

      setInventorySummary: (
        summary,
      ) =>
        set({
          inventorySummary: summary,
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

      setProjectsSummary: (
        summary,
      ) =>
        set({
          projectsSummary: summary,
        }),

      setPricingSummary: (
        summary,
      ) =>
        set({
          pricingSummary: summary,
        }),

      setCustomersSummary: (
        summary,
      ) =>
        set({
          customersSummary: summary,
        }),

      executeImport: (
        rows,
        metadata,
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
                  'completed',

                importErrors: [],

                lastImportedFile:
                  metadata.fileName,

                lastImportedAt:
                  importedAt,

                isPersisting: true,
              })

              void indexedDbDataRepository
                .saveSalesDataset({
                  summary:
                    result.summary,

                  normalizedRows:
                    result.normalizedRows,

                  lastImportedFile:
                    metadata.fileName,

                  lastImportedAt:
                    importedAt,
                })
                .then(() => {
                  set({
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

            default:
              throw new Error(
                `No existe un destino de almacenamiento para el reporte "${result.reportType}".`,
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

          if (
            currentState.isHydrating ||
            currentState.isHydrated
          ) {
            return
          }

          set({
            isHydrating: true,

            persistenceError: null,
          })

          try {
            const persistedDataset =
              await indexedDbDataRepository
                .loadSalesDataset()

            if (!persistedDataset) {
              set({
                isHydrating: false,

                isHydrated: true,
              })

              return
            }

            set({
              activeReportType:
                'sales',

              importStatus:
                'completed',

              fileMetadata: null,

              importErrors: [],

              salesSummary:
                persistedDataset
                  .summary,

              normalizedSales:
                persistedDataset
                  .normalizedRows,

              lastImportedFile:
                persistedDataset
                  .lastImportedFile,

              lastImportedAt:
                persistedDataset
                  .lastImportedAt,

              isHydrating: false,

              isHydrated: true,

              persistenceError:
                null,
            })
          } catch (caughtError) {
            set({
              isHydrating: false,

              isHydrated: true,

              persistenceError:
                getErrorMessage(
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

              inventorySummary:
                null,

              forecastSummary:
                null,

              quotaSummary: null,

              projectsSummary:
                null,

              pricingSummary: null,

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