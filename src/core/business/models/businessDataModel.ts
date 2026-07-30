import type {
  BusinessCustomerPeriod,
} from '../entities/customerPeriod'

import type {
  BusinessCustomerBrandPeriod,
} from '../entities/customerBrandPeriod'

import type {
  BusinessBrand,
} from '../entities/brand'

import type {
  BusinessBrandPeriod,
} from '../entities/brandPeriod'

import type {
  BusinessBrandTarget,
} from '../entities/brandTarget'

import type {
  BusinessCustomer,
} from '../entities/customer'

import type {
  BusinessProduct,
} from '../entities/product'

import type {
  BusinessProductPeriod,
} from '../entities/productPeriod'

import type {
  ProductSalesReconciliationSummary,
} from '../reconciliation'

import type {
  BusinessSalesSegment,
} from '../entities/salesSegment'

import type {
  ProductIdentityQualityReport,
} from '../quality'

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

  customerPeriods:
    Map<string, BusinessCustomerPeriod>

  customerBrandPeriods:
    Map<string, BusinessCustomerBrandPeriod>

  brands:
    Map<string, BusinessBrand>

  brandPeriods:
    Map<string, BusinessBrandPeriod>

  brandTargets:
    Map<string, BusinessBrandTarget>

  products:
    Map<string, BusinessProduct>

  productPeriods:
    Map<string, BusinessProductPeriod>

  /** Additive analytical grain used by SW-003 segmentation queries. */
  salesSegments?:
    Map<string, BusinessSalesSegment>

  /** Available when the model was built through the PMC-005 pipeline. */
  productReconciliation?:
    ProductSalesReconciliationSummary


  /** Product identity quality gate produced by IQ-001. */
  productIdentityQuality?:
    ProductIdentityQualityReport

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