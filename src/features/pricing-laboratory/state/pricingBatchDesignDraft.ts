import type {
  PriceBatchCommonFactorStrategy,
  PriceBatchDesignInput,
  PriceBatchProductInput,
  PriceDesignObjective,
  PriceDesignObjectiveType,
} from '../../../core/business/pricing'

export interface PricingBatchProductDraft {
  key: string
  model: string
  sku: string
  cost: string
  notes: string
}

export interface PricingBatchDesignDraft {
  brandName: string
  currency: string
  discountRates: string
  objectiveType: PriceDesignObjectiveType
  objectiveValue: string
  commonFactorStrategy: PriceBatchCommonFactorStrategy
  explicitCommonFactor: string
  notes: string
  products: PricingBatchProductDraft[]
}

export interface PricingBatchDesignDraftResult {
  valid: boolean
  input: PriceBatchDesignInput | null
  errors: string[]
}

export interface PricingBatchPasteResult {
  products: PricingBatchProductDraft[]
  errors: string[]
}

export const PRICE_BATCH_COMMON_FACTOR_STRATEGIES = [
  'protect_all',
  'average_required',
  'explicit',
] as const satisfies readonly PriceBatchCommonFactorStrategy[]

export function createEmptyPricingBatchProductDraft(
  sequence: number,
): PricingBatchProductDraft {
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    key: `BATCH-PRODUCT-${normalizedSequence}`,
    model: '',
    sku: '',
    cost: '',
    notes: '',
  }
}

export function createEmptyPricingBatchDesignDraft(): PricingBatchDesignDraft {
  return {
    brandName: '',
    currency: '',
    discountRates: '',
    objectiveType: 'target_gross_margin',
    objectiveValue: '',
    commonFactorStrategy: 'protect_all',
    explicitCommonFactor: '',
    notes: '',
    products: [createEmptyPricingBatchProductDraft(1)],
  }
}

function parseNumber(value: string): number | null {
  const compact = value
    .trim()
    .replace(/\s/g, '')
  const normalized = compact.includes('.')
    ? compact.replace(/,/g, '')
    : /^-?\d+,\d{1,2}$/.test(compact)
      ? compact.replace(',', '.')
      : compact.replace(/,/g, '')

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)

  return Number.isFinite(parsed)
    ? parsed
    : null
}

function buildObjective(
  type: PriceDesignObjectiveType,
  rawValue: string,
  errors: string[],
): PriceDesignObjective | null {
  const value = parseNumber(rawValue)

  if (value === null) {
    errors.push('Captura el valor del objetivo común.')
    return null
  }

  switch (type) {
    case 'target_gross_margin':
      if (value < 0 || value >= 100) {
        errors.push('El margen objetivo debe ser mayor o igual a 0% y menor a 100%.')
        return null
      }

      return {
        type,
        grossMargin: value / 100,
      }

    case 'target_gross_profit':
      if (value < 0) {
        errors.push('El GP unitario objetivo no puede ser negativo.')
        return null
      }

      return {
        type,
        grossProfit: value,
      }

    case 'target_selling_price':
      if (value <= 0) {
        errors.push('El precio neto objetivo debe ser mayor a cero.')
        return null
      }

      return {
        type,
        sellingPrice: value,
      }

    case 'list_price_factor':
    case 'selling_price_factor':
      if (value <= 0) {
        errors.push('El factor objetivo debe ser mayor a cero.')
        return null
      }

      return {
        type,
        factor: value,
      }

    case 'list_price':
      if (value <= 0) {
        errors.push('El precio de lista objetivo debe ser mayor a cero.')
        return null
      }

      return {
        type,
        listPrice: value,
      }
  }
}

function parseDiscountRates(
  rawValue: string,
  errors: string[],
): number[] {
  const tokens = rawValue
    .split(/[;,\s]+/)
    .map((token) => token.trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    errors.push('Captura al menos un descuento para la matriz.')
    return []
  }

  const percentages: number[] = []

  tokens.forEach((token) => {
    const parsed = Number(token)

    if (!Number.isFinite(parsed) || parsed < 0 || parsed >= 100) {
      errors.push(`El descuento "${token}" debe ser mayor o igual a 0 y menor a 100.`)
      return
    }

    percentages.push(parsed / 100)
  })

  return percentages
}

function buildProducts(
  drafts: readonly PricingBatchProductDraft[],
  errors: string[],
): PriceBatchProductInput[] {
  const activeDrafts = drafts.filter((draft) =>
    draft.model.trim() ||
    draft.sku.trim() ||
    draft.cost.trim() ||
    draft.notes.trim(),
  )

  if (activeDrafts.length === 0) {
    errors.push('Agrega al menos un producto con costo.')
    return []
  }

  return activeDrafts.map((draft, index) => {
    const cost = parseNumber(draft.cost)

    if (cost === null || cost <= 0) {
      errors.push(`El producto ${draft.model.trim() || draft.sku.trim() || index + 1} requiere un costo mayor a cero.`)
    }

    return {
      id: draft.key || `BATCH-PRODUCT-${index + 1}`,
      model: draft.model.trim() || null,
      sku: draft.sku.trim() || null,
      cost: cost ?? 0,
      notes: draft.notes.trim() || null,
    }
  })
}

function normalizeSequence(sequence: number): number {
  if (!Number.isFinite(sequence) || sequence < 1) {
    return 1
  }

  return Math.floor(sequence)
}

export function buildPriceBatchDesignInputFromDraft(
  draft: PricingBatchDesignDraft,
  sequence: number,
): PricingBatchDesignDraftResult {
  const errors: string[] = []
  const currency = draft.currency.trim().toLocaleUpperCase('es-MX')
  const objective = buildObjective(
    draft.objectiveType,
    draft.objectiveValue,
    errors,
  )
  const discountRates = parseDiscountRates(
    draft.discountRates,
    errors,
  )
  const products = buildProducts(draft.products, errors)
  const explicitCommonFactor = draft.commonFactorStrategy === 'explicit'
    ? parseNumber(draft.explicitCommonFactor)
    : null

  if (!currency) {
    errors.push('Captura la moneda común de la matriz.')
  }

  if (
    draft.commonFactorStrategy === 'explicit' &&
    (explicitCommonFactor === null || explicitCommonFactor <= 0)
  ) {
    errors.push('Captura un factor común explícito mayor a cero.')
  }

  if (
    errors.length > 0 ||
    !currency ||
    !objective ||
    products.length === 0 ||
    discountRates.length === 0
  ) {
    return {
      valid: false,
      input: null,
      errors,
    }
  }

  const normalizedSequence = normalizeSequence(sequence)

  return {
    valid: true,
    input: {
      id: `NEW-BRAND-BATCH-${normalizedSequence}`,
      brandName: draft.brandName.trim() || null,
      currency,
      products,
      discountRates,
      objective,
      commonFactor: {
        strategy: draft.commonFactorStrategy,
        factor: explicitCommonFactor,
      },
      notes: draft.notes.trim() || null,
    },
    errors: [],
  }
}

function splitPastedLine(line: string): string[] {
  if (line.includes('\t')) {
    return line.split('\t')
  }

  if (line.includes(';')) {
    return line.split(';')
  }

  return line.split(',')
}

export function parsePricingBatchProductsText(
  value: string,
  startingSequence = 1,
): PricingBatchPasteResult {
  const errors: string[] = []
  const products: PricingBatchProductDraft[] = []
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  lines.forEach((line, index) => {
    const cells = splitPastedLine(line).map((cell) => cell.trim())

    if (cells.length < 2) {
      errors.push(`La línea ${index + 1} debe incluir al menos modelo y costo.`)
      return
    }

    const model = cells[0] ?? ''
    const hasSkuColumn = cells.length >= 3
    const sku = hasSkuColumn ? cells[1] ?? '' : ''
    const cost = hasSkuColumn ? cells[2] ?? '' : cells[1] ?? ''
    const notes = hasSkuColumn
      ? cells.slice(3).join(' · ')
      : cells.slice(2).join(' · ')

    if (parseNumber(cost) === null) {
      errors.push(`La línea ${index + 1} contiene un costo no numérico.`)
      return
    }

    products.push({
      key: `BATCH-PRODUCT-${startingSequence + products.length}`,
      model,
      sku,
      cost,
      notes,
    })
  })

  return {
    products,
    errors,
  }
}

export function priceBatchCommonFactorStrategyLabel(
  strategy: PriceBatchCommonFactorStrategy,
): string {
  switch (strategy) {
    case 'protect_all':
      return 'Proteger todos · mayor factor requerido'
    case 'average_required':
      return 'Promedio de factores requeridos'
    case 'explicit':
      return 'Factor común capturado'
  }
}
