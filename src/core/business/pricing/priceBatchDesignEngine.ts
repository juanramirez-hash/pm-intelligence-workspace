import {
  calculatePriceGrossMargin,
  roundPricingValue,
} from './pricingMath'

import {
  evaluatePriceDesign,
} from './priceDesignEngine'

import {
  PRICE_BATCH_DESIGN_METHODOLOGY,
} from './priceBatchDesignContracts'

import type {
  PriceBatchDesignInput,
  PriceBatchDesignIssue,
  PriceBatchDesignOptions,
  PriceBatchDesignResult,
  PriceBatchDesignRow,
  PriceBatchDiscountSummary,
  PriceBatchProductInput,
  PriceBatchRowCompliance,
} from './priceBatchDesignContracts'

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
  input: PriceBatchDesignInput,
): PriceBatchDesignInput {
  return {
    ...input,
    products: input.products.map(cloneProduct),
    discountRates: [...input.discountRates],
    objective: cloneObjective(input.objective),
    commonFactor: {
      ...input.commonFactor,
    },
  }
}

function issue(
  input: PriceBatchDesignIssue,
): PriceBatchDesignIssue {
  return {
    ...input,
  }
}

function emptySummary() {
  return {
    productCount: 0,
    discountCount: 0,
    matrixRowCount: 0,
    calculableRowCount: 0,
    warningRowCount: 0,
    invalidRowCount: 0,
    meetsObjectiveCount: 0,
    belowObjectiveCount: 0,
    commonListFactor: null,
  }
}

function invalidResult(
  input: PriceBatchDesignInput,
  issues: readonly PriceBatchDesignIssue[],
): PriceBatchDesignResult {
  return {
    available: false,
    methodology: PRICE_BATCH_DESIGN_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsBatch: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: 'invalid',
    input: cloneInput(input),
    commonListFactor: null,
    rows: [],
    discountSummaries: [],
    summary: emptySummary(),
    issues: issues.map(issue),
    explainability: [
      'La matriz no pudo calcularse porque faltan datos explícitos o existen valores inválidos.',
      'No se creó ni modificó ningún producto, marca, costo o precio comercial.',
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

function commonFactorFromRows(
  input: PriceBatchDesignInput,
  requiredFactors: readonly number[],
  ratePrecision: number,
): number | null {
  if (input.commonFactor.strategy === 'explicit') {
    const factor = input.commonFactor.factor

    return Number.isFinite(factor) && (factor ?? 0) > 0
      ? roundPricingValue(factor ?? 0, ratePrecision)
      : null
  }

  if (requiredFactors.length === 0) {
    return null
  }

  const factor = input.commonFactor.strategy === 'protect_all'
    ? Math.max(...requiredFactors)
    : requiredFactors.reduce((total, value) => total + value, 0) /
      requiredFactors.length

  return roundPricingValue(factor, ratePrecision)
}

function buildDiscountSummaries(
  rows: readonly PriceBatchDesignRow[],
  discountRates: readonly number[],
  moneyPrecision: number,
  ratePrecision: number,
): PriceBatchDiscountSummary[] {
  return discountRates.map((discountRate) => {
    const matchingRows = rows.filter(
      (row) => row.discountRate === discountRate,
    )
    const calculableRows = matchingRows.filter(
      (row) => row.commonFactorDesign?.metrics,
    )
    const metrics = calculableRows
      .map((row) => row.commonFactorDesign?.metrics)
      .filter((item): item is PriceDesignMetrics => Boolean(item))
    const totalCost = metrics.reduce(
      (total, item) => total + item.cost,
      0,
    )
    const totalListPrice = metrics.reduce(
      (total, item) => total + item.listPrice,
      0,
    )
    const totalSellingPrice = metrics.reduce(
      (total, item) => total + item.sellingPrice,
      0,
    )
    const totalGrossProfit = metrics.reduce(
      (total, item) => total + item.grossProfit,
      0,
    )

    return {
      discountRate,
      productCount: matchingRows.length,
      calculableCount: calculableRows.length,
      belowObjectiveCount: matchingRows.filter(
        (row) => row.compliance === 'below_objective',
      ).length,
      totalCost: roundPricingValue(totalCost, moneyPrecision),
      totalListPrice: roundPricingValue(totalListPrice, moneyPrecision),
      totalSellingPrice: roundPricingValue(totalSellingPrice, moneyPrecision),
      totalGrossProfit: roundPricingValue(totalGrossProfit, moneyPrecision),
      grossMargin: roundPricingValue(
        calculatePriceGrossMargin(
          totalSellingPrice,
          totalCost,
        ),
        ratePrecision,
      ),
    }
  })
}

function strategyExplanation(
  input: PriceBatchDesignInput,
  commonListFactor: number,
): string {
  switch (input.commonFactor.strategy) {
    case 'protect_all':
      return `El factor común ${commonListFactor}x corresponde al mayor factor individual requerido y busca proteger todos los productos y descuentos calculables.`
    case 'average_required':
      return `El factor común ${commonListFactor}x corresponde al promedio simple de los factores individuales requeridos; algunos productos pueden quedar debajo del objetivo.`
    case 'explicit':
      return `El factor común ${commonListFactor}x fue capturado explícitamente por el usuario y se evaluó sin ajustes automáticos.`
  }
}

export function evaluatePriceBatchDesign(
  input: PriceBatchDesignInput,
  optionsInput?: PriceBatchDesignOptions,
): PriceBatchDesignResult {
  const moneyPrecision = optionsInput?.moneyPrecision ?? DEFAULT_MONEY_PRECISION
  const ratePrecision = optionsInput?.ratePrecision ?? DEFAULT_RATE_PRECISION
  const issues: PriceBatchDesignIssue[] = []
  const id = normalizeIdentifier(input.id)
  const currency = normalizeIdentifier(input.currency)

  if (!id) {
    issues.push(issue({
      code: 'PRICE_BATCH_INVALID_IDENTIFIER',
      severity: 'invalid',
      message: 'La matriz requiere un identificador temporal.',
      productId: null,
      discountRate: null,
    }))
  }

  if (!currency) {
    issues.push(issue({
      code: 'PRICE_BATCH_INVALID_CURRENCY',
      severity: 'invalid',
      message: 'Captura la moneda común de los costos y precios simulados.',
      productId: null,
      discountRate: null,
    }))
  }

  if (!isValidObjective(input.objective)) {
    issues.push(issue({
      code: 'PRICE_BATCH_INVALID_OBJECTIVE',
      severity: 'invalid',
      message: 'El objetivo común requiere un valor explícito válido.',
      productId: null,
      discountRate: null,
    }))
  }

  if (input.products.length === 0) {
    issues.push(issue({
      code: 'PRICE_BATCH_EMPTY_PRODUCTS',
      severity: 'invalid',
      message: 'Agrega al menos un producto con costo válido.',
      productId: null,
      discountRate: null,
    }))
  }

  const normalizedProducts = input.products.map((product, index) => ({
    ...cloneProduct(product),
    id: normalizeIdentifier(product.id || `BATCH-PRODUCT-${index + 1}`),
    model: normalizeText(product.model),
    sku: normalizeText(product.sku),
    notes: normalizeText(product.notes),
  }))
  const productIds = new Set<string>()

  normalizedProducts.forEach((product) => {
    if (!product.id || !Number.isFinite(product.cost) || product.cost <= 0) {
      issues.push(issue({
        code: 'PRICE_BATCH_INVALID_PRODUCT',
        severity: 'invalid',
        message: `El producto ${(product.model ?? product.sku ?? product.id) || 'sin identificar'} requiere costo mayor a cero.`,
        productId: product.id || null,
        discountRate: null,
      }))
    }

    if (productIds.has(product.id)) {
      issues.push(issue({
        code: 'PRICE_BATCH_DUPLICATE_PRODUCT_ID',
        severity: 'invalid',
        message: `El identificador temporal ${product.id} está duplicado.`,
        productId: product.id,
        discountRate: null,
      }))
    }

    productIds.add(product.id)
  })

  if (input.discountRates.length === 0) {
    issues.push(issue({
      code: 'PRICE_BATCH_EMPTY_DISCOUNTS',
      severity: 'invalid',
      message: 'Captura al menos un descuento para construir la matriz.',
      productId: null,
      discountRate: null,
    }))
  }

  const normalizedDiscounts = input.discountRates.map(
    (discountRate) => roundPricingValue(discountRate, ratePrecision),
  )
  const discountSet = new Set<number>()

  normalizedDiscounts.forEach((discountRate) => {
    if (
      !Number.isFinite(discountRate) ||
      discountRate < 0 ||
      discountRate >= 1
    ) {
      issues.push(issue({
        code: 'PRICE_BATCH_INVALID_DISCOUNT',
        severity: 'invalid',
        message: 'Cada descuento debe ser mayor o igual a 0% y menor a 100%.',
        productId: null,
        discountRate: Number.isFinite(discountRate) ? discountRate : null,
      }))
    }

    if (discountSet.has(discountRate)) {
      issues.push(issue({
        code: 'PRICE_BATCH_DUPLICATE_DISCOUNT',
        severity: 'invalid',
        message: `El descuento ${(discountRate * 100).toLocaleString('es-MX')}% está duplicado.`,
        productId: null,
        discountRate,
      }))
    }

    discountSet.add(discountRate)
  })

  if (
    input.commonFactor.strategy === 'explicit' &&
    (
      !Number.isFinite(input.commonFactor.factor) ||
      (input.commonFactor.factor ?? 0) <= 0
    )
  ) {
    issues.push(issue({
      code: 'PRICE_BATCH_INVALID_COMMON_FACTOR',
      severity: 'invalid',
      message: 'El factor común explícito debe ser mayor a cero.',
      productId: null,
      discountRate: null,
    }))
  }

  if (issues.some((item) => item.severity === 'invalid')) {
    return invalidResult(input, issues)
  }

  const normalizedInput: PriceBatchDesignInput = {
    ...cloneInput(input),
    id,
    brandName: normalizeText(input.brandName),
    currency,
    products: normalizedProducts,
    discountRates: normalizedDiscounts,
    notes: normalizeText(input.notes),
  }

  const requiredRows = normalizedProducts.flatMap((product, productIndex) =>
    normalizedDiscounts.map((discountRate, discountIndex) => {
      const requiredDesign = evaluatePriceDesign({
        id: `${id}::${product.id}::REQUIRED::${discountIndex + 1}`,
        identity: {
          brandName: normalizedInput.brandName,
          model: product.model,
          sku: product.sku,
        },
        currency,
        cost: product.cost,
        discountRate,
        objective: cloneObjective(input.objective),
        notes: product.notes ?? normalizedInput.notes,
      }, {
        moneyPrecision,
        ratePrecision,
      })

      return {
        product,
        productIndex,
        discountRate,
        discountIndex,
        requiredDesign,
      }
    }),
  )

  const requiredFactors = requiredRows
    .map((row) => row.requiredDesign.metrics?.listPriceFactor ?? null)
    .filter((factor): factor is number => factor !== null)
  const commonListFactor = commonFactorFromRows(
    normalizedInput,
    requiredFactors,
    ratePrecision,
  )

  if (commonListFactor === null) {
    return invalidResult(normalizedInput, [
      ...issues,
      issue({
        code: 'PRICE_BATCH_NO_CALCULABLE_ROWS',
        severity: 'invalid',
        message: 'No existen filas calculables para determinar el factor común.',
        productId: null,
        discountRate: null,
      }),
    ])
  }

  const rows: PriceBatchDesignRow[] = requiredRows.map((row, index) => {
    const commonFactorDesign = evaluatePriceDesign({
      id: `${id}::${row.product.id}::COMMON::${row.discountIndex + 1}`,
      identity: {
        brandName: normalizedInput.brandName,
        model: row.product.model,
        sku: row.product.sku,
      },
      currency,
      cost: row.product.cost,
      discountRate: row.discountRate,
      objective: {
        type: 'list_price_factor',
        factor: commonListFactor,
      },
      notes: row.product.notes ?? normalizedInput.notes,
    }, {
      moneyPrecision,
      ratePrecision,
    })
    const requiredListFactor = row.requiredDesign.metrics?.listPriceFactor ?? null
    const metrics = commonFactorDesign.metrics
    let compliance: PriceBatchRowCompliance = 'invalid'

    if (metrics) {
      compliance = objectiveIsMet(metrics, normalizedInput.objective)
        ? 'meets_objective'
        : 'below_objective'
    }

    if (compliance === 'below_objective') {
      issues.push(issue({
        code: 'PRICE_BATCH_BELOW_OBJECTIVE',
        severity: 'warning',
        message: `${row.product.model ?? row.product.sku ?? row.product.id} queda debajo del objetivo al descuento ${(row.discountRate * 100).toLocaleString('es-MX')}%.`,
        productId: row.product.id,
        discountRate: row.discountRate,
      }))
    }

    return {
      key: `${row.product.id}::${row.discountRate}`,
      order: index + 1,
      product: cloneProduct(row.product),
      discountRate: row.discountRate,
      requiredDesign: row.requiredDesign,
      commonFactorDesign,
      requiredListFactor,
      commonListFactor,
      factorDelta: requiredListFactor === null
        ? null
        : roundPricingValue(
          commonListFactor - requiredListFactor,
          ratePrecision,
        ),
      compliance,
    }
  })

  const discountSummaries = buildDiscountSummaries(
    rows,
    normalizedDiscounts,
    moneyPrecision,
    ratePrecision,
  )
  const invalidRowCount = rows.filter(
    (row) => row.compliance === 'invalid',
  ).length
  const belowObjectiveCount = rows.filter(
    (row) => row.compliance === 'below_objective',
  ).length
  const warningRowCount = rows.filter((row) =>
    row.requiredDesign.status === 'warning' ||
    row.commonFactorDesign?.status === 'warning' ||
    row.compliance === 'below_objective',
  ).length
  const summary = {
    productCount: normalizedProducts.length,
    discountCount: normalizedDiscounts.length,
    matrixRowCount: rows.length,
    calculableRowCount: rows.length - invalidRowCount,
    warningRowCount,
    invalidRowCount,
    meetsObjectiveCount: rows.filter(
      (row) => row.compliance === 'meets_objective',
    ).length,
    belowObjectiveCount,
    commonListFactor,
  }

  return {
    available: rows.some((row) => row.commonFactorDesign?.available),
    methodology: PRICE_BATCH_DESIGN_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      createsProductsOrBrands: false,
      persistsBatch: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: invalidRowCount > 0
      ? 'invalid'
      : warningRowCount > 0
        ? 'warning'
        : 'valid',
    input: normalizedInput,
    commonListFactor,
    rows,
    discountSummaries,
    summary,
    issues,
    explainability: [
      strategyExplanation(normalizedInput, commonListFactor),
      'Cada factor individual requerido se calcula por producto y descuento con price-design-v1.',
      'La matriz vuelve a calcular cada producto usando el mismo factor de lista común para medir GP, margen y cumplimiento.',
      'Los totales agregados suman una unidad de cada producto; no representan una proyección de volumen.',
      'El resultado existe únicamente en memoria y no crea productos, marcas ni registros de precio.',
    ],
  }
}
