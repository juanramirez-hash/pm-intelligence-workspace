import type {
  PriceBatchDesignResult,
  PricePortfolioMixInput,
} from '../../../core/business/pricing'

export interface PricingPortfolioMixScenarioDraft {
  key: string
  label: string
  quantities: Record<string, string>
  notes: string
}

export interface PricingPortfolioMixDraft {
  commonListFactors: string
  mixes: PricingPortfolioMixScenarioDraft[]
  notes: string
}

export interface PricingPortfolioMixDraftResult {
  valid: boolean
  input: PricePortfolioMixInput | null
  errors: string[]
}

export function createEmptyPricingPortfolioMixScenarioDraft(
  sequence: number,
  productIds: readonly string[],
): PricingPortfolioMixScenarioDraft {
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    key: `MIX-${normalizedSequence}`,
    label: normalizedSequence === 1
      ? 'Mezcla objetivo'
      : `Mezcla ${normalizedSequence}`,
    quantities: Object.fromEntries(
      productIds.map((productId) => [productId, '']),
    ),
    notes: '',
  }
}

export function createEmptyPricingPortfolioMixDraft(
  productIds: readonly string[] = [],
): PricingPortfolioMixDraft {
  return {
    commonListFactors: '',
    mixes: [
      createEmptyPricingPortfolioMixScenarioDraft(1, productIds),
    ],
    notes: '',
  }
}

function parsePositiveFactor(
  token: string,
): number | null {
  const parsed = Number(token.trim())

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : null
}

export function parsePricingPortfolioMixFactors(
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
    const factor = parsePositiveFactor(token)

    if (factor === null) {
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
    errors.push('Captura al menos un factor común para comparar las mezclas.')
  }

  return {
    factors,
    errors,
  }
}

function parseQuantity(
  value: string,
): number | null {
  const normalized = value.trim()

  if (!normalized) {
    return 0
  }

  const parsed = Number(normalized)

  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : null
}

export function buildPricePortfolioMixInputFromDraft(
  source: PriceBatchDesignResult,
  draft: PricingPortfolioMixDraft,
  sequence: number,
): PricingPortfolioMixDraftResult {
  const parsedFactors = parsePricingPortfolioMixFactors(
    draft.commonListFactors,
  )
  const errors = [...parsedFactors.errors]

  if (!source.available) {
    errors.push('Calcula primero una matriz por lote válida.')
  }

  if (draft.mixes.length === 0) {
    errors.push('Captura al menos una mezcla de volumen.')
  }

  const normalizedMixKeys = new Set<string>()
  const mixes = draft.mixes.map((mix, mixIndex) => {
    const key = mix.key.trim().toLocaleUpperCase('es-MX') || `MIX-${mixIndex + 1}`
    const label = mix.label.trim()

    if (!label) {
      errors.push(`La mezcla ${mixIndex + 1} requiere nombre.`)
    }

    if (normalizedMixKeys.has(key)) {
      errors.push(`La mezcla ${key} está duplicada.`)
    }
    normalizedMixKeys.add(key)

    const quantities = source.input.products.map((product) => {
      const parsed = parseQuantity(mix.quantities[product.id] ?? '')

      if (parsed === null) {
        errors.push(`La cantidad de ${product.model ?? product.sku ?? product.id} en ${label || key} debe ser mayor o igual a cero.`)
      }

      return {
        productId: product.id,
        quantity: parsed ?? -1,
      }
    })

    if (!quantities.some((quantity) => quantity.quantity > 0)) {
      errors.push(`La mezcla ${label || key} requiere al menos una cantidad mayor a cero.`)
    }

    return {
      id: key,
      label: label || `Mezcla ${mixIndex + 1}`,
      quantities,
      notes: mix.notes.trim() || null,
    }
  })

  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    valid: errors.length === 0,
    input: errors.length > 0
      ? null
      : {
        id: `PORTFOLIO-MIX-${normalizedSequence}`,
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
        commonListFactors: parsedFactors.factors,
        mixes,
        notes: draft.notes.trim() || source.input.notes || null,
      },
    errors,
  }
}
