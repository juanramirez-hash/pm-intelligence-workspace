import {
  calculatePriceGrossMargin,
  roundPricingValue,
} from './pricingMath'

import {
  PRICE_CORRIDOR_METHODOLOGY,
} from './priceCorridorContracts'

import type {
  PriceCorridorCell,
  PriceCorridorExposure,
  PriceCorridorFactorSummary,
  PriceCorridorFeasibility,
  PriceCorridorInput,
  PriceCorridorIssue,
  PriceCorridorOptions,
  PriceCorridorProductInput,
  PriceCorridorProductResult,
  PriceCorridorResult,
  PriceCorridorScenarioInput,
  PriceCorridorScenarioSummary,
  PriceCorridorTierInput,
} from './priceCorridorContracts'

const DEFAULT_MONEY_PRECISION = 2
const DEFAULT_RATE_PRECISION = 6
const DEFAULT_QUANTITY_PRECISION = 4
const COMPARISON_TOLERANCE = 0.00001

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function normalizeText(value: string | null | undefined): string | null {
  const normalized = (value ?? '')
    .trim()
    .replace(/\s+/g, ' ')

  return normalized || null
}

function cloneProduct(
  product: PriceCorridorProductInput,
): PriceCorridorProductInput {
  return {
    ...product,
  }
}

function cloneScenario(
  scenario: PriceCorridorScenarioInput,
): PriceCorridorScenarioInput {
  return {
    ...scenario,
  }
}

function cloneTier(
  tier: PriceCorridorTierInput,
): PriceCorridorTierInput {
  return {
    ...tier,
  }
}

function cloneInput(
  input: PriceCorridorInput,
): PriceCorridorInput {
  return {
    ...input,
    products: input.products.map(cloneProduct),
    scenarios: input.scenarios.map(cloneScenario),
    tiers: input.tiers.map(cloneTier),
    commonListFactors: [...input.commonListFactors],
  }
}

function emptySummary() {
  return {
    productCount: 0,
    scenarioCount: 0,
    tierCount: 0,
    factorCount: 0,
    cellCount: 0,
    fullyFeasibleCellCount: 0,
    partiallyFeasibleCellCount: 0,
    notFeasibleCellCount: 0,
    invalidCellCount: 0,
    belowFloorProductCount: 0,
    atFloorProductCount: 0,
    fullyFeasibleFactorCount: 0,
    globalMaximumRequiredFactor: null,
    globalMinimumSupportedDiscountRate: null,
    globalMinimumSafetyAmount: null,
  }
}

function isolationContract() {
  return {
    mutatesCatalogPrice: false,
    mutatesSourceCost: false,
    persistsCorridor: false,
    fetchesLiveExchangeRate: false,
    approvesDiscount: false,
    writesBusinessRepository: false,
    writesOtherWorkspaces: false,
  } as const
}

function invalidResult(
  input: PriceCorridorInput,
  issues: readonly PriceCorridorIssue[],
): PriceCorridorResult {
  return {
    available: false,
    methodology: PRICE_CORRIDOR_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: isolationContract(),
    status: 'invalid',
    input: cloneInput(input),
    cells: [],
    scenarioSummaries: [],
    factorSummaries: [],
    summary: emptySummary(),
    criticalScenarioId: null,
    criticalScenarioLabel: null,
    issues: issues.map((item) => ({
      ...item,
    })),
    explainability: [
      'El corredor no pudo calcularse porque faltan supuestos explícitos o existen valores inválidos.',
      'No se aprobó ningún descuento, no se consultó un tipo de cambio en vivo y no se modificó ni persistió ningún costo o precio.',
    ],
  }
}

function productLabel(
  product: PriceCorridorProductInput,
): string {
  return product.model ?? product.sku ?? product.id
}

function issue(
  code: PriceCorridorIssue['code'],
  severity: PriceCorridorIssue['severity'],
  message: string,
  values: Partial<Pick<
    PriceCorridorIssue,
    'scenarioId' | 'tierId' | 'productId' | 'commonListFactor'
  >> = {},
): PriceCorridorIssue {
  return {
    code,
    severity,
    message,
    scenarioId: values.scenarioId ?? null,
    tierId: values.tierId ?? null,
    productId: values.productId ?? null,
    commonListFactor: values.commonListFactor ?? null,
  }
}

function validateInput(
  input: PriceCorridorInput,
): PriceCorridorIssue[] {
  const issues: PriceCorridorIssue[] = []
  const id = normalizeIdentifier(input.id)
  const sourceBatchId = normalizeIdentifier(input.sourceBatchId)
  const sourceCostCurrency = normalizeIdentifier(input.sourceCostCurrency)
  const reportingCurrency = normalizeIdentifier(input.reportingCurrency)

  if (!id) {
    issues.push(issue(
      'PRICE_CORRIDOR_INVALID_IDENTIFIER',
      'invalid',
      'La simulación requiere un identificador.',
    ))
  }

  if (!sourceBatchId) {
    issues.push(issue(
      'PRICE_CORRIDOR_INVALID_SOURCE_BATCH',
      'invalid',
      'La simulación requiere el identificador del lote fuente.',
    ))
  }

  if (!sourceCostCurrency || !reportingCurrency) {
    issues.push(issue(
      'PRICE_CORRIDOR_INVALID_CURRENCY',
      'invalid',
      'La moneda de costo y la moneda de reporte son obligatorias.',
    ))
  }

  if (
    !Number.isFinite(input.referenceExchangeRate) ||
    input.referenceExchangeRate <= 0
  ) {
    issues.push(issue(
      'PRICE_CORRIDOR_INVALID_REFERENCE_EXCHANGE_RATE',
      'invalid',
      'El tipo de cambio de referencia debe ser mayor a cero.',
    ))
  }

  if (input.products.length === 0) {
    issues.push(issue(
      'PRICE_CORRIDOR_EMPTY_PRODUCTS',
      'invalid',
      'La simulación requiere al menos un producto.',
    ))
  }

  const productIds = new Set<string>()
  let hasPositiveQuantity = false

  input.products.forEach((product) => {
    const productId = normalizeIdentifier(product.id)

    if (
      !productId ||
      !Number.isFinite(product.cost) ||
      product.cost <= 0 ||
      !Number.isFinite(product.quantity) ||
      product.quantity < 0
    ) {
      issues.push(issue(
        'PRICE_CORRIDOR_INVALID_PRODUCT',
        'invalid',
        `El producto ${productLabel(product)} requiere costo mayor a cero y cantidad no negativa.`,
        {
          productId: product.id,
        },
      ))
    }

    if (productIds.has(productId)) {
      issues.push(issue(
        'PRICE_CORRIDOR_DUPLICATE_PRODUCT_ID',
        'invalid',
        `El producto ${productLabel(product)} está duplicado.`,
        {
          productId: product.id,
        },
      ))
    }

    productIds.add(productId)

    if (product.quantity > 0) {
      hasPositiveQuantity = true
    }

    if (
      input.costBasis === 'reference_landed_cost' &&
      (
        product.explicitLandedCost === null ||
        !Number.isFinite(product.explicitLandedCost) ||
        product.explicitLandedCost <= 0
      )
    ) {
      issues.push(issue(
        'PRICE_CORRIDOR_MISSING_LANDED_COST',
        'invalid',
        `El producto ${productLabel(product)} requiere un costo aterrizado explícito mayor a cero.`,
        {
          productId: product.id,
        },
      ))
    }
  })

  if (!hasPositiveQuantity) {
    issues.push(issue(
      'PRICE_CORRIDOR_NO_POSITIVE_QUANTITY',
      'invalid',
      'Captura al menos una cantidad mayor a cero.',
    ))
  }

  if (input.scenarios.length === 0) {
    issues.push(issue(
      'PRICE_CORRIDOR_EMPTY_SCENARIOS',
      'invalid',
      'La simulación requiere al menos un escenario.',
    ))
  }

  const scenarioIds = new Set<string>()

  input.scenarios.forEach((scenario) => {
    const scenarioId = normalizeIdentifier(scenario.id)

    if (
      !scenarioId ||
      !normalizeText(scenario.label) ||
      !Number.isFinite(scenario.costChangeRate) ||
      scenario.costChangeRate <= -1 ||
      !Number.isFinite(scenario.exchangeRate) ||
      scenario.exchangeRate <= 0
    ) {
      issues.push(issue(
        'PRICE_CORRIDOR_INVALID_SCENARIO',
        'invalid',
        `El escenario ${scenario.label || scenario.id || 'sin nombre'} tiene valores inválidos.`,
        {
          scenarioId: scenario.id,
        },
      ))
    }

    if (scenarioIds.has(scenarioId)) {
      issues.push(issue(
        'PRICE_CORRIDOR_DUPLICATE_SCENARIO_ID',
        'invalid',
        `El escenario ${scenario.label || scenario.id} está duplicado.`,
        {
          scenarioId: scenario.id,
        },
      ))
    }

    scenarioIds.add(scenarioId)
  })

  if (input.tiers.length === 0) {
    issues.push(issue(
      'PRICE_CORRIDOR_EMPTY_TIERS',
      'invalid',
      'La simulación requiere al menos un nivel comercial.',
    ))
  }

  const tierIds = new Set<string>()

  input.tiers.forEach((tier) => {
    const tierId = normalizeIdentifier(tier.id)
    const marginIsValid = tier.minimumGrossMargin === null ||
      (
        Number.isFinite(tier.minimumGrossMargin) &&
        tier.minimumGrossMargin >= 0 &&
        tier.minimumGrossMargin < 1
      )
    const grossProfitIsValid = tier.minimumGrossProfit === null ||
      (
        Number.isFinite(tier.minimumGrossProfit) &&
        tier.minimumGrossProfit >= 0
      )
    const hasFloor = tier.minimumGrossMargin !== null ||
      tier.minimumGrossProfit !== null

    if (
      !tierId ||
      !normalizeText(tier.label) ||
      !Number.isFinite(tier.discountRate) ||
      tier.discountRate < 0 ||
      tier.discountRate >= 1 ||
      !marginIsValid ||
      !grossProfitIsValid ||
      !hasFloor
    ) {
      issues.push(issue(
        'PRICE_CORRIDOR_INVALID_TIER',
        'invalid',
        `El nivel ${tier.label || tier.id || 'sin nombre'} requiere descuento válido y al menos un piso de margen o GP.`,
        {
          tierId: tier.id,
        },
      ))
    }

    if (tierIds.has(tierId)) {
      issues.push(issue(
        'PRICE_CORRIDOR_DUPLICATE_TIER_ID',
        'invalid',
        `El nivel ${tier.label || tier.id} está duplicado.`,
        {
          tierId: tier.id,
        },
      ))
    }

    tierIds.add(tierId)
  })

  if (input.commonListFactors.length === 0) {
    issues.push(issue(
      'PRICE_CORRIDOR_EMPTY_FACTORS',
      'invalid',
      'Captura al menos un factor común candidato.',
    ))
  }

  const factors = new Set<number>()

  input.commonListFactors.forEach((factor) => {
    if (!Number.isFinite(factor) || factor <= 0) {
      issues.push(issue(
        'PRICE_CORRIDOR_INVALID_FACTOR',
        'invalid',
        `El factor ${factor} debe ser mayor a cero.`,
        {
          commonListFactor: factor,
        },
      ))
      return
    }

    if (factors.has(factor)) {
      issues.push(issue(
        'PRICE_CORRIDOR_DUPLICATE_FACTOR',
        'invalid',
        `El factor ${factor}x está duplicado.`,
        {
          commonListFactor: factor,
        },
      ))
    }

    factors.add(factor)
  })

  return issues
}

function referenceUnitCost(
  input: PriceCorridorInput,
  product: PriceCorridorProductInput,
): number | null {
  if (input.costBasis === 'reference_purchase_cost') {
    return product.cost * input.referenceExchangeRate
  }

  return product.explicitLandedCost
}

function stressedUnitCost(
  input: PriceCorridorInput,
  product: PriceCorridorProductInput,
  scenario: PriceCorridorScenarioInput,
): number | null {
  const costMultiplier = 1 + scenario.costChangeRate

  if (input.costBasis === 'reference_purchase_cost') {
    return product.cost * costMultiplier * scenario.exchangeRate
  }

  if (product.explicitLandedCost === null) {
    return null
  }

  return product.explicitLandedCost *
    costMultiplier *
    (scenario.exchangeRate / input.referenceExchangeRate)
}

function priceFloorFromMargin(
  cost: number,
  minimumGrossMargin: number | null,
): number | null {
  if (minimumGrossMargin === null) {
    return null
  }

  return cost / (1 - minimumGrossMargin)
}

function priceFloorFromGrossProfit(
  cost: number,
  minimumGrossProfit: number | null,
): number | null {
  if (minimumGrossProfit === null) {
    return null
  }

  return cost + minimumGrossProfit
}

function maximumOfNullable(
  values: readonly (number | null)[],
): number | null {
  const finite = values.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  )

  return finite.length > 0
    ? Math.max(...finite)
    : null
}

function minimumOfNullable(
  values: readonly (number | null)[],
): number | null {
  const finite = values.filter(
    (value): value is number => value !== null && Number.isFinite(value),
  )

  return finite.length > 0
    ? Math.min(...finite)
    : null
}

function exposureFromSafety(
  safetyAmount: number,
): PriceCorridorExposure {
  if (!Number.isFinite(safetyAmount)) {
    return 'invalid'
  }

  if (safetyAmount < -COMPARISON_TOLERANCE) {
    return 'below_floor'
  }

  if (Math.abs(safetyAmount) <= COMPARISON_TOLERANCE) {
    return 'at_floor'
  }

  return 'safe'
}

function feasibilityFromProducts(
  products: readonly PriceCorridorProductResult[],
): PriceCorridorFeasibility {
  if (products.length === 0) {
    return 'invalid'
  }

  const meets = products.filter((product) => product.meetsFloor).length

  if (meets === products.length) {
    return 'fully_feasible'
  }

  if (meets === 0) {
    return 'not_feasible'
  }

  return 'partially_feasible'
}

function buildProductResult(
  input: PriceCorridorInput,
  product: PriceCorridorProductInput,
  scenario: PriceCorridorScenarioInput,
  factor: number,
  tier: PriceCorridorTierInput,
  moneyPrecision: number,
  ratePrecision: number,
  quantityPrecision: number,
): PriceCorridorProductResult | null {
  const referenceCost = referenceUnitCost(input, product)
  const stressedCost = stressedUnitCost(input, product, scenario)

  if (
    referenceCost === null ||
    stressedCost === null ||
    !Number.isFinite(referenceCost) ||
    !Number.isFinite(stressedCost) ||
    referenceCost <= 0 ||
    stressedCost <= 0
  ) {
    return null
  }

  const candidateListPriceRaw = referenceCost * factor
  const candidateNetPriceRaw =
    candidateListPriceRaw * (1 - tier.discountRate)
  const floorFromMarginRaw = priceFloorFromMargin(
    stressedCost,
    tier.minimumGrossMargin,
  )
  const floorFromGrossProfitRaw = priceFloorFromGrossProfit(
    stressedCost,
    tier.minimumGrossProfit,
  )
  const priceFloorRaw = maximumOfNullable([
    floorFromMarginRaw,
    floorFromGrossProfitRaw,
  ])

  if (
    priceFloorRaw === null ||
    !Number.isFinite(candidateListPriceRaw) ||
    candidateListPriceRaw <= 0 ||
    !Number.isFinite(candidateNetPriceRaw) ||
    candidateNetPriceRaw <= 0 ||
    !Number.isFinite(priceFloorRaw) ||
    priceFloorRaw <= 0
  ) {
    return null
  }

  const maximumDiscountRateRaw =
    1 - (priceFloorRaw / candidateListPriceRaw)
  const corridorWidthRaw = candidateListPriceRaw - priceFloorRaw
  const corridorWidthRateRaw = priceFloorRaw === 0
    ? null
    : corridorWidthRaw / priceFloorRaw
  const safetyAmountRaw = candidateNetPriceRaw - priceFloorRaw
  const safetyRateRaw = priceFloorRaw === 0
    ? null
    : safetyAmountRaw / priceFloorRaw
  const requiredListFactorRaw =
    priceFloorRaw / (referenceCost * (1 - tier.discountRate))
  const factorGapRaw = factor - requiredListFactorRaw
  const grossProfitRaw = candidateNetPriceRaw - stressedCost
  const grossMarginRaw = calculatePriceGrossMargin(
    candidateNetPriceRaw,
    stressedCost,
  )
  const costDeltaRaw = stressedCost - referenceCost
  const costChangeRateRaw = referenceCost === 0
    ? null
    : costDeltaRaw / referenceCost
  const quantity = roundPricingValue(
    product.quantity,
    quantityPrecision,
  )
  const exposure = exposureFromSafety(safetyAmountRaw)
  const meetsFloor = exposure === 'safe' || exposure === 'at_floor'

  return {
    key: [
      scenario.id,
      factor,
      tier.id,
      product.id,
    ].join('::'),
    product: cloneProduct(product),
    quantity,
    referenceUnitCost: roundPricingValue(referenceCost, moneyPrecision),
    stressedUnitCost: roundPricingValue(stressedCost, moneyPrecision),
    costDelta: roundPricingValue(costDeltaRaw, moneyPrecision),
    costChangeRate: costChangeRateRaw === null
      ? null
      : roundPricingValue(costChangeRateRaw, ratePrecision),
    candidateListPrice: roundPricingValue(
      candidateListPriceRaw,
      moneyPrecision,
    ),
    candidateNetPrice: roundPricingValue(
      candidateNetPriceRaw,
      moneyPrecision,
    ),
    floorFromGrossMargin: floorFromMarginRaw === null
      ? null
      : roundPricingValue(floorFromMarginRaw, moneyPrecision),
    floorFromGrossProfit: floorFromGrossProfitRaw === null
      ? null
      : roundPricingValue(floorFromGrossProfitRaw, moneyPrecision),
    priceFloor: roundPricingValue(priceFloorRaw, moneyPrecision),
    maximumDiscountRate: roundPricingValue(
      maximumDiscountRateRaw,
      ratePrecision,
    ),
    corridorWidth: roundPricingValue(corridorWidthRaw, moneyPrecision),
    corridorWidthRate: corridorWidthRateRaw === null
      ? null
      : roundPricingValue(corridorWidthRateRaw, ratePrecision),
    safetyAmount: roundPricingValue(safetyAmountRaw, moneyPrecision),
    safetyRateOnFloor: safetyRateRaw === null
      ? null
      : roundPricingValue(safetyRateRaw, ratePrecision),
    requiredListFactor: roundPricingValue(
      requiredListFactorRaw,
      ratePrecision,
    ),
    factorGap: roundPricingValue(factorGapRaw, ratePrecision),
    grossProfit: roundPricingValue(grossProfitRaw, moneyPrecision),
    grossMargin: roundPricingValue(grossMarginRaw, ratePrecision),
    exposure,
    meetsFloor,
    referenceCostTotal: roundPricingValue(
      referenceCost * quantity,
      moneyPrecision,
    ),
    stressedCostTotal: roundPricingValue(
      stressedCost * quantity,
      moneyPrecision,
    ),
    listPriceTotal: roundPricingValue(
      candidateListPriceRaw * quantity,
      moneyPrecision,
    ),
    sellingPriceTotal: roundPricingValue(
      candidateNetPriceRaw * quantity,
      moneyPrecision,
    ),
    floorTotal: roundPricingValue(
      priceFloorRaw * quantity,
      moneyPrecision,
    ),
    grossProfitTotal: roundPricingValue(
      grossProfitRaw * quantity,
      moneyPrecision,
    ),
    safetyTotal: roundPricingValue(
      safetyAmountRaw * quantity,
      moneyPrecision,
    ),
  }
}

function sum(
  values: readonly number[],
): number {
  return values.reduce((total, value) => total + value, 0)
}

function buildCell(
  input: PriceCorridorInput,
  scenario: PriceCorridorScenarioInput,
  scenarioOrder: number,
  factor: number,
  factorOrder: number,
  tier: PriceCorridorTierInput,
  tierOrder: number,
  order: number,
  options: Required<PriceCorridorOptions>,
): PriceCorridorCell {
  const products = input.products.flatMap((product) => {
    const result = buildProductResult(
      input,
      product,
      scenario,
      factor,
      tier,
      options.moneyPrecision,
      options.ratePrecision,
      options.quantityPrecision,
    )

    return result
      ? [result]
      : []
  })
  const feasibility = feasibilityFromProducts(products)
  const totalUnits = roundPricingValue(
    sum(products.map((product) => product.quantity)),
    options.quantityPrecision,
  )
  const coveredUnits = sum(
    products
      .filter((product) => product.meetsFloor)
      .map((product) => product.quantity),
  )
  const volumeCoverageRate = totalUnits > 0
    ? coveredUnits / totalUnits
    : 0
  const referenceCostTotal = sum(
    products.map((product) => product.referenceCostTotal),
  )
  const stressedCostTotal = sum(
    products.map((product) => product.stressedCostTotal),
  )
  const totalListPrice = sum(
    products.map((product) => product.listPriceTotal),
  )
  const totalSellingPrice = sum(
    products.map((product) => product.sellingPriceTotal),
  )
  const totalPriceFloor = sum(
    products.map((product) => product.floorTotal),
  )
  const totalGrossProfit = sum(
    products.map((product) => product.grossProfitTotal),
  )
  const totalSafetyAmount = sum(
    products.map((product) => product.safetyTotal),
  )
  const grossMargin = totalSellingPrice === 0
    ? 0
    : (totalSellingPrice - stressedCostTotal) / totalSellingPrice
  const minimumRequiredFactor = maximumOfNullable(
    products.map((product) => product.requiredListFactor),
  )
  const limitingProduct = [...products].sort((left, right) => {
    const factorDelta =
      right.requiredListFactor - left.requiredListFactor

    if (Math.abs(factorDelta) > COMPARISON_TOLERANCE) {
      return factorDelta
    }

    return left.maximumDiscountRate - right.maximumDiscountRate
  })[0] ?? null

  return {
    key: [
      scenario.id,
      factor,
      tier.id,
    ].join('::'),
    order,
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    scenarioOrder,
    costChangeRate: scenario.costChangeRate,
    exchangeRate: scenario.exchangeRate,
    referenceExchangeRate: input.referenceExchangeRate,
    commonListFactor: factor,
    factorOrder,
    tierId: tier.id,
    tierLabel: tier.label,
    tierOrder,
    discountRate: tier.discountRate,
    minimumGrossMargin: tier.minimumGrossMargin,
    minimumGrossProfit: tier.minimumGrossProfit,
    costBasis: input.costBasis,
    minimumRequiredFactor,
    factorGapToMinimum: minimumRequiredFactor === null
      ? null
      : roundPricingValue(
        factor - minimumRequiredFactor,
        options.ratePrecision,
      ),
    supportedMaximumDiscountRate: minimumOfNullable(
      products.map((product) => product.maximumDiscountRate),
    ),
    minimumCorridorWidth: minimumOfNullable(
      products.map((product) => product.corridorWidth),
    ),
    minimumSafetyAmount: minimumOfNullable(
      products.map((product) => product.safetyAmount),
    ),
    minimumSafetyRateOnFloor: minimumOfNullable(
      products.map((product) => product.safetyRateOnFloor),
    ),
    feasibility,
    totalUnits,
    productCount: input.products.length,
    calculableProductCount: products.length,
    meetsFloorProductCount: products.filter(
      (product) => product.meetsFloor,
    ).length,
    belowFloorProductCount: products.filter(
      (product) => product.exposure === 'below_floor',
    ).length,
    atFloorProductCount: products.filter(
      (product) => product.exposure === 'at_floor',
    ).length,
    volumeCoverageRate: roundPricingValue(
      volumeCoverageRate,
      options.ratePrecision,
    ),
    referenceCostTotal: roundPricingValue(
      referenceCostTotal,
      options.moneyPrecision,
    ),
    stressedCostTotal: roundPricingValue(
      stressedCostTotal,
      options.moneyPrecision,
    ),
    totalListPrice: roundPricingValue(
      totalListPrice,
      options.moneyPrecision,
    ),
    totalSellingPrice: roundPricingValue(
      totalSellingPrice,
      options.moneyPrecision,
    ),
    totalPriceFloor: roundPricingValue(
      totalPriceFloor,
      options.moneyPrecision,
    ),
    totalGrossProfit: roundPricingValue(
      totalGrossProfit,
      options.moneyPrecision,
    ),
    grossMargin: roundPricingValue(
      grossMargin,
      options.ratePrecision,
    ),
    totalSafetyAmount: roundPricingValue(
      totalSafetyAmount,
      options.moneyPrecision,
    ),
    limitingProductId: limitingProduct?.product.id ?? null,
    limitingProductLabel: limitingProduct
      ? productLabel(limitingProduct.product)
      : null,
    products,
  }
}

function buildScenarioSummaries(
  input: PriceCorridorInput,
  cells: readonly PriceCorridorCell[],
): PriceCorridorScenarioSummary[] {
  return input.scenarios.map((scenario) => {
    const scenarioCells = cells.filter(
      (cell) => cell.scenarioId === scenario.id,
    )
    const criticalCell = [...scenarioCells].sort((left, right) => {
      const leftFactor = left.minimumRequiredFactor ?? -Infinity
      const rightFactor = right.minimumRequiredFactor ?? -Infinity
      const factorDelta = rightFactor - leftFactor

      if (Math.abs(factorDelta) > COMPARISON_TOLERANCE) {
        return factorDelta
      }

      return (left.minimumSafetyAmount ?? Infinity) -
        (right.minimumSafetyAmount ?? Infinity)
    })[0] ?? null
    const criticalProduct = criticalCell?.products.find(
      (product) => product.product.id === criticalCell.limitingProductId,
    ) ?? null

    return {
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      costChangeRate: scenario.costChangeRate,
      exchangeRate: scenario.exchangeRate,
      cellCount: scenarioCells.length,
      fullyFeasibleCellCount: scenarioCells.filter(
        (cell) => cell.feasibility === 'fully_feasible',
      ).length,
      partiallyFeasibleCellCount: scenarioCells.filter(
        (cell) => cell.feasibility === 'partially_feasible',
      ).length,
      notFeasibleCellCount: scenarioCells.filter(
        (cell) => cell.feasibility === 'not_feasible',
      ).length,
      invalidCellCount: scenarioCells.filter(
        (cell) => cell.feasibility === 'invalid',
      ).length,
      maximumRequiredFactor: maximumOfNullable(
        scenarioCells.map((cell) => cell.minimumRequiredFactor),
      ),
      minimumSupportedMaximumDiscountRate: minimumOfNullable(
        scenarioCells.map((cell) => cell.supportedMaximumDiscountRate),
      ),
      minimumSafetyAmount: minimumOfNullable(
        scenarioCells.map((cell) => cell.minimumSafetyAmount),
      ),
      minimumGrossMargin: minimumOfNullable(
        scenarioCells.map((cell) => cell.grossMargin),
      ),
      minimumTotalGrossProfit: minimumOfNullable(
        scenarioCells.map((cell) => cell.totalGrossProfit),
      ),
      criticalTierId: criticalCell?.tierId ?? null,
      criticalTierLabel: criticalCell?.tierLabel ?? null,
      criticalProductId: criticalProduct?.product.id ?? null,
      criticalProductLabel: criticalProduct
        ? productLabel(criticalProduct.product)
        : null,
    }
  })
}

function buildFactorSummaries(
  input: PriceCorridorInput,
  cells: readonly PriceCorridorCell[],
): PriceCorridorFactorSummary[] {
  return input.commonListFactors.map((factor) => {
    const factorCells = cells.filter(
      (cell) => cell.commonListFactor === factor,
    )
    const fullyFeasibleCellCount = factorCells.filter(
      (cell) => cell.feasibility === 'fully_feasible',
    ).length

    return {
      commonListFactor: factor,
      cellCount: factorCells.length,
      fullyFeasibleCellCount,
      partiallyFeasibleCellCount: factorCells.filter(
        (cell) => cell.feasibility === 'partially_feasible',
      ).length,
      notFeasibleCellCount: factorCells.filter(
        (cell) => cell.feasibility === 'not_feasible',
      ).length,
      invalidCellCount: factorCells.filter(
        (cell) => cell.feasibility === 'invalid',
      ).length,
      minimumVolumeCoverageRate: minimumOfNullable(
        factorCells.map((cell) => cell.volumeCoverageRate),
      ) ?? 0,
      minimumSupportedMaximumDiscountRate: minimumOfNullable(
        factorCells.map((cell) => cell.supportedMaximumDiscountRate),
      ),
      minimumSafetyAmount: minimumOfNullable(
        factorCells.map((cell) => cell.minimumSafetyAmount),
      ),
      minimumGrossMargin: minimumOfNullable(
        factorCells.map((cell) => cell.grossMargin),
      ),
      fullyFeasibleAcrossAllScenariosAndTiers:
        factorCells.length > 0 &&
        fullyFeasibleCellCount === factorCells.length,
    }
  })
}

function outputIssues(
  cells: readonly PriceCorridorCell[],
): PriceCorridorIssue[] {
  const issues: PriceCorridorIssue[] = []

  cells.forEach((cell) => {
    cell.products.forEach((product) => {
      if (product.exposure === 'below_floor') {
        issues.push(issue(
          'PRICE_CORRIDOR_BELOW_FLOOR',
          'warning',
          `${productLabel(product.product)} queda ${Math.abs(product.safetyAmount).toLocaleString('es-MX')} por debajo del piso en ${cell.scenarioLabel} / ${cell.tierLabel} / ${cell.commonListFactor}x.`,
          {
            scenarioId: cell.scenarioId,
            tierId: cell.tierId,
            productId: product.product.id,
            commonListFactor: cell.commonListFactor,
          },
        ))
      }

      if (product.exposure === 'at_floor') {
        issues.push(issue(
          'PRICE_CORRIDOR_AT_FLOOR',
          'info',
          `${productLabel(product.product)} queda exactamente en el piso en ${cell.scenarioLabel} / ${cell.tierLabel} / ${cell.commonListFactor}x.`,
          {
            scenarioId: cell.scenarioId,
            tierId: cell.tierId,
            productId: product.product.id,
            commonListFactor: cell.commonListFactor,
          },
        ))
      }
    })
  })

  return issues
}

function normalizeInput(
  input: PriceCorridorInput,
): PriceCorridorInput {
  return {
    ...cloneInput(input),
    id: normalizeIdentifier(input.id),
    sourceBatchId: normalizeIdentifier(input.sourceBatchId),
    brandName: normalizeText(input.brandName),
    sourceCostCurrency: normalizeIdentifier(input.sourceCostCurrency),
    reportingCurrency: normalizeIdentifier(input.reportingCurrency),
    products: input.products.map((product) => ({
      ...cloneProduct(product),
      id: normalizeIdentifier(product.id),
      model: normalizeText(product.model),
      sku: normalizeText(product.sku),
      notes: normalizeText(product.notes),
    })),
    scenarios: input.scenarios.map((scenario) => ({
      ...cloneScenario(scenario),
      id: normalizeIdentifier(scenario.id),
      label: normalizeText(scenario.label) ?? scenario.id,
      notes: normalizeText(scenario.notes),
    })),
    tiers: input.tiers.map((tier) => ({
      ...cloneTier(tier),
      id: normalizeIdentifier(tier.id),
      label: normalizeText(tier.label) ?? tier.id,
      notes: normalizeText(tier.notes),
    })),
    notes: normalizeText(input.notes),
  }
}

export function evaluatePriceCorridor(
  input: PriceCorridorInput,
  options: PriceCorridorOptions = {},
): PriceCorridorResult {
  const validationIssues = validateInput(input)

  if (validationIssues.some((item) => item.severity === 'invalid')) {
    return invalidResult(input, validationIssues)
  }

  const normalizedInput = normalizeInput(input)
  const resolvedOptions: Required<PriceCorridorOptions> = {
    moneyPrecision: options.moneyPrecision ?? DEFAULT_MONEY_PRECISION,
    ratePrecision: options.ratePrecision ?? DEFAULT_RATE_PRECISION,
    quantityPrecision: options.quantityPrecision ?? DEFAULT_QUANTITY_PRECISION,
  }
  const cells: PriceCorridorCell[] = []
  let order = 1

  normalizedInput.scenarios.forEach((scenario, scenarioIndex) => {
    normalizedInput.commonListFactors.forEach((factor, factorIndex) => {
      normalizedInput.tiers.forEach((tier, tierIndex) => {
        cells.push(buildCell(
          normalizedInput,
          scenario,
          scenarioIndex + 1,
          factor,
          factorIndex + 1,
          tier,
          tierIndex + 1,
          order,
          resolvedOptions,
        ))
        order += 1
      })
    })
  })

  if (
    cells.length === 0 ||
    cells.every((cell) => cell.feasibility === 'invalid')
  ) {
    return invalidResult(normalizedInput, [
      ...validationIssues,
      issue(
        'PRICE_CORRIDOR_NO_CALCULABLE_ROWS',
        'invalid',
        'No fue posible calcular ninguna combinación del corredor.',
      ),
    ])
  }

  const scenarioSummaries = buildScenarioSummaries(
    normalizedInput,
    cells,
  )
  const factorSummaries = buildFactorSummaries(
    normalizedInput,
    cells,
  )
  const calculatedIssues = outputIssues(cells)
  const issues = [
    ...validationIssues,
    ...calculatedIssues,
  ]
  const criticalScenario = [...scenarioSummaries].sort((left, right) => {
    const leftFactor = left.maximumRequiredFactor ?? -Infinity
    const rightFactor = right.maximumRequiredFactor ?? -Infinity
    const factorDelta = rightFactor - leftFactor

    if (Math.abs(factorDelta) > COMPARISON_TOLERANCE) {
      return factorDelta
    }

    return (left.minimumSafetyAmount ?? Infinity) -
      (right.minimumSafetyAmount ?? Infinity)
  })[0] ?? null
  const fullyFeasibleCellCount = cells.filter(
    (cell) => cell.feasibility === 'fully_feasible',
  ).length
  const partiallyFeasibleCellCount = cells.filter(
    (cell) => cell.feasibility === 'partially_feasible',
  ).length
  const notFeasibleCellCount = cells.filter(
    (cell) => cell.feasibility === 'not_feasible',
  ).length
  const invalidCellCount = cells.filter(
    (cell) => cell.feasibility === 'invalid',
  ).length

  return {
    available: true,
    methodology: PRICE_CORRIDOR_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: isolationContract(),
    status: issues.some((item) => item.severity === 'warning')
      ? 'warning'
      : 'valid',
    input: normalizedInput,
    cells,
    scenarioSummaries,
    factorSummaries,
    summary: {
      productCount: normalizedInput.products.length,
      scenarioCount: normalizedInput.scenarios.length,
      tierCount: normalizedInput.tiers.length,
      factorCount: normalizedInput.commonListFactors.length,
      cellCount: cells.length,
      fullyFeasibleCellCount,
      partiallyFeasibleCellCount,
      notFeasibleCellCount,
      invalidCellCount,
      belowFloorProductCount: cells.reduce(
        (total, cell) => total + cell.belowFloorProductCount,
        0,
      ),
      atFloorProductCount: cells.reduce(
        (total, cell) => total + cell.atFloorProductCount,
        0,
      ),
      fullyFeasibleFactorCount: factorSummaries.filter(
        (summary) => summary.fullyFeasibleAcrossAllScenariosAndTiers,
      ).length,
      globalMaximumRequiredFactor: maximumOfNullable(
        cells.map((cell) => cell.minimumRequiredFactor),
      ),
      globalMinimumSupportedDiscountRate: minimumOfNullable(
        cells.map((cell) => cell.supportedMaximumDiscountRate),
      ),
      globalMinimumSafetyAmount: minimumOfNullable(
        cells.map((cell) => cell.minimumSafetyAmount),
      ),
    },
    criticalScenarioId: criticalScenario?.scenarioId ?? null,
    criticalScenarioLabel: criticalScenario?.scenarioLabel ?? null,
    issues,
    explainability: [
      'El precio de lista candidato se fija con el costo de referencia y el factor común; no se recalcula durante el escenario de estrés.',
      'El piso por margen se calcula como costo estresado ÷ (1 - margen mínimo).',
      'El piso por GP se calcula como costo estresado + GP unitario mínimo.',
      'Cuando existen ambos pisos, gobierna el mayor.',
      'El descuento máximo soportado es 1 - (precio piso ÷ precio de lista candidato).',
      'La distancia de seguridad es precio neto candidato - precio piso; el semáforo no utiliza tolerancias comerciales ocultas.',
      'Los costos, cantidades, tipos de cambio, factores, descuentos y pisos son supuestos explícitos de la sesión.',
      'El resultado no aprueba descuentos, no persiste corredores y no modifica costos o precios reales.',
    ],
  }
}
