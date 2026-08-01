import {
  findPricingLaboratoryTemplateDefinition,
} from '../../../core/business/pricing'

import type {
  PriceEngineeringGuardrail,
  PriceEngineeringGuardrailSeverity,
  PriceEngineeringScenarioBasis,
  PriceEngineeringScenarioBasisType,
  PricingLaboratoryTemplateInput,
  StandardPricingLaboratoryTemplateId,
} from '../../../core/business/pricing'

export const PRICING_LABORATORY_BASIS_TYPES = [
  'selling_price',
  'discount_rate',
  'target_gross_margin',
  'target_gross_profit',
  'selling_price_factor',
  'additional_discount',
] as const satisfies readonly PriceEngineeringScenarioBasisType[]

export type PricingLaboratoryGuardrailDraftKey =
  | 'minimumGrossMargin'
  | 'minimumGrossProfit'
  | 'minimumSellingPrice'
  | 'maximumSellingPrice'
  | 'maximumDiscountRate'

export interface PricingLaboratoryGuardrailDraft {
  minimumGrossMargin: string
  minimumGrossProfit: string
  minimumSellingPrice: string
  maximumSellingPrice: string
  maximumDiscountRate: string
  severity: PriceEngineeringGuardrailSeverity
}

export interface PricingLaboratoryScenarioDraft {
  templateId: StandardPricingLaboratoryTemplateId
  name: string
  basisType: PriceEngineeringScenarioBasisType
  basisValue: string
  additionalDiscountBase: 'list_price' | 'current_selling_price'
  guardrails: PricingLaboratoryGuardrailDraft
  notes: string
}

export interface PricingLaboratoryScenarioScope {
  productId: string
  currency: string
}

export interface PricingLaboratoryScenarioDraftResult {
  valid: boolean
  input: PricingLaboratoryTemplateInput | null
  errors: string[]
}

export function createEmptyPricingLaboratoryScenarioDraft():
PricingLaboratoryScenarioDraft {
  return {
    templateId: 'CUSTOM',
    name: '',
    basisType: 'selling_price',
    basisValue: '',
    additionalDiscountBase: 'current_selling_price',
    guardrails: {
      minimumGrossMargin: '',
      minimumGrossProfit: '',
      minimumSellingPrice: '',
      maximumSellingPrice: '',
      maximumDiscountRate: '',
      severity: 'warning',
    },
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

function isPercentageBasis(
  type: PriceEngineeringScenarioBasisType,
): boolean {
  return type === 'discount_rate' ||
    type === 'target_gross_margin' ||
    type === 'additional_discount'
}

function buildBasis(
  draft: PricingLaboratoryScenarioDraft,
  errors: string[],
): PriceEngineeringScenarioBasis | null {
  const value = parseNumber(draft.basisValue)

  if (value === null) {
    errors.push('Captura un valor numérico para el escenario.')
    return null
  }

  if (isPercentageBasis(draft.basisType)) {
    if (value < 0 || value >= 100) {
      errors.push('Los porcentajes deben ser mayores o iguales a 0 y menores a 100.')
      return null
    }
  } else if (draft.basisType === 'target_gross_profit') {
    if (value < 0) {
      errors.push('El GP objetivo no puede ser negativo desde el constructor visual.')
      return null
    }
  } else if (value <= 0) {
    errors.push('El valor debe ser mayor a 0.')
    return null
  }

  switch (draft.basisType) {
    case 'selling_price':
      return {
        type: 'selling_price',
        sellingPrice: value,
      }
    case 'discount_rate':
      return {
        type: 'discount_rate',
        discountRate: value / 100,
      }
    case 'target_gross_margin':
      return {
        type: 'target_gross_margin',
        grossMargin: value / 100,
      }
    case 'target_gross_profit':
      return {
        type: 'target_gross_profit',
        grossProfit: value,
      }
    case 'selling_price_factor':
      return {
        type: 'selling_price_factor',
        factor: value,
      }
    case 'additional_discount':
      return {
        type: 'additional_discount',
        discountRate: value / 100,
        applyTo: draft.additionalDiscountBase,
      }
  }
}

interface GuardrailDraftDefinition {
  key: PricingLaboratoryGuardrailDraftKey
  type: PriceEngineeringGuardrail['type']
  percentage: boolean
  label: string
}

const GUARDRAIL_DRAFT_DEFINITIONS: readonly GuardrailDraftDefinition[] = [
  {
    key: 'minimumGrossMargin',
    type: 'minimum_gross_margin',
    percentage: true,
    label: 'Margen mínimo',
  },
  {
    key: 'minimumGrossProfit',
    type: 'minimum_gross_profit',
    percentage: false,
    label: 'GP mínimo',
  },
  {
    key: 'minimumSellingPrice',
    type: 'minimum_selling_price',
    percentage: false,
    label: 'Precio mínimo',
  },
  {
    key: 'maximumSellingPrice',
    type: 'maximum_selling_price',
    percentage: false,
    label: 'Precio máximo',
  },
  {
    key: 'maximumDiscountRate',
    type: 'maximum_discount_rate',
    percentage: true,
    label: 'Descuento máximo',
  },
]

function buildGuardrails(
  draft: PricingLaboratoryScenarioDraft,
  errors: string[],
): PriceEngineeringGuardrail[] {
  const guardrails: PriceEngineeringGuardrail[] = []

  GUARDRAIL_DRAFT_DEFINITIONS.forEach((definition) => {
    const rawValue = draft.guardrails[definition.key]

    if (!rawValue.trim()) {
      return
    }

    const parsed = parseNumber(rawValue)

    if (parsed === null || parsed < 0) {
      errors.push(`${definition.label} debe ser un número mayor o igual a 0.`)
      return
    }

    if (definition.percentage && parsed > 100) {
      errors.push(`${definition.label} no puede superar 100%.`)
      return
    }

    guardrails.push({
      type: definition.type,
      threshold: definition.percentage
        ? parsed / 100
        : parsed,
      severity: draft.guardrails.severity,
    } as PriceEngineeringGuardrail)
  })

  return guardrails
}

function normalizeSequence(sequence: number): number {
  if (!Number.isFinite(sequence) || sequence < 1) {
    return 1
  }

  return Math.floor(sequence)
}

export function buildPricingLaboratoryTemplateFromDraft(
  draft: PricingLaboratoryScenarioDraft,
  sequence: number,
  scope: PricingLaboratoryScenarioScope | null,
): PricingLaboratoryScenarioDraftResult {
  const errors: string[] = []
  const definition = findPricingLaboratoryTemplateDefinition(
    draft.templateId,
  )

  if (!definition) {
    errors.push('La plantilla seleccionada no existe en el catálogo del laboratorio.')
  }

  if (!scope?.productId.trim() || !scope.currency.trim()) {
    errors.push('Selecciona producto y moneda antes de agregar un escenario.')
  }

  const basis = buildBasis(draft, errors)
  const guardrails = buildGuardrails(draft, errors)

  if (!definition || !scope || !basis || errors.length > 0) {
    return {
      valid: false,
      input: null,
      errors,
    }
  }

  const normalizedSequence = normalizeSequence(sequence)
  const configurationId = `UI-${definition.id}-${normalizedSequence}`
  const name = draft.name.trim() || `${definition.label} ${normalizedSequence}`

  return {
    valid: true,
    input: {
      id: configurationId,
      templateId: definition.id,
      name,
      enabled: true,
      basis,
      ...(guardrails.length > 0
        ? { guardrails }
        : {}),
      scope: {
        productIds: [scope.productId],
        currencies: [scope.currency],
      },
      sourceReference: 'Pricing Laboratory UI / in-memory',
      notes: draft.notes.trim() || null,
    },
    errors: [],
  }
}

export function basisTypeLabel(
  type: PriceEngineeringScenarioBasisType,
): string {
  switch (type) {
    case 'selling_price':
      return 'Precio de venta'
    case 'discount_rate':
      return 'Descuento sobre lista'
    case 'target_gross_margin':
      return 'Margen objetivo'
    case 'target_gross_profit':
      return 'GP unitario objetivo'
    case 'selling_price_factor':
      return 'Factor sobre costo'
    case 'additional_discount':
      return 'Descuento adicional compuesto'
  }
}

export function basisTypeUnit(
  type: PriceEngineeringScenarioBasisType,
): string {
  if (isPercentageBasis(type)) {
    return '%'
  }

  if (type === 'selling_price_factor') {
    return 'factor'
  }

  return 'importe'
}
