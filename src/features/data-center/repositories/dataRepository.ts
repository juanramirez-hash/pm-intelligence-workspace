import type {
  SalesDatasetSummary,
} from '../types/reportTypes'
import type {
  NormalizedSalesRow,
} from '../importers/sales/salesTypes'
import type {
  NormalizedTargetRow,
  TargetDatasetSummary,
} from '../importers/targets/targetTypes'

export interface PersistedSalesDataset {
  summary: SalesDatasetSummary
  normalizedRows: NormalizedSalesRow[]
  lastImportedFile: string
  lastImportedAt: string
}

export interface PersistedTargetDataset {
  summary: TargetDatasetSummary
  normalizedRows: NormalizedTargetRow[]
  lastImportedFile: string
  lastImportedAt: string
}

export interface DataRepository {
  saveSalesDataset: (
    dataset: PersistedSalesDataset,
  ) => Promise<void>

  loadSalesDataset: () =>
    Promise<PersistedSalesDataset | null>

  saveTargetDataset: (
    dataset: PersistedTargetDataset,
  ) => Promise<void>

  loadTargetDataset: () =>
    Promise<PersistedTargetDataset | null>

  clearAllData: () => Promise<void>
}
