import type {
  BusinessPriceInput,
} from '../../../../core/business/pricing'

export interface RawPricingRow {
  [column: string]: unknown
}

export type PricingSourceChannel =
  | 'canonical'
  | 'mxn'
  | 'usd'

/**
 * Normalized pricing input owned by Data Center.
 *
 * The row is structurally compatible with BusinessPriceInput so Business Core
 * can materialize auditable BusinessPrice facts without reading spreadsheets.
 */
export interface NormalizedPricingRow
  extends BusinessPriceInput {
  sourceRowNumber: number
  sourceChannel: PricingSourceChannel
  model: string | null
  purchaseCurrency: string | null
  quantityPricingSchedule: string | null
  usdChannelSkippedForCurrencyMismatch: boolean
}

export interface PricingDatasetSummary {
  sourceRows: number
  generatedPriceFacts: number
  uniqueProducts: number
  uniqueBrands: number
  uniqueCurrencies: number

  mxnPrices: number
  usdPrices: number
  otherCurrencyPrices: number
  dualCurrencySourceRows: number
  singleCurrencySourceRows: number
  skippedUsdCrossCurrencyRows: number

  pricesWithNegativeMargin: number
  pricesAboveList: number
  pricesWithoutEffectiveDate: number
  duplicatePriceRecords: number

  productMasterAvailable: boolean
  reconciledPriceFacts: number
  pricesWithoutProduct: number
  priceBrandMismatches: number
  productCoverageRate: number | null

  blockingIssues: number
  warningIssues: number

  periodStart: string | null
  periodEnd: string | null

  processedRows: number
  ignoredRows: number
}
