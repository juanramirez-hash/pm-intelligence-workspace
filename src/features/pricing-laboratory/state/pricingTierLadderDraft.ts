import type {
  PriceBatchDesignResult,
  PriceTierLadderInput,
  PriceTierObjective,
  PriceTierObjectiveType,
} from '../../../core/business/pricing'

export interface PricingTierLadderTierDraft {
  key: string
  label: string
  discountRate: string
  objectiveType: PriceTierObjectiveType
  objectiveValue: string
  notes: string
}

export interface PricingTierLadderDraft {
  tiers: PricingTierLadderTierDraft[]
  commonListFactors: string
  notes: string
}

export interface PricingTierLadderDraftResult {
  valid: boolean
  input: PriceTierLadderInput | null
  errors: string[]
}

export const PRICE_TIER_OBJECTIVE_TYPES: readonly PriceTierObjectiveType[] = [
  'minimum_gross_margin',
  'minimum_gross_profit',
]

export function priceTierObjectiveLabel(
  type: PriceTierObjectiveType,
): string {
  switch (type) {
    case 'minimum_gross_margin':
      return 'Margen mínimo'
    case 'minimum_gross_profit':
      return 'GP unitario mínimo'
  }
}

export function priceTierObjectiveUnit(
  type: PriceTierObjectiveType,
): string {
  return type === 'minimum_gross_margin'
    ? '%'
    : 'importe'
}

export function createEmptyPricingTierDraft(
  sequence: number,
): PricingTierLadderTierDraft {
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    key: `tier-${normalizedSequence}`,
    label: '',
    discountRate: '',
    objectiveType: 'minimum_gross_margin',
    objectiveValue: '',
    notes: '',
  }
}

export function createEmptyPricingTierLadderDraft(): PricingTierLadderDraft {
  return {
    tiers: [createEmptyPricingTierDraft(1)],
    commonListFactors: '',
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

export function parsePricingTierLadderFactors(
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

  return {
    factors,
    errors,
  }
}

function buildObjective(
  tier: PricingTierLadderTierDraft,
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
    errors.push(`${label}: el GP mínimo no puede ser negativo.`)
    return null
  }

  return {
    type: 'minimum_gross_profit',
    grossProfit: value,
  }
}

export function buildPriceTierLadderInputFromDraft(
  source: PriceBatchDesignResult,
  draft: PricingTierLadderDraft,
  sequence: number,
): PricingTierLadderDraftResult {
  const errors: string[] = []
  const factorResult = parsePricingTierLadderFactors(
    draft.commonListFactors,
  )
  errors.push(...factorResult.errors)

  if (!source.available) {
    errors.push('Calcula primero una matriz por lote válida.')
  }

  if (draft.tiers.length === 0) {
    errors.push('Captura al menos un nivel comercial.')
  }

  const discountRates = new Set<number>()
  const tiers = draft.tiers.flatMap((tier, index) => {
    const label = tier.label.trim().replace(/\s+/g, ' ')
    const discountValue = parseNumber(tier.discountRate)
    const objective = buildObjective(tier, index, errors)

    if (!label) {
      errors.push(`Nivel ${index + 1}: captura una etiqueta comercial.`)
    }

    if (
      discountValue === null ||
      discountValue < 0 ||
      discountValue >= 100
    ) {
      errors.push(`${label || `Nivel ${index + 1}`}: el descuento debe estar entre 0% y menos de 100%.`)
    }

    const discountRate = discountValue === null
      ? null
      : discountValue / 100

    if (discountRate !== null && discountRates.has(discountRate)) {
      errors.push(`${label || `Nivel ${index + 1}`}: el descuento ${discountValue}% está duplicado.`)
    }

    if (discountRate !== null) {
      discountRates.add(discountRate)
    }

    if (!label || discountRate === null || !objective) {
      return []
    }

    return [{
      id: `TIER-${index + 1}`,
      label,
      discountRate,
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
        id: `TIER-LADDER-${normalizedSequence}`,
        sourceBatchId: source.input.id,
        brandName: source.input.brandName,
        currency: source.input.currency,
        products: source.input.products.map((product) => ({
          ...product,
        })),
        tiers,
        commonListFactors: factorResult.factors,
        notes: draft.notes.trim() || source.input.notes || null,
      },
    errors,
  }
}
