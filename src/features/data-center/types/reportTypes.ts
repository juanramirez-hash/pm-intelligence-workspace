export type ReportType =
  | 'sales'
  | 'inventory'
  | 'purchases'
  | 'purchase-requests'
  | 'forecast'
  | 'quota'
  | 'projects'
  | 'project-billing'
  | 'exchange-rates'
  | 'pricing'
  | 'customers'
  | 'products'
  | 'other'

export const REPORT_TYPES: ReportType[] = [
  'sales',
  'inventory',
  'purchases',
  'purchase-requests',
  'forecast',
  'quota',
  'projects',
  'project-billing',
  'exchange-rates',
  'pricing',
  'customers',
  'products',
  'other',
]
import type { TargetDatasetSummary } from '../importers/targets/targetTypes'

export type { TargetDatasetSummary }

export interface SalesSummaryItem {
  key: string
  label: string
  totalSales: number
  totalGrossProfit: number
  totalQuantity: number
  rowCount: number
  grossMargin: number
}

export interface SalesDatasetSummary {
  periodStart: string | null
  periodEnd: string | null

  totalSales: number
  totalGrossProfit: number
  grossMargin: number
  totalQuantity: number

  uniqueCustomers: number
  uniqueProducts: number
  uniqueDocuments: number

  activeBrands: number
  activeLocations: number

  salesByBrand: SalesSummaryItem[]
  salesByMonth: SalesSummaryItem[]
  salesByLocation: SalesSummaryItem[]

  processedRows: number
  ignoredRows: number
}