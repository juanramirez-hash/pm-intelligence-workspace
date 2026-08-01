import type {
  PriceDesignInput,
  PriceDesignObjective,
  PriceDesignObjectiveType,
} from '../../../core/business/pricing'

export const PRICE_DESIGN_OBJECTIVE_TYPES = [
  'target_gross_margin',
  'target_gross_profit',
  'target_selling_price',
  'list_price_factor',
  'selling_price_factor',
  'list_price',
] as const satisfies readonly PriceDesignObjectiveType[]

export interface PricingNewProductDesignDraft {
  brandName: string
  model: string
  sku: string
  currency: string
  cost: string
  discountRate: string
  objectiveType: PriceDesignObjectiveType
  objectiveValue: string
  notes: string
}

export interface PricingNewProductDesignDraftResult {
  valid: boolean
  input: PriceDesignInput | null
  errors: string[]
}

export function createEmptyPricingNewProductDesignDraft():
PricingNewProductDesignDraft {
  return {
    brandName: '',
    model: '',
    sku: '',
    currency: '',
    cost: '',
    discountRate: '',
    objectiveType: 'target_gross_margin',
    objectiveValue: '',
    notes: '',
  }
}

function parseNumber(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/,/g, '')

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
    errors.push('Captura el valor del objetivo de cálculo.')
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
        errors.push('El factor debe ser mayor a cero.')
        return null
      }

      return {
        type,
        factor: value,
      }

    case 'list_price':
      if (value <= 0) {
        errors.push('El precio de lista debe ser mayor a cero.')
        return null
      }

      return {
        type,
        listPrice: value,
      }
  }
}

function normalizeSequence(sequence: number): number {
  if (!Number.isFinite(sequence) || sequence < 1) {
    return 1
  }

  return Math.floor(sequence)
}

export function buildPriceDesignInputFromDraft(
  draft: PricingNewProductDesignDraft,
  sequence: number,
): PricingNewProductDesignDraftResult {
  const errors: string[] = []
  const cost = parseNumber(draft.cost)
  const discountRate = parseNumber(draft.discountRate)
  const currency = draft.currency.trim().toLocaleUpperCase('es-MX')

  if (!currency) {
    errors.push('Captura la moneda del costo y de los precios simulados.')
  }

  if (cost === null || cost <= 0) {
    errors.push('El costo debe ser un número mayor a cero.')
  }

  if (
    discountRate === null ||
    discountRate < 0 ||
    discountRate >= 100
  ) {
    errors.push('El descuento debe ser mayor o igual a 0% y menor a 100%.')
  }

  const objective = buildObjective(
    draft.objectiveType,
    draft.objectiveValue,
    errors,
  )

  if (
    errors.length > 0 ||
    cost === null ||
    discountRate === null ||
    !objective
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
      id: `NEW-PRODUCT-${normalizedSequence}`,
      identity: {
        brandName: draft.brandName.trim() || null,
        model: draft.model.trim() || null,
        sku: draft.sku.trim() || null,
      },
      currency,
      cost,
      discountRate: discountRate / 100,
      objective,
      notes: draft.notes.trim() || null,
    },
    errors: [],
  }
}

export function priceDesignObjectiveLabel(
  type: PriceDesignObjectiveType,
): string {
  switch (type) {
    case 'target_gross_margin':
      return 'Margen objetivo al descuento'
    case 'target_gross_profit':
      return 'GP unitario objetivo al descuento'
    case 'target_selling_price':
      return 'Precio neto objetivo'
    case 'list_price_factor':
      return 'Factor de lista (Lista / Costo)'
    case 'selling_price_factor':
      return 'Factor neto (Venta / Costo)'
    case 'list_price':
      return 'Precio de lista conocido'
  }
}

export function priceDesignObjectiveUnit(
  type: PriceDesignObjectiveType,
): string {
  if (type === 'target_gross_margin') {
    return '%'
  }

  if (
    type === 'list_price_factor' ||
    type === 'selling_price_factor'
  ) {
    return 'factor'
  }

  return 'importe'
}
