import type {
  PriceBatchDesignResult,
  PriceBatchSensitivityInput,
} from '../../../core/business/pricing'

export interface PricingBatchSensitivityDraft {
  commonListFactors: string
  notes: string
}

export interface PricingBatchSensitivityDraftResult {
  valid: boolean
  input: PriceBatchSensitivityInput | null
  errors: string[]
}

export function createEmptyPricingBatchSensitivityDraft(): PricingBatchSensitivityDraft {
  return {
    commonListFactors: '',
    notes: '',
  }
}

function parseFactor(value: string): number | null {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)

  return Number.isFinite(parsed)
    ? parsed
    : null
}

export function parsePricingBatchSensitivityFactors(
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
    const factor = parseFactor(token)

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
    errors.push('Captura al menos un factor común para analizar.')
  }

  return {
    factors,
    errors,
  }
}

export function buildPriceBatchSensitivityInputFromDraft(
  source: PriceBatchDesignResult,
  draft: PricingBatchSensitivityDraft,
  sequence: number,
): PricingBatchSensitivityDraftResult {
  const parsed = parsePricingBatchSensitivityFactors(
    draft.commonListFactors,
  )
  const errors = [...parsed.errors]

  if (!source.available) {
    errors.push('Calcula primero una matriz por lote válida.')
  }

  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    valid: errors.length === 0,
    input: errors.length > 0
      ? null
      : {
        id: `BATCH-SENSITIVITY-${normalizedSequence}`,
        sourceBatchId: source.input.id,
        brandName: source.input.brandName,
        currency: source.input.currency,
        products: source.input.products.map((product) => ({
          ...product,
        })),
        discountRates: [...source.input.discountRates],
        objective: {
          ...source.input.objective,
        },
        commonListFactors: parsed.factors,
        notes: draft.notes.trim() || source.input.notes || null,
      },
    errors,
  }
}
