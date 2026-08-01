import type {
  PricingLaboratoryTemplateDefinition,
  StandardPricingLaboratoryTemplateId,
} from './pricingTemplateContracts'

const TEMPLATE_DEFINITIONS: readonly PricingLaboratoryTemplateDefinition[] = [
  {
    id: 'PROMOTION',
    label: 'Promoción',
    kind: 'promotion',
    pricingGroupId: 'PROMOTION',
    description: 'Simulación temporal de una promoción sin alterar el precio fuente.',
    suggestedBasisTypes: [
      'discount_rate',
      'additional_discount',
      'selling_price',
      'target_gross_margin',
    ],
    numericPolicy: 'explicit-input-only',
  },
  {
    id: 'SILVER',
    label: 'Silver',
    kind: 'pricing_group',
    pricingGroupId: 'SILVER',
    description: 'Plantilla de laboratorio para evaluar un supuesto Silver explícito.',
    suggestedBasisTypes: [
      'discount_rate',
      'selling_price',
      'target_gross_margin',
      'selling_price_factor',
    ],
    numericPolicy: 'explicit-input-only',
  },
  {
    id: 'GOLD',
    label: 'Gold',
    kind: 'pricing_group',
    pricingGroupId: 'GOLD',
    description: 'Plantilla de laboratorio para evaluar un supuesto Gold explícito.',
    suggestedBasisTypes: [
      'discount_rate',
      'selling_price',
      'target_gross_margin',
      'selling_price_factor',
    ],
    numericPolicy: 'explicit-input-only',
  },
  {
    id: 'PLATINUM',
    label: 'Platinum',
    kind: 'pricing_group',
    pricingGroupId: 'PLATINUM',
    description: 'Plantilla de laboratorio para evaluar un supuesto Platinum explícito.',
    suggestedBasisTypes: [
      'discount_rate',
      'selling_price',
      'target_gross_margin',
      'selling_price_factor',
    ],
    numericPolicy: 'explicit-input-only',
  },
  {
    id: 'PROJECT',
    label: 'Proyecto',
    kind: 'project',
    pricingGroupId: 'PROJECT',
    description: 'Simulación especial de proyecto con supuestos y límites capturados.',
    suggestedBasisTypes: [
      'discount_rate',
      'selling_price',
      'target_gross_margin',
      'target_gross_profit',
    ],
    numericPolicy: 'explicit-input-only',
  },
  {
    id: 'CUSTOM',
    label: 'Personalizado',
    kind: 'custom',
    pricingGroupId: 'CUSTOM',
    description: 'Escenario libre para comparar cualquier supuesto soportado por el motor.',
    suggestedBasisTypes: [
      'selling_price',
      'discount_rate',
      'target_gross_margin',
      'target_gross_profit',
      'selling_price_factor',
      'additional_discount',
    ],
    numericPolicy: 'explicit-input-only',
  },
]

function cloneDefinition(
  definition: PricingLaboratoryTemplateDefinition,
): PricingLaboratoryTemplateDefinition {
  return {
    ...definition,
    suggestedBasisTypes: [...definition.suggestedBasisTypes],
  }
}

export function getStandardPricingLaboratoryTemplates():
PricingLaboratoryTemplateDefinition[] {
  return TEMPLATE_DEFINITIONS.map(cloneDefinition)
}

export function findPricingLaboratoryTemplateDefinition(
  templateId: StandardPricingLaboratoryTemplateId,
): PricingLaboratoryTemplateDefinition | null {
  const definition = TEMPLATE_DEFINITIONS.find(
    (item) => item.id === templateId,
  )

  return definition
    ? cloneDefinition(definition)
    : null
}
