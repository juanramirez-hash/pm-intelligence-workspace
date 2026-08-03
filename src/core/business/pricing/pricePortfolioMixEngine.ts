import {
  calculatePriceGrossMargin,
  roundPricingValue,
} from './pricingMath'

import {
  evaluatePriceDesign,
} from './priceDesignEngine'

import {
  PRICE_PORTFOLIO_MIX_METHODOLOGY,
} from './pricePortfolioMixContracts'

import type {
  PriceBatchProductInput,
} from './priceBatchDesignContracts'

import type {
  PriceDesignMetrics,
  PriceDesignObjective,
} from './priceDesignContracts'

import type {
  PricePortfolioMixCell,
  PricePortfolioMixFactorSummary,
  PricePortfolioMixFeasibility,
  PricePortfolioMixInput,
  PricePortfolioMixIssue,
  PricePortfolioMixOptions,
  PricePortfolioMixProductResult,
  PricePortfolioMixResult,
  PricePortfolioMixScenarioInput,
  PricePortfolioMixScenarioSummary,
} from './pricePortfolioMixContracts'

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
  product: PriceBatchProductInput,
): PriceBatchProductInput {
  return {
    ...product,
  }
}

function cloneObjective(
  objective: PriceDesignObjective,
): PriceDesignObjective {
  return {
    ...objective,
  }
}

function cloneMix(
  mix: PricePortfolioMixScenarioInput,
): PricePortfolioMixScenarioInput {
  return {
    ...mix,
    quantities: mix.quantities.map((quantity) => ({
      ...quantity,
    })),
  }
}

function cloneInput(
  input: PricePortfolioMixInput,
): PricePortfolioMixInput {
  return {
    ...input,
    products: input.products.map(cloneProduct),
    discountRates: [...input.discountRates],
    objective: cloneObjective(input.objective),
    commonListFactors: [...input.commonListFactors],
    mixes: input.mixes.map(cloneMix),
  }
}

function emptySummary() {
  return {
    productCount: 0,
    activeProductCount: 0,
    mixCount: 0,
    discountCount: 0,
    factorCount: 0,
    cellCount: 0,
    fullyFeasibleCellCount: 0,
    partiallyFeasibleCellCount: 0,
    notFeasibleCellCount: 0,
    invalidCellCount: 0,
    belowObjectiveProductCount: 0,
    totalAssumedUnitsAcrossMixes: 0,
    fullyFeasibleFactorCount: 0,
  }
}

function invalidResult(
  input: PricePortfolioMixInput,
  issues: readonly PricePortfolioMixIssue[],
): PricePortfolioMixResult {
  return {
    available: false,
    methodology: PRICE_PORTFOLIO_MIX_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsPortfolioMix: false,
      writesForecast: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: 'invalid',
    input: cloneInput(input),
    cells: [],
    mixSummaries: [],
    factorSummaries: [],
    summary: emptySummary(),
    issues: issues.map((item) => ({
      ...item,
    })),
    explainability: [
      'La simulación ponderada no pudo calcularse porque faltan supuestos explícitos o existen valores inválidos.',
      'No se creó, modificó, persistió ni publicó ningún producto, costo, factor, precio, Forecast o presupuesto.',
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

function normalizeInput(
  input: PricePortfolioMixInput,
  ratePrecision: number,
  quantityPrecision: number,
): PricePortfolioMixInput {
  return {
    ...cloneInput(input),
    id: normalizeIdentifier(input.id),
    sourceBatchId: normalizeIdentifier(input.sourceBatchId),
    brandName: normalizeText(input.brandName),
    currency: normalizeIdentifier(input.currency),
    products: input.products.map((product, index) => ({
      ...cloneProduct(product),
      id: normalizeIdentifier(product.id || `PORTFOLIO-PRODUCT-${index + 1}`),
      model: normalizeText(product.model),
      sku: normalizeText(product.sku),
      notes: normalizeText(product.notes),
    })),
    discountRates: input.discountRates.map(
      (discountRate) => roundPricingValue(discountRate, ratePrecision),
    ),
    objective: cloneObjective(input.objective),
    commonListFactors: input.commonListFactors.map(
      (factor) => roundPricingValue(factor, ratePrecision),
    ),
    mixes: input.mixes.map((mix, index) => ({
      ...cloneMix(mix),
      id: normalizeIdentifier(mix.id || `MIX-${index + 1}`),
      label: normalizeText(mix.label) ?? `Mezcla ${index + 1}`,
      notes: normalizeText(mix.notes),
      quantities: mix.quantities.map((quantity) => ({
        productId: normalizeIdentifier(quantity.productId),
        quantity: roundPricingValue(quantity.quantity, quantityPrecision),
      })),
    })),
    notes: normalizeText(input.notes),
  }
}

function validateInput(
  input: PricePortfolioMixInput,
): PricePortfolioMixIssue[] {
  const issues: PricePortfolioMixIssue[] = []
  const add = (
    item: PricePortfolioMixIssue,
  ) => issues.push(item)

  if (!input.id) {
    add({
      code: 'PRICE_PORTFOLIO_MIX_INVALID_IDENTIFIER',
      severity: 'invalid',
      message: 'La simulación de mezcla requiere un identificador temporal.',
      mixId: null,
      productId: null,
      commonListFactor: null,
      discountRate: null,
    })
  }

  if (!input.sourceBatchId) {
    add({
      code: 'PRICE_PORTFOLIO_MIX_INVALID_SOURCE_BATCH',
      severity: 'invalid',
      message: 'La simulación de mezcla requiere la matriz por lote de origen.',
      mixId: null,
      productId: null,
      commonListFactor: null,
      discountRate: null,
    })
  }

  if (!input.currency) {
    add({
      code: 'PRICE_PORTFOLIO_MIX_INVALID_CURRENCY',
      severity: 'invalid',
      message: 'Captura una moneda común para la simulación.',
      mixId: null,
      productId: null,
      commonListFactor: null,
      discountRate: null,
    })
  }

  if (!isValidObjective(input.objective)) {
    add({
      code: 'PRICE_PORTFOLIO_MIX_INVALID_OBJECTIVE',
      severity: 'invalid',
      message: 'El objetivo de referencia de la matriz de origen no es válido.',
      mixId: null,
      productId: null,
      commonListFactor: null,
      discountRate: null,
    })
  }

  if (input.products.length === 0) {
    add({
      code: 'PRICE_PORTFOLIO_MIX_EMPTY_PRODUCTS',
      severity: 'invalid',
      message: 'La simulación requiere al menos un producto con costo.',
      mixId: null,
      productId: null,
      commonListFactor: null,
      discountRate: null,
    })
  }

  const productIds = new Set<string>()

  input.products.forEach((product) => {
    if (!product.id || !Number.isFinite(product.cost) || product.cost <= 0) {
      add({
        code: 'PRICE_PORTFOLIO_MIX_INVALID_PRODUCT',
        severity: 'invalid',
        message: `El producto ${productLabel(product) || 'sin identificar'} requiere ID y costo mayor a cero.`,
        mixId: null,
        productId: product.id || null,
        commonListFactor: null,
        discountRate: null,
      })
    }

    if (productIds.has(product.id)) {
      add({
        code: 'PRICE_PORTFOLIO_MIX_DUPLICATE_PRODUCT_ID',
        severity: 'invalid',
        message: `El producto ${product.id} está duplicado.`,
        mixId: null,
        productId: product.id,
        commonListFactor: null,
        discountRate: null,
      })
    }

    productIds.add(product.id)
  })

  if (input.discountRates.length === 0) {
    add({
      code: 'PRICE_PORTFOLIO_MIX_EMPTY_DISCOUNTS',
      severity: 'invalid',
      message: 'La simulación requiere al menos un descuento explícito.',
      mixId: null,
      productId: null,
      commonListFactor: null,
      discountRate: null,
    })
  }

  const discounts = new Set<number>()
  input.discountRates.forEach((discountRate) => {
    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate >= 1) {
      add({
        code: 'PRICE_PORTFOLIO_MIX_INVALID_DISCOUNT',
        severity: 'invalid',
        message: 'Cada descuento debe ser mayor o igual a 0% y menor a 100%.',
        mixId: null,
        productId: null,
        commonListFactor: null,
        discountRate: Number.isFinite(discountRate) ? discountRate : null,
      })
    }

    if (discounts.has(discountRate)) {
      add({
        code: 'PRICE_PORTFOLIO_MIX_DUPLICATE_DISCOUNT',
        severity: 'invalid',
        message: `El descuento ${(discountRate * 100).toLocaleString('es-MX')}% está duplicado.`,
        mixId: null,
        productId: null,
        commonListFactor: null,
        discountRate,
      })
    }

    discounts.add(discountRate)
  })

  if (input.commonListFactors.length === 0) {
    add({
      code: 'PRICE_PORTFOLIO_MIX_EMPTY_FACTORS',
      severity: 'invalid',
      message: 'Captura al menos un factor común para comparar las mezclas.',
      mixId: null,
      productId: null,
      commonListFactor: null,
      discountRate: null,
    })
  }

  const factors = new Set<number>()
  input.commonListFactors.forEach((factor) => {
    if (!Number.isFinite(factor) || factor <= 0) {
      add({
        code: 'PRICE_PORTFOLIO_MIX_INVALID_FACTOR',
        severity: 'invalid',
        message: 'Cada factor común debe ser mayor a cero.',
        mixId: null,
        productId: null,
        commonListFactor: Number.isFinite(factor) ? factor : null,
        discountRate: null,
      })
    }

    if (factors.has(factor)) {
      add({
        code: 'PRICE_PORTFOLIO_MIX_DUPLICATE_FACTOR',
        severity: 'invalid',
        message: `El factor ${factor.toLocaleString('es-MX')}x está duplicado.`,
        mixId: null,
        productId: null,
        commonListFactor: factor,
        discountRate: null,
      })
    }

    factors.add(factor)
  })

  if (input.mixes.length === 0) {
    add({
      code: 'PRICE_PORTFOLIO_MIX_EMPTY_MIXES',
      severity: 'invalid',
      message: 'Captura al menos una mezcla de volumen.',
      mixId: null,
      productId: null,
      commonListFactor: null,
      discountRate: null,
    })
  }

  const mixIds = new Set<string>()
  input.mixes.forEach((mix) => {
    if (!mix.id || !normalizeText(mix.label)) {
      add({
        code: 'PRICE_PORTFOLIO_MIX_INVALID_MIX',
        severity: 'invalid',
        message: 'Cada mezcla requiere identificador y nombre.',
        mixId: mix.id || null,
        productId: null,
        commonListFactor: null,
        discountRate: null,
      })
    }

    if (mixIds.has(mix.id)) {
      add({
        code: 'PRICE_PORTFOLIO_MIX_DUPLICATE_MIX_ID',
        severity: 'invalid',
        message: `La mezcla ${mix.id} está duplicada.`,
        mixId: mix.id,
        productId: null,
        commonListFactor: null,
        discountRate: null,
      })
    }
    mixIds.add(mix.id)

    const quantityProducts = new Set<string>()
    let totalQuantity = 0

    mix.quantities.forEach((quantity) => {
      if (!productIds.has(quantity.productId)) {
        add({
          code: 'PRICE_PORTFOLIO_MIX_UNKNOWN_PRODUCT',
          severity: 'invalid',
          message: `La mezcla ${mix.label} contiene el producto desconocido ${quantity.productId || 'sin ID'}.`,
          mixId: mix.id,
          productId: quantity.productId || null,
          commonListFactor: null,
          discountRate: null,
        })
      }

      if (quantityProducts.has(quantity.productId)) {
        add({
          code: 'PRICE_PORTFOLIO_MIX_DUPLICATE_QUANTITY_PRODUCT',
          severity: 'invalid',
          message: `El producto ${quantity.productId} aparece más de una vez en la mezcla ${mix.label}.`,
          mixId: mix.id,
          productId: quantity.productId,
          commonListFactor: null,
          discountRate: null,
        })
      }
      quantityProducts.add(quantity.productId)

      if (!Number.isFinite(quantity.quantity) || quantity.quantity < 0) {
        add({
          code: 'PRICE_PORTFOLIO_MIX_INVALID_QUANTITY',
          severity: 'invalid',
          message: `La cantidad de ${quantity.productId || 'producto'} en ${mix.label} debe ser mayor o igual a cero.`,
          mixId: mix.id,
          productId: quantity.productId || null,
          commonListFactor: null,
          discountRate: null,
        })
      } else {
        totalQuantity += quantity.quantity
      }
    })

    if (totalQuantity <= 0) {
      add({
        code: 'PRICE_PORTFOLIO_MIX_ZERO_VOLUME',
        severity: 'invalid',
        message: `La mezcla ${mix.label} requiere al menos una cantidad mayor a cero.`,
        mixId: mix.id,
        productId: null,
        commonListFactor: null,
        discountRate: null,
      })
    }
  })

  return issues
}

function buildProductResult(
  input: PricePortfolioMixInput,
  mix: PricePortfolioMixScenarioInput,
  product: PriceBatchProductInput,
  commonListFactor: number,
  discountRate: number,
  mixIndex: number,
  factorIndex: number,
  discountIndex: number,
  productIndex: number,
  moneyPrecision: number,
  ratePrecision: number,
): PricePortfolioMixProductResult {
  const quantity = mix.quantities.find(
    (item) => item.productId === product.id,
  )?.quantity ?? 0
  const requiredDesign = evaluatePriceDesign({
    id: `${input.id}::REQUIRED::${mixIndex + 1}::${discountIndex + 1}::${product.id}`,
    identity: {
      brandName: input.brandName,
      model: product.model,
      sku: product.sku,
    },
    currency: input.currency,
    cost: product.cost,
    discountRate,
    objective: cloneObjective(input.objective),
    notes: product.notes ?? mix.notes ?? input.notes,
  }, {
    moneyPrecision,
    ratePrecision,
  })
  const design = evaluatePriceDesign({
    id: `${input.id}::MIX-${mixIndex + 1}::FACTOR-${factorIndex + 1}::DISCOUNT-${discountIndex + 1}::${product.id}`,
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
    notes: product.notes ?? mix.notes ?? input.notes,
  }, {
    moneyPrecision,
    ratePrecision,
  })
  const metrics = design.metrics
  const requiredListFactor = requiredDesign.metrics?.listPriceFactor ?? null

  return {
    key: `${mixIndex + 1}::${factorIndex + 1}::${discountIndex + 1}::${productIndex + 1}`,
    product: cloneProduct(product),
    quantity,
    commonListFactor,
    discountRate,
    requiredListFactor,
    factorGap: requiredListFactor === null
      ? null
      : roundPricingValue(commonListFactor - requiredListFactor, ratePrecision),
    design,
    metrics,
    meetsObjective: metrics
      ? objectiveIsMet(metrics, input.objective)
      : null,
    totalCost: metrics
      ? roundPricingValue(metrics.cost * quantity, moneyPrecision)
      : 0,
    totalListPrice: metrics
      ? roundPricingValue(metrics.listPrice * quantity, moneyPrecision)
      : 0,
    totalSellingPrice: metrics
      ? roundPricingValue(metrics.sellingPrice * quantity, moneyPrecision)
      : 0,
    totalGrossProfit: metrics
      ? roundPricingValue(metrics.grossProfit * quantity, moneyPrecision)
      : 0,
    salesShare: 0,
    grossProfitShare: 0,
  }
}

function feasibilityFor(
  activeProducts: readonly PricePortfolioMixProductResult[],
  calculableProducts: readonly PricePortfolioMixProductResult[],
): PricePortfolioMixFeasibility {
  if (activeProducts.length === 0 || calculableProducts.length !== activeProducts.length) {
    return 'invalid'
  }

  const meets = calculableProducts.filter(
    (product) => product.meetsObjective === true,
  ).length

  if (meets === calculableProducts.length) {
    return 'fully_feasible'
  }

  return meets === 0
    ? 'not_feasible'
    : 'partially_feasible'
}

function buildCell(
  input: PricePortfolioMixInput,
  mix: PricePortfolioMixScenarioInput,
  commonListFactor: number,
  discountRate: number,
  mixIndex: number,
  factorIndex: number,
  discountIndex: number,
  order: number,
  moneyPrecision: number,
  ratePrecision: number,
): PricePortfolioMixCell {
  const products = input.products.map((product, productIndex) =>
    buildProductResult(
      input,
      mix,
      product,
      commonListFactor,
      discountRate,
      mixIndex,
      factorIndex,
      discountIndex,
      productIndex,
      moneyPrecision,
      ratePrecision,
    ),
  )
  const activeProducts = products.filter((product) => product.quantity > 0)
  const calculableProducts = activeProducts.filter(
    (product): product is PricePortfolioMixProductResult & {
      metrics: PriceDesignMetrics
    } => product.metrics !== null,
  )
  const totalUnits = activeProducts.reduce(
    (total, product) => total + product.quantity,
    0,
  )
  const totalCost = calculableProducts.reduce(
    (total, product) => total + product.totalCost,
    0,
  )
  const totalListPrice = calculableProducts.reduce(
    (total, product) => total + product.totalListPrice,
    0,
  )
  const totalSellingPrice = calculableProducts.reduce(
    (total, product) => total + product.totalSellingPrice,
    0,
  )
  const totalGrossProfit = calculableProducts.reduce(
    (total, product) => total + product.totalGrossProfit,
    0,
  )
  const meetsObjectiveProductCount = calculableProducts.filter(
    (product) => product.meetsObjective === true,
  ).length
  const belowObjectiveProductCount = calculableProducts.filter(
    (product) => product.meetsObjective === false,
  ).length
  const compliantVolume = calculableProducts.reduce(
    (total, product) => total + (product.meetsObjective ? product.quantity : 0),
    0,
  )
  const margins = calculableProducts.map(
    (product) => product.metrics.grossMargin,
  )

  const productsWithShares = products.map((product) => ({
    ...product,
    salesShare: totalSellingPrice > 0
      ? roundPricingValue(product.totalSellingPrice / totalSellingPrice, ratePrecision)
      : 0,
    grossProfitShare: totalGrossProfit !== 0
      ? roundPricingValue(product.totalGrossProfit / totalGrossProfit, ratePrecision)
      : 0,
  }))
  const topSales = productsWithShares.reduce<PricePortfolioMixProductResult | null>(
    (current, product) => product.quantity > 0 &&
      (!current || product.totalSellingPrice > current.totalSellingPrice)
      ? product
      : current,
    null,
  )
  const topGrossProfit = productsWithShares.reduce<PricePortfolioMixProductResult | null>(
    (current, product) => product.quantity > 0 &&
      (!current || product.totalGrossProfit > current.totalGrossProfit)
      ? product
      : current,
    null,
  )

  return {
    key: `${mix.id}::${commonListFactor}::${discountRate}`,
    order,
    mixId: mix.id,
    mixLabel: mix.label,
    mixOrder: mixIndex,
    commonListFactor,
    factorOrder: factorIndex,
    discountRate,
    discountOrder: discountIndex,
    feasibility: feasibilityFor(activeProducts, calculableProducts),
    totalUnits: roundPricingValue(totalUnits, ratePrecision),
    activeProductCount: activeProducts.length,
    calculableProductCount: calculableProducts.length,
    meetsObjectiveProductCount,
    belowObjectiveProductCount,
    volumeCoverageRate: totalUnits > 0
      ? roundPricingValue(compliantVolume / totalUnits, ratePrecision)
      : 0,
    totalCost: roundPricingValue(totalCost, moneyPrecision),
    totalListPrice: roundPricingValue(totalListPrice, moneyPrecision),
    totalSellingPrice: roundPricingValue(totalSellingPrice, moneyPrecision),
    totalGrossProfit: roundPricingValue(totalGrossProfit, moneyPrecision),
    grossMargin: roundPricingValue(
      calculatePriceGrossMargin(totalSellingPrice, totalCost),
      ratePrecision,
    ),
    weightedNetFactor: totalCost > 0
      ? roundPricingValue(totalSellingPrice / totalCost, ratePrecision)
      : 0,
    averageSellingPrice: totalUnits > 0
      ? roundPricingValue(totalSellingPrice / totalUnits, moneyPrecision)
      : 0,
    minimumGrossMargin: margins.length > 0
      ? roundPricingValue(Math.min(...margins), ratePrecision)
      : null,
    maximumGrossMargin: margins.length > 0
      ? roundPricingValue(Math.max(...margins), ratePrecision)
      : null,
    topSalesProductId: topSales?.product.id ?? null,
    topSalesProductLabel: topSales
      ? productLabel(topSales.product)
      : null,
    topSalesShare: topSales?.salesShare ?? 0,
    topGrossProfitProductId: topGrossProfit?.product.id ?? null,
    topGrossProfitProductLabel: topGrossProfit
      ? productLabel(topGrossProfit.product)
      : null,
    topGrossProfitShare: topGrossProfit?.grossProfitShare ?? 0,
    products: productsWithShares,
  }
}

function buildMixSummaries(
  mixes: readonly PricePortfolioMixScenarioInput[],
  cells: readonly PricePortfolioMixCell[],
): PricePortfolioMixScenarioSummary[] {
  return mixes.map((mix) => {
    const matching = cells.filter((cell) => cell.mixId === mix.id)
    const margins = matching.map((cell) => cell.grossMargin)
    const grossProfits = matching.map((cell) => cell.totalGrossProfit)
    const quantities = mix.quantities.filter((quantity) => quantity.quantity > 0)

    return {
      mixId: mix.id,
      mixLabel: mix.label,
      totalUnits: quantities.reduce(
        (total, quantity) => total + quantity.quantity,
        0,
      ),
      activeProductCount: quantities.length,
      cellCount: matching.length,
      fullyFeasibleCellCount: matching.filter(
        (cell) => cell.feasibility === 'fully_feasible',
      ).length,
      partiallyFeasibleCellCount: matching.filter(
        (cell) => cell.feasibility === 'partially_feasible',
      ).length,
      notFeasibleCellCount: matching.filter(
        (cell) => cell.feasibility === 'not_feasible',
      ).length,
      invalidCellCount: matching.filter(
        (cell) => cell.feasibility === 'invalid',
      ).length,
      minimumGrossMargin: margins.length > 0
        ? Math.min(...margins)
        : null,
      maximumGrossMargin: margins.length > 0
        ? Math.max(...margins)
        : null,
      minimumTotalGrossProfit: grossProfits.length > 0
        ? Math.min(...grossProfits)
        : null,
      maximumTotalGrossProfit: grossProfits.length > 0
        ? Math.max(...grossProfits)
        : null,
    }
  })
}

function buildFactorSummaries(
  factors: readonly number[],
  cells: readonly PricePortfolioMixCell[],
  ratePrecision: number,
): PricePortfolioMixFactorSummary[] {
  return factors.map((commonListFactor) => {
    const matching = cells.filter(
      (cell) => cell.commonListFactor === commonListFactor,
    )
    const coverages = matching.map((cell) => cell.volumeCoverageRate)
    const margins = matching.map((cell) => cell.grossMargin)

    return {
      commonListFactor,
      cellCount: matching.length,
      fullyFeasibleCellCount: matching.filter(
        (cell) => cell.feasibility === 'fully_feasible',
      ).length,
      partiallyFeasibleCellCount: matching.filter(
        (cell) => cell.feasibility === 'partially_feasible',
      ).length,
      notFeasibleCellCount: matching.filter(
        (cell) => cell.feasibility === 'not_feasible',
      ).length,
      invalidCellCount: matching.filter(
        (cell) => cell.feasibility === 'invalid',
      ).length,
      minimumVolumeCoverageRate: coverages.length > 0
        ? roundPricingValue(Math.min(...coverages), ratePrecision)
        : 0,
      averageVolumeCoverageRate: coverages.length > 0
        ? roundPricingValue(
          coverages.reduce((total, value) => total + value, 0) / coverages.length,
          ratePrecision,
        )
        : 0,
      minimumGrossMargin: margins.length > 0
        ? roundPricingValue(Math.min(...margins), ratePrecision)
        : null,
      maximumGrossMargin: margins.length > 0
        ? roundPricingValue(Math.max(...margins), ratePrecision)
        : null,
      fullyFeasibleAcrossAllMixesAndDiscounts: matching.length > 0 && matching.every(
        (cell) => cell.feasibility === 'fully_feasible',
      ),
    }
  })
}

export function evaluatePricePortfolioMix(
  input: PricePortfolioMixInput,
  optionsInput?: PricePortfolioMixOptions,
): PricePortfolioMixResult {
  const moneyPrecision = optionsInput?.moneyPrecision ?? DEFAULT_MONEY_PRECISION
  const ratePrecision = optionsInput?.ratePrecision ?? DEFAULT_RATE_PRECISION
  const quantityPrecision = optionsInput?.quantityPrecision ?? DEFAULT_QUANTITY_PRECISION
  const normalizedInput = normalizeInput(
    input,
    ratePrecision,
    quantityPrecision,
  )
  const issues = validateInput(normalizedInput)

  if (issues.some((item) => item.severity === 'invalid')) {
    return invalidResult(normalizedInput, issues)
  }

  const cells: PricePortfolioMixCell[] = []
  let order = 0

  normalizedInput.mixes.forEach((mix, mixIndex) => {
    normalizedInput.commonListFactors.forEach((factor, factorIndex) => {
      normalizedInput.discountRates.forEach((discountRate, discountIndex) => {
        order += 1
        cells.push(buildCell(
          normalizedInput,
          mix,
          factor,
          discountRate,
          mixIndex,
          factorIndex,
          discountIndex,
          order,
          moneyPrecision,
          ratePrecision,
        ))
      })
    })
  })

  if (cells.length === 0 || cells.every((cell) => cell.feasibility === 'invalid')) {
    issues.push({
      code: 'PRICE_PORTFOLIO_MIX_NO_CALCULABLE_ROWS',
      severity: 'invalid',
      message: 'No fue posible calcular ninguna combinación de mezcla, factor y descuento.',
      mixId: null,
      productId: null,
      commonListFactor: null,
      discountRate: null,
    })
    return invalidResult(normalizedInput, issues)
  }

  const belowObjectiveProductCount = cells.reduce(
    (total, cell) => total + cell.belowObjectiveProductCount,
    0,
  )

  if (belowObjectiveProductCount > 0) {
    issues.push({
      code: 'PRICE_PORTFOLIO_MIX_BELOW_OBJECTIVE',
      severity: 'warning',
      message: `${belowObjectiveProductCount.toLocaleString('es-MX')} resultados producto × mezcla quedaron debajo del objetivo explícito.`,
      mixId: null,
      productId: null,
      commonListFactor: null,
      discountRate: null,
    })
  }

  const mixSummaries = buildMixSummaries(
    normalizedInput.mixes,
    cells,
  )
  const factorSummaries = buildFactorSummaries(
    normalizedInput.commonListFactors,
    cells,
    ratePrecision,
  )
  const activeProductIds = new Set(
    normalizedInput.mixes.flatMap((mix) => mix.quantities)
      .filter((quantity) => quantity.quantity > 0)
      .map((quantity) => quantity.productId),
  )
  const summary = {
    productCount: normalizedInput.products.length,
    activeProductCount: activeProductIds.size,
    mixCount: normalizedInput.mixes.length,
    discountCount: normalizedInput.discountRates.length,
    factorCount: normalizedInput.commonListFactors.length,
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
    belowObjectiveProductCount,
    totalAssumedUnitsAcrossMixes: roundPricingValue(
      normalizedInput.mixes.reduce(
        (total, mix) => total + mix.quantities.reduce(
          (mixTotal, quantity) => mixTotal + quantity.quantity,
          0,
        ),
        0,
      ),
      quantityPrecision,
    ),
    fullyFeasibleFactorCount: factorSummaries.filter(
      (factor) => factor.fullyFeasibleAcrossAllMixesAndDiscounts,
    ).length,
  }

  return {
    available: true,
    methodology: PRICE_PORTFOLIO_MIX_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsPortfolioMix: false,
      writesForecast: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: issues.some((item) => item.severity === 'warning')
      ? 'warning'
      : 'valid',
    input: cloneInput(normalizedInput),
    cells,
    mixSummaries,
    factorSummaries,
    summary,
    issues: issues.map((item) => ({
      ...item,
    })),
    explainability: [
      'Cada celda aplica un factor de lista y un descuento explícitos a cada producto, y multiplica los resultados unitarios por las cantidades capturadas en la mezcla.',
      'El margen consolidado se calcula como GP total ponderado entre venta total ponderada; no es el promedio simple de márgenes por producto.',
      'La cobertura por volumen representa la proporción de unidades asumidas en productos que cumplen el objetivo explícito.',
      'Las cantidades son supuestos temporales de laboratorio: no crean Forecast, presupuesto, demanda, inventario ni compromiso de compra.',
      'El análisis no ordena ni recomienda automáticamente una mezcla, factor o descuento ganador.',
      'Ningún precio, costo, producto, marca o escenario fue persistido o publicado.',
    ],
  }
}
