import type {
  PriceBatchDesignResult,
  PriceCorridorCostBasis,
  PriceCorridorInput,
} from '../../../core/business/pricing'

export interface PricingCorridorScenarioDraft {
  key: string
  label: string
  costChangePercent: string
  exchangeRate: string
  notes: string
}

export interface PricingCorridorTierDraft {
  key: string
  label: string
  discountPercent: string
  minimumGrossMarginPercent: string
  minimumGrossProfit: string
  notes: string
}

export interface PricingCorridorDraft {
  sourceCostCurrency: string
  reportingCurrency: string
  referenceExchangeRate: string
  costBasis: PriceCorridorCostBasis
  quantities: Record<string, string>
  explicitLandedCosts: Record<string, string>
  scenarios: PricingCorridorScenarioDraft[]
  tiers: PricingCorridorTierDraft[]
  commonListFactors: string
  notes: string
}

export interface PricingCorridorDraftResult {
  valid: boolean
  input: PriceCorridorInput | null
  errors: string[]
}

function parseNumber(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.')

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)

  return Number.isFinite(parsed)
    ? parsed
    : null
}

function sourceFloorValues(
  source: PriceBatchDesignResult,
): {
  minimumGrossMarginPercent: string
  minimumGrossProfit: string
} {
  switch (source.input.objective.type) {
    case 'target_gross_margin':
      return {
        minimumGrossMarginPercent:
          (source.input.objective.grossMargin * 100).toString(),
        minimumGrossProfit: '',
      }
    case 'target_gross_profit':
      return {
        minimumGrossMarginPercent: '',
        minimumGrossProfit:
          source.input.objective.grossProfit.toString(),
      }
    default:
      return {
        minimumGrossMarginPercent: '',
        minimumGrossProfit: '',
      }
  }
}

export function createEmptyPricingCorridorScenarioDraft(
  sequence: number,
  exchangeRate = '',
): PricingCorridorScenarioDraft {
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    key: `corridor-scenario-${normalizedSequence}`,
    label: normalizedSequence === 1 ? 'Base' : '',
    costChangePercent: normalizedSequence === 1 ? '0' : '',
    exchangeRate,
    notes: '',
  }
}

export function createEmptyPricingCorridorTierDraft(
  sequence: number,
): PricingCorridorTierDraft {
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    key: `corridor-tier-${normalizedSequence}`,
    label: '',
    discountPercent: '',
    minimumGrossMarginPercent: '',
    minimumGrossProfit: '',
    notes: '',
  }
}

export function createEmptyPricingCorridorDraft(
  source: PriceBatchDesignResult,
): PricingCorridorDraft {
  const floorValues = sourceFloorValues(source)
  const discounts = source.input.discountRates.length > 0
    ? source.input.discountRates
    : [0]

  return {
    sourceCostCurrency: source.input.currency,
    reportingCurrency: source.input.currency,
    referenceExchangeRate: '1',
    costBasis: 'reference_purchase_cost',
    quantities: Object.fromEntries(
      source.input.products.map((product) => [product.id, '1']),
    ),
    explicitLandedCosts: Object.fromEntries(
      source.input.products.map((product) => [product.id, '']),
    ),
    scenarios: [
      createEmptyPricingCorridorScenarioDraft(1, '1'),
    ],
    tiers: discounts.map((discountRate, index) => ({
      key: `corridor-tier-${index + 1}`,
      label: `Nivel ${(discountRate * 100).toLocaleString('es-MX')}%`,
      discountPercent: (discountRate * 100).toString(),
      minimumGrossMarginPercent:
        floorValues.minimumGrossMarginPercent,
      minimumGrossProfit:
        floorValues.minimumGrossProfit,
      notes: '',
    })),
    commonListFactors: source.commonListFactor?.toString() ?? '',
    notes: '',
  }
}

export function parsePricingCorridorFactors(
  value: string,
): {
  factors: number[]
  errors: string[]
} {
  const tokens = value
    .split(/[\s,;|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  const errors: string[] = []
  const factors: number[] = []
  const seen = new Set<number>()

  tokens.forEach((token) => {
    const factor = parseNumber(token)

    if (factor === null || factor <= 0) {
      errors.push(`El factor "${token}" debe ser un número mayor a cero.`)
      return
    }

    if (seen.has(factor)) {
      errors.push(`El factor ${factor.toLocaleString('es-MX')}x está duplicado.`)
      return
    }

    seen.add(factor)
    factors.push(factor)
  })

  if (factors.length === 0 && errors.length === 0) {
    errors.push('Captura al menos un factor común candidato.')
  }

  return {
    factors,
    errors,
  }
}

export function buildPriceCorridorInputFromDraft(
  source: PriceBatchDesignResult,
  draft: PricingCorridorDraft,
  sequence: number,
): PricingCorridorDraftResult {
  const errors: string[] = []
  const parsedFactors = parsePricingCorridorFactors(
    draft.commonListFactors,
  )
  errors.push(...parsedFactors.errors)

  if (!source.available) {
    errors.push('Calcula primero una matriz por lote válida.')
  }

  const sourceCostCurrency = draft.sourceCostCurrency
    .trim()
    .toLocaleUpperCase('es-MX')
  const reportingCurrency = draft.reportingCurrency
    .trim()
    .toLocaleUpperCase('es-MX')
  const referenceExchangeRate = parseNumber(
    draft.referenceExchangeRate,
  )

  if (!sourceCostCurrency) {
    errors.push('Captura la moneda del costo.')
  }

  if (!reportingCurrency) {
    errors.push('Captura la moneda de reporte.')
  }

  if (
    referenceExchangeRate === null ||
    referenceExchangeRate <= 0
  ) {
    errors.push('El tipo de cambio de referencia debe ser mayor a cero.')
  }

  const products = source.input.products.map((product) => {
    const quantity = parseNumber(
      draft.quantities[product.id] ?? '',
    )
    const explicitLandedCost = parseNumber(
      draft.explicitLandedCosts[product.id] ?? '',
    )

    if (quantity === null || quantity < 0) {
      errors.push(
        `${product.model ?? product.sku ?? product.id}: la cantidad debe ser mayor o igual a cero.`,
      )
    }

    if (
      draft.costBasis === 'reference_landed_cost' &&
      (
        explicitLandedCost === null ||
        explicitLandedCost <= 0
      )
    ) {
      errors.push(
        `${product.model ?? product.sku ?? product.id}: captura un costo aterrizado explícito mayor a cero.`,
      )
    }

    return {
      ...product,
      quantity: quantity ?? -1,
      explicitLandedCost: explicitLandedCost !== null &&
        explicitLandedCost > 0
        ? explicitLandedCost
        : null,
    }
  })

  if (!products.some((product) => product.quantity > 0)) {
    errors.push('Captura al menos una cantidad mayor a cero.')
  }

  if (draft.scenarios.length === 0) {
    errors.push('Captura al menos un escenario.')
  }

  const scenarioLabels = new Set<string>()
  const scenarios = draft.scenarios.flatMap((scenario, index) => {
    const label = scenario.label.trim().replace(/\s+/g, ' ')
    const normalizedLabel = label.toLocaleUpperCase('es-MX')
    const costChangePercent = parseNumber(
      scenario.costChangePercent,
    )
    const exchangeRate = parseNumber(scenario.exchangeRate)

    if (!label) {
      errors.push(`Escenario ${index + 1}: captura un nombre.`)
    }

    if (label && scenarioLabels.has(normalizedLabel)) {
      errors.push(`${label}: el escenario está duplicado.`)
    }

    if (label) {
      scenarioLabels.add(normalizedLabel)
    }

    if (
      costChangePercent === null ||
      costChangePercent <= -100
    ) {
      errors.push(
        `${label || `Escenario ${index + 1}`}: la variación de costo debe ser mayor a -100%.`,
      )
    }

    if (exchangeRate === null || exchangeRate <= 0) {
      errors.push(
        `${label || `Escenario ${index + 1}`}: el tipo de cambio debe ser mayor a cero.`,
      )
    }

    if (
      !label ||
      costChangePercent === null ||
      exchangeRate === null
    ) {
      return []
    }

    return [{
      id: `CORRIDOR-SCENARIO-${index + 1}`,
      label,
      costChangeRate: costChangePercent / 100,
      exchangeRate,
      notes: scenario.notes.trim() || null,
    }]
  })

  if (draft.tiers.length === 0) {
    errors.push('Captura al menos un nivel comercial.')
  }

  const tierLabels = new Set<string>()
  const tiers = draft.tiers.flatMap((tier, index) => {
    const label = tier.label.trim().replace(/\s+/g, ' ')
    const normalizedLabel = label.toLocaleUpperCase('es-MX')
    const discountPercent = parseNumber(tier.discountPercent)
    const marginPercent = parseNumber(
      tier.minimumGrossMarginPercent,
    )
    const grossProfit = parseNumber(tier.minimumGrossProfit)
    const hasMargin = marginPercent !== null
    const hasGrossProfit = grossProfit !== null

    if (!label) {
      errors.push(`Nivel ${index + 1}: captura una etiqueta.`)
    }

    if (label && tierLabels.has(normalizedLabel)) {
      errors.push(`${label}: el nivel está duplicado.`)
    }

    if (label) {
      tierLabels.add(normalizedLabel)
    }

    if (
      discountPercent === null ||
      discountPercent < 0 ||
      discountPercent >= 100
    ) {
      errors.push(
        `${label || `Nivel ${index + 1}`}: el descuento debe estar entre 0% y menos de 100%.`,
      )
    }

    if (
      hasMargin &&
      (
        marginPercent < 0 ||
        marginPercent >= 100
      )
    ) {
      errors.push(
        `${label || `Nivel ${index + 1}`}: el margen mínimo debe estar entre 0% y menos de 100%.`,
      )
    }

    if (hasGrossProfit && grossProfit < 0) {
      errors.push(
        `${label || `Nivel ${index + 1}`}: el GP mínimo no puede ser negativo.`,
      )
    }

    if (!hasMargin && !hasGrossProfit) {
      errors.push(
        `${label || `Nivel ${index + 1}`}: captura al menos un piso de margen o GP.`,
      )
    }

    if (
      !label ||
      discountPercent === null ||
      (!hasMargin && !hasGrossProfit)
    ) {
      return []
    }

    return [{
      id: `CORRIDOR-TIER-${index + 1}`,
      label,
      discountRate: discountPercent / 100,
      minimumGrossMargin: hasMargin
        ? marginPercent / 100
        : null,
      minimumGrossProfit: hasGrossProfit
        ? grossProfit
        : null,
      notes: tier.notes.trim() || null,
    }]
  })

  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    valid: errors.length === 0,
    input: errors.length > 0
      ? null
      : {
        id: `PRICE-CORRIDOR-${normalizedSequence}`,
        sourceBatchId: source.input.id,
        brandName: source.input.brandName,
        sourceCostCurrency,
        reportingCurrency,
        referenceExchangeRate: referenceExchangeRate ?? -1,
        costBasis: draft.costBasis,
        products,
        scenarios,
        tiers,
        commonListFactors: parsedFactors.factors,
        notes: draft.notes.trim() || source.input.notes || null,
      },
    errors,
  }
}
