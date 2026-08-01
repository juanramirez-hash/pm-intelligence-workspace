import type {
  BusinessPrice,
  BusinessPriceMarginBand,
  BusinessPriceScenario,
} from '../entities/price'

import type {
  BusinessDataModel,
} from '../models'

export interface PriceIndexes {
  byProductId: Map<string, BusinessPrice[]>
  byBrandId: Map<string, BusinessPrice[]>
  byCurrency: Map<string, BusinessPrice[]>
  byMarginBand: Map<BusinessPriceMarginBand, BusinessPrice[]>
  byPricingGroup: Map<string, BusinessPrice[]>
  byGrossMargin: BusinessPrice[]
  byGrossProfit: BusinessPrice[]
  currentByProductCurrency: Map<string, BusinessPrice>
  scenariosByPriceId: Map<string, BusinessPriceScenario[]>
  scenariosByPricingGroup: Map<string, BusinessPriceScenario[]>
}

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function productCurrencyKey(
  productId: string,
  currency: string,
): string {
  return [
    normalizeIdentifier(productId),
    normalizeIdentifier(currency),
  ].join('::')
}

function pushPrice(
  index: Map<string, BusinessPrice[]>,
  key: string | null,
  price: BusinessPrice,
): void {
  if (!key) {
    return
  }

  const normalizedKey = normalizeIdentifier(key)
  const values = index.get(normalizedKey) ?? []
  values.push(price)
  index.set(normalizedKey, values)
}

function pushMarginPrice(
  index: Map<BusinessPriceMarginBand, BusinessPrice[]>,
  price: BusinessPrice,
): void {
  const values = index.get(price.marginBand) ?? []
  values.push(price)
  index.set(price.marginBand, values)
}

function pushScenario(
  index: Map<string, BusinessPriceScenario[]>,
  key: string | null,
  scenario: BusinessPriceScenario,
): void {
  if (!key) {
    return
  }

  const normalizedKey = normalizeIdentifier(key)
  const values = index.get(normalizedKey) ?? []
  values.push(scenario)
  index.set(normalizedKey, values)
}

function comparePrices(
  left: BusinessPrice,
  right: BusinessPrice,
): number {
  const leftDate = left.effectiveDate ?? ''
  const rightDate = right.effectiveDate ?? ''

  return rightDate.localeCompare(leftDate) ||
    left.id.localeCompare(right.id)
}

function compareScenarios(
  left: BusinessPriceScenario,
  right: BusinessPriceScenario,
): number {
  return left.name.localeCompare(right.name) ||
    left.id.localeCompare(right.id)
}

function sortPriceIndex(
  index: Map<string, BusinessPrice[]>,
): void {
  for (const values of index.values()) {
    values.sort(comparePrices)
  }
}

export function buildPriceIndexes(
  model: BusinessDataModel,
): PriceIndexes {
  const byProductId = new Map<string, BusinessPrice[]>()
  const byBrandId = new Map<string, BusinessPrice[]>()
  const byCurrency = new Map<string, BusinessPrice[]>()
  const byMarginBand = new Map<
    BusinessPriceMarginBand,
    BusinessPrice[]
  >()
  const byPricingGroup = new Map<string, BusinessPrice[]>()
  const byGrossMargin: BusinessPrice[] = []
  const byGrossProfit: BusinessPrice[] = []
  const currentByProductCurrency =
    new Map<string, BusinessPrice>()
  const scenariosByPriceId =
    new Map<string, BusinessPriceScenario[]>()
  const scenariosByPricingGroup =
    new Map<string, BusinessPriceScenario[]>()

  for (const price of model.prices?.values() ?? []) {
    pushPrice(byProductId, price.productId, price)
    pushPrice(byBrandId, price.brandId, price)
    pushPrice(byCurrency, price.currency, price)
    pushPrice(byPricingGroup, price.pricingGroupId, price)
    pushMarginPrice(byMarginBand, price)
    byGrossMargin.push(price)
    byGrossProfit.push(price)
  }

  sortPriceIndex(byProductId)
  sortPriceIndex(byBrandId)
  sortPriceIndex(byCurrency)
  sortPriceIndex(byPricingGroup)

  for (const values of byMarginBand.values()) {
    values.sort(comparePrices)
  }

  byGrossMargin.sort(
    (left, right) =>
      left.grossMargin - right.grossMargin ||
      comparePrices(left, right),
  )

  byGrossProfit.sort(
    (left, right) =>
      left.grossProfit - right.grossProfit ||
      comparePrices(left, right),
  )

  for (const price of model.prices?.values() ?? []) {
    const key = productCurrencyKey(
      price.productId,
      price.currency,
    )
    const current = currentByProductCurrency.get(key)

    if (!current || comparePrices(price, current) < 0) {
      currentByProductCurrency.set(key, price)
    }
  }

  for (const scenario of model.priceScenarios?.values() ?? []) {
    pushScenario(
      scenariosByPriceId,
      scenario.priceId,
      scenario,
    )
    pushScenario(
      scenariosByPricingGroup,
      scenario.pricingGroupId,
      scenario,
    )
  }

  for (const values of scenariosByPriceId.values()) {
    values.sort(compareScenarios)
  }

  for (const values of scenariosByPricingGroup.values()) {
    values.sort(compareScenarios)
  }

  return {
    byProductId,
    byBrandId,
    byCurrency,
    byMarginBand,
    byPricingGroup,
    byGrossMargin,
    byGrossProfit,
    currentByProductCurrency,
    scenariosByPriceId,
    scenariosByPricingGroup,
  }
}

export function buildPriceProductCurrencyKey(
  productId: string,
  currency: string,
): string {
  return productCurrencyKey(productId, currency)
}
