// MB-001: responses of /api/brands/* (delivery 2A). Every value the server
// sends as null stays null here and is shown as "—", never as 0. Gross
// profit and margin are null when costHidden is true.

import type {
  MyDayBrand,
  MyDayBrandSource,
  MyDayLifecycleStatus,
  MyDayPeriodStatus,
  MyDayTrendStatus,
  MyDayView,
  MyDayWorkingDays,
} from '../../my-day/api/myDayTypes'

export type {
  MyDayLifecycleStatus,
  MyDayTrendStatus,
  MyDayView,
}

export type BrandTabId = 'ventas' | 'clientes' | 'productos' | 'inteligencia'

export interface BrandBase {
  ok: true
  brandKey: string
  brandLabel: string
  period: string | null
  periods: string[]
  dataCutoff: string | null
  costHidden: boolean
  reason?: string
}

export interface BrandComparisonDates {
  basis?: string
  currentFrom: string
  currentTo: string
  previousFrom: string
  previousTo: string
}

// -- Directory ------------------------------------------------------------------

export interface BrandDirectoryRow extends Omit<MyDayBrand, 'participation'> {
  hasSalesInPeriod: boolean
  firstSaleDate: string | null
  lastSaleDate: string | null
}

export interface BrandDirectoryResponse {
  ok: true
  view: MyDayView
  brandSource: MyDayBrandSource
  period: string | null
  periods: string[]
  dataCutoff: string | null
  limit: number
  offset: number
  reason?: string
  periodStatus?: MyDayPeriodStatus
  workingDays?: MyDayWorkingDays
  calendarMissingYears?: number[]
  summary: {
    brands: number
    withSales: number
    withoutSales: number
    requiringAttention: number
    byLifecycle: Partial<Record<MyDayLifecycleStatus, number>>
  } | null
  total: number
  hasMore: boolean
  rows: BrandDirectoryRow[]
}

export interface BrandDirectoryRequest {
  view: MyDayView
  period?: string | null
  q?: string
  status?: string
  sales?: 'with' | 'without' | ''
  sort?: 'revenue' | 'name' | 'variation'
  limit: number
  offset: number
}

// -- Header -----------------------------------------------------------------------

export interface BrandTeamMember {
  id: number
  name: string
}

export interface BrandOpenAction {
  id: number
  title: string
  priority: string
  status: string
  horizon: string | null
  dueDate: string | null
  ownerName: string | null
  daysOverdue: number
}

export interface BrandHeaderResponse extends BrandBase {
  periodStatus?: MyDayPeriodStatus
  workingDays?: MyDayWorkingDays
  calendarMissingYears?: number[]
  comparison?: BrandComparisonDates | null
  hasSalesInPeriod?: boolean
  firstSaleDate?: string | null
  lastSaleDate?: string | null
  brand: Omit<MyDayBrand, 'participation'> | null
  team?: { pms: BrandTeamMember[], assistants: BrandTeamMember[] }
  actions?: {
    total: number
    overdue: number
    immediateOpen: number
    rows: BrandOpenAction[]
  }
}

// -- Sales ------------------------------------------------------------------------

export interface BrandVariation {
  amount: number | null
  percentage: number | null
}

export interface BrandMonthSide {
  dateFrom: string
  dateTo: string
  workingDays: number
  revenue: number
  grossProfit: number | null
  grossMargin: number | null
  quantity: number
  documents: number
  customers: number
  products: number
}

export interface BrandMonthOverMonth {
  available: boolean
  basis?: string
  periodStatus?: MyDayPeriodStatus
  holidaysExcluded?: boolean
  calendarMissingYears?: number[]
  costHidden: boolean
  current?: BrandMonthSide
  previous?: BrandMonthSide
  variations?: {
    revenue: BrandVariation
    grossProfit: BrandVariation
    grossMarginPoints: number | null
    customers: BrandVariation
    products: BrandVariation
    documents: BrandVariation
  }
}

export interface BrandYearWindow {
  year: number
  periodId: string
  dateFrom: string
  dateTo: string
  workingDays: number
  revenue: number
  grossProfit: number | null
  grossMargin: number | null
  quantity: number
  documents: number
  customers: number
  products: number
  rowCount: number
}

export interface BrandYearVariationSet {
  revenue: BrandVariation
  grossProfit: BrandVariation
  grossMarginPoints: number | null
  customers: BrandVariation
  products: BrandVariation
}

export interface BrandYearSlots {
  current: BrandYearWindow | null
  previousYear: BrandYearWindow | null
  twoYearsBack: BrandYearWindow | null
  variations: {
    vsPreviousYear: BrandYearVariationSet | null
    vsTwoYearsBack: BrandYearVariationSet | null
  }
}

export interface BrandAnnualProjection {
  year: number
  revenue: number
  grossProfit: number | null
  grossMargin: number | null
  historicalRevenueCompletionRatio: number | null
  historicalGrossProfitCompletionRatio: number | null
  historicalYearsUsed: number[]
}

export interface BrandAnnualTarget {
  revenue: number
  monthsWithTarget: number
  monthsInYear: number
  complete: boolean
  projectedAttainment: number | null
  ytdAttainment: number | null
}

export interface BrandYearOverYear {
  available: boolean
  currentYear: number
  closed?: boolean
  description?: string
  // CAL-001: years of the windows without a calendar (counted Monday to Friday).
  calendarMissingYears?: number[]
  holidaysExcluded?: boolean
  costHidden: boolean
  monthly?: BrandYearSlots
  ytd?: BrandYearSlots
  annual?: {
    projection: BrandAnnualProjection | null
    previousYear: BrandYearWindow | null
    twoYearsBack: BrandYearWindow | null
    target: BrandAnnualTarget | null
    projectionVariations: {
      vsPreviousYear: BrandYearVariationSet | null
      vsTwoYearsBack: BrandYearVariationSet | null
    }
  }
}

// MB-001C: year over year of a portfolio (Mis marcas / Todas), for the directory.
export interface BrandPortfolioYearResponse {
  ok: true
  view: MyDayView
  brandSource: 'assigned' | 'all-brands' | 'none'
  // Number of brands of "Mis marcas"; null for Todas (no brand filter).
  brandCount: number | null
  period: string | null
  periods: string[]
  dataCutoff: string | null
  costHidden: boolean
  reason?: string
  yearOverYear: BrandYearOverYear | null
}

export interface BrandSeriesMonth {
  periodId: string
  hasSales: boolean
  partial: boolean
  revenue: number | null
  grossProfit: number | null
  grossMargin: number | null
  customers: number | null
  products: number | null
  documents: number | null
  quantity: number | null
  target: {
    revenue: number | null
    grossProfit: number | null
    grossMargin: number | null
  } | null
  attainment: number | null
}

export interface BrandDocumentRow {
  documentNumber: string | null
  saleDate: string
  customerId: string | null
  customerName: string | null
  salesRep: string | null
  location: string | null
  lines: number
  quantity: number
  revenue: number
  grossProfit: number | null
}

export interface BrandDocuments {
  total: number
  lines: number
  revenue: number
  grossProfit: number | null
  hasMore: boolean
  rows: BrandDocumentRow[]
}

export type BrandSalesSection = 'comparison' | 'yoy' | 'series' | 'documents'

export interface BrandSalesResponse extends BrandBase {
  sections: BrandSalesSection[]
  limit: number
  offset: number
  monthOverMonth?: BrandMonthOverMonth
  yearOverYear?: BrandYearOverYear
  series?: BrandSeriesMonth[]
  documents?: BrandDocuments
}

export interface BrandExportColumn {
  key: string
  label: string
}

export interface BrandExportResponse extends BrandBase {
  dateFrom?: string
  dateTo?: string
  maxRows?: number
  truncated?: boolean
  total?: number
  columns: BrandExportColumn[]
  rows: Array<Record<string, string | number | null>>
}

// -- Customers --------------------------------------------------------------------

export type BrandCustomerFilter = 'activos' | 'por-recuperar' | 'suben' | 'bajan'

export interface BrandCustomerRow {
  customerId: string | null
  customerName: string | null
  revenue?: number
  previousRevenue?: number
  variation?: number
  variationPercentage?: number | null
  grossProfit?: number | null
  previousGrossProfit?: number | null
  documents?: number
  lastSaleDate: string | null
  // Customers to recover.
  baseRevenue?: number
  baseGrossProfit?: number | null
  activeMonths?: number | null
  avgMonthlyRevenue?: number | null
}

export interface BrandCustomersResponse extends BrandBase {
  filter: BrandCustomerFilter
  limit: number
  offset: number
  comparison?: BrandComparisonDates
  lossWindow?: {
    baseFrom: string
    baseTo: string
    inactiveFrom: string
    inactiveTo: string
  } | null
  counts: Partial<Record<BrandCustomerFilter, number>> | null
  hasMore: boolean
  rows: BrandCustomerRow[]
}

// -- Products ---------------------------------------------------------------------

export type BrandProductFilter = 'vendidos' | 'por-recuperar' | 'agotados'

export interface BrandProductRow {
  itemKey: string
  itemCode: string | null
  model: string | null
  quantity?: number
  previousQuantity?: number
  revenue?: number
  previousRevenue?: number
  variation?: number
  variationPercentage?: number | null
  grossProfit?: number | null
  previousGrossProfit?: number | null
  baseRevenue?: number
  baseQuantity?: number
  baseGrossProfit?: number | null
  // Missing inventory data stays null.
  onHand?: number | null
  pendingReceiptUnits?: number | null
  catalogStatus?: string | null
  lastSaleDate?: string | null
  // Out of stock (MD-002 rules).
  avgMonthlyUnits?: number
  arrivalStatus?: string
}

export interface BrandProductsResponse extends BrandBase {
  sources?: { inventory?: { status?: 'up-to-date' | 'stale' | 'no-data' } }
  filter: BrandProductFilter
  limit: number
  offset: number
  comparison?: BrandComparisonDates
  total: number
  hasMore: boolean
  rows: BrandProductRow[]
}
