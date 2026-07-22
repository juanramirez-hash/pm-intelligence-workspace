import type {
  BusinessBrand,
} from '../entities/brand'

import type {
  BusinessBrandPeriod,
} from '../entities/brandPeriod'

import type {
  BusinessCustomer,
} from '../entities/customer'

import type {
  BusinessProduct,
} from '../entities/product'

export interface BusinessDataTotals {
  revenue: number
  grossProfit: number
  quantity: number
  documents: number
}

export interface BusinessPeriod {
  id: string
  year: number
  month: number

  periodStart: string
  periodEnd: string

  revenue: number
  grossProfit: number
  quantity: number
  documents: number

  customers: Set<string>
  brands: Set<string>
  products: Set<string>
}

export interface BusinessDataModel {
  generatedAt: string

  periodStart: string | null
  periodEnd: string | null

  totals: BusinessDataTotals

  customers:
    Map<string, BusinessCustomer>

  brands:
    Map<string, BusinessBrand>

  brandPeriods:
    Map<string, BusinessBrandPeriod>

  products:
    Map<string, BusinessProduct>

  periods:
    Map<string, BusinessPeriod>

  documentNumbers:
    Set<string>

  locations:
    Set<string>

  salesRepresentatives:
    Set<string>

  currencies:
    Set<string>

  processedRows: number
  ignoredRows: number
}