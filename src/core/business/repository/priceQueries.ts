import type {
  BusinessPrice,
  BusinessPriceMarginBand,
  BusinessPriceScenario,
  BusinessPricingQualityIssue,
  BusinessPricingSummary,
} from '../entities/price'

import type {
  BusinessDataModel,
} from '../models'

import {
  buildPriceIndexes,
  buildPriceProductCurrencyKey,
} from './priceIndexes'

import type {
  PriceIndexes,
} from './priceIndexes'

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function clonePrice(price: BusinessPrice): BusinessPrice {
  return { ...price }
}

function cloneScenario(
  scenario: BusinessPriceScenario,
): BusinessPriceScenario {
  return { ...scenario }
}

function cloneIssue(
  issue: BusinessPricingQualityIssue,
): BusinessPricingQualityIssue {
  return { ...issue }
}

function emptySummary(): BusinessPricingSummary {
  return {
    totalPrices: 0,
    totalScenarios: 0,
    uniqueProducts: 0,
    uniqueBrands: 0,
    uniqueCurrencies: 0,
    pricesWithNegativeMargin: 0,
    pricesWithoutEffectiveDate: 0,
    invalidPriceInputs: 0,
    invalidScenarioInputs: 0,
    duplicatePriceRecords: 0,
    duplicateScenarioRecords: 0,
    blockingIssues: 0,
    warningIssues: 0,
  }
}

function lowerBound(
  values: readonly BusinessPrice[],
  target: number,
  selector: (price: BusinessPrice) => number,
): number {
  let low = 0
  let high = values.length

  while (low < high) {
    const middle = Math.floor((low + high) / 2)

    if (selector(values[middle]!) < target) {
      low = middle + 1
    } else {
      high = middle
    }
  }

  return low
}

function selectNumericRange(
  values: readonly BusinessPrice[],
  minimum: number,
  maximum: number,
  selector: (price: BusinessPrice) => number,
): BusinessPrice[] {
  if (
    Number.isNaN(minimum) ||
    Number.isNaN(maximum) ||
    maximum < minimum
  ) {
    return []
  }

  const start = lowerBound(values, minimum, selector)
  const result: BusinessPrice[] = []

  for (let index = start; index < values.length; index += 1) {
    const price = values[index]!
    const value = selector(price)

    if (value > maximum) {
      break
    }

    result.push(clonePrice(price))
  }

  return result
}

export class PriceQueries {
  private readonly model: BusinessDataModel
  private readonly indexes: PriceIndexes

  constructor(model: BusinessDataModel) {
    this.model = model
    this.indexes = buildPriceIndexes(model)
  }

  getAll(): BusinessPrice[] {
    return [...(this.model.prices?.values() ?? [])]
      .map(clonePrice)
  }

  findById(priceId: string): BusinessPrice | undefined {
    const price = this.model.prices?.get(
      normalizeIdentifier(priceId),
    )

    return price ? clonePrice(price) : undefined
  }

  getByProduct(productId: string): BusinessPrice[] {
    return [
      ...(this.indexes.byProductId.get(
        normalizeIdentifier(productId),
      ) ?? []),
    ].map(clonePrice)
  }

  findCurrentByProduct(
    productId: string,
    currency = 'MXN',
  ): BusinessPrice | undefined {
    const price = this.indexes.currentByProductCurrency.get(
      buildPriceProductCurrencyKey(productId, currency),
    )

    return price ? clonePrice(price) : undefined
  }

  getByBrand(brandId: string): BusinessPrice[] {
    return [
      ...(this.indexes.byBrandId.get(
        normalizeIdentifier(brandId),
      ) ?? []),
    ].map(clonePrice)
  }

  getByCurrency(currency: string): BusinessPrice[] {
    return [
      ...(this.indexes.byCurrency.get(
        normalizeIdentifier(currency),
      ) ?? []),
    ].map(clonePrice)
  }

  getByMarginBand(
    marginBand: BusinessPriceMarginBand,
  ): BusinessPrice[] {
    return [
      ...(this.indexes.byMarginBand.get(marginBand) ?? []),
    ].map(clonePrice)
  }

  getByPricingGroup(
    pricingGroupId: string,
  ): BusinessPrice[] {
    return [
      ...(this.indexes.byPricingGroup.get(
        normalizeIdentifier(pricingGroupId),
      ) ?? []),
    ].map(clonePrice)
  }

  findByMargin(
    minimum: number,
    maximum = Number.POSITIVE_INFINITY,
  ): BusinessPrice[] {
    return selectNumericRange(
      this.indexes.byGrossMargin,
      minimum,
      maximum,
      (price) => price.grossMargin,
    )
  }

  findByGrossProfit(
    minimum: number,
    maximum = Number.POSITIVE_INFINITY,
  ): BusinessPrice[] {
    return selectNumericRange(
      this.indexes.byGrossProfit,
      minimum,
      maximum,
      (price) => price.grossProfit,
    )
  }

  getScenarios(priceId: string): BusinessPriceScenario[] {
    return [
      ...(this.indexes.scenariosByPriceId.get(
        normalizeIdentifier(priceId),
      ) ?? []),
    ].map(cloneScenario)
  }

  findScenario(
    scenarioId: string,
  ): BusinessPriceScenario | undefined {
    const scenario = this.model.priceScenarios?.get(
      normalizeIdentifier(scenarioId),
    )

    return scenario ? cloneScenario(scenario) : undefined
  }

  getScenariosByPricingGroup(
    pricingGroupId: string,
  ): BusinessPriceScenario[] {
    return [
      ...(this.indexes.scenariosByPricingGroup.get(
        normalizeIdentifier(pricingGroupId),
      ) ?? []),
    ].map(cloneScenario)
  }

  getSummary(): BusinessPricingSummary {
    return {
      ...(this.model.pricingSummary ?? emptySummary()),
    }
  }

  getQualityIssues(): BusinessPricingQualityIssue[] {
    return (this.model.pricingQualityIssues ?? [])
      .map(cloneIssue)
  }
}
