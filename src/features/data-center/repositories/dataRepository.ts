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

export interface PersistedSalesDataset {
  summary: SalesDatasetSummary
  normalizedRows: NormalizedSalesRow[]
  lastImportedFile: string
  lastImportedAt: string
  importScope?: 'full-periods' | 'partial'
}

export interface PersistedTargetDataset {
  summary: TargetDatasetSummary
  normalizedRows: NormalizedTargetRow[]
  lastImportedFile: string
  lastImportedAt: string
}

export interface PersistedProductMasterDataset {
  summary: ProductMasterDatasetSummary
  normalizedRows: NormalizedProductMasterRow[]
  lastImportedFile: string
  lastImportedAt: string
}

export interface PersistedInventoryDataset {
  summary: InventoryDatasetSummary
  normalizedRows: NormalizedInventoryRow[]
  lastImportedFile: string
  lastImportedAt: string
}

export interface PersistedPurchaseOrderDataset {
  summary: PurchaseOrderDatasetSummary
  normalizedRows: NormalizedPurchaseOrderRow[]
  lastImportedFile: string
  lastImportedAt: string
}

export interface PersistedPurchaseRequestDataset {
  summary: PurchaseRequestDatasetSummary
  normalizedRows: NormalizedPurchaseRequestRow[]
  lastImportedFile: string
  lastImportedAt: string
}

export interface PersistedProjectDataset {
  summary: ProjectDatasetSummary
  normalizedRows: NormalizedProjectRow[]
  lastImportedFile: string
  lastImportedAt: string
}

export interface PersistedProjectBillingDataset {
  summary: ProjectBillingDatasetSummary
  normalizedRows: NormalizedProjectBillingRow[]
  lastImportedFile: string
  lastImportedAt: string
}

export interface PersistedExchangeRateDataset {
  summary: ExchangeRateDatasetSummary
  normalizedRows: NormalizedExchangeRateRow[]
  lastImportedFile: string
  lastImportedAt: string
}

export interface PersistedPricingDataset {
  summary: PricingDatasetSummary
  normalizedRows: NormalizedPricingRow[]
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

  saveProductMasterDataset: (
    dataset: PersistedProductMasterDataset,
  ) => Promise<void>

  loadProductMasterDataset: () =>
    Promise<PersistedProductMasterDataset | null>

  saveInventoryDataset: (
    dataset: PersistedInventoryDataset,
  ) => Promise<void>

  loadInventoryDataset: () =>
    Promise<PersistedInventoryDataset | null>

  savePurchaseOrderDataset: (
    dataset: PersistedPurchaseOrderDataset,
  ) => Promise<void>

  loadPurchaseOrderDataset: () =>
    Promise<PersistedPurchaseOrderDataset | null>

  savePurchaseRequestDataset: (
    dataset: PersistedPurchaseRequestDataset,
  ) => Promise<void>

  loadPurchaseRequestDataset: () =>
    Promise<PersistedPurchaseRequestDataset | null>

  saveProjectDataset: (
    dataset: PersistedProjectDataset,
  ) => Promise<void>

  loadProjectDataset: () =>
    Promise<PersistedProjectDataset | null>

  saveProjectBillingDataset: (
    dataset: PersistedProjectBillingDataset,
  ) => Promise<void>

  loadProjectBillingDataset: () =>
    Promise<PersistedProjectBillingDataset | null>

  saveExchangeRateDataset: (
    dataset: PersistedExchangeRateDataset,
  ) => Promise<void>

  loadExchangeRateDataset: () =>
    Promise<PersistedExchangeRateDataset | null>

  savePricingDataset: (
    dataset: PersistedPricingDataset,
  ) => Promise<void>

  loadPricingDataset: () =>
    Promise<PersistedPricingDataset | null>

  clearAllData: () => Promise<void>
}