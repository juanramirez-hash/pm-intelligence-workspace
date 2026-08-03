import type {
  PriceBatchDesignResult,
  PriceLandedCostComponentCalculationType,
  PriceLandedCostComponentCategory,
  PriceLandedCostComponentDirection,
  PriceLandedCostInput,
  PriceLandedCostListPriceBasis,
  PriceTierObjective,
  PriceTierObjectiveType,
} from '../../../core/business/pricing'

export interface PricingLandedCostComponentDraft {
  key: string
  label: string
  category: PriceLandedCostComponentCategory
  direction: PriceLandedCostComponentDirection
  calculationType: PriceLandedCostComponentCalculationType
  value: string
  productIds: string[]
  notes: string
}

export interface PricingLandedCostScenarioDraft {
  key: string
  label: string
  purchaseCostChangePercent: string
  exchangeRate: string
  componentChangePercent: string
  notes: string
}

export interface PricingLandedCostTierDraft {
  key: string
  label: string
  discountRate: string
  objectiveType: PriceTierObjectiveType
  objectiveValue: string
  notes: string
}

export interface PricingLandedCostDraft {
  sourceCostCurrency: string
  reportingCurrency: string
  referenceExchangeRate: string
  listPriceBasis: PriceLandedCostListPriceBasis
  commonListFactors: string
  quantities: Record<string, string>
  components: PricingLandedCostComponentDraft[]
  scenarios: PricingLandedCostScenarioDraft[]
  tiers: PricingLandedCostTierDraft[]
  notes: string
}

export interface PricingLandedCostDraftResult {
  valid: boolean
  input: PriceLandedCostInput | null
  errors: string[]
}

export const PRICE_LANDED_COST_COMPONENT_CATEGORIES: readonly PriceLandedCostComponentCategory[] = [
  'freight',
  'insurance',
  'tariff',
  'customs',
  'handling',
  'domestic_logistics',
  'financing',
  'rebate',
  'other',
]

export const PRICE_LANDED_COST_CALCULATION_TYPES: readonly PriceLandedCostComponentCalculationType[] = [
  'percentage_of_purchase_cost',
  'percentage_of_current_subtotal',
  'fixed_per_unit',
  'fixed_total_by_quantity',
  'fixed_total_by_purchase_cost',
]

export const PRICE_LANDED_COST_LIST_PRICE_BASES: readonly PriceLandedCostListPriceBasis[] = [
  'reference_landed_cost',
  'reference_purchase_cost',
]

export function priceLandedCostCategoryLabel(
  category: PriceLandedCostComponentCategory,
): string {
  switch (category) {
    case 'freight': return 'Flete'
    case 'insurance': return 'Seguro'
    case 'tariff': return 'Arancel'
    case 'customs': return 'Gastos aduanales'
    case 'handling': return 'Maniobras'
    case 'domestic_logistics': return 'Logística nacional'
    case 'financing': return 'Costo financiero'
    case 'rebate': return 'Bonificación / rebate'
    case 'other': return 'Otro componente'
  }
}

export function priceLandedCostCalculationLabel(
  type: PriceLandedCostComponentCalculationType,
): string {
  switch (type) {
    case 'percentage_of_purchase_cost': return '% sobre costo de compra'
    case 'percentage_of_current_subtotal': return '% sobre subtotal acumulado'
    case 'fixed_per_unit': return 'Importe fijo por unidad'
    case 'fixed_total_by_quantity': return 'Importe total distribuido por cantidad'
    case 'fixed_total_by_purchase_cost': return 'Importe total distribuido por valor de compra'
  }
}

export function priceLandedCostCalculationUnit(
  type: PriceLandedCostComponentCalculationType,
): string {
  switch (type) {
    case 'percentage_of_purchase_cost':
    case 'percentage_of_current_subtotal':
      return '%'
    case 'fixed_per_unit':
    case 'fixed_total_by_quantity':
    case 'fixed_total_by_purchase_cost':
      return 'importe'
  }
}

export function priceLandedCostListPriceBasisLabel(
  basis: PriceLandedCostListPriceBasis,
): string {
  switch (basis) {
    case 'reference_landed_cost': return 'Costo aterrizado de referencia'
    case 'reference_purchase_cost': return 'Costo de compra convertido de referencia'
  }
}

export function createEmptyPricingLandedCostComponentDraft(
  sequence: number,
): PricingLandedCostComponentDraft {
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    key: `landed-component-${normalizedSequence}`,
    label: '',
    category: 'other',
    direction: 'add',
    calculationType: 'fixed_per_unit',
    value: '',
    productIds: [],
    notes: '',
  }
}

export function createEmptyPricingLandedCostScenarioDraft(
  sequence: number,
  exchangeRate = '1',
): PricingLandedCostScenarioDraft {
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    key: `landed-scenario-${normalizedSequence}`,
    label: normalizedSequence === 1
      ? 'Base'
      : `Escenario ${normalizedSequence}`,
    purchaseCostChangePercent: normalizedSequence === 1 ? '0' : '',
    exchangeRate: normalizedSequence === 1 ? exchangeRate : '',
    componentChangePercent: normalizedSequence === 1 ? '0' : '',
    notes: '',
  }
}

export function createEmptyPricingLandedCostTierDraft(
  sequence: number,
): PricingLandedCostTierDraft {
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 1

  return {
    key: `landed-tier-${normalizedSequence}`,
    label: '',
    discountRate: '',
    objectiveType: 'minimum_gross_margin',
    objectiveValue: '',
    notes: '',
  }
}

function initialTierFromSource(
  source?: PriceBatchDesignResult | null,
): PricingLandedCostTierDraft {
  const tier = createEmptyPricingLandedCostTierDraft(1)
  const discountRate = source?.input.discountRates[0]

  if (discountRate !== undefined) {
    tier.label = `Descuento ${(discountRate * 100).toLocaleString('es-MX')}%`
    tier.discountRate = String(discountRate * 100)
  }

  const objective = source?.input.objective

  if (objective?.type === 'target_gross_margin') {
    tier.objectiveType = 'minimum_gross_margin'
    tier.objectiveValue = String(objective.grossMargin * 100)
  } else if (objective?.type === 'target_gross_profit') {
    tier.objectiveType = 'minimum_gross_profit'
    tier.objectiveValue = String(objective.grossProfit)
  }

  return tier
}

export function createEmptyPricingLandedCostDraft(
  source?: PriceBatchDesignResult | null,
): PricingLandedCostDraft {
  const currency = source?.input.currency ?? ''
  const referenceExchangeRate = '1'

  return {
    sourceCostCurrency: currency,
    reportingCurrency: currency,
    referenceExchangeRate,
    listPriceBasis: 'reference_landed_cost',
    commonListFactors: source?.commonListFactor
      ? String(source.commonListFactor)
      : '',
    quantities: Object.fromEntries(
      (source?.input.products ?? []).map((product) => [product.id, '1']),
    ),
    components: [],
    scenarios: [
      createEmptyPricingLandedCostScenarioDraft(1, referenceExchangeRate),
    ],
    tiers: [initialTierFromSource(source)],
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

export function parsePricingLandedCostFactors(
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
      errors.push(`El factor "${token}" debe ser mayor a cero.`)
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
  tier: PricingLandedCostTierDraft,
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

function buildComponentCalculation(
  component: PricingLandedCostComponentDraft,
  value: number,
) {
  switch (component.calculationType) {
    case 'percentage_of_purchase_cost':
    case 'percentage_of_current_subtotal':
      return {
        type: component.calculationType,
        rate: value / 100,
      } as const
    case 'fixed_per_unit':
    case 'fixed_total_by_quantity':
    case 'fixed_total_by_purchase_cost':
      return {
        type: component.calculationType,
        amount: value,
      } as const
  }
}

export function buildPriceLandedCostInputFromDraft(
  source: PriceBatchDesignResult,
  draft: PricingLandedCostDraft,
  sequence: number,
): PricingLandedCostDraftResult {
  const errors: string[] = []
  const parsedFactors = parsePricingLandedCostFactors(
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
    errors.push('Captura la moneda del costo de compra.')
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

  const validProductIds = new Set(products.map((product) => product.id))
  const components = draft.components.flatMap((component, index) => {
    const label = component.label.trim().replace(/\s+/g, ' ')
    const value = parseNumber(component.value)

    if (!label) {
      errors.push(`Componente ${index + 1}: captura una etiqueta.`)
    }

    if (value === null || value < 0) {
      errors.push(`${label || `Componente ${index + 1}`}: captura un valor no negativo.`)
    }

    const unknownProduct = component.productIds.find(
      (productId) => !validProductIds.has(productId),
    )

    if (unknownProduct) {
      errors.push(`${label || `Componente ${index + 1}`}: el producto ${unknownProduct} no existe en el lote.`)
    }

    if (!label || value === null || value < 0 || unknownProduct) {
      return []
    }

    return [{
      id: `LANDED-COMPONENT-${index + 1}`,
      label,
      category: component.category,
      direction: component.direction,
      calculation: buildComponentCalculation(component, value),
      productIds: component.productIds.length > 0
        ? [...component.productIds]
        : null,
      notes: component.notes.trim() || null,
    }]
  })

  if (draft.scenarios.length === 0) {
    errors.push('Captura al menos un escenario de costo aterrizado.')
  }

  const scenarios = draft.scenarios.flatMap((scenario, index) => {
    const label = scenario.label.trim().replace(/\s+/g, ' ')
    const purchaseCostChangePercent = parseNumber(
      scenario.purchaseCostChangePercent,
    )
    const exchangeRate = parseNumber(scenario.exchangeRate)
    const componentChangePercent = parseNumber(
      scenario.componentChangePercent,
    )

    if (!label) {
      errors.push(`Escenario ${index + 1}: captura un nombre.`)
    }

    if (
      purchaseCostChangePercent === null ||
      purchaseCostChangePercent <= -100
    ) {
      errors.push(`${label || `Escenario ${index + 1}`}: la variación del costo de compra debe ser mayor a -100%.`)
    }

    if (exchangeRate === null || exchangeRate <= 0) {
      errors.push(`${label || `Escenario ${index + 1}`}: el tipo de cambio debe ser mayor a cero.`)
    }

    if (
      componentChangePercent === null ||
      componentChangePercent <= -100
    ) {
      errors.push(`${label || `Escenario ${index + 1}`}: la variación de componentes debe ser mayor a -100%.`)
    }

    if (
      !label ||
      purchaseCostChangePercent === null ||
      exchangeRate === null ||
      componentChangePercent === null
    ) {
      return []
    }

    return [{
      id: `LANDED-SCENARIO-${index + 1}`,
      label,
      purchaseCostChangeRate: purchaseCostChangePercent / 100,
      exchangeRate,
      componentChangeRate: componentChangePercent / 100,
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
      id: `LANDED-TIER-${index + 1}`,
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
        id: `LANDED-COST-${normalizedSequence}`,
        sourceBatchId: source.input.id,
        brandName: source.input.brandName,
        sourceCostCurrency,
        reportingCurrency,
        referenceExchangeRate: referenceExchangeRate ?? -1,
        listPriceBasis: draft.listPriceBasis,
        products,
        components,
        scenarios,
        tiers,
        commonListFactors: parsedFactors.factors,
        notes: draft.notes.trim() || source.input.notes || null,
      },
    errors,
  }
}
