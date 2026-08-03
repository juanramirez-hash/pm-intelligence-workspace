import type {
  PriceBatchDesignResult,
  PriceCostFxStressInput,
  PriceTierObjective,
  PriceTierObjectiveType,
} from '../../../core/business/pricing'

export interface PricingCostFxStressScenarioDraft {
  key: string
  label: string
  costChangePercent: string
  exchangeRate: string
  notes: string
}

export interface PricingCostFxStressTierDraft {
  key: string
  label: string
  discountRate: string
  objectiveType: PriceTierObjectiveType
  objectiveValue: string
  notes: string
}

export interface PricingCostFxStressDraft {
  sourceCostCurrency: string
  reportingCurrency: string
  referenceExchangeRate: string
  commonListFactors: string
  quantities: Record<string, string>
  scenarios: PricingCostFxStressScenarioDraft[]
  tiers: PricingCostFxStressTierDraft[]
  notes: string
}

export interface PricingCostFxStressDraftResult {
  valid: boolean
  input: PriceCostFxStressInput | null
  errors: string[]
}

export function createEmptyPricingCostFxStressScenarioDraft(
  sequence: number,
): PricingCostFxStressScenarioDraft {
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    key: `stress-${normalizedSequence}`,
    label: normalizedSequence === 1
      ? 'Base'
      : `Escenario ${normalizedSequence}`,
    costChangePercent: normalizedSequence === 1 ? '0' : '',
    exchangeRate: normalizedSequence === 1 ? '1' : '',
    notes: '',
  }
}

export function createEmptyPricingCostFxStressTierDraft(
  sequence: number,
): PricingCostFxStressTierDraft {
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    key: `stress-tier-${normalizedSequence}`,
    label: '',
    discountRate: '',
    objectiveType: 'minimum_gross_margin',
    objectiveValue: '',
    notes: '',
  }
}

export function createEmptyPricingCostFxStressDraft(
  source?: PriceBatchDesignResult | null,
): PricingCostFxStressDraft {
  const currency = source?.input.currency ?? ''

  return {
    sourceCostCurrency: currency,
    reportingCurrency: currency,
    referenceExchangeRate: '1',
    commonListFactors: source?.commonListFactor
      ? String(source.commonListFactor)
      : '',
    quantities: Object.fromEntries(
      (source?.input.products ?? []).map((product) => [product.id, '1']),
    ),
    scenarios: [createEmptyPricingCostFxStressScenarioDraft(1)],
    tiers: [createEmptyPricingCostFxStressTierDraft(1)],
    notes: '',
  }
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

export function parsePricingCostFxStressFactors(
  value: string,
): {
  factors: number[]
  errors: string[]
} {
  const tokens = value
    .split(/[\s,;|]+/)
    .map((token) => token.trim())
    .filter(Boolean)
  const factors: number[] = []
  const errors: string[] = []
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

  if (tokens.length === 0) {
    errors.push('Captura al menos un factor común candidato.')
  }

  return {
    factors,
    errors,
  }
}

function buildTierObjective(
  tier: PricingCostFxStressTierDraft,
  index: number,
  errors: string[],
): PriceTierObjective | null {
  const value = parseNumber(tier.objectiveValue)
  const label = tier.label.trim() || `Nivel ${index + 1}`

  if (value === null) {
    errors.push(`${label}: captura un objetivo numérico.`)
    return null
  }

  if (tier.objectiveType === 'minimum_gross_margin') {
    if (value < 0 || value >= 100) {
      errors.push(`${label}: el margen mínimo debe estar entre 0% y menos de 100%.`)
      return null
    }

    return {
      type: 'minimum_gross_margin',
      grossMargin: value / 100,
    }
  }

  if (value < 0) {
    errors.push(`${label}: el GP unitario mínimo no puede ser negativo.`)
    return null
  }

  return {
    type: 'minimum_gross_profit',
    grossProfit: value,
  }
}

export function buildPriceCostFxStressInputFromDraft(
  source: PriceBatchDesignResult,
  draft: PricingCostFxStressDraft,
  sequence: number,
): PricingCostFxStressDraftResult {
  const errors: string[] = []
  const parsedFactors = parsePricingCostFxStressFactors(
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

  if (!sourceCostCurrency) {
    errors.push('Captura la moneda del costo base.')
  }

  if (!reportingCurrency) {
    errors.push('Captura la moneda de reporte.')
  }

  const referenceExchangeRate = parseNumber(draft.referenceExchangeRate)

  if (referenceExchangeRate === null || referenceExchangeRate <= 0) {
    errors.push('El tipo de cambio de referencia debe ser mayor a cero.')
  }

  const products = source.input.products.map((product) => {
    const quantity = parseNumber(draft.quantities[product.id] ?? '')

    if (quantity === null || quantity < 0) {
      errors.push(`La cantidad de ${product.model ?? product.sku ?? product.id} debe ser mayor o igual a cero.`)
    }

    return {
      ...product,
      quantity: quantity ?? -1,
    }
  })

  if (!products.some((product) => product.quantity > 0)) {
    errors.push('Captura al menos una cantidad mayor a cero.')
  }

  if (draft.scenarios.length === 0) {
    errors.push('Captura al menos un escenario de costo y tipo de cambio.')
  }

  const scenarioKeys = new Set<string>()
  const scenarios = draft.scenarios.flatMap((scenario, index) => {
    const label = scenario.label.trim().replace(/\s+/g, ' ')
    const costChangePercent = parseNumber(scenario.costChangePercent)
    const exchangeRate = parseNumber(scenario.exchangeRate)
    const id = `STRESS-${index + 1}`

    if (!label) {
      errors.push(`Escenario ${index + 1}: captura un nombre.`)
    }

    if (scenarioKeys.has(scenario.key)) {
      errors.push(`El escenario ${scenario.key} está duplicado.`)
    }
    scenarioKeys.add(scenario.key)

    if (costChangePercent === null || costChangePercent <= -100) {
      errors.push(`${label || id}: la variación de costo debe ser mayor a -100%.`)
    }

    if (exchangeRate === null || exchangeRate <= 0) {
      errors.push(`${label || id}: el tipo de cambio debe ser mayor a cero.`)
    }

    if (!label || costChangePercent === null || exchangeRate === null) {
      return []
    }

    return [{
      id,
      label,
      costChangeRate: costChangePercent / 100,
      exchangeRate,
      notes: scenario.notes.trim() || null,
    }]
  })

  if (draft.tiers.length === 0) {
    errors.push('Captura al menos un nivel comercial.')
  }

  const tiers = draft.tiers.flatMap((tier, index) => {
    const label = tier.label.trim().replace(/\s+/g, ' ')
    const discountPercent = parseNumber(tier.discountRate)
    const objective = buildTierObjective(tier, index, errors)

    if (!label) {
      errors.push(`Nivel ${index + 1}: captura una etiqueta comercial.`)
    }

    if (
      discountPercent === null ||
      discountPercent < 0 ||
      discountPercent >= 100
    ) {
      errors.push(`${label || `Nivel ${index + 1}`}: el descuento debe estar entre 0% y menos de 100%.`)
    }

    if (!label || discountPercent === null || !objective) {
      return []
    }

    return [{
      id: `STRESS-TIER-${index + 1}`,
      label,
      discountRate: discountPercent / 100,
      objective,
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
        id: `COST-FX-STRESS-${normalizedSequence}`,
        sourceBatchId: source.input.id,
        brandName: source.input.brandName,
        sourceCostCurrency,
        reportingCurrency,
        referenceExchangeRate: referenceExchangeRate ?? -1,
        products,
        scenarios,
        tiers,
        commonListFactors: parsedFactors.factors,
        notes: draft.notes.trim() || source.input.notes || null,
      },
    errors,
  }
}
