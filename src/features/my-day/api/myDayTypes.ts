// MD-003: responses of /api/my-day/* (MD-001, MD-002, MD-002-HOTFIX1) and
// the fields of /api/actions that "Mi día" uses. Every amount the server
// sends as null stays null here: it is shown as "—", never as 0.

export type MyDayView = 'mine' | 'all'

export type MyDayBrandSource =
  | 'assigned'
  | 'all-brands'
  | 'none'

export type MyDayPeriodStatus =
  | 'open'
  | 'closed'
  | 'after-cutoff'

export type MyDayLifecycleStatus =
  | 'active'
  | 'new'
  | 'recovered'
  | 'lost'
  | 'inactive'

export type MyDayTrendStatus =
  | 'growing'
  | 'stable'
  | 'declining'
  | 'without_comparison'

export interface MyDayWorkingDays {
  elapsed: number
  total: number
  remaining: number
  // CAL-001: business days = Monday to Friday minus the calendar of
  // non-working days. false when a year of the window has no calendar loaded.
  holidaysExcluded: boolean
  // The quota template (brand_targets.working_days) is informative; the
  // calendar rules. mismatch: the template differs from the calendar.
  templateTotal?: number | null
  mismatch?: boolean
}

export interface MyDayQuotaPace {
  attainment: number | null
  gap: number | null
  projectedRevenue: number | null
  projectedAttainment: number | null
  dailyGap: number | null
}

export interface MyDayTarget {
  revenue: number | null
  grossProfit: number | null
  grossMargin: number | null
  workingDays: number | null
}

export interface MyDayBrand extends MyDayQuotaPace {
  brandKey: string
  brandLabel: string
  // Can be negative (credit notes).
  revenue: number
  target: MyDayTarget | null
  previousRevenue: number
  revenueVariation: number
  revenueVariationPercentage: number | null
  grossProfit: number
  grossMargin: number | null
  customers: number
  products: number
  participation: number
  lifecycleStatus: MyDayLifecycleStatus
  trendStatus: MyDayTrendStatus
  requiresAttention: boolean
  attentionReason: string | null
  lostCustomers: number
}

export interface MyDayPortfolio extends MyDayQuotaPace {
  brands: number
  brandsWithTarget: number
  revenue: number
  revenueWithTarget: number
  target: number | null
  // MD-003-HOTFIX2: attainment, projectedRevenue, projectedAttainment, gap
  // and dailyGap use the revenue of every brand against the total target.
  // revenueWithTarget, projectedRevenueWithTarget and brandsWithTarget are
  // information only.
  projectedRevenueWithTarget: number | null
  previousRevenue: number
  revenueVariation: number
  revenueVariationPercentage: number | null
  grossProfit: number
  grossMargin: number | null
  brandsRequiringAttention: number
  lostCustomers: number
}

export interface MyDaySummaryResponse {
  ok: true
  period: string | null
  dataCutoff: string | null
  brandSource?: MyDayBrandSource
  periodStatus?: MyDayPeriodStatus
  workingDays?: MyDayWorkingDays
  // Years of the windows without a calendar (counted Monday to Friday).
  calendarMissingYears?: number[]
  portfolio: MyDayPortfolio | null
  brands: MyDayBrand[]
  reason?: string
}

export interface MyDayLostCustomer {
  brandKey: string
  brandLabel: string
  customerId: string
  customerName: string | null
  baseRevenue: number
  baseGrossProfit: number | null
  activeMonths: number | null
  lastSaleDate: string | null
  avgMonthlyRevenue: number | null
}

export interface MyDayLostCustomersResponse {
  ok: true
  period: string | null
  dataCutoff: string | null
  inactivePeriods: number
  basePeriods: number
  limit: number
  offset: number
  window: {
    baseFrom: string
    baseTo: string
    inactiveFrom: string
    inactiveTo: string
  } | null
  hasMore: boolean
  rows: MyDayLostCustomer[]
  reason?: string
}

export type MyDayArrivalStatus =
  | 'scheduled'
  | 'overdue'
  | 'no-date'
  | 'no-po-data'
  | 'no-po'

export interface MyDayNextArrival {
  date: string | null
  purchaseOrderNumber: string
  supplierName: string | null
  status: string | null
  shipmentStatus: string | null
  overdue: boolean
  hasOverduePurchaseOrders: boolean
}

export interface MyDayStockAlertRow {
  itemKey: string
  itemCode: string
  brandKey: string | null
  brandLabel: string | null
  catalogStatus: string | null
  onHand: number
  pendingReceiptUnits: number
  // 0 = no quantity in any branch; null for loads before MD-002-HOTFIX1.
  positions: number | null
  netUnits: number
  avgMonthlyUnits: number
  lastSaleDate: string | null
  arrivalStatus: MyDayArrivalStatus
  nextArrival: MyDayNextArrival | null
  // Low stock only.
  avgDailyUnits?: number
  coverageDays?: number
}

export type MyDayStockAlertKind =
  | 'out-of-stock'
  | 'low-stock'

export interface MyDaySourceFreshness {
  lastImportedAt: string | null
  dataCutoff: string | null
  referenceDate: string | null
  daysSince: number | null
  status: 'up-to-date' | 'stale' | 'no-data'
  stale: boolean | null
}

export interface MyDaySources {
  inventory: MyDaySourceFreshness
  purchases: MyDaySourceFreshness
  sales: MyDaySourceFreshness
}

export interface MyDayInventoryCoverage {
  complete: boolean
  source: 'items' | 'positions'
  articles: number | null
  articlesWithPositions: number
  reason: string | null
}

export interface MyDayStockAlertPage {
  total: number
  hasMore: boolean
  rows: MyDayStockAlertRow[]
  complete?: boolean
}

export interface MyDayStockAlertsResponse {
  ok: true
  view: MyDayView
  dataCutoff: string | null
  brandSource: MyDayBrandSource
  salesWindow: {
    from: string
    to: string
    days: number
    months: number
  } | null
  sources: MyDaySources
  inventoryCoverage: MyDayInventoryCoverage | null
  limit: number
  reason?: string
  outOfStock: MyDayStockAlertPage
  lowStock: MyDayStockAlertPage
}

export interface MyDayStockAlertListResponse {
  ok: true
  view: MyDayView
  dataCutoff: string | null
  sources: MyDaySources
  inventoryCoverage: MyDayInventoryCoverage | null
  kind: MyDayStockAlertKind
  limit: number
  offset: number
  total: number
  hasMore: boolean
  rows: MyDayStockAlertRow[]
  complete?: boolean
  reason?: string
}

export interface MyDayCurrencyAmount {
  amount: number | null
  lines: number
  linesWithoutAmount: number
  linesHidden: number
}

export type MyDayAmountsByCurrency = Record<string, MyDayCurrencyAmount>

export interface MyDayArrivalRow {
  purchaseOrderNumber: string
  supplierName: string | null
  statuses: string[]
  shipmentStatuses: string[]
  expectedReceiptDate: string
  latestExpectedReceiptDate: string
  overdue: boolean
  brands: Array<{ brandKey: string | null, brandLabel: string | null }>
  items: number
  lines: number
  amountsByCurrency: MyDayAmountsByCurrency
  costHidden: boolean
}

// MD-003-HOTFIX1: status filter of /api/my-day/arrivals.
export type MyDayArrivalTab = 'upcoming' | 'overdue'

export interface MyDayArrivalsResponse {
  ok: true
  view: MyDayView
  dataCutoff: string | null
  brandSource: MyDayBrandSource
  sources: MyDaySources
  status?: MyDayArrivalTab | 'all'
  limit: number
  offset: number
  reason?: string
  window: {
    from: string
    to: string
    days: number
  } | null
  summary: {
    purchaseOrders: number
    upcoming: number
    overdue: number
    linesWithoutDate: number
    amountsByCurrency: MyDayAmountsByCurrency
    costHidden: boolean
  } | null
  total: number
  hasMore: boolean
  rows: MyDayArrivalRow[]
}

export type MyDayActionPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export type MyDayActionStatus =
  | 'open'
  | 'in_progress'
  | 'blocked'
  | 'done'
  | 'cancelled'
  | 'auto_resolved'

// Fields of pm_action_queue used by "Mi día" (snake_case, as the API sends).
export interface MyDayAction {
  id: number
  brand_id: string
  brand_key: string
  title: string
  priority: MyDayActionPriority
  status: MyDayActionStatus
  due_date: string
  owner_name: string | null
  days_overdue: number
}

export interface MyDayActionsResponse {
  ok: true
  rows: MyDayAction[]
}
