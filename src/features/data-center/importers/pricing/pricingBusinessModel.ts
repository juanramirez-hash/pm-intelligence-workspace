import {
  buildBusinessPrices,
} from '../../../../core/business/builders/buildBusinessPrices'

import {
  buildBusinessDataModel,
} from '../../../../core/business/builders/buildBusinessDataModel'

import type {
  BusinessPrice,
  BusinessPricingQualityIssue,
} from '../../../../core/business/entities/price'

import type {
  NormalizedProductMasterRow,
} from '../products/productMasterTypes'

import type {
  NormalizedPricingRow,
  PricingDatasetSummary,
} from './pricingTypes'

export interface PricingBusinessModel {
  inputs: NormalizedPricingRow[]
  prices: BusinessPrice[]
  qualityIssues: BusinessPricingQualityIssue[]
  summary: PricingDatasetSummary
}

export function buildPricingBusinessModel(
  inputs: NormalizedPricingRow[],
  ignoredRows: number,
  productMaster: readonly NormalizedProductMasterRow[] = [],
): PricingBusinessModel {
  const productMasterAvailable = productMaster.length > 0
  const pricing = productMasterAvailable
    ? (() => {
        const model = buildBusinessDataModel([], {
          productMaster,
          prices: inputs,
        })

        if (
          !model.prices ||
          !model.pricingSummary ||
          !model.pricingQualityIssues
        ) {
          throw new Error(
            'Business Core did not publish the Pricing contract.',
          )
        }

        return {
          prices: model.prices,
          summary: model.pricingSummary,
          qualityIssues: model.pricingQualityIssues,
        }
      })()
    : buildBusinessPrices(inputs)
  const prices = [...pricing.prices.values()]
  const uniqueProducts = new Set<string>()
  const uniqueBrands = new Set<string>()
  const uniqueCurrencies = new Set<string>()
  const sourceChannels = new Map<number, Set<string>>()
  const effectiveDates: string[] = []
  const skippedUsdSourceRows = new Set<number>()

  let mxnPrices = 0
  let usdPrices = 0
  let otherCurrencyPrices = 0
  let pricesAboveList = 0

  for (const input of inputs) {
    const channels = sourceChannels.get(input.sourceRowNumber) ?? new Set()
    channels.add(input.currency)
    sourceChannels.set(input.sourceRowNumber, channels)

    if (input.usdChannelSkippedForCurrencyMismatch) {
      skippedUsdSourceRows.add(input.sourceRowNumber)
    }
  }

  for (const price of prices) {
    uniqueProducts.add(price.productId)
    uniqueBrands.add(price.brandId)
    uniqueCurrencies.add(price.currency)

    if (price.currency === 'MXN') {
      mxnPrices += 1
    } else if (price.currency === 'USD') {
      usdPrices += 1
    } else {
      otherCurrencyPrices += 1
    }

    if (price.sellingPrice > price.listPrice) {
      pricesAboveList += 1
    }

    if (price.effectiveDate) {
      effectiveDates.push(price.effectiveDate)
    }
  }

  effectiveDates.sort()

  const pricesWithoutProduct = pricing.qualityIssues
    .filter((issue) => issue.code === 'PRICE_PRODUCT_NOT_FOUND')
    .length
  const priceBrandMismatches = pricing.qualityIssues
    .filter((issue) => issue.code === 'PRICE_BRAND_MISMATCH')
    .length
  const reconciledPriceFacts = productMasterAvailable
    ? Math.max(0, prices.length - pricesWithoutProduct)
    : 0
  const productCoverageRate = productMasterAvailable
    ? prices.length > 0
      ? reconciledPriceFacts / prices.length
      : 1
    : null

  const dualCurrencySourceRows = [...sourceChannels.values()]
    .filter((currencies) => currencies.size > 1)
    .length
  const singleCurrencySourceRows = [...sourceChannels.values()]
    .filter((currencies) => currencies.size === 1)
    .length

  return {
    inputs,
    prices,
    qualityIssues: pricing.qualityIssues,
    summary: {
      sourceRows: sourceChannels.size + ignoredRows,
      generatedPriceFacts: prices.length,
      uniqueProducts: uniqueProducts.size,
      uniqueBrands: uniqueBrands.size,
      uniqueCurrencies: uniqueCurrencies.size,
      mxnPrices,
      usdPrices,
      otherCurrencyPrices,
      dualCurrencySourceRows,
      singleCurrencySourceRows,
      skippedUsdCrossCurrencyRows: skippedUsdSourceRows.size,
      pricesWithNegativeMargin:
        pricing.summary.pricesWithNegativeMargin,
      pricesAboveList,
      pricesWithoutEffectiveDate:
        pricing.summary.pricesWithoutEffectiveDate,
      duplicatePriceRecords:
        pricing.summary.duplicatePriceRecords,
      productMasterAvailable,
      reconciledPriceFacts,
      pricesWithoutProduct,
      priceBrandMismatches,
      productCoverageRate,
      blockingIssues: pricing.summary.blockingIssues,
      warningIssues: pricing.summary.warningIssues,
      periodStart: effectiveDates[0] ?? null,
      periodEnd: effectiveDates.at(-1) ?? null,
      processedRows: prices.length,
      ignoredRows,
    },
  }
}
