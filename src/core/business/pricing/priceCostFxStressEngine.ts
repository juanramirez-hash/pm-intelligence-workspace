import {
  calculatePriceGrossMargin,
  roundPricingValue,
} from './pricingMath'

import {
  evaluatePriceDesign,
} from './priceDesignEngine'

import {
  PRICE_COST_FX_STRESS_METHODOLOGY,
} from './priceCostFxStressContracts'

import type {
  PriceDesignMetrics,
  PriceDesignObjective,
} from './priceDesignContracts'

import type {
  PriceTierLadderTierInput,
  PriceTierObjective,
} from './priceTierLadderContracts'

import type {
  PriceCostFxStressCell,
  PriceCostFxStressFactorSummary,
  PriceCostFxStressFeasibility,
  PriceCostFxStressInput,
  PriceCostFxStressIssue,
  PriceCostFxStressOptions,
  PriceCostFxStressProductInput,
  PriceCostFxStressProductResult,
  PriceCostFxStressResult,
  PriceCostFxStressScenarioInput,
  PriceCostFxStressScenarioSummary,
} from './priceCostFxStressContracts'

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

function cloneObjective(
  objective: PriceTierObjective,
): PriceTierObjective {
  return {
    ...objective,
  }
}

function cloneTier(
  tier: PriceTierLadderTierInput,
): PriceTierLadderTierInput {
  return {
    ...tier,
    objective: cloneObjective(tier.objective),
  }
}

function cloneProduct(
  product: PriceCostFxStressProductInput,
): PriceCostFxStressProductInput {
  return {
    ...product,
  }
}

function cloneScenario(
  scenario: PriceCostFxStressScenarioInput,
): PriceCostFxStressScenarioInput {
  return {
    ...scenario,
  }
}

function cloneInput(
  input: PriceCostFxStressInput,
): PriceCostFxStressInput {
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
    belowObjectiveProductCount: 0,
    fullyFeasibleFactorCount: 0,
    globalMaximumRequiredFactor: null,
  }
}

function invalidResult(
  input: PriceCostFxStressInput,
  issues: readonly PriceCostFxStressIssue[],
): PriceCostFxStressResult {
  return {
    available: false,
    methodology: PRICE_COST_FX_STRESS_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      mutatesSourceCost: false,
      persistsStressTest: false,
      fetchesLiveExchangeRate: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
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
      'La prueba de estrés no pudo calcularse porque faltan supuestos explícitos o existen valores inválidos.',
      'No se consultó un tipo de cambio en vivo y no se modificó ni persistió ningún costo, factor o precio.',
    ],
  }
}

function productLabel(
  product: PriceCostFxStressProductInput,
): string {
  return product.model ?? product.sku ?? product.id
}

function isValidTierObjective(
  objective: PriceTierObjective,
): boolean {
  switch (objective.type) {
    case 'minimum_gross_margin':
      return Number.isFinite(objective.grossMargin) &&
        objective.grossMargin >= 0 &&
        objective.grossMargin < 1
    case 'minimum_gross_profit':
      return Number.isFinite(objective.grossProfit) &&
        objective.grossProfit >= 0
  }
}

function toDesignObjective(
  objective: PriceTierObjective,
): PriceDesignObjective {
  switch (objective.type) {
    case 'minimum_gross_margin':
      return {
        type: 'target_gross_margin',
        grossMargin: objective.grossMargin,
      }
    case 'minimum_gross_profit':
      return {
        type: 'target_gross_profit',
        grossProfit: objective.grossProfit,
      }
  }
}

function objectiveIsMet(
  metrics: PriceDesignMetrics,
  objective: PriceTierObjective,
): boolean {
  switch (objective.type) {
    case 'minimum_gross_margin':
      return metrics.grossMargin + COMPARISON_TOLERANCE >= objective.grossMargin
    case 'minimum_gross_profit':
      return metrics.grossProfit + COMPARISON_TOLERANCE >= objective.grossProfit
  }
}

function normalizeInput(
  input: PriceCostFxStressInput,
  ratePrecision: number,
  quantityPrecision: number,
): PriceCostFxStressInput {
  return {
    ...cloneInput(input),
    id: normalizeIdentifier(input.id),
    sourceBatchId: normalizeIdentifier(input.sourceBatchId),
    brandName: normalizeText(input.brandName),
    sourceCostCurrency: normalizeIdentifier(input.sourceCostCurrency),
    reportingCurrency: normalizeIdentifier(input.reportingCurrency),
    referenceExchangeRate: roundPricingValue(input.referenceExchangeRate, ratePrecision),
    products: input.products.map((product, index) => ({
      ...cloneProduct(product),
      id: normalizeIdentifier(product.id || `STRESS-PRODUCT-${index + 1}`),
      model: normalizeText(product.model),
      sku: normalizeText(product.sku),
      notes: normalizeText(product.notes),
      quantity: roundPricingValue(product.quantity, quantityPrecision),
    })),
    scenarios: input.scenarios.map((scenario, index) => ({
      ...cloneScenario(scenario),
      id: normalizeIdentifier(scenario.id || `STRESS-SCENARIO-${index + 1}`),
      label: normalizeText(scenario.label) ?? `Escenario ${index + 1}`,
      costChangeRate: roundPricingValue(scenario.costChangeRate, ratePrecision),
      exchangeRate: roundPricingValue(scenario.exchangeRate, ratePrecision),
      notes: normalizeText(scenario.notes),
    })),
    tiers: input.tiers.map((tier, index) => ({
      ...cloneTier(tier),
      id: normalizeIdentifier(tier.id || `STRESS-TIER-${index + 1}`),
      label: normalizeText(tier.label) ?? `Nivel ${index + 1}`,
      discountRate: roundPricingValue(tier.discountRate, ratePrecision),
      notes: normalizeText(tier.notes),
    })),
    commonListFactors: input.commonListFactors.map(
      (factor) => roundPricingValue(factor, ratePrecision),
    ),
    notes: normalizeText(input.notes),
  }
}

function validateInput(
  input: PriceCostFxStressInput,
): PriceCostFxStressIssue[] {
  const issues: PriceCostFxStressIssue[] = []
  const add = (item: PriceCostFxStressIssue) => issues.push(item)

  if (!input.id) {
    add({
      code: 'PRICE_COST_FX_STRESS_INVALID_IDENTIFIER',
      severity: 'invalid',
      message: 'La prueba de estrés requiere un identificador temporal.',
      scenarioId: null,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  if (!input.sourceBatchId) {
    add({
      code: 'PRICE_COST_FX_STRESS_INVALID_SOURCE_BATCH',
      severity: 'invalid',
      message: 'La prueba de estrés requiere la matriz por lote de origen.',
      scenarioId: null,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  if (!input.sourceCostCurrency || !input.reportingCurrency) {
    add({
      code: 'PRICE_COST_FX_STRESS_INVALID_CURRENCY',
      severity: 'invalid',
      message: 'Captura la moneda del costo y la moneda de reporte.',
      scenarioId: null,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  if (!Number.isFinite(input.referenceExchangeRate) || input.referenceExchangeRate <= 0) {
    add({
      code: 'PRICE_COST_FX_STRESS_INVALID_CURRENCY',
      severity: 'invalid',
      message: 'El tipo de cambio de referencia debe ser mayor a cero.',
      scenarioId: null,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  if (input.products.length === 0) {
    add({
      code: 'PRICE_COST_FX_STRESS_EMPTY_PRODUCTS',
      severity: 'invalid',
      message: 'La prueba de estrés requiere al menos un producto.',
      scenarioId: null,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  const productIds = new Set<string>()
  input.products.forEach((product) => {
    if (
      !product.id ||
      !Number.isFinite(product.cost) ||
      product.cost <= 0 ||
      !Number.isFinite(product.quantity) ||
      product.quantity < 0
    ) {
      add({
        code: 'PRICE_COST_FX_STRESS_INVALID_PRODUCT',
        severity: 'invalid',
        message: `El producto ${productLabel(product) || 'sin identificar'} requiere costo mayor a cero y cantidad mayor o igual a cero.`,
        scenarioId: null,
        tierId: null,
        productId: product.id || null,
        commonListFactor: null,
      })
    }

    if (productIds.has(product.id)) {
      add({
        code: 'PRICE_COST_FX_STRESS_DUPLICATE_PRODUCT_ID',
        severity: 'invalid',
        message: `El producto ${product.id} está duplicado.`,
        scenarioId: null,
        tierId: null,
        productId: product.id,
        commonListFactor: null,
      })
    }
    productIds.add(product.id)
  })

  if (!input.products.some((product) => product.quantity > 0)) {
    add({
      code: 'PRICE_COST_FX_STRESS_INVALID_PRODUCT',
      severity: 'invalid',
      message: 'Captura al menos una cantidad mayor a cero para ponderar la prueba de estrés.',
      scenarioId: null,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  if (input.scenarios.length === 0) {
    add({
      code: 'PRICE_COST_FX_STRESS_EMPTY_SCENARIOS',
      severity: 'invalid',
      message: 'Captura al menos un escenario de costo y tipo de cambio.',
      scenarioId: null,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  const scenarioIds = new Set<string>()
  input.scenarios.forEach((scenario) => {
    if (
      !scenario.id ||
      !scenario.label ||
      !Number.isFinite(scenario.costChangeRate) ||
      scenario.costChangeRate <= -1 ||
      !Number.isFinite(scenario.exchangeRate) ||
      scenario.exchangeRate <= 0
    ) {
      add({
        code: 'PRICE_COST_FX_STRESS_INVALID_SCENARIO',
        severity: 'invalid',
        message: `El escenario ${scenario.label || scenario.id || 'sin nombre'} requiere variación mayor a -100% y tipo de cambio mayor a cero.`,
        scenarioId: scenario.id || null,
        tierId: null,
        productId: null,
        commonListFactor: null,
      })
    }

    if (scenarioIds.has(scenario.id)) {
      add({
        code: 'PRICE_COST_FX_STRESS_DUPLICATE_SCENARIO_ID',
        severity: 'invalid',
        message: `El escenario ${scenario.id} está duplicado.`,
        scenarioId: scenario.id,
        tierId: null,
        productId: null,
        commonListFactor: null,
      })
    }
    scenarioIds.add(scenario.id)
  })

  if (input.tiers.length === 0) {
    add({
      code: 'PRICE_COST_FX_STRESS_EMPTY_TIERS',
      severity: 'invalid',
      message: 'Captura al menos un nivel comercial con descuento y objetivo.',
      scenarioId: null,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  const tierIds = new Set<string>()
  input.tiers.forEach((tier) => {
    if (
      !tier.id ||
      !tier.label ||
      !Number.isFinite(tier.discountRate) ||
      tier.discountRate < 0 ||
      tier.discountRate >= 1 ||
      !isValidTierObjective(tier.objective)
    ) {
      add({
        code: 'PRICE_COST_FX_STRESS_INVALID_TIER',
        severity: 'invalid',
        message: `El nivel ${tier.label || tier.id || 'sin nombre'} contiene descuento u objetivo inválidos.`,
        scenarioId: null,
        tierId: tier.id || null,
        productId: null,
        commonListFactor: null,
      })
    }

    if (tierIds.has(tier.id)) {
      add({
        code: 'PRICE_COST_FX_STRESS_DUPLICATE_TIER_ID',
        severity: 'invalid',
        message: `El nivel ${tier.id} está duplicado.`,
        scenarioId: null,
        tierId: tier.id,
        productId: null,
        commonListFactor: null,
      })
    }
    tierIds.add(tier.id)
  })

  if (input.commonListFactors.length === 0) {
    add({
      code: 'PRICE_COST_FX_STRESS_EMPTY_FACTORS',
      severity: 'invalid',
      message: 'Captura al menos un factor común candidato.',
      scenarioId: null,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  const factors = new Set<number>()
  input.commonListFactors.forEach((factor) => {
    if (!Number.isFinite(factor) || factor <= 0) {
      add({
        code: 'PRICE_COST_FX_STRESS_INVALID_FACTOR',
        severity: 'invalid',
        message: `El factor ${factor} debe ser mayor a cero.`,
        scenarioId: null,
        tierId: null,
        productId: null,
        commonListFactor: factor,
      })
    }

    if (factors.has(factor)) {
      add({
        code: 'PRICE_COST_FX_STRESS_DUPLICATE_FACTOR',
        severity: 'invalid',
        message: `El factor ${factor.toLocaleString('es-MX')}x está duplicado.`,
        scenarioId: null,
        tierId: null,
        productId: null,
        commonListFactor: factor,
      })
    }
    factors.add(factor)
  })

  return issues
}

function cellFeasibility(
  calculableCount: number,
  meetsCount: number,
): PriceCostFxStressFeasibility {
  if (calculableCount === 0) {
    return 'invalid'
  }

  if (meetsCount === calculableCount) {
    return 'fully_feasible'
  }

  return meetsCount > 0
    ? 'partially_feasible'
    : 'not_feasible'
}

function buildCell(
  input: PriceCostFxStressInput,
  scenario: PriceCostFxStressScenarioInput,
  scenarioOrder: number,
  factor: number,
  factorOrder: number,
  tier: PriceTierLadderTierInput,
  tierOrder: number,
  order: number,
  moneyPrecision: number,
  ratePrecision: number,
): PriceCostFxStressCell {
  const activeProducts = input.products.filter((product) => product.quantity > 0)
  const products: PriceCostFxStressProductResult[] = activeProducts.map((product) => {
    const adjustedCostInSourceCurrency = product.cost * (1 + scenario.costChangeRate)
    const convertedBaseCost = product.cost * input.referenceExchangeRate
    const stressedUnitCost = adjustedCostInSourceCurrency * scenario.exchangeRate
    const requiredDesign = evaluatePriceDesign({
      id: `${input.id}-${scenario.id}-${tier.id}-${product.id}-REQUIRED`,
      identity: {
        brandName: input.brandName,
        model: product.model,
        sku: product.sku,
      },
      currency: input.reportingCurrency,
      cost: stressedUnitCost,
      discountRate: tier.discountRate,
      objective: toDesignObjective(tier.objective),
    }, {
      moneyPrecision,
      ratePrecision,
    })
    const requiredListFactor = requiredDesign.metrics && convertedBaseCost > 0
      ? roundPricingValue(requiredDesign.metrics.listPrice / convertedBaseCost, ratePrecision)
      : null
    const design = evaluatePriceDesign({
      id: `${input.id}-${scenario.id}-${tier.id}-${factor}-${product.id}`,
      identity: {
        brandName: input.brandName,
        model: product.model,
        sku: product.sku,
      },
      currency: input.reportingCurrency,
      cost: stressedUnitCost,
      discountRate: tier.discountRate,
      objective: {
        type: 'list_price',
        listPrice: convertedBaseCost * factor,
      },
    }, {
      moneyPrecision,
      ratePrecision,
    })
    const metrics = design.metrics
    const meetsObjective = metrics
      ? objectiveIsMet(metrics, tier.objective)
      : null

    return {
      key: `${scenario.id}::${factor}::${tier.id}::${product.id}`,
      product: cloneProduct(product),
      quantity: product.quantity,
      baseCostInSourceCurrency: roundPricingValue(product.cost, moneyPrecision),
      adjustedCostInSourceCurrency: roundPricingValue(adjustedCostInSourceCurrency, moneyPrecision),
      convertedBaseCost: roundPricingValue(convertedBaseCost, moneyPrecision),
      stressedUnitCost: roundPricingValue(stressedUnitCost, moneyPrecision),
      requiredListFactor,
      factorGap: requiredListFactor === null
        ? null
        : roundPricingValue(factor - requiredListFactor, ratePrecision),
      design,
      metrics,
      meetsObjective,
      baseCostTotal: roundPricingValue(convertedBaseCost * product.quantity, moneyPrecision),
      stressedCostTotal: roundPricingValue(stressedUnitCost * product.quantity, moneyPrecision),
      totalListPrice: roundPricingValue((metrics?.listPrice ?? 0) * product.quantity, moneyPrecision),
      totalSellingPrice: roundPricingValue((metrics?.sellingPrice ?? 0) * product.quantity, moneyPrecision),
      totalGrossProfit: roundPricingValue((metrics?.grossProfit ?? 0) * product.quantity, moneyPrecision),
    }
  })

  const calculable = products.filter((product) => product.metrics)
  const meetsCount = calculable.filter((product) => product.meetsObjective).length
  const totalUnits = products.reduce((total, product) => total + product.quantity, 0)
  const coveredUnits = products.reduce(
    (total, product) => total + (product.meetsObjective ? product.quantity : 0),
    0,
  )
  const convertedBaseCostTotal = products.reduce((total, product) => total + product.baseCostTotal, 0)
  const stressedCostTotal = products.reduce((total, product) => total + product.stressedCostTotal, 0)
  const totalListPrice = products.reduce((total, product) => total + product.totalListPrice, 0)
  const totalSellingPrice = products.reduce((total, product) => total + product.totalSellingPrice, 0)
  const totalGrossProfit = products.reduce((total, product) => total + product.totalGrossProfit, 0)
  const margins = calculable
    .map((product) => product.metrics?.grossMargin)
    .filter((value): value is number => value !== undefined)
  const minimumProduct = products.reduce<PriceCostFxStressProductResult | null>(
    (current, product) => {
      if (product.requiredListFactor === null) {
        return current
      }

      if (current?.requiredListFactor === null || current === null) {
        return product
      }

      return product.requiredListFactor > current.requiredListFactor
        ? product
        : current
    },
    null,
  )
  const minimumRequiredFactor = minimumProduct?.requiredListFactor ?? null

  return {
    key: `${scenario.id}::${factor}::${tier.id}`,
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
    objective: cloneObjective(tier.objective),
    minimumRequiredFactor,
    factorGapToMinimum: minimumRequiredFactor === null
      ? null
      : roundPricingValue(factor - minimumRequiredFactor, ratePrecision),
    feasibility: cellFeasibility(calculable.length, meetsCount),
    totalUnits: roundPricingValue(totalUnits, DEFAULT_QUANTITY_PRECISION),
    productCount: products.length,
    calculableProductCount: calculable.length,
    meetsObjectiveProductCount: meetsCount,
    belowObjectiveProductCount: calculable.length - meetsCount,
    volumeCoverageRate: totalUnits > 0
      ? roundPricingValue(coveredUnits / totalUnits, ratePrecision)
      : 0,
    convertedBaseCostTotal: roundPricingValue(convertedBaseCostTotal, moneyPrecision),
    stressedCostTotal: roundPricingValue(stressedCostTotal, moneyPrecision),
    costImpact: roundPricingValue(stressedCostTotal - convertedBaseCostTotal, moneyPrecision),
    totalListPrice: roundPricingValue(totalListPrice, moneyPrecision),
    totalSellingPrice: roundPricingValue(totalSellingPrice, moneyPrecision),
    totalGrossProfit: roundPricingValue(totalGrossProfit, moneyPrecision),
    grossMargin: roundPricingValue(
      calculatePriceGrossMargin(totalSellingPrice, stressedCostTotal),
      ratePrecision,
    ),
    weightedNetFactor: stressedCostTotal > 0
      ? roundPricingValue(totalSellingPrice / stressedCostTotal, ratePrecision)
      : 0,
    minimumGrossMargin: margins.length > 0
      ? roundPricingValue(Math.min(...margins), ratePrecision)
      : null,
    maximumGrossMargin: margins.length > 0
      ? roundPricingValue(Math.max(...margins), ratePrecision)
      : null,
    limitingProductId: minimumProduct?.product.id ?? null,
    limitingProductLabel: minimumProduct
      ? productLabel(minimumProduct.product)
      : null,
    products,
  }
}

function buildScenarioSummaries(
  input: PriceCostFxStressInput,
  cells: readonly PriceCostFxStressCell[],
): PriceCostFxStressScenarioSummary[] {
  return input.scenarios.map((scenario) => {
    const matching = cells.filter((cell) => cell.scenarioId === scenario.id)
    const validMargins = matching.map((cell) => cell.grossMargin)
    const validGp = matching.map((cell) => cell.totalGrossProfit)
    const criticalCell = matching.reduce<PriceCostFxStressCell | null>(
      (current, cell) => {
        if (cell.minimumRequiredFactor === null) {
          return current
        }
        if (current?.minimumRequiredFactor === null || current === null) {
          return cell
        }
        return cell.minimumRequiredFactor > current.minimumRequiredFactor
          ? cell
          : current
      },
      null,
    )

    return {
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      costChangeRate: scenario.costChangeRate,
      exchangeRate: scenario.exchangeRate,
      cellCount: matching.length,
      fullyFeasibleCellCount: matching.filter((cell) => cell.feasibility === 'fully_feasible').length,
      partiallyFeasibleCellCount: matching.filter((cell) => cell.feasibility === 'partially_feasible').length,
      notFeasibleCellCount: matching.filter((cell) => cell.feasibility === 'not_feasible').length,
      invalidCellCount: matching.filter((cell) => cell.feasibility === 'invalid').length,
      minimumGrossMargin: validMargins.length > 0 ? Math.min(...validMargins) : null,
      minimumTotalGrossProfit: validGp.length > 0 ? Math.min(...validGp) : null,
      maximumRequiredFactor: criticalCell?.minimumRequiredFactor ?? null,
      criticalTierId: criticalCell?.tierId ?? null,
      criticalTierLabel: criticalCell?.tierLabel ?? null,
      criticalProductId: criticalCell?.limitingProductId ?? null,
      criticalProductLabel: criticalCell?.limitingProductLabel ?? null,
    }
  })
}

function buildFactorSummaries(
  input: PriceCostFxStressInput,
  cells: readonly PriceCostFxStressCell[],
): PriceCostFxStressFactorSummary[] {
  return input.commonListFactors.map((factor) => {
    const matching = cells.filter((cell) => cell.commonListFactor === factor)
    const margins = matching.map((cell) => cell.grossMargin)
    const grossProfits = matching.map((cell) => cell.totalGrossProfit)

    return {
      commonListFactor: factor,
      cellCount: matching.length,
      fullyFeasibleCellCount: matching.filter((cell) => cell.feasibility === 'fully_feasible').length,
      partiallyFeasibleCellCount: matching.filter((cell) => cell.feasibility === 'partially_feasible').length,
      notFeasibleCellCount: matching.filter((cell) => cell.feasibility === 'not_feasible').length,
      invalidCellCount: matching.filter((cell) => cell.feasibility === 'invalid').length,
      minimumVolumeCoverageRate: matching.length > 0
        ? Math.min(...matching.map((cell) => cell.volumeCoverageRate))
        : 0,
      minimumGrossMargin: margins.length > 0 ? Math.min(...margins) : null,
      minimumTotalGrossProfit: grossProfits.length > 0 ? Math.min(...grossProfits) : null,
      fullyFeasibleAcrossAllScenariosAndTiers: matching.length > 0 &&
        matching.every((cell) => cell.feasibility === 'fully_feasible'),
    }
  })
}

export function evaluatePriceCostFxStress(
  input: PriceCostFxStressInput,
  optionsInput?: PriceCostFxStressOptions,
): PriceCostFxStressResult {
  const moneyPrecision = optionsInput?.moneyPrecision ?? DEFAULT_MONEY_PRECISION
  const ratePrecision = optionsInput?.ratePrecision ?? DEFAULT_RATE_PRECISION
  const quantityPrecision = optionsInput?.quantityPrecision ?? DEFAULT_QUANTITY_PRECISION
  const normalized = normalizeInput(input, ratePrecision, quantityPrecision)
  const issues = validateInput(normalized)

  if (issues.some((item) => item.severity === 'invalid')) {
    return invalidResult(normalized, issues)
  }

  const cells: PriceCostFxStressCell[] = []
  let order = 0

  normalized.scenarios.forEach((scenario, scenarioOrder) => {
    normalized.commonListFactors.forEach((factor, factorOrder) => {
      normalized.tiers.forEach((tier, tierOrder) => {
        order += 1
        cells.push(buildCell(
          normalized,
          scenario,
          scenarioOrder,
          factor,
          factorOrder,
          tier,
          tierOrder,
          order,
          moneyPrecision,
          ratePrecision,
        ))
      })
    })
  })

  if (cells.length === 0 || cells.every((cell) => cell.feasibility === 'invalid')) {
    return invalidResult(normalized, [
      ...issues,
      {
        code: 'PRICE_COST_FX_STRESS_NO_CALCULABLE_ROWS',
        severity: 'invalid',
        message: 'No se produjo ninguna combinación calculable.',
        scenarioId: null,
        tierId: null,
        productId: null,
        commonListFactor: null,
      },
    ])
  }

  const belowObjectiveProductCount = cells.reduce(
    (total, cell) => total + cell.belowObjectiveProductCount,
    0,
  )

  if (belowObjectiveProductCount > 0) {
    issues.push({
      code: 'PRICE_COST_FX_STRESS_BELOW_OBJECTIVE',
      severity: 'warning',
      message: `${belowObjectiveProductCount.toLocaleString('es-MX')} resultados producto quedaron debajo del objetivo explícito.`,
      scenarioId: null,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  const scenarioSummaries = buildScenarioSummaries(normalized, cells)
  const factorSummaries = buildFactorSummaries(normalized, cells)
  const criticalScenario = scenarioSummaries.reduce<PriceCostFxStressScenarioSummary | null>(
    (current, scenario) => {
      if (scenario.maximumRequiredFactor === null) {
        return current
      }
      if (current?.maximumRequiredFactor === null || current === null) {
        return scenario
      }
      return scenario.maximumRequiredFactor > current.maximumRequiredFactor
        ? scenario
        : current
    },
    null,
  )
  const requiredFactors = cells
    .map((cell) => cell.minimumRequiredFactor)
    .filter((factor): factor is number => factor !== null)

  return {
    available: true,
    methodology: PRICE_COST_FX_STRESS_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      mutatesSourceCost: false,
      persistsStressTest: false,
      fetchesLiveExchangeRate: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: issues.some((item) => item.severity === 'warning')
      ? 'warning'
      : 'valid',
    input: cloneInput(normalized),
    cells,
    scenarioSummaries,
    factorSummaries,
    summary: {
      productCount: normalized.products.filter((product) => product.quantity > 0).length,
      scenarioCount: normalized.scenarios.length,
      tierCount: normalized.tiers.length,
      factorCount: normalized.commonListFactors.length,
      cellCount: cells.length,
      fullyFeasibleCellCount: cells.filter((cell) => cell.feasibility === 'fully_feasible').length,
      partiallyFeasibleCellCount: cells.filter((cell) => cell.feasibility === 'partially_feasible').length,
      notFeasibleCellCount: cells.filter((cell) => cell.feasibility === 'not_feasible').length,
      invalidCellCount: cells.filter((cell) => cell.feasibility === 'invalid').length,
      belowObjectiveProductCount,
      fullyFeasibleFactorCount: factorSummaries.filter(
        (summary) => summary.fullyFeasibleAcrossAllScenariosAndTiers,
      ).length,
      globalMaximumRequiredFactor: requiredFactors.length > 0
        ? Math.max(...requiredFactors)
        : null,
    },
    criticalScenarioId: criticalScenario?.scenarioId ?? null,
    criticalScenarioLabel: criticalScenario?.scenarioLabel ?? null,
    issues,
    explainability: [
      'El precio de lista candidato se fijó con costo base × tipo de cambio de referencia × factor; no se recalculó con cada escenario de estrés.',
      'El costo estresado se calculó como costo base × (1 + variación de costo) × tipo de cambio explícito del escenario.',
      'Los tipos de cambio expresan unidades de la moneda de reporte por una unidad de la moneda del costo; no se consultó ninguna tasa en vivo.',
      'La factibilidad se evaluó contra el objetivo explícito de cada nivel comercial y las cantidades capturadas.',
      'El escenario crítico es el que produce el mayor factor mínimo matemático entre los escenarios evaluados.',
      'La prueba no recomienda, aprueba, persiste ni publica costos, factores o precios.',
    ],
  }
}
