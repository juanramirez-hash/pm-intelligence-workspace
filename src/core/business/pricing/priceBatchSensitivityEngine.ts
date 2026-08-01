import {
  calculatePriceGrossMargin,
  roundPricingValue,
} from './pricingMath'

import {
  evaluatePriceDesign,
} from './priceDesignEngine'

import {
  PRICE_BATCH_SENSITIVITY_METHODOLOGY,
} from './priceBatchSensitivityContracts'

import type {
  PriceBatchProductInput,
} from './priceBatchDesignContracts'

import type {
  PriceBatchSensitivityBand,
  PriceBatchSensitivityCell,
  PriceBatchSensitivityDiscountMinimum,
  PriceBatchSensitivityFactorSummary,
  PriceBatchSensitivityInput,
  PriceBatchSensitivityIssue,
  PriceBatchSensitivityOptions,
  PriceBatchSensitivityProductResult,
  PriceBatchSensitivityResult,
} from './priceBatchSensitivityContracts'

import type {
  PriceDesignMetrics,
  PriceDesignObjective,
} from './priceDesignContracts'

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

function cloneObjective(
  objective: PriceDesignObjective,
): PriceDesignObjective {
  return {
    ...objective,
  }
}

function cloneProduct(
  product: PriceBatchProductInput,
): PriceBatchProductInput {
  return {
    ...product,
  }
}

function cloneInput(
  input: PriceBatchSensitivityInput,
): PriceBatchSensitivityInput {
  return {
    ...input,
    products: input.products.map(cloneProduct),
    discountRates: [...input.discountRates],
    objective: cloneObjective(input.objective),
    commonListFactors: [...input.commonListFactors],
  }
}

function issue(
  input: PriceBatchSensitivityIssue,
): PriceBatchSensitivityIssue {
  return {
    ...input,
  }
}

function emptySummary() {
  return {
    productCount: 0,
    discountCount: 0,
    factorCount: 0,
    cellCount: 0,
    fullyFeasibleCellCount: 0,
    partiallyFeasibleCellCount: 0,
    notFeasibleCellCount: 0,
    invalidCellCount: 0,
    belowObjectiveCount: 0,
    globalMinimumFactor: null,
    fullyFeasibleFactorCount: 0,
    maximumCoverageRate: 0,
    minimumCoverageRate: 0,
  }
}

function invalidResult(
  input: PriceBatchSensitivityInput,
  issues: readonly PriceBatchSensitivityIssue[],
): PriceBatchSensitivityResult {
  return {
    available: false,
    methodology: PRICE_BATCH_SENSITIVITY_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsSensitivity: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: 'invalid',
    input: cloneInput(input),
    discountMinimums: [],
    globalMinimumFactor: null,
    cells: [],
    factorSummaries: [],
    summary: emptySummary(),
    issues: issues.map(issue),
    explainability: [
      'La sensibilidad no pudo calcularse porque faltan datos explícitos o existen valores inválidos.',
      'No se creó, modificó ni publicó ningún producto, marca, costo, factor o precio comercial.',
    ],
  }
}

function isValidObjective(
  objective: PriceDesignObjective,
): boolean {
  switch (objective.type) {
    case 'target_gross_margin':
      return Number.isFinite(objective.grossMargin) &&
        objective.grossMargin >= 0 &&
        objective.grossMargin < 1
    case 'target_gross_profit':
      return Number.isFinite(objective.grossProfit) &&
        objective.grossProfit >= 0
    case 'target_selling_price':
      return Number.isFinite(objective.sellingPrice) &&
        objective.sellingPrice > 0
    case 'list_price_factor':
    case 'selling_price_factor':
      return Number.isFinite(objective.factor) &&
        objective.factor > 0
    case 'list_price':
      return Number.isFinite(objective.listPrice) &&
        objective.listPrice > 0
  }
}

function objectiveIsMet(
  metrics: PriceDesignMetrics,
  objective: PriceDesignObjective,
): boolean {
  switch (objective.type) {
    case 'target_gross_margin':
      return metrics.grossMargin + COMPARISON_TOLERANCE >= objective.grossMargin
    case 'target_gross_profit':
      return metrics.grossProfit + COMPARISON_TOLERANCE >= objective.grossProfit
    case 'target_selling_price':
      return metrics.sellingPrice + COMPARISON_TOLERANCE >= objective.sellingPrice
    case 'list_price_factor':
      return metrics.listPriceFactor + COMPARISON_TOLERANCE >= objective.factor
    case 'selling_price_factor':
      return metrics.sellingPriceFactor + COMPARISON_TOLERANCE >= objective.factor
    case 'list_price':
      return metrics.listPrice + COMPARISON_TOLERANCE >= objective.listPrice
  }
}

function productLabel(
  product: PriceBatchProductInput,
): string {
  return product.model ?? product.sku ?? product.id
}

function feasibilityBand(
  factor: number,
  minimumRequiredFactor: number | null,
): PriceBatchSensitivityBand {
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

function buildDiscountMinimums(
  input: PriceBatchSensitivityInput,
  moneyPrecision: number,
  ratePrecision: number,
): PriceBatchSensitivityDiscountMinimum[] {
  return input.discountRates.map((discountRate, discountIndex) => {
    const designs = input.products.map((product) => {
      const design = evaluatePriceDesign({
        id: `${input.id}::MINIMUM::${product.id}::${discountIndex + 1}`,
        identity: {
          brandName: input.brandName,
          model: product.model,
          sku: product.sku,
        },
        currency: input.currency,
        cost: product.cost,
        discountRate,
        objective: cloneObjective(input.objective),
        notes: product.notes ?? input.notes,
      }, {
        moneyPrecision,
        ratePrecision,
      })

      return {
        product,
        requiredListFactor: design.metrics?.listPriceFactor ?? null,
      }
    })
    const calculable = designs.filter(
      (item): item is {
        product: PriceBatchProductInput
        requiredListFactor: number
      } => item.requiredListFactor !== null,
    )
    const limiting = calculable.reduce<{
      product: PriceBatchProductInput
      requiredListFactor: number
    } | null>((current, item) => {
      if (!current || item.requiredListFactor > current.requiredListFactor) {
        return item
      }

      return current
    }, null)

    return {
      discountRate,
      minimumRequiredFactor: limiting
        ? roundPricingValue(limiting.requiredListFactor, ratePrecision)
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
  input: PriceBatchSensitivityInput,
  product: PriceBatchProductInput,
  commonListFactor: number,
  discountRate: number,
  productIndex: number,
  factorIndex: number,
  discountIndex: number,
  moneyPrecision: number,
  ratePrecision: number,
): PriceBatchSensitivityProductResult {
  const requiredDesign = evaluatePriceDesign({
    id: `${input.id}::REQUIRED::${discountIndex + 1}::${product.id}`,
    identity: {
      brandName: input.brandName,
      model: product.model,
      sku: product.sku,
    },
    currency: input.currency,
    cost: product.cost,
    discountRate,
    objective: cloneObjective(input.objective),
    notes: product.notes ?? input.notes,
  }, {
    moneyPrecision,
    ratePrecision,
  })
  const requiredListFactor = requiredDesign.metrics?.listPriceFactor ?? null
  const design = evaluatePriceDesign({
    id: `${input.id}::FACTOR-${factorIndex + 1}::DISCOUNT-${discountIndex + 1}::${product.id}`,
    identity: {
      brandName: input.brandName,
      model: product.model,
      sku: product.sku,
    },
    currency: input.currency,
    cost: product.cost,
    discountRate,
    objective: {
      type: 'list_price_factor',
      factor: commonListFactor,
    },
    notes: product.notes ?? input.notes,
  }, {
    moneyPrecision,
    ratePrecision,
  })
  const metrics = design.metrics

  return {
    key: `${factorIndex + 1}::${discountIndex + 1}::${productIndex + 1}`,
    product: cloneProduct(product),
    commonListFactor,
    discountRate,
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
      ? objectiveIsMet(metrics, input.objective)
      : null,
  }
}

function buildCell(
  input: PriceBatchSensitivityInput,
  commonListFactor: number,
  discountRate: number,
  minimum: PriceBatchSensitivityDiscountMinimum,
  order: number,
  factorIndex: number,
  discountIndex: number,
  moneyPrecision: number,
  ratePrecision: number,
): PriceBatchSensitivityCell {
  const products = input.products.map((product, productIndex) =>
    buildProductResult(
      input,
      product,
      commonListFactor,
      discountRate,
      productIndex,
      factorIndex,
      discountIndex,
      moneyPrecision,
      ratePrecision,
    ),
  )
  const calculable = products.filter(
    (item): item is PriceBatchSensitivityProductResult & {
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
  const feasibility = calculable.length !== products.length
    ? 'invalid'
    : meetsObjectiveCount === products.length
      ? 'fully_feasible'
      : meetsObjectiveCount === 0
        ? 'not_feasible'
        : 'partially_feasible'

  return {
    key: `${commonListFactor}::${discountRate}`,
    order,
    commonListFactor,
    discountRate,
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
      calculatePriceGrossMargin(totalSellingPrice, totalCost),
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
  factors: readonly number[],
  cells: readonly PriceBatchSensitivityCell[],
  ratePrecision: number,
): PriceBatchSensitivityFactorSummary[] {
  return factors.map((commonListFactor) => {
    const matching = cells.filter(
      (cell) => cell.commonListFactor === commonListFactor,
    )
    const coverageRates = matching.map((cell) => cell.coverageRate)

    return {
      commonListFactor,
      discountCount: matching.length,
      fullyFeasibleDiscountCount: matching.filter(
        (cell) => cell.feasibility === 'fully_feasible',
      ).length,
      partiallyFeasibleDiscountCount: matching.filter(
        (cell) => cell.feasibility === 'partially_feasible',
      ).length,
      notFeasibleDiscountCount: matching.filter(
        (cell) => cell.feasibility === 'not_feasible',
      ).length,
      invalidDiscountCount: matching.filter(
        (cell) => cell.feasibility === 'invalid',
      ).length,
      belowObjectiveCount: matching.reduce(
        (total, cell) => total + cell.belowObjectiveCount,
        0,
      ),
      minimumCoverageRate: coverageRates.length > 0
        ? roundPricingValue(Math.min(...coverageRates), ratePrecision)
        : 0,
      averageCoverageRate: coverageRates.length > 0
        ? roundPricingValue(
          coverageRates.reduce((total, value) => total + value, 0) /
            coverageRates.length,
          ratePrecision,
        )
        : 0,
      fullyFeasibleAcrossAllDiscounts: matching.length > 0 && matching.every(
        (cell) => cell.feasibility === 'fully_feasible',
      ),
    }
  })
}

export function evaluatePriceBatchSensitivity(
  input: PriceBatchSensitivityInput,
  optionsInput?: PriceBatchSensitivityOptions,
): PriceBatchSensitivityResult {
  const moneyPrecision = optionsInput?.moneyPrecision ?? DEFAULT_MONEY_PRECISION
  const ratePrecision = optionsInput?.ratePrecision ?? DEFAULT_RATE_PRECISION
  const issues: PriceBatchSensitivityIssue[] = []
  const id = normalizeIdentifier(input.id)
  const sourceBatchId = normalizeIdentifier(input.sourceBatchId)
  const currency = normalizeIdentifier(input.currency)

  if (!id) {
    issues.push(issue({
      code: 'PRICE_SENSITIVITY_INVALID_IDENTIFIER',
      severity: 'invalid',
      message: 'La sensibilidad requiere un identificador temporal.',
      commonListFactor: null,
      discountRate: null,
      productId: null,
    }))
  }

  if (!sourceBatchId) {
    issues.push(issue({
      code: 'PRICE_SENSITIVITY_INVALID_SOURCE_BATCH',
      severity: 'invalid',
      message: 'La sensibilidad requiere la referencia de la matriz por lote de origen.',
      commonListFactor: null,
      discountRate: null,
      productId: null,
    }))
  }

  if (!currency) {
    issues.push(issue({
      code: 'PRICE_SENSITIVITY_INVALID_CURRENCY',
      severity: 'invalid',
      message: 'Captura la moneda común de la sensibilidad.',
      commonListFactor: null,
      discountRate: null,
      productId: null,
    }))
  }

  if (!isValidObjective(input.objective)) {
    issues.push(issue({
      code: 'PRICE_SENSITIVITY_INVALID_OBJECTIVE',
      severity: 'invalid',
      message: 'El objetivo de referencia requiere un valor explícito válido.',
      commonListFactor: null,
      discountRate: null,
      productId: null,
    }))
  }

  if (input.products.length === 0) {
    issues.push(issue({
      code: 'PRICE_SENSITIVITY_EMPTY_PRODUCTS',
      severity: 'invalid',
      message: 'La sensibilidad requiere al menos un producto con costo válido.',
      commonListFactor: null,
      discountRate: null,
      productId: null,
    }))
  }

  const normalizedProducts = input.products.map((product, index) => ({
    ...cloneProduct(product),
    id: normalizeIdentifier(product.id || `SENSITIVITY-PRODUCT-${index + 1}`),
    model: normalizeText(product.model),
    sku: normalizeText(product.sku),
    notes: normalizeText(product.notes),
  }))
  const productIds = new Set<string>()

  normalizedProducts.forEach((product) => {
    if (!product.id || !Number.isFinite(product.cost) || product.cost <= 0) {
      issues.push(issue({
        code: 'PRICE_SENSITIVITY_INVALID_PRODUCT',
        severity: 'invalid',
        message: `El producto ${productLabel(product) || 'sin identificar'} requiere costo mayor a cero.`,
        commonListFactor: null,
        discountRate: null,
        productId: product.id || null,
      }))
    }

    if (productIds.has(product.id)) {
      issues.push(issue({
        code: 'PRICE_SENSITIVITY_DUPLICATE_PRODUCT_ID',
        severity: 'invalid',
        message: `El identificador temporal ${product.id} está duplicado.`,
        commonListFactor: null,
        discountRate: null,
        productId: product.id,
      }))
    }

    productIds.add(product.id)
  })

  if (input.discountRates.length === 0) {
    issues.push(issue({
      code: 'PRICE_SENSITIVITY_EMPTY_DISCOUNTS',
      severity: 'invalid',
      message: 'La sensibilidad requiere al menos un descuento explícito.',
      commonListFactor: null,
      discountRate: null,
      productId: null,
    }))
  }

  const normalizedDiscounts = input.discountRates.map(
    (discountRate) => roundPricingValue(discountRate, ratePrecision),
  )
  const discountSet = new Set<number>()

  normalizedDiscounts.forEach((discountRate) => {
    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate >= 1) {
      issues.push(issue({
        code: 'PRICE_SENSITIVITY_INVALID_DISCOUNT',
        severity: 'invalid',
        message: 'Cada descuento debe ser mayor o igual a 0% y menor a 100%.',
        commonListFactor: null,
        discountRate: Number.isFinite(discountRate) ? discountRate : null,
        productId: null,
      }))
    }

    if (discountSet.has(discountRate)) {
      issues.push(issue({
        code: 'PRICE_SENSITIVITY_DUPLICATE_DISCOUNT',
        severity: 'invalid',
        message: `El descuento ${(discountRate * 100).toLocaleString('es-MX')}% está duplicado.`,
        commonListFactor: null,
        discountRate,
        productId: null,
      }))
    }

    discountSet.add(discountRate)
  })

  if (input.commonListFactors.length === 0) {
    issues.push(issue({
      code: 'PRICE_SENSITIVITY_EMPTY_FACTORS',
      severity: 'invalid',
      message: 'Captura al menos un factor común para evaluar.',
      commonListFactor: null,
      discountRate: null,
      productId: null,
    }))
  }

  const normalizedFactors = input.commonListFactors.map(
    (factor) => roundPricingValue(factor, ratePrecision),
  )
  const factorSet = new Set<number>()

  normalizedFactors.forEach((factor) => {
    if (!Number.isFinite(factor) || factor <= 0) {
      issues.push(issue({
        code: 'PRICE_SENSITIVITY_INVALID_FACTOR',
        severity: 'invalid',
        message: 'Cada factor común debe ser mayor a cero.',
        commonListFactor: Number.isFinite(factor) ? factor : null,
        discountRate: null,
        productId: null,
      }))
    }

    if (factorSet.has(factor)) {
      issues.push(issue({
        code: 'PRICE_SENSITIVITY_DUPLICATE_FACTOR',
        severity: 'invalid',
        message: `El factor ${factor.toLocaleString('es-MX')}x está duplicado.`,
        commonListFactor: factor,
        discountRate: null,
        productId: null,
      }))
    }

    factorSet.add(factor)
  })

  if (issues.some((item) => item.severity === 'invalid')) {
    return invalidResult(input, issues)
  }

  const normalizedInput: PriceBatchSensitivityInput = {
    ...cloneInput(input),
    id,
    sourceBatchId,
    brandName: normalizeText(input.brandName),
    currency,
    products: normalizedProducts,
    discountRates: normalizedDiscounts,
    commonListFactors: normalizedFactors,
    notes: normalizeText(input.notes),
  }
  const discountMinimums = buildDiscountMinimums(
    normalizedInput,
    moneyPrecision,
    ratePrecision,
  )
  const minimumValues = discountMinimums
    .map((item) => item.minimumRequiredFactor)
    .filter((value): value is number => value !== null)
  const globalMinimumFactor = minimumValues.length > 0
    ? roundPricingValue(Math.max(...minimumValues), ratePrecision)
    : null

  if (globalMinimumFactor === null) {
    return invalidResult(normalizedInput, [
      ...issues,
      issue({
        code: 'PRICE_SENSITIVITY_NO_CALCULABLE_ROWS',
        severity: 'invalid',
        message: 'No existen combinaciones calculables para determinar los factores mínimos.',
        commonListFactor: null,
        discountRate: null,
        productId: null,
      }),
    ])
  }

  const cells = normalizedFactors.flatMap((factor, factorIndex) =>
    normalizedDiscounts.map((discountRate, discountIndex) =>
      buildCell(
        normalizedInput,
        factor,
        discountRate,
        discountMinimums[discountIndex]!,
        factorIndex * normalizedDiscounts.length + discountIndex + 1,
        factorIndex,
        discountIndex,
        moneyPrecision,
        ratePrecision,
      ),
    ),
  )
  const factorSummaries = buildFactorSummaries(
    normalizedFactors,
    cells,
    ratePrecision,
  )
  const fullyFeasibleFactors = factorSummaries.filter(
    (summary) => summary.fullyFeasibleAcrossAllDiscounts,
  )

  if (fullyFeasibleFactors.length === 0) {
    issues.push(issue({
      code: 'PRICE_SENSITIVITY_NO_FULLY_FEASIBLE_FACTOR',
      severity: 'warning',
      message: 'Ninguno de los factores capturados cumple el objetivo para todos los productos y descuentos evaluados.',
      commonListFactor: null,
      discountRate: null,
      productId: null,
    }))
  }

  const coverageRates = cells.map((cell) => cell.coverageRate)
  const summary = {
    productCount: normalizedProducts.length,
    discountCount: normalizedDiscounts.length,
    factorCount: normalizedFactors.length,
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
    belowObjectiveCount: cells.reduce(
      (total, cell) => total + cell.belowObjectiveCount,
      0,
    ),
    globalMinimumFactor,
    fullyFeasibleFactorCount: fullyFeasibleFactors.length,
    maximumCoverageRate: coverageRates.length > 0
      ? roundPricingValue(Math.max(...coverageRates), ratePrecision)
      : 0,
    minimumCoverageRate: coverageRates.length > 0
      ? roundPricingValue(Math.min(...coverageRates), ratePrecision)
      : 0,
  }

  return {
    available: cells.some((cell) => cell.calculableCount > 0),
    methodology: PRICE_BATCH_SENSITIVITY_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsSensitivity: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: summary.invalidCellCount > 0
      ? 'warning'
      : fullyFeasibleFactors.length === 0
        ? 'warning'
        : 'valid',
    input: normalizedInput,
    discountMinimums,
    globalMinimumFactor,
    cells,
    factorSummaries,
    summary,
    issues,
    explainability: [
      'Cada factor capturado se evalúa contra todos los productos y descuentos mediante price-design-v1.',
      'El factor mínimo por descuento es el mayor factor individual requerido entre los productos calculables.',
      'El factor mínimo global es el mayor de los mínimos por descuento; es un umbral matemático, no una recomendación comercial.',
      'La cobertura indica qué proporción de productos cumple el objetivo explícito dentro de cada combinación Factor × Descuento.',
      'Los agregados consideran una unidad de cada producto y no representan volumen, Forecast, presupuesto ni mezcla comercial.',
      'El análisis existe únicamente en memoria y no crea, modifica, aprueba ni publica precios o factores.',
    ],
  }
}
