import type {
  BusinessPrice,
} from '../entities/price'

import {
  calculatePriceDiscountRate,
  calculatePriceFactor,
  calculatePriceFromDiscount,
  calculatePriceFromSellingFactor,
  calculatePriceFromTargetGrossMargin,
  calculatePriceFromTargetGrossProfit,
  calculatePriceGrossMargin,
  calculatePriceGrossProfit,
  classifyPriceMarginBand,
  roundPricingValue,
} from './pricingMath'

import {
  PRICE_DESIGN_METHODOLOGY,
} from './priceDesignContracts'

import type {
  PriceDesignInput,
  PriceDesignMetrics,
  PriceDesignObjective,
  PriceDesignOptions,
  PriceDesignResult,
  PriceDesignSignal,
} from './priceDesignContracts'

const DEFAULT_MONEY_PRECISION = 2
const DEFAULT_RATE_PRECISION = 6

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

function normalizeOptions(
  options: PriceDesignOptions | undefined,
): Required<PriceDesignOptions> {
  return {
    moneyPrecision: options?.moneyPrecision ?? DEFAULT_MONEY_PRECISION,
    ratePrecision: options?.ratePrecision ?? DEFAULT_RATE_PRECISION,
  }
}

function cloneInput(input: PriceDesignInput): PriceDesignInput {
  return {
    ...input,
    identity: {
      ...input.identity,
    },
    objective: {
      ...input.objective,
    },
  }
}

function signal(
  input: PriceDesignSignal,
): PriceDesignSignal {
  return {
    ...input,
  }
}

function invalidResult(
  input: PriceDesignInput,
  signals: readonly PriceDesignSignal[],
): PriceDesignResult {
  return {
    available: false,
    methodology: PRICE_DESIGN_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      persistsDesign: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: 'invalid',
    input: cloneInput(input),
    metrics: null,
    transientPrice: null,
    signals: signals.map(signal),
    explainability: [
      'El diseño no pudo calcularse porque faltan datos explícitos o existen valores inválidos.',
      'No se modificó ni persistió ningún precio de catálogo.',
    ],
  }
}

function isValidObjective(objective: PriceDesignObjective): boolean {
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

interface DerivedPriceDesign {
  listPrice: number
  sellingPrice: number
}

function derivePrices(
  cost: number,
  discountRate: number,
  objective: PriceDesignObjective,
): DerivedPriceDesign | null {
  const discountMultiplier = 1 - discountRate

  if (discountMultiplier <= 0) {
    return null
  }

  switch (objective.type) {
    case 'target_gross_margin': {
      const sellingPrice = calculatePriceFromTargetGrossMargin(
        cost,
        objective.grossMargin,
      )

      return sellingPrice === null
        ? null
        : {
          sellingPrice,
          listPrice: sellingPrice / discountMultiplier,
        }
    }

    case 'target_gross_profit': {
      const sellingPrice = calculatePriceFromTargetGrossProfit(
        cost,
        objective.grossProfit,
      )

      return sellingPrice === null
        ? null
        : {
          sellingPrice,
          listPrice: sellingPrice / discountMultiplier,
        }
    }

    case 'target_selling_price':
      return {
        sellingPrice: objective.sellingPrice,
        listPrice: objective.sellingPrice / discountMultiplier,
      }

    case 'list_price_factor': {
      const listPrice = calculatePriceFromSellingFactor(
        cost,
        objective.factor,
      )

      return listPrice === null
        ? null
        : {
          listPrice,
          sellingPrice: calculatePriceFromDiscount(
            listPrice,
            discountRate,
          ),
        }
    }

    case 'selling_price_factor': {
      const sellingPrice = calculatePriceFromSellingFactor(
        cost,
        objective.factor,
      )

      return sellingPrice === null
        ? null
        : {
          sellingPrice,
          listPrice: sellingPrice / discountMultiplier,
        }
    }

    case 'list_price':
      return {
        listPrice: objective.listPrice,
        sellingPrice: calculatePriceFromDiscount(
          objective.listPrice,
          discountRate,
        ),
      }
  }
}

function objectiveExplanation(
  objective: PriceDesignObjective,
): string {
  switch (objective.type) {
    case 'target_gross_margin':
      return 'El precio neto se calculó para alcanzar el margen objetivo y después se reconstruyó el precio de lista mediante el descuento declarado.'
    case 'target_gross_profit':
      return 'El precio neto se calculó sumando el GP unitario objetivo al costo y después se reconstruyó el precio de lista.'
    case 'target_selling_price':
      return 'El precio de lista se reconstruyó para que el descuento declarado produzca el precio neto objetivo.'
    case 'list_price_factor':
      return 'El precio de lista se calculó multiplicando el costo por el factor de lista capturado; el precio neto resulta del descuento declarado.'
    case 'selling_price_factor':
      return 'El precio neto se calculó multiplicando el costo por el factor neto capturado; el precio de lista se reconstruyó con el descuento declarado.'
    case 'list_price':
      return 'El precio neto se calculó aplicando el descuento declarado al precio de lista capturado.'
  }
}

function buildTransientPrice(
  input: PriceDesignInput,
  metrics: PriceDesignMetrics,
): BusinessPrice {
  const designId = normalizeIdentifier(input.id)
  const model = normalizeIdentifier(input.identity.model ?? '')
  const sku = normalizeIdentifier(input.identity.sku ?? '')
  const brandName = normalizeIdentifier(input.identity.brandName ?? '')
  const productId = [
    'MANUAL',
    model || sku || designId,
  ].join('::')
  const brandId = brandName || 'NEW-BRAND'

  return {
    id: `MANUAL-PRICE::${designId}`,
    productId,
    brandId,
    currency: metrics.currency,
    cost: metrics.cost,
    listPrice: metrics.listPrice,
    sellingPrice: metrics.sellingPrice,
    discountRate: metrics.discountRate,
    grossProfit: metrics.grossProfit,
    grossMargin: metrics.grossMargin,
    pricingFactor: metrics.listPriceFactor,
    marginBand: metrics.marginBand,
    pricingGroupId: null,
    effectiveDate: null,
    source: 'manual',
    sourceReference: 'Pricing Laboratory / new product design / in-memory',
  }
}

export function evaluatePriceDesign(
  input: PriceDesignInput,
  optionsInput?: PriceDesignOptions,
): PriceDesignResult {
  const options = normalizeOptions(optionsInput)
  const signals: PriceDesignSignal[] = []
  const id = normalizeIdentifier(input.id)
  const currency = normalizeIdentifier(input.currency)

  if (!id) {
    signals.push(signal({
      code: 'PRICE_DESIGN_INVALID_IDENTIFIER',
      severity: 'invalid',
      message: 'El diseño requiere un identificador temporal.',
      actual: null,
      threshold: null,
    }))
  }

  if (!currency) {
    signals.push(signal({
      code: 'PRICE_DESIGN_INVALID_CURRENCY',
      severity: 'invalid',
      message: 'Captura la moneda del costo y de los precios simulados.',
      actual: null,
      threshold: null,
    }))
  }

  if (!Number.isFinite(input.cost) || input.cost <= 0) {
    signals.push(signal({
      code: 'PRICE_DESIGN_INVALID_COST',
      severity: 'invalid',
      message: 'El costo debe ser un número mayor a cero.',
      actual: Number.isFinite(input.cost) ? input.cost : null,
      threshold: 0,
    }))
  }

  if (
    !Number.isFinite(input.discountRate) ||
    input.discountRate < 0 ||
    input.discountRate >= 1
  ) {
    signals.push(signal({
      code: 'PRICE_DESIGN_INVALID_DISCOUNT',
      severity: 'invalid',
      message: 'El descuento debe ser mayor o igual a 0% y menor a 100%.',
      actual: Number.isFinite(input.discountRate)
        ? input.discountRate
        : null,
      threshold: 1,
    }))
  }

  if (!isValidObjective(input.objective)) {
    signals.push(signal({
      code: 'PRICE_DESIGN_INVALID_OBJECTIVE',
      severity: 'invalid',
      message: 'El objetivo de cálculo requiere un valor explícito válido.',
      actual: null,
      threshold: null,
    }))
  }

  if (signals.some((item) => item.severity === 'invalid')) {
    return invalidResult(input, signals)
  }

  const derived = derivePrices(
    input.cost,
    input.discountRate,
    input.objective,
  )

  if (
    !derived ||
    !Number.isFinite(derived.listPrice) ||
    !Number.isFinite(derived.sellingPrice) ||
    derived.listPrice <= 0 ||
    derived.sellingPrice <= 0
  ) {
    return invalidResult(input, [
      ...signals,
      signal({
        code: 'PRICE_DESIGN_INVALID_OBJECTIVE',
        severity: 'invalid',
        message: 'El objetivo capturado no produce precios positivos y finitos.',
        actual: null,
        threshold: null,
      }),
    ])
  }

  const listPrice = roundPricingValue(
    derived.listPrice,
    options.moneyPrecision,
  )
  const sellingPrice = roundPricingValue(
    derived.sellingPrice,
    options.moneyPrecision,
  )
  const cost = roundPricingValue(
    input.cost,
    options.moneyPrecision,
  )
  const grossProfit = roundPricingValue(
    calculatePriceGrossProfit(sellingPrice, cost),
    options.moneyPrecision,
  )
  const grossMargin = roundPricingValue(
    calculatePriceGrossMargin(sellingPrice, cost),
    options.ratePrecision,
  )
  const listPriceFactor = roundPricingValue(
    calculatePriceFactor(listPrice, cost) ?? 0,
    options.ratePrecision,
  )
  const sellingPriceFactor = roundPricingValue(
    calculatePriceFactor(sellingPrice, cost) ?? 0,
    options.ratePrecision,
  )
  const discountRate = roundPricingValue(
    calculatePriceDiscountRate(listPrice, sellingPrice),
    options.ratePrecision,
  )

  if (grossProfit < 0) {
    signals.push(signal({
      code: 'PRICE_DESIGN_NEGATIVE_GROSS_PROFIT',
      severity: 'warning',
      message: 'El diseño produce GP unitario negativo al descuento capturado.',
      actual: grossProfit,
      threshold: 0,
    }))
  }

  if (listPriceFactor < 1) {
    signals.push(signal({
      code: 'PRICE_DESIGN_LIST_FACTOR_BELOW_ONE',
      severity: 'warning',
      message: 'El factor de lista queda por debajo de 1.00 respecto al costo.',
      actual: listPriceFactor,
      threshold: 1,
    }))
  }

  const metrics: PriceDesignMetrics = {
    currency,
    cost,
    discountRate,
    listPrice,
    sellingPrice,
    grossProfit,
    grossMargin,
    listPriceFactor,
    sellingPriceFactor,
    marginBand: classifyPriceMarginBand(grossMargin),
  }
  const normalizedInput: PriceDesignInput = {
    ...cloneInput(input),
    id,
    currency,
    identity: {
      brandName: normalizeText(input.identity.brandName),
      model: normalizeText(input.identity.model),
      sku: normalizeText(input.identity.sku),
    },
    notes: normalizeText(input.notes),
  }

  return {
    available: true,
    methodology: PRICE_DESIGN_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      persistsDesign: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: signals.some((item) => item.severity === 'warning')
      ? 'warning'
      : 'valid',
    input: normalizedInput,
    metrics,
    transientPrice: buildTransientPrice(normalizedInput, metrics),
    signals,
    explainability: [
      objectiveExplanation(input.objective),
      'Precio neto = Precio de lista × (1 - descuento).',
      'Factor de lista = Precio de lista ÷ costo.',
      'Factor neto = Precio de venta neto ÷ costo.',
      'El resultado existe únicamente en memoria y no crea un producto ni un precio comercial.',
    ],
  }
}
