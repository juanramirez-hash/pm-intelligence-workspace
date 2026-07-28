export type SalesComparisonMode =
  | 'previous-period'
  | 'previous-year'

export interface SalesWorkspaceFilters {
  periodId: string | null
  comparisonMode: SalesComparisonMode
}

export interface SalesWorkspacePeriodOption {
  id: string
  label: string
  year: number
  month: number
}

export interface SalesWorkspaceSnapshot {
  periodId: string
  periodLabel: string
  revenue: number
  grossProfit: number
  grossMargin: number
  quantity: number
  documents: number
  customerCount: number
  brandCount: number
  productCount: number
}

export interface SalesWorkspaceComparison {
  mode: SalesComparisonMode
  label: string
  previousPeriodId: string | null
  previousPeriodLabel: string | null
  revenueVariation: number | null
  grossProfitVariation: number | null
  quantityVariation: number | null
  marginPointVariation: number | null
}

export interface SalesWorkspaceTrendItem {
  periodId: string
  periodLabel: string
  revenue: number
  grossProfit: number
  grossMargin: number
}

export interface SalesWorkspaceRankingItem {
  id: string
  label: string
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
  participation: number
}

export interface SalesWorkspaceReconciliation {
  totalRows: number
  matchedRows: number
  ambiguousRows: number
  unmatchedRows: number
  matchRate: number
}

export interface SalesWorkspaceViewModel {
  available: boolean
  periodOptions: SalesWorkspacePeriodOption[]
  selectedPeriodId: string | null
  selectedPeriodLabel: string
  current: SalesWorkspaceSnapshot | null
  comparison: SalesWorkspaceComparison
  trend: SalesWorkspaceTrendItem[]
  topBrands: SalesWorkspaceRankingItem[]
  topCustomers: SalesWorkspaceRankingItem[]
  topProducts: SalesWorkspaceRankingItem[]
  reconciliation: SalesWorkspaceReconciliation
}
