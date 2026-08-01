import {
  calculatePriceGrossMargin,
  roundPricingValue,
} from './pricingMath'

import {
  evaluatePriceDesign,
} from './priceDesignEngine'

import {
  PRICE_TIER_LADDER_METHODOLOGY,
} from './priceTierLadderContracts'

import type {
  PriceBatchProductInput,
} from './priceBatchDesignContracts'

import type {
  PriceDesignMetrics,
  PriceDesignObjective,
} from './priceDesignContracts'

import type {
  PriceTierLadderBand,
  PriceTierLadderCell,
  PriceTierLadderFactorSummary,
  PriceTierLadderFeasibility,
  PriceTierLadderInput,
  PriceTierLadderIssue,
  PriceTierLadderOptions,
  PriceTierLadderProductResult,
  PriceTierLadderResult,
  PriceTierLadderTierInput,
  PriceTierLadderTierMinimum,
  PriceTierLadderTierSummary,
  PriceTierObjective,
} from './priceTierLadderContracts'

const DEFAULT_MONEY_PRECISION = 2
const DEFAULT_RATE_PRECISION = 6
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
  product: PriceBatchProductInput,
): PriceBatchProductInput {
  return {
    ...product,
  }
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

function cloneInput(
  input: PriceTierLadderInput,
): PriceTierLadderInput {
  return {
    ...input,
    products: input.products.map(cloneProduct),
    tiers: input.tiers.map(cloneTier),
    commonListFactors: [...input.commonListFactors],
  }
}

function issue(
  input: PriceTierLadderIssue,
): PriceTierLadderIssue {
  return {
    ...input,
  }
}

function emptySummary() {
  return {
    productCount: 0,
    tierCount: 0,
    factorCount: 0,
    cellCount: 0,
    fullyFeasibleCellCount: 0,
    partiallyFeasibleCellCount: 0,
    notFeasibleCellCount: 0,
    invalidCellCount: 0,
    belowObjectiveCount: 0,
    globalMinimumFactor: null,
    fullyFeasibleFactorCount: 0,
  }
}

function invalidResult(
  input: PriceTierLadderInput,
  issues: readonly PriceTierLadderIssue[],
): PriceTierLadderResult {
  return {
    available: false,
    methodology: PRICE_TIER_LADDER_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsLadder: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: 'invalid',
    input: cloneInput(input),
    tierMinimums: [],
    globalMinimumFactor: null,
    limitingTierId: null,
    limitingTierLabel: null,
    limitingProductId: null,
    limitingProductLabel: null,
    cells: [],
    factorSummaries: [],
    tierSummaries: [],
    summary: emptySummary(),
    issues: issues.map(issue),
    explainability: [
      'La escalera comercial no pudo calcularse porque faltan datos explícitos o existen valores inválidos.',
      'No se creó, modificó ni publicó ningún producto, marca, costo, factor o precio comercial.',
    ],
  }
}

function productLabel(
  product: PriceBatchProductInput,
): string {
  return product.model ?? product.sku ?? product.id
}

function isValidObjective(
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

function toPriceDesignObjective(
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

function feasibilityBand(
  factor: number,
  minimumRequiredFactor: number | null,
): PriceTierLadderBand {
  if (minimumRequiredFactor === null) {
    return 'unavailable'
  }

  const delta = factor - minimumRequiredFactor

  if (Math.abs(delta) <= COMPARISON_TOLERANCE) {
    return 'minimum_threshold'
  }

  return delta > 0
    ? 'above_minimum'
    : 'below_minimum'
}

function validateInput(
  input: PriceTierLadderInput,
): PriceTierLadderIssue[] {
  const issues: PriceTierLadderIssue[] = []
  const normalizedId = normalizeIdentifier(input.id)
  const normalizedSourceBatchId = normalizeIdentifier(input.sourceBatchId)
  const currency = normalizeIdentifier(input.currency)

  if (!normalizedId) {
    issues.push({
      code: 'PRICE_TIER_LADDER_INVALID_IDENTIFIER',
      severity: 'invalid',
      message: 'La arquitectura comercial requiere un identificador explícito.',
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  if (!normalizedSourceBatchId) {
    issues.push({
      code: 'PRICE_TIER_LADDER_INVALID_SOURCE_BATCH',
      severity: 'invalid',
      message: 'La arquitectura comercial requiere una matriz por lote de origen.',
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  if (!currency) {
    issues.push({
      code: 'PRICE_TIER_LADDER_INVALID_CURRENCY',
      severity: 'invalid',
      message: 'La arquitectura comercial requiere una moneda explícita.',
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  if (input.products.length === 0) {
    issues.push({
      code: 'PRICE_TIER_LADDER_EMPTY_PRODUCTS',
      severity: 'invalid',
      message: 'La arquitectura comercial requiere al menos un producto.',
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  const productIds = new Set<string>()

  input.products.forEach((product) => {
    const productId = normalizeIdentifier(product.id)

    if (!productId || !Number.isFinite(product.cost) || product.cost <= 0) {
      issues.push({
        code: 'PRICE_TIER_LADDER_INVALID_PRODUCT',
        severity: 'invalid',
        message: `El producto ${product.id || 'sin ID'} requiere identificador y costo mayor a cero.`,
        tierId: null,
        productId: product.id || null,
        commonListFactor: null,
      })
      return
    }

    if (productIds.has(productId)) {
      issues.push({
        code: 'PRICE_TIER_LADDER_DUPLICATE_PRODUCT_ID',
        severity: 'invalid',
        message: `El producto ${productId} está duplicado.`,
        tierId: null,
        productId,
        commonListFactor: null,
      })
    }

    productIds.add(productId)
  })

  if (input.tiers.length === 0) {
    issues.push({
      code: 'PRICE_TIER_LADDER_EMPTY_TIERS',
      severity: 'invalid',
      message: 'Captura al menos un nivel comercial con descuento y objetivo explícitos.',
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  const tierIds = new Set<string>()
  const tierDiscounts = new Set<number>()

  input.tiers.forEach((tier) => {
    const tierId = normalizeIdentifier(tier.id)
    const tierLabel = normalizeText(tier.label)

    if (
      !tierId ||
      !tierLabel ||
      !Number.isFinite(tier.discountRate) ||
      tier.discountRate < 0 ||
      tier.discountRate >= 1 ||
      !isValidObjective(tier.objective)
    ) {
      issues.push({
        code: 'PRICE_TIER_LADDER_INVALID_TIER',
        severity: 'invalid',
        message: `El nivel ${tier.label || tier.id || 'sin nombre'} contiene descuento u objetivo inválidos.`,
        tierId: tier.id || null,
        productId: null,
        commonListFactor: null,
      })
      return
    }

    if (tierIds.has(tierId)) {
      issues.push({
        code: 'PRICE_TIER_LADDER_DUPLICATE_TIER_ID',
        severity: 'invalid',
        message: `El nivel ${tierId} está duplicado.`,
        tierId,
        productId: null,
        commonListFactor: null,
      })
    }

    if (tierDiscounts.has(tier.discountRate)) {
      issues.push({
        code: 'PRICE_TIER_LADDER_DUPLICATE_TIER_DISCOUNT',
        severity: 'invalid',
        message: `El descuento ${(tier.discountRate * 100).toLocaleString('es-MX')}% está repetido en la escalera.`,
        tierId,
        productId: null,
        commonListFactor: null,
      })
    }

    tierIds.add(tierId)
    tierDiscounts.add(tier.discountRate)
  })

  const factors = new Set<number>()

  input.commonListFactors.forEach((factor) => {
    if (!Number.isFinite(factor) || factor <= 0) {
      issues.push({
        code: 'PRICE_TIER_LADDER_INVALID_FACTOR',
        severity: 'invalid',
        message: `El factor ${factor} debe ser mayor a cero.`,
        tierId: null,
        productId: null,
        commonListFactor: factor,
      })
      return
    }

    if (factors.has(factor)) {
      issues.push({
        code: 'PRICE_TIER_LADDER_DUPLICATE_FACTOR',
        severity: 'invalid',
        message: `El factor ${factor.toLocaleString('es-MX')}x está duplicado.`,
        tierId: null,
        productId: null,
        commonListFactor: factor,
      })
    }

    factors.add(factor)
  })

  if (input.commonListFactors.length === 0) {
    issues.push({
      code: 'PRICE_TIER_LADDER_NO_CANDIDATE_FACTORS',
      severity: 'info',
      message: 'No se capturaron factores candidatos; se calcularán únicamente los mínimos matemáticos por nivel.',
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  return issues
}

function normalizeInput(
  input: PriceTierLadderInput,
  ratePrecision: number,
): PriceTierLadderInput {
  return {
    id: normalizeIdentifier(input.id),
    sourceBatchId: normalizeIdentifier(input.sourceBatchId),
    brandName: normalizeText(input.brandName),
    currency: normalizeIdentifier(input.currency),
    products: input.products.map((product) => ({
      ...product,
      id: normalizeIdentifier(product.id),
      model: normalizeText(product.model),
      sku: normalizeText(product.sku),
      cost: product.cost,
      notes: normalizeText(product.notes),
    })),
    tiers: input.tiers.map((tier) => ({
      ...tier,
      id: normalizeIdentifier(tier.id),
      label: normalizeText(tier.label) ?? normalizeIdentifier(tier.id),
      discountRate: roundPricingValue(tier.discountRate, ratePrecision),
      objective: cloneObjective(tier.objective),
      notes: normalizeText(tier.notes),
    })),
    commonListFactors: input.commonListFactors.map((factor) =>
      roundPricingValue(factor, ratePrecision),
    ),
    notes: normalizeText(input.notes),
  }
}

function buildTierMinimums(
  input: PriceTierLadderInput,
  moneyPrecision: number,
  ratePrecision: number,
): PriceTierLadderTierMinimum[] {
  return input.tiers.map((tier, tierIndex) => {
    const calculations = input.products.map((product) => {
      const design = evaluatePriceDesign({
        id: `${input.id}::MINIMUM::${tier.id}::${product.id}`,
        identity: {
          brandName: input.brandName,
          model: product.model,
          sku: product.sku,
        },
        currency: input.currency,
        cost: product.cost,
        discountRate: tier.discountRate,
        objective: toPriceDesignObjective(tier.objective),
        notes: tier.notes ?? product.notes ?? input.notes,
      }, {
        moneyPrecision,
        ratePrecision,
      })

      return {
        product,
        factor: design.metrics?.listPriceFactor ?? null,
      }
    })
    const calculable = calculations.filter(
      (item): item is {
        product: PriceBatchProductInput
        factor: number
      } => item.factor !== null,
    )
    const limiting = calculable.reduce<{
      product: PriceBatchProductInput
      factor: number
    } | null>((current, item) => {
      if (!current || item.factor > current.factor) {
        return item
      }

      return current
    }, null)

    return {
      tierId: tier.id,
      tierLabel: tier.label,
      tierOrder: tierIndex + 1,
      discountRate: tier.discountRate,
      objective: cloneObjective(tier.objective),
      minimumRequiredFactor: limiting
        ? roundPricingValue(limiting.factor, ratePrecision)
        : null,
      limitingProductId: limiting?.product.id ?? null,
      limitingProductLabel: limiting
        ? productLabel(limiting.product)
        : null,
      calculableProductCount: calculable.length,
    }
  })
}

function buildProductResult(
  input: PriceTierLadderInput,
  tier: PriceTierLadderTierInput,
  product: PriceBatchProductInput,
  commonListFactor: number,
  factorIndex: number,
  tierIndex: number,
  productIndex: number,
  moneyPrecision: number,
  ratePrecision: number,
): PriceTierLadderProductResult {
  const requiredDesign = evaluatePriceDesign({
    id: `${input.id}::REQUIRED::${tier.id}::${product.id}`,
    identity: {
      brandName: input.brandName,
      model: product.model,
      sku: product.sku,
    },
    currency: input.currency,
    cost: product.cost,
    discountRate: tier.discountRate,
    objective: toPriceDesignObjective(tier.objective),
    notes: tier.notes ?? product.notes ?? input.notes,
  }, {
    moneyPrecision,
    ratePrecision,
  })
  const requiredListFactor = requiredDesign.metrics?.listPriceFactor ?? null
  const design = evaluatePriceDesign({
    id: `${input.id}::FACTOR-${factorIndex + 1}::${tier.id}::${product.id}`,
    identity: {
      brandName: input.brandName,
      model: product.model,
      sku: product.sku,
    },
    currency: input.currency,
    cost: product.cost,
    discountRate: tier.discountRate,
    objective: {
      type: 'list_price_factor',
      factor: commonListFactor,
    },
    notes: tier.notes ?? product.notes ?? input.notes,
  }, {
    moneyPrecision,
    ratePrecision,
  })
  const metrics = design.metrics

  return {
    key: `${factorIndex + 1}::${tierIndex + 1}::${productIndex + 1}`,
    product: cloneProduct(product),
    tier: cloneTier(tier),
    commonListFactor,
    requiredListFactor,
    factorGap: requiredListFactor === null
      ? null
      : roundPricingValue(
        commonListFactor - requiredListFactor,
        ratePrecision,
      ),
    design,
    metrics,
    meetsObjective: metrics
      ? objectiveIsMet(metrics, tier.objective)
      : null,
  }
}

function buildCell(
  input: PriceTierLadderInput,
  tier: PriceTierLadderTierInput,
  minimum: PriceTierLadderTierMinimum,
  commonListFactor: number,
  order: number,
  factorIndex: number,
  tierIndex: number,
  moneyPrecision: number,
  ratePrecision: number,
): PriceTierLadderCell {
  const products = input.products.map((product, productIndex) =>
    buildProductResult(
      input,
      tier,
      product,
      commonListFactor,
      factorIndex,
      tierIndex,
      productIndex,
      moneyPrecision,
      ratePrecision,
    ),
  )
  const calculable = products.filter(
    (item): item is PriceTierLadderProductResult & {
      metrics: PriceDesignMetrics
    } => item.metrics !== null,
  )
  const meetsObjectiveCount = calculable.filter(
    (item) => item.meetsObjective === true,
  ).length
  const belowObjectiveCount = calculable.filter(
    (item) => item.meetsObjective === false,
  ).length
  const totalCost = calculable.reduce(
    (total, item) => total + item.metrics.cost,
    0,
  )
  const totalListPrice = calculable.reduce(
    (total, item) => total + item.metrics.listPrice,
    0,
  )
  const totalSellingPrice = calculable.reduce(
    (total, item) => total + item.metrics.sellingPrice,
    0,
  )
  const totalGrossProfit = calculable.reduce(
    (total, item) => total + item.metrics.grossProfit,
    0,
  )
  const margins = calculable.map((item) => item.metrics.grossMargin)
  const coverageRate = products.length === 0
    ? 0
    : meetsObjectiveCount / products.length
  const feasibility: PriceTierLadderFeasibility =
    calculable.length !== products.length
      ? 'invalid'
      : meetsObjectiveCount === products.length
        ? 'fully_feasible'
        : meetsObjectiveCount === 0
          ? 'not_feasible'
          : 'partially_feasible'

  return {
    key: `${commonListFactor}::${tier.id}`,
    order,
    commonListFactor,
    tierId: tier.id,
    tierLabel: tier.label,
    tierOrder: tierIndex + 1,
    discountRate: tier.discountRate,
    objective: cloneObjective(tier.objective),
    minimumRequiredFactor: minimum.minimumRequiredFactor,
    factorGapToMinimum: minimum.minimumRequiredFactor === null
      ? null
      : roundPricingValue(
        commonListFactor - minimum.minimumRequiredFactor,
        ratePrecision,
      ),
    band: feasibilityBand(
      commonListFactor,
      minimum.minimumRequiredFactor,
    ),
    feasibility,
    productCount: products.length,
    calculableCount: calculable.length,
    meetsObjectiveCount,
    belowObjectiveCount,
    coverageRate: roundPricingValue(coverageRate, ratePrecision),
    totalCost: roundPricingValue(totalCost, moneyPrecision),
    totalListPrice: roundPricingValue(totalListPrice, moneyPrecision),
    totalSellingPrice: roundPricingValue(totalSellingPrice, moneyPrecision),
    totalGrossProfit: roundPricingValue(totalGrossProfit, moneyPrecision),
    grossMargin: roundPricingValue(
      calculatePriceGrossMargin(totalSellingPrice, totalGrossProfit),
      ratePrecision,
    ),
    minimumGrossMargin: margins.length > 0
      ? roundPricingValue(Math.min(...margins), ratePrecision)
      : null,
    maximumGrossMargin: margins.length > 0
      ? roundPricingValue(Math.max(...margins), ratePrecision)
      : null,
    products,
  }
}

function buildFactorSummaries(
  cells: readonly PriceTierLadderCell[],
  factors: readonly number[],
  tierCount: number,
  ratePrecision: number,
): PriceTierLadderFactorSummary[] {
  return factors.map((factor) => {
    const matching = cells.filter(
      (cell) => cell.commonListFactor === factor,
    )
    const coverages = matching.map((cell) => cell.coverageRate)

    return {
      commonListFactor: factor,
      tierCount,
      fullyFeasibleTierCount: matching.filter(
        (cell) => cell.feasibility === 'fully_feasible',
      ).length,
      partiallyFeasibleTierCount: matching.filter(
        (cell) => cell.feasibility === 'partially_feasible',
      ).length,
      notFeasibleTierCount: matching.filter(
        (cell) => cell.feasibility === 'not_feasible',
      ).length,
      invalidTierCount: matching.filter(
        (cell) => cell.feasibility === 'invalid',
      ).length,
      belowObjectiveCount: matching.reduce(
        (total, cell) => total + cell.belowObjectiveCount,
        0,
      ),
      minimumCoverageRate: coverages.length > 0
        ? roundPricingValue(Math.min(...coverages), ratePrecision)
        : 0,
      averageCoverageRate: coverages.length > 0
        ? roundPricingValue(
          coverages.reduce((total, value) => total + value, 0) /
            coverages.length,
          ratePrecision,
        )
        : 0,
      fullyFeasibleAcrossAllTiers: matching.length === tierCount &&
        matching.every((cell) => cell.feasibility === 'fully_feasible'),
    }
  })
}

function buildTierSummaries(
  cells: readonly PriceTierLadderCell[],
  tiers: readonly PriceTierLadderTierInput[],
  factorCount: number,
): PriceTierLadderTierSummary[] {
  return tiers.map((tier) => {
    const matching = cells.filter((cell) => cell.tierId === tier.id)
    const coverages = matching.map((cell) => cell.coverageRate)

    return {
      tierId: tier.id,
      tierLabel: tier.label,
      discountRate: tier.discountRate,
      objective: cloneObjective(tier.objective),
      factorCount,
      fullyFeasibleFactorCount: matching.filter(
        (cell) => cell.feasibility === 'fully_feasible',
      ).length,
      partiallyFeasibleFactorCount: matching.filter(
        (cell) => cell.feasibility === 'partially_feasible',
      ).length,
      notFeasibleFactorCount: matching.filter(
        (cell) => cell.feasibility === 'not_feasible',
      ).length,
      minimumCoverageRate: coverages.length > 0
        ? Math.min(...coverages)
        : 0,
      maximumCoverageRate: coverages.length > 0
        ? Math.max(...coverages)
        : 0,
    }
  })
}

export function evaluatePriceTierLadder(
  rawInput: PriceTierLadderInput,
  options: PriceTierLadderOptions = {},
): PriceTierLadderResult {
  const moneyPrecision = options.moneyPrecision ?? DEFAULT_MONEY_PRECISION
  const ratePrecision = options.ratePrecision ?? DEFAULT_RATE_PRECISION
  const validationIssues = validateInput(rawInput)
  const invalidIssues = validationIssues.filter(
    (item) => item.severity === 'invalid',
  )

  if (invalidIssues.length > 0) {
    return invalidResult(rawInput, validationIssues)
  }

  const input = normalizeInput(rawInput, ratePrecision)
  const tierMinimums = buildTierMinimums(
    input,
    moneyPrecision,
    ratePrecision,
  )
  const calculableMinimums = tierMinimums.filter(
    (minimum): minimum is PriceTierLadderTierMinimum & {
      minimumRequiredFactor: number
    } => minimum.minimumRequiredFactor !== null,
  )
  const issues = validationIssues.map(issue)

  if (calculableMinimums.length !== input.tiers.length) {
    issues.push({
      code: 'PRICE_TIER_LADDER_NO_CALCULABLE_MINIMUM',
      severity: 'invalid',
      message: 'No fue posible calcular el factor mínimo para todos los niveles comerciales.',
      tierId: null,
      productId: null,
      commonListFactor: null,
    })

    return invalidResult(input, issues)
  }

  const limitingMinimum = calculableMinimums.reduce(
    (current, item) => item.minimumRequiredFactor > current.minimumRequiredFactor
      ? item
      : current,
  )
  const globalMinimumFactor = roundPricingValue(
    limitingMinimum.minimumRequiredFactor,
    ratePrecision,
  )
  const cells: PriceTierLadderCell[] = []
  let order = 1

  input.commonListFactors.forEach((factor, factorIndex) => {
    input.tiers.forEach((tier, tierIndex) => {
      const minimum = tierMinimums[tierIndex]

      if (!minimum) {
        return
      }

      cells.push(buildCell(
        input,
        tier,
        minimum,
        factor,
        order,
        factorIndex,
        tierIndex,
        moneyPrecision,
        ratePrecision,
      ))
      order += 1
    })
  })

  const belowObjectiveCount = cells.reduce(
    (total, cell) => total + cell.belowObjectiveCount,
    0,
  )

  if (belowObjectiveCount > 0) {
    issues.push({
      code: 'PRICE_TIER_LADDER_BELOW_OBJECTIVE',
      severity: 'warning',
      message: `${belowObjectiveCount.toLocaleString('es-MX')} combinaciones producto × nivel quedaron debajo del objetivo explícito.`,
      tierId: null,
      productId: null,
      commonListFactor: null,
    })
  }

  const factorSummaries = buildFactorSummaries(
    cells,
    input.commonListFactors,
    input.tiers.length,
    ratePrecision,
  )
  const tierSummaries = buildTierSummaries(
    cells,
    input.tiers,
    input.commonListFactors.length,
  )
  const limitingTier = input.tiers.find(
    (tier) => tier.id === limitingMinimum.tierId,
  ) ?? null
  const status = issues.some((item) => item.severity === 'warning')
    ? 'warning'
    : 'valid'

  return {
    available: true,
    methodology: PRICE_TIER_LADDER_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsLadder: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status,
    input: cloneInput(input),
    tierMinimums,
    globalMinimumFactor,
    limitingTierId: limitingMinimum.tierId,
    limitingTierLabel: limitingMinimum.tierLabel,
    limitingProductId: limitingMinimum.limitingProductId,
    limitingProductLabel: limitingMinimum.limitingProductLabel,
    cells,
    factorSummaries,
    tierSummaries,
    summary: {
      productCount: input.products.length,
      tierCount: input.tiers.length,
      factorCount: input.commonListFactors.length,
      cellCount: cells.length,
      fullyFeasibleCellCount: cells.filter(
        (cell) => cell.feasibility === 'fully_feasible',
      ).length,
      partiallyFeasibleCellCount: cells.filter(
        (cell) => cell.feasibility === 'partially_feasible',
      ).length,
      notFeasibleCellCount: cells.filter(
        (cell) => cell.feasibility === 'not_feasible',
      ).length,
      invalidCellCount: cells.filter(
        (cell) => cell.feasibility === 'invalid',
      ).length,
      belowObjectiveCount,
      globalMinimumFactor,
      fullyFeasibleFactorCount: factorSummaries.filter(
        (summary) => summary.fullyFeasibleAcrossAllTiers,
      ).length,
    },
    issues,
    explainability: [
      'Cada nivel comercial usa un descuento y un objetivo mínimo capturados explícitamente.',
      'El factor mínimo de cada nivel corresponde al mayor factor requerido entre sus productos.',
      'El factor mínimo global corresponde al mayor mínimo entre todos los niveles de la escalera.',
      `El nivel limitante es ${limitingTier?.label ?? limitingMinimum.tierLabel} y el producto limitante es ${limitingMinimum.limitingProductLabel ?? 'no identificado'}.`,
      'Los factores candidatos se evalúan sin reordenarlos, aprobarlos o recomendar uno automáticamente.',
      'Los agregados consideran una unidad de cada producto y no representan mezcla, volumen, presupuesto o Forecast.',
      'La ejecución es temporal y no crea, modifica, persiste o publica precios.',
    ],
  }
}
