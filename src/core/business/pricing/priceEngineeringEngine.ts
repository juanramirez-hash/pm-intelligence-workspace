import type {
  BusinessPrice,
  BusinessPriceScenario,
} from '../entities/price'

import {
  calculatePriceAfterAdditionalDiscount,
  calculatePriceDiscountRate,
  calculatePriceFromDiscount,
  calculatePriceFromSellingFactor,
  calculatePriceFromTargetGrossMargin,
  calculatePriceFromTargetGrossProfit,
  calculatePriceGrossMargin,
  calculatePriceGrossProfit,
  calculatePriceFactor,
  calculateSellingPriceFactor,
  classifyPriceMarginBand,
  roundPricingValue,
} from './pricingMath'

import {
  PRICE_ENGINEERING_EXECUTION_MODE,
  PRICE_ENGINEERING_METHODOLOGY,
} from './priceEngineeringContracts'

import type {
  PriceEngineeringDelta,
  PriceEngineeringEvaluationStatus,
  PriceEngineeringGuardrail,
  PriceEngineeringLaboratoryInput,
  PriceEngineeringLaboratoryResult,
  PriceEngineeringMetrics,
  PriceEngineeringOptions,
  PriceEngineeringScenarioBasis,
  PriceEngineeringScenarioEvaluation,
  PriceEngineeringScenarioInput,
  PriceEngineeringSignal,
} from './priceEngineeringContracts'

const DEFAULT_MONEY_PRECISION = 2
const DEFAULT_RATE_PRECISION = 6
const COMPARISON_TOLERANCE = 1e-9

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function clonePrice(price: Readonly<BusinessPrice>): BusinessPrice {
  return {
    ...price,
  }
}

function normalizeOptions(
  options: PriceEngineeringOptions | undefined,
): Required<PriceEngineeringOptions> {
  return {
    moneyPrecision: options?.moneyPrecision ??
      DEFAULT_MONEY_PRECISION,
    ratePrecision: options?.ratePrecision ??
      DEFAULT_RATE_PRECISION,
  }
}

function createSignal(
  signal: PriceEngineeringSignal,
): PriceEngineeringSignal {
  return {
    ...signal,
  }
}

function validateSourcePrice(
  price: Readonly<BusinessPrice>,
): PriceEngineeringSignal[] {
  const values = [
    price.cost,
    price.listPrice,
    price.sellingPrice,
  ]

  if (
    !normalizeIdentifier(price.id) ||
    !normalizeIdentifier(price.productId) ||
    !normalizeIdentifier(price.currency) ||
    values.some((value) => !Number.isFinite(value)) ||
    price.cost < 0 ||
    price.listPrice <= 0 ||
    price.sellingPrice <= 0
  ) {
    return [createSignal({
      code: 'INVALID_SOURCE_PRICE',
      severity: 'invalid',
      message: 'El precio fuente no cumple el contrato mínimo del laboratorio.',
      actual: null,
      threshold: null,
    })]
  }

  return []
}

function buildMetrics(
  price: Readonly<BusinessPrice>,
  sellingPriceInput: number,
  options: Required<PriceEngineeringOptions>,
): PriceEngineeringMetrics {
  const sellingPrice = roundPricingValue(
    sellingPriceInput,
    options.moneyPrecision,
  )

  const grossProfit = roundPricingValue(
    calculatePriceGrossProfit(sellingPrice, price.cost),
    options.moneyPrecision,
  )

  const grossMargin = roundPricingValue(
    calculatePriceGrossMargin(sellingPrice, price.cost),
    options.ratePrecision,
  )

  return {
    currency: price.currency,
    cost: roundPricingValue(price.cost, options.moneyPrecision),
    listPrice: roundPricingValue(
      price.listPrice,
      options.moneyPrecision,
    ),
    sellingPrice,
    discountRate: roundPricingValue(
      calculatePriceDiscountRate(price.listPrice, sellingPrice),
      options.ratePrecision,
    ),
    grossProfit,
    grossMargin,
    listPriceFactor: nullableRound(
      calculatePriceFactor(price.listPrice, price.cost),
      options.ratePrecision,
    ),
    sellingPriceFactor: nullableRound(
      calculateSellingPriceFactor(sellingPrice, price.cost),
      options.ratePrecision,
    ),
    marginBand: classifyPriceMarginBand(grossMargin),
  }
}

function nullableRound(
  value: number | null,
  precision: number,
): number | null {
  return value === null
    ? null
    : roundPricingValue(value, precision)
}

function deriveSellingPrice(
  price: Readonly<BusinessPrice>,
  basis: PriceEngineeringScenarioBasis,
): number | null {
  switch (basis.type) {
    case 'selling_price':
      return Number.isFinite(basis.sellingPrice) &&
        basis.sellingPrice > 0
        ? basis.sellingPrice
        : null

    case 'discount_rate':
      return Number.isFinite(basis.discountRate) &&
        basis.discountRate < 1
        ? calculatePriceFromDiscount(
          price.listPrice,
          basis.discountRate,
        )
        : null

    case 'target_gross_margin':
      return calculatePriceFromTargetGrossMargin(
        price.cost,
        basis.grossMargin,
      )

    case 'target_gross_profit':
      return calculatePriceFromTargetGrossProfit(
        price.cost,
        basis.grossProfit,
      )

    case 'selling_price_factor':
      return calculatePriceFromSellingFactor(
        price.cost,
        basis.factor,
      )

    case 'additional_discount': {
      if (
        !Number.isFinite(basis.discountRate) ||
        basis.discountRate >= 1
      ) {
        return null
      }

      const source = basis.applyTo === 'list_price'
        ? price.listPrice
        : price.sellingPrice

      return calculatePriceAfterAdditionalDiscount(
        source,
        basis.discountRate,
      )
    }
  }
}

function buildDelta(
  base: PriceEngineeringMetrics,
  scenario: PriceEngineeringMetrics,
  options: Required<PriceEngineeringOptions>,
): PriceEngineeringDelta {
  return {
    sellingPrice: roundPricingValue(
      scenario.sellingPrice - base.sellingPrice,
      options.moneyPrecision,
    ),
    sellingPriceRate: calculateDeltaRate(
      base.sellingPrice,
      scenario.sellingPrice,
      options.ratePrecision,
    ),
    discountRate: roundPricingValue(
      scenario.discountRate - base.discountRate,
      options.ratePrecision,
    ),
    grossProfit: roundPricingValue(
      scenario.grossProfit - base.grossProfit,
      options.moneyPrecision,
    ),
    grossProfitRate: calculateDeltaRate(
      base.grossProfit,
      scenario.grossProfit,
      options.ratePrecision,
    ),
    grossMargin: roundPricingValue(
      scenario.grossMargin - base.grossMargin,
      options.ratePrecision,
    ),
  }
}

function calculateDeltaRate(
  base: number,
  scenario: number,
  precision: number,
): number | null {
  if (base === 0) {
    return null
  }

  return roundPricingValue(
    (scenario - base) / Math.abs(base),
    precision,
  )
}

function buildDiagnosticSignals(
  metrics: PriceEngineeringMetrics,
): PriceEngineeringSignal[] {
  const signals: PriceEngineeringSignal[] = []

  if (metrics.grossProfit < 0) {
    signals.push(createSignal({
      code: 'NEGATIVE_GROSS_PROFIT',
      severity: 'warning',
      message: 'El escenario genera Gross Profit unitario negativo.',
      actual: metrics.grossProfit,
      threshold: 0,
    }))
  }

  if (metrics.sellingPrice > metrics.listPrice) {
    signals.push(createSignal({
      code: 'SELLING_PRICE_ABOVE_LIST',
      severity: 'warning',
      message: 'El precio simulado queda por arriba del precio de lista.',
      actual: metrics.sellingPrice,
      threshold: metrics.listPrice,
    }))
  }

  return signals
}

function buildGuardrailSignals(
  metrics: PriceEngineeringMetrics,
  guardrails: readonly PriceEngineeringGuardrail[],
): PriceEngineeringSignal[] {
  const signals: PriceEngineeringSignal[] = []

  guardrails.forEach((guardrail) => {
    if (!Number.isFinite(guardrail.threshold)) {
      signals.push(createSignal({
        code: 'INVALID_GUARDRAIL',
        severity: 'invalid',
        message: 'El escenario contiene una restricción no numérica.',
        actual: null,
        threshold: null,
      }))
      return
    }

    switch (guardrail.type) {
      case 'minimum_gross_margin':
        if (
          metrics.grossMargin + COMPARISON_TOLERANCE <
          guardrail.threshold
        ) {
          signals.push(createSignal({
            code: 'MINIMUM_GROSS_MARGIN_NOT_MET',
            severity: guardrail.severity,
            message: 'El escenario no alcanza el margen mínimo solicitado.',
            actual: metrics.grossMargin,
            threshold: guardrail.threshold,
          }))
        }
        break

      case 'minimum_gross_profit':
        if (
          metrics.grossProfit + COMPARISON_TOLERANCE <
          guardrail.threshold
        ) {
          signals.push(createSignal({
            code: 'MINIMUM_GROSS_PROFIT_NOT_MET',
            severity: guardrail.severity,
            message: 'El escenario no alcanza el GP unitario mínimo solicitado.',
            actual: metrics.grossProfit,
            threshold: guardrail.threshold,
          }))
        }
        break

      case 'minimum_selling_price':
        if (
          metrics.sellingPrice + COMPARISON_TOLERANCE <
          guardrail.threshold
        ) {
          signals.push(createSignal({
            code: 'MINIMUM_SELLING_PRICE_NOT_MET',
            severity: guardrail.severity,
            message: 'El escenario queda por debajo del precio piso suministrado.',
            actual: metrics.sellingPrice,
            threshold: guardrail.threshold,
          }))
        }
        break

      case 'maximum_selling_price':
        if (
          metrics.sellingPrice - COMPARISON_TOLERANCE >
          guardrail.threshold
        ) {
          signals.push(createSignal({
            code: 'MAXIMUM_SELLING_PRICE_EXCEEDED',
            severity: guardrail.severity,
            message: 'El escenario supera el precio máximo suministrado.',
            actual: metrics.sellingPrice,
            threshold: guardrail.threshold,
          }))
        }
        break

      case 'maximum_discount_rate':
        if (
          metrics.discountRate - COMPARISON_TOLERANCE >
          guardrail.threshold
        ) {
          signals.push(createSignal({
            code: 'MAXIMUM_DISCOUNT_RATE_EXCEEDED',
            severity: guardrail.severity,
            message: 'El escenario supera el descuento máximo suministrado.',
            actual: metrics.discountRate,
            threshold: guardrail.threshold,
          }))
        }
        break
    }
  })

  return signals
}

function resolveStatus(
  signals: readonly PriceEngineeringSignal[],
): PriceEngineeringEvaluationStatus {
  if (signals.some((signal) => signal.severity === 'invalid')) {
    return 'invalid'
  }

  if (signals.some((signal) => signal.severity === 'blocking')) {
    return 'blocked'
  }

  if (signals.some((signal) => signal.severity === 'warning')) {
    return 'warning'
  }

  return 'valid'
}

function explainBasis(
  basis: PriceEngineeringScenarioBasis,
): string {
  switch (basis.type) {
    case 'selling_price':
      return 'El escenario parte de un precio de venta capturado manualmente.'
    case 'discount_rate':
      return 'El escenario aplica un descuento directo sobre el precio de lista.'
    case 'target_gross_margin':
      return 'El escenario despeja el precio requerido para el margen objetivo.'
    case 'target_gross_profit':
      return 'El escenario suma el GP unitario objetivo al costo.'
    case 'selling_price_factor':
      return 'El escenario aplica un factor de precio de venta sobre el costo.'
    case 'additional_discount':
      return basis.applyTo === 'list_price'
        ? 'El descuento adicional se aplica sobre el precio de lista.'
        : 'El descuento adicional se compone sobre el precio de venta actual.'
  }
}

function buildExplainability(
  basis: PriceEngineeringScenarioBasis,
  metrics: PriceEngineeringMetrics | null,
  delta: PriceEngineeringDelta | null,
  status: PriceEngineeringEvaluationStatus,
  signalCount: number,
): string[] {
  const explanations = [explainBasis(basis)]

  if (metrics && delta) {
    explanations.push(
      `Precio simulado ${metrics.sellingPrice.toFixed(2)} ${metrics.currency}; ` +
      `GP ${metrics.grossProfit.toFixed(2)} y margen ` +
      `${(metrics.grossMargin * 100).toFixed(2)}%.`,
    )
    explanations.push(
      `Variación contra el precio actual: ` +
      `${delta.sellingPrice.toFixed(2)} ${metrics.currency}; ` +
      `variación de margen ` +
      `${(delta.grossMargin * 100).toFixed(2)} puntos porcentuales.`,
    )
  }

  if (status === 'valid') {
    explanations.push('El escenario no activa advertencias ni restricciones suministradas.')
  } else {
    explanations.push(
      `El escenario termina en estado ${status} con ${signalCount} señal(es).`,
    )
  }

  return explanations
}

export function evaluatePriceScenario(
  price: Readonly<BusinessPrice>,
  base: PriceEngineeringMetrics,
  scenario: Readonly<PriceEngineeringScenarioInput>,
  defaultGuardrails: readonly PriceEngineeringGuardrail[] = [],
  optionsInput?: PriceEngineeringOptions,
): PriceEngineeringScenarioEvaluation {
  const options = normalizeOptions(optionsInput)
  const scenarioId = normalizeIdentifier(scenario.id)
  const pricingGroupId = scenario.pricingGroupId
    ? normalizeIdentifier(scenario.pricingGroupId)
    : null

  if (!scenarioId || !scenario.name.trim()) {
    const signals = [createSignal({
      code: 'INVALID_SCENARIO_IDENTIFIER',
      severity: 'invalid',
      message: 'El escenario requiere identificador y nombre.',
      actual: null,
      threshold: null,
    })]

    return {
      scenarioId,
      name: scenario.name.trim(),
      kind: scenario.kind,
      pricingGroupId,
      basis: { ...scenario.basis },
      status: 'invalid',
      metrics: null,
      delta: null,
      signals,
      explainability: buildExplainability(
        scenario.basis,
        null,
        null,
        'invalid',
        signals.length,
      ),
    }
  }

  const sellingPrice = deriveSellingPrice(price, scenario.basis)

  if (
    sellingPrice === null ||
    !Number.isFinite(sellingPrice) ||
    sellingPrice <= 0
  ) {
    const signals = [createSignal({
      code: 'INVALID_SCENARIO_BASIS',
      severity: 'invalid',
      message: 'La base del escenario no produce un precio de venta válido.',
      actual: sellingPrice,
      threshold: 0,
    })]

    return {
      scenarioId,
      name: scenario.name.trim(),
      kind: scenario.kind,
      pricingGroupId,
      basis: { ...scenario.basis },
      status: 'invalid',
      metrics: null,
      delta: null,
      signals,
      explainability: buildExplainability(
        scenario.basis,
        null,
        null,
        'invalid',
        signals.length,
      ),
    }
  }

  const metrics = buildMetrics(price, sellingPrice, options)
  const delta = buildDelta(base, metrics, options)
  const guardrails = [
    ...defaultGuardrails,
    ...(scenario.guardrails ?? []),
  ]
  const signals = [
    ...buildDiagnosticSignals(metrics),
    ...buildGuardrailSignals(metrics, guardrails),
  ]
  const status = resolveStatus(signals)

  return {
    scenarioId,
    name: scenario.name.trim(),
    kind: scenario.kind,
    pricingGroupId,
    basis: { ...scenario.basis },
    status,
    metrics,
    delta,
    signals,
    explainability: buildExplainability(
      scenario.basis,
      metrics,
      delta,
      status,
      signals.length,
    ),
  }
}

export function createEngineeringScenarioFromStored(
  scenario: Readonly<BusinessPriceScenario>,
  guardrails: readonly PriceEngineeringGuardrail[] = [],
): PriceEngineeringScenarioInput {
  return {
    id: scenario.id,
    name: scenario.name,
    kind: scenario.kind,
    pricingGroupId: scenario.pricingGroupId,
    basis: {
      type: 'selling_price',
      sellingPrice: scenario.sellingPrice,
    },
    guardrails: guardrails.map((guardrail) => ({
      ...guardrail,
    })),
  }
}

export function evaluatePriceLaboratory(
  input: Readonly<PriceEngineeringLaboratoryInput>,
): PriceEngineeringLaboratoryResult {
  const sourcePrice = clonePrice(input.price)
  const options = normalizeOptions(input.options)
  const sourceSignals = validateSourcePrice(sourcePrice)

  if (sourceSignals.length > 0) {
    return {
      available: false,
      methodology: PRICE_ENGINEERING_METHODOLOGY,
      executionMode: PRICE_ENGINEERING_EXECUTION_MODE,
      isolation: {
        mutatesSourcePrice: false,
        persistsScenarioResults: false,
        writesBusinessRepository: false,
        writesOtherWorkspaces: false,
      },
      sourcePrice,
      base: null,
      scenarios: [],
      summary: {
        totalScenarios: 0,
        validScenarios: 0,
        warningScenarios: 0,
        blockedScenarios: 0,
        invalidScenarios: 0,
      },
      signals: sourceSignals,
    }
  }

  const base = buildMetrics(
    sourcePrice,
    sourcePrice.sellingPrice,
    options,
  )

  const scenarios = input.scenarios.map((scenario) =>
    evaluatePriceScenario(
      sourcePrice,
      base,
      scenario,
      input.defaultGuardrails,
      options,
    ),
  )

  return {
    available: true,
    methodology: PRICE_ENGINEERING_METHODOLOGY,
    executionMode: PRICE_ENGINEERING_EXECUTION_MODE,
    isolation: {
      mutatesSourcePrice: false,
      persistsScenarioResults: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    sourcePrice,
    base,
    scenarios,
    summary: {
      totalScenarios: scenarios.length,
      validScenarios: scenarios.filter(
        (scenario) => scenario.status === 'valid',
      ).length,
      warningScenarios: scenarios.filter(
        (scenario) => scenario.status === 'warning',
      ).length,
      blockedScenarios: scenarios.filter(
        (scenario) => scenario.status === 'blocked',
      ).length,
      invalidScenarios: scenarios.filter(
        (scenario) => scenario.status === 'invalid',
      ).length,
    },
    signals: [],
  }
}

export class PriceEngineeringEngine {
  evaluate(
    input: Readonly<PriceEngineeringLaboratoryInput>,
  ): PriceEngineeringLaboratoryResult {
    return evaluatePriceLaboratory(input)
  }
}
