import type {
  BusinessPrice,
  BusinessPricingQualityCode,
  BusinessPricingQualityIssue,
  BusinessPriceScenario,
  BusinessPricingSummary,
} from '../entities/price'

import type {
  BusinessProduct,
} from '../entities/product'

import type {
  BusinessPriceInput,
  BusinessPriceScenarioInput,
  BusinessPricingBuildOptions,
} from '../pricing'

import {
  calculatePriceDiscountRate,
  calculatePriceGrossMargin,
  calculatePriceGrossProfit,
  calculatePriceFactor,
  calculatePriceFromDiscount,
  classifyPriceMarginBand,
  roundPricingValue,
} from '../pricing'

export interface BusinessPricingBuildResult {
  prices: Map<string, BusinessPrice>
  scenarios: Map<string, BusinessPriceScenario>
  summary: BusinessPricingSummary
  qualityIssues: BusinessPricingQualityIssue[]
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function normalizeIdentifier(
  value: string | null | undefined,
): string {
  return (value ?? '')
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function normalizeText(
  value: string | null | undefined,
): string | null {
  const normalized = (value ?? '')
    .trim()
    .replace(/\s+/g, ' ')

  return normalized || null
}

function normalizeSource(
  value: BusinessPriceInput['source'] |
    BusinessPriceScenarioInput['source'],
) {
  return value ?? 'unknown'
}

function isValidIsoDate(value: string | null): boolean {
  if (value === null) {
    return true
  }

  if (!ISO_DATE_PATTERN.test(value)) {
    return false
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
}

function finite(value: number): boolean {
  return Number.isFinite(value)
}

function createIssue(
  issues: BusinessPricingQualityIssue[],
  code: BusinessPricingQualityCode,
  severity: BusinessPricingQualityIssue['severity'],
  message: string,
  inputIndex: number,
  priceId: string | null,
  scenarioId: string | null,
  productId: string | null,
): void {
  issues.push({
    id: [
      code,
      String(inputIndex + 1).padStart(6, '0'),
      priceId ?? 'NO_PRICE',
      scenarioId ?? 'NO_SCENARIO',
    ].join('::'),
    code,
    severity,
    message,
    inputIndex,
    priceId,
    scenarioId,
    productId,
  })
}

export function buildBusinessPriceId(
  input: Pick<
    BusinessPriceInput,
    'id' | 'productId' | 'currency' | 'effectiveDate'
  >,
): string {
  const explicitId = normalizeIdentifier(input.id)

  if (explicitId) {
    return explicitId
  }

  return [
    normalizeIdentifier(input.productId),
    normalizeIdentifier(input.currency),
    input.effectiveDate ?? 'UNDATED',
  ].join('::')
}

export function buildBusinessPriceScenarioId(
  input: Pick<
    BusinessPriceScenarioInput,
    'id' | 'priceId' | 'kind' | 'pricingGroupId' | 'name'
  >,
): string {
  const explicitId = normalizeIdentifier(input.id)

  if (explicitId) {
    return explicitId
  }

  return [
    normalizeIdentifier(input.priceId),
    normalizeIdentifier(input.kind),
    normalizeIdentifier(input.pricingGroupId) ||
      normalizeIdentifier(input.name),
  ].join('::')
}

function createEmptySummary(): BusinessPricingSummary {
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

function resolveProduct(
  products: ReadonlyMap<string, BusinessProduct> | undefined,
  productId: string,
): BusinessProduct | undefined {
  if (!products) {
    return undefined
  }

  return products.get(productId)
}

function buildPrice(
  input: BusinessPriceInput,
  inputIndex: number,
  products: ReadonlyMap<string, BusinessProduct> | undefined,
  options: Required<BusinessPricingBuildOptions>,
  issues: BusinessPricingQualityIssue[],
): BusinessPrice | null {
  const productId = normalizeIdentifier(input.productId)
  const brandId = normalizeIdentifier(input.brandId)
  const currency = normalizeIdentifier(input.currency)
  const effectiveDate = normalizeText(input.effectiveDate)
  const priceId = buildBusinessPriceId({
    ...input,
    productId,
    currency,
    effectiveDate,
  })

  if (!productId || !brandId) {
    createIssue(
      issues,
      'PRICE_INVALID_IDENTIFIER',
      'blocking',
      'Price requires canonical productId and brandId values.',
      inputIndex,
      priceId || null,
      null,
      productId || null,
    )
    return null
  }

  if (!currency) {
    createIssue(
      issues,
      'PRICE_INVALID_CURRENCY',
      'blocking',
      `Price ${priceId} requires a currency.`,
      inputIndex,
      priceId,
      null,
      productId,
    )
    return null
  }

  if (!finite(input.cost) || input.cost < 0) {
    createIssue(
      issues,
      'PRICE_INVALID_COST',
      'blocking',
      `Price ${priceId} has an invalid cost.`,
      inputIndex,
      priceId,
      null,
      productId,
    )
    return null
  }

  if (!finite(input.listPrice) || input.listPrice <= 0) {
    createIssue(
      issues,
      'PRICE_INVALID_LIST_PRICE',
      'blocking',
      `Price ${priceId} has an invalid list price.`,
      inputIndex,
      priceId,
      null,
      productId,
    )
    return null
  }

  const sellingPrice = input.sellingPrice ?? input.listPrice

  if (!finite(sellingPrice) || sellingPrice <= 0) {
    createIssue(
      issues,
      'PRICE_INVALID_SELLING_PRICE',
      'blocking',
      `Price ${priceId} has an invalid selling price.`,
      inputIndex,
      priceId,
      null,
      productId,
    )
    return null
  }

  if (!isValidIsoDate(effectiveDate)) {
    createIssue(
      issues,
      'PRICE_INVALID_EFFECTIVE_DATE',
      'blocking',
      `Price ${priceId} has an invalid effective date.`,
      inputIndex,
      priceId,
      null,
      productId,
    )
    return null
  }

  const product = resolveProduct(products, productId)

  if (products && !product) {
    createIssue(
      issues,
      'PRICE_PRODUCT_NOT_FOUND',
      'warning',
      `Price ${priceId} references a product not found in Product Master.`,
      inputIndex,
      priceId,
      null,
      productId,
    )
  }

  const productBrandId = normalizeIdentifier(
    product?.brandId ?? product?.brand,
  )

  if (
    productBrandId &&
    productBrandId !== brandId
  ) {
    createIssue(
      issues,
      'PRICE_BRAND_MISMATCH',
      'warning',
      `Price ${priceId} brand differs from Product Master.`,
      inputIndex,
      priceId,
      null,
      productId,
    )
  }

  const grossProfit = calculatePriceGrossProfit(
    sellingPrice,
    input.cost,
  )
  const grossMargin = calculatePriceGrossMargin(
    sellingPrice,
    input.cost,
  )
  const discountRate = calculatePriceDiscountRate(
    input.listPrice,
    sellingPrice,
  )
  const pricingFactor = calculatePriceFactor(
    input.listPrice,
    input.cost,
  )

  if (grossMargin < 0) {
    createIssue(
      issues,
      'PRICE_NEGATIVE_MARGIN',
      'warning',
      `Price ${priceId} produces a negative gross margin.`,
      inputIndex,
      priceId,
      null,
      productId,
    )
  }

  if (sellingPrice > input.listPrice) {
    createIssue(
      issues,
      'PRICE_ABOVE_LIST',
      'warning',
      `Price ${priceId} is above list price.`,
      inputIndex,
      priceId,
      null,
      productId,
    )
  }

  return {
    id: priceId,
    productId,
    brandId,
    currency,
    cost: roundPricingValue(input.cost, options.moneyPrecision),
    listPrice: roundPricingValue(
      input.listPrice,
      options.moneyPrecision,
    ),
    sellingPrice: roundPricingValue(
      sellingPrice,
      options.moneyPrecision,
    ),
    discountRate: roundPricingValue(
      discountRate,
      options.ratePrecision,
    ),
    grossProfit: roundPricingValue(
      grossProfit,
      options.moneyPrecision,
    ),
    grossMargin: roundPricingValue(
      grossMargin,
      options.ratePrecision,
    ),
    pricingFactor:
      pricingFactor === null
        ? null
        : roundPricingValue(
            pricingFactor,
            options.ratePrecision,
          ),
    marginBand: classifyPriceMarginBand(grossMargin),
    pricingGroupId:
      normalizeIdentifier(input.pricingGroupId) || null,
    effectiveDate,
    source: normalizeSource(input.source),
    sourceReference: normalizeText(input.sourceReference),
  }
}

function buildScenario(
  input: BusinessPriceScenarioInput,
  inputIndex: number,
  prices: ReadonlyMap<string, BusinessPrice>,
  options: Required<BusinessPricingBuildOptions>,
  issues: BusinessPricingQualityIssue[],
): BusinessPriceScenario | null {
  const priceId = normalizeIdentifier(input.priceId)
  const scenarioId = buildBusinessPriceScenarioId({
    ...input,
    priceId,
  })
  const price = prices.get(priceId)

  if (!price) {
    createIssue(
      issues,
      'SCENARIO_PRICE_NOT_FOUND',
      'blocking',
      `Scenario ${scenarioId} references an unknown price.`,
      inputIndex,
      priceId || null,
      scenarioId,
      null,
    )
    return null
  }

  const suppliedDiscount = input.discountRate
  const suppliedSellingPrice = input.sellingPrice

  let sellingPrice: number

  if (
    suppliedSellingPrice !== null &&
    suppliedSellingPrice !== undefined
  ) {
    sellingPrice = suppliedSellingPrice
  } else if (
    suppliedDiscount !== null &&
    suppliedDiscount !== undefined &&
    finite(suppliedDiscount)
  ) {
    sellingPrice = calculatePriceFromDiscount(
      price.listPrice,
      suppliedDiscount,
    )
  } else {
    createIssue(
      issues,
      'SCENARIO_INVALID_SELLING_PRICE',
      'blocking',
      `Scenario ${scenarioId} requires sellingPrice or discountRate.`,
      inputIndex,
      price.id,
      scenarioId,
      price.productId,
    )
    return null
  }

  if (!finite(sellingPrice) || sellingPrice <= 0) {
    createIssue(
      issues,
      'SCENARIO_INVALID_SELLING_PRICE',
      'blocking',
      `Scenario ${scenarioId} has an invalid selling price.`,
      inputIndex,
      price.id,
      scenarioId,
      price.productId,
    )
    return null
  }

  const effectiveDate = normalizeText(input.effectiveDate)

  if (!isValidIsoDate(effectiveDate)) {
    createIssue(
      issues,
      'SCENARIO_INVALID_EFFECTIVE_DATE',
      'blocking',
      `Scenario ${scenarioId} has an invalid effective date.`,
      inputIndex,
      price.id,
      scenarioId,
      price.productId,
    )
    return null
  }

  const discountRate = calculatePriceDiscountRate(
    price.listPrice,
    sellingPrice,
  )

  if (
    suppliedDiscount !== null &&
    suppliedDiscount !== undefined &&
    finite(suppliedDiscount)
  ) {
    const expectedSellingPrice =
      calculatePriceFromDiscount(
        price.listPrice,
        suppliedDiscount,
      )

    if (
      Math.abs(expectedSellingPrice - sellingPrice) >
      options.consistencyTolerance
    ) {
      createIssue(
        issues,
        'SCENARIO_DISCOUNT_MISMATCH',
        'warning',
        `Scenario ${scenarioId} discount does not match its selling price.`,
        inputIndex,
        price.id,
        scenarioId,
        price.productId,
      )
    }
  }

  const grossProfit = calculatePriceGrossProfit(
    sellingPrice,
    price.cost,
  )
  const grossMargin = calculatePriceGrossMargin(
    sellingPrice,
    price.cost,
  )

  return {
    id: scenarioId,
    priceId: price.id,
    productId: price.productId,
    name: normalizeText(input.name) ?? input.kind,
    kind: input.kind,
    pricingGroupId:
      normalizeIdentifier(input.pricingGroupId) || null,
    sellingPrice: roundPricingValue(
      sellingPrice,
      options.moneyPrecision,
    ),
    discountRate: roundPricingValue(
      discountRate,
      options.ratePrecision,
    ),
    grossProfit: roundPricingValue(
      grossProfit,
      options.moneyPrecision,
    ),
    grossMargin: roundPricingValue(
      grossMargin,
      options.ratePrecision,
    ),
    marginBand: classifyPriceMarginBand(grossMargin),
    effectiveDate,
    source: normalizeSource(input.source),
    sourceReference: normalizeText(input.sourceReference),
  }
}

export function buildBusinessPrices(
  priceInputs: readonly BusinessPriceInput[],
  scenarioInputs: readonly BusinessPriceScenarioInput[] = [],
  products?: ReadonlyMap<string, BusinessProduct>,
  buildOptions: BusinessPricingBuildOptions = {},
): BusinessPricingBuildResult {
  const options: Required<BusinessPricingBuildOptions> = {
    moneyPrecision: buildOptions.moneyPrecision ?? 2,
    ratePrecision: buildOptions.ratePrecision ?? 6,
    consistencyTolerance:
      buildOptions.consistencyTolerance ?? 0.01,
  }

  const prices = new Map<string, BusinessPrice>()
  const scenarios = new Map<string, BusinessPriceScenario>()
  const qualityIssues: BusinessPricingQualityIssue[] = []
  const summary = createEmptySummary()

  for (const [inputIndex, input] of priceInputs.entries()) {
    const price = buildPrice(
      input,
      inputIndex,
      products,
      options,
      qualityIssues,
    )

    if (!price) {
      summary.invalidPriceInputs += 1
      continue
    }

    if (prices.has(price.id)) {
      summary.duplicatePriceRecords += 1
      createIssue(
        qualityIssues,
        'PRICE_DUPLICATE_ID',
        'warning',
        `Price ${price.id} was replaced by the latest input row.`,
        inputIndex,
        price.id,
        null,
        price.productId,
      )
    }

    prices.set(price.id, price)
  }

  for (const [inputIndex, input] of scenarioInputs.entries()) {
    const scenario = buildScenario(
      input,
      inputIndex,
      prices,
      options,
      qualityIssues,
    )

    if (!scenario) {
      summary.invalidScenarioInputs += 1
      continue
    }

    if (scenarios.has(scenario.id)) {
      summary.duplicateScenarioRecords += 1
      createIssue(
        qualityIssues,
        'SCENARIO_DUPLICATE_ID',
        'warning',
        `Scenario ${scenario.id} was replaced by the latest input row.`,
        inputIndex,
        scenario.priceId,
        scenario.id,
        scenario.productId,
      )
    }

    scenarios.set(scenario.id, scenario)
  }

  summary.totalPrices = prices.size
  summary.totalScenarios = scenarios.size
  summary.uniqueProducts = new Set(
    [...prices.values()].map((price) => price.productId),
  ).size
  summary.uniqueBrands = new Set(
    [...prices.values()].map((price) => price.brandId),
  ).size
  summary.uniqueCurrencies = new Set(
    [...prices.values()].map((price) => price.currency),
  ).size
  summary.pricesWithNegativeMargin = [...prices.values()].filter(
    (price) => price.grossMargin < 0,
  ).length
  summary.pricesWithoutEffectiveDate = [...prices.values()].filter(
    (price) => price.effectiveDate === null,
  ).length
  summary.blockingIssues = qualityIssues.filter(
    (issue) => issue.severity === 'blocking',
  ).length
  summary.warningIssues = qualityIssues.filter(
    (issue) => issue.severity === 'warning',
  ).length

  return {
    prices,
    scenarios,
    summary,
    qualityIssues,
  }
}
