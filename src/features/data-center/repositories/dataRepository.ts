import type {
  SalesDatasetSummary,
} from '../types/reportTypes'
import type {
  NormalizedSalesRow,
} from '../importers/sales/salesTypes'

export interface PersistedSalesDataset {
  summary: SalesDatasetSummary
  normalizedRows: NormalizedSalesRow[]

  lastImportedFile: string
  lastImportedAt: string
}

export interface DataRepository {
  saveSalesDataset: (
    dataset: PersistedSalesDataset,
  ) => Promise<void>

  loadSalesDataset: () =>
    Promise<PersistedSalesDataset | null>

  clearAllData: () => Promise<void>
}