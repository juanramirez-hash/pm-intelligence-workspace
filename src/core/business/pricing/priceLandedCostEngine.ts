import {
  calculatePriceGrossMargin,
  roundPricingValue,
} from './pricingMath'

import {
  evaluatePriceDesign,
} from './priceDesignEngine'

import {
  PRICE_LANDED_COST_METHODOLOGY,
} from './priceLandedCostContracts'

import type {
  PriceDesignMetrics,
  PriceDesignObjective,
} from './priceDesignContracts'

import type {
  PriceTierLadderTierInput,
  PriceTierObjective,
} from './priceTierLadderContracts'

import type {
  PriceLandedCostCell,
  PriceLandedCostComponentCalculation,
  PriceLandedCostComponentInput,
  PriceLandedCostComponentSummary,
  PriceLandedCostFactorSummary,
  PriceLandedCostFeasibility,
  PriceLandedCostInput,
  PriceLandedCostIssue,
  PriceLandedCostOptions,
  PriceLandedCostProductInput,
  PriceLandedCostProductResult,
  PriceLandedCostResult,
  PriceLandedCostScenarioInput,
  PriceLandedCostScenarioSummary,
  PriceLandedCostWaterfallStep,
} from './priceLandedCostContracts'

const DEFAULT_MONEY_PRECISION = 2
const DEFAULT_RATE_PRECISION = 6
const DEFAULT_QUANTITY_PRECISION = 4
const COMPARISON_TOLERANCE = 0.00001

function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function normalizeText(value: string | null | undefined): string | null {
  const normalized = (value ?? '')
    .trim()
    .replace(/\s+/g, ' ')

  return normalized || null
}

function cloneCalculation(
  calculation: PriceLandedCostComponentCalculation,
): PriceLandedCostComponentCalculation {
  return {
    ...calculation,
  }
}

function cloneComponent(
  component: PriceLandedCostComponentInput,
): PriceLandedCostComponentInput {
  return {
    ...component,
    calculation: cloneCalculation(component.calculation),
    productIds: component.productIds
      ? [...component.productIds]
      : null,
  }
}

function cloneObjective(
  objective: PriceTierObjective,
): PriceTierObjective {
  return {
    ...objective,
  }
}

function cloneTier(
  tier: PriceTierLadderTierInput,
): PriceTierLadderTierInput {
  return {
    ...tier,
    objective: cloneObjective(tier.objective),
  }
}

function cloneProduct(
  product: PriceLandedCostProductInput,
): PriceLandedCostProductInput {
  return {
    ...product,
  }
}

function cloneScenario(
  scenario: PriceLandedCostScenarioInput,
): PriceLandedCostScenarioInput {
  return {
    ...scenario,
  }
}

function cloneInput(
  input: PriceLandedCostInput,
): PriceLandedCostInput {
  return {
    ...input,
    products: input.products.map(cloneProduct),
    components: input.components.map(cloneComponent),
    scenarios: input.scenarios.map(cloneScenario),
    tiers: input.tiers.map(cloneTier),
    commonListFactors: [...input.commonListFactors],
  }
}

function emptySummary() {
  return {
    productCount: 0,
    componentCount: 0,
    scenarioCount: 0,
    tierCount: 0,
    factorCount: 0,
    cellCount: 0,
    fullyFeasibleCellCount: 0,
    partiallyFeasibleCellCount: 0,
    notFeasibleCellCount: 0,
    invalidCellCount: 0,
    belowObjectiveProductCount: 0,
    fullyFeasibleFactorCount: 0,
    globalMaximumRequiredFactor: null,
    maximumLandedCostUpliftRate: null,
  }
}

function invalidResult(
  input: PriceLandedCostInput,
  issues: readonly PriceLandedCostIssue[],
): PriceLandedCostResult {
  return {
    available: false,
    methodology: PRICE_LANDED_COST_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      mutatesSourceCost: false,
      persistsLandedCost: false,
      fetchesLiveExchangeRate: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: 'invalid',
    input: cloneInput(input),
    cells: [],
    scenarioSummaries: [],
    factorSummaries: [],
    summary: emptySummary(),
    criticalScenarioId: null,
    criticalScenarioLabel: null,
    issues: issues.map((item) => ({
      ...item,
    })),
    explainability: [
      'La simulación de costo aterrizado no pudo calcularse porque faltan supuestos explícitos o existen valores inválidos.',
      'No se consultó un tipo de cambio en vivo y no se modificó ni persistió ningún costo, componente o precio.',
    ],
  }
}

function productLabel(
  product: PriceLandedCostProductInput,
): string {
  return product.model ?? product.sku ?? product.id
}

function isValidTierObjective(
  objective: PriceTierObjective,
): boolean {
  switch (objective.type) {
    case 'minimum_gross_margin':
      return Number.isFinite(objective.grossMargin) &&
        objective.grossMargin >= 0 &&
        objective.grossMargin < 1
    case 'minimum_gross_profit':
      return Number.isFinite(objective.grossProfit) &&
        objective.grossProfit >= 0
  }
}

function toDesignObjective(
  objective: PriceTierObjective,
): PriceDesignObjective {
  switch (objective.type) {
    case 'minimum_gross_margin':
      return {
        type: 'target_gross_margin',
        grossMargin: objective.grossMargin,
      }
    case 'minimum_gross_profit':
      return {
        type: 'target_gross_profit',
        grossProfit: objective.grossProfit,
      }
  }
}

function objectiveIsMet(
  metrics: PriceDesignMetrics,
  objective: PriceTierObjective,
): boolean {
  switch (objective.type) {
    case 'minimum_gross_margin':
      return metrics.grossMargin + COMPARISON_TOLERANCE >= objective.grossMargin
    case 'minimum_gross_profit':
      return metrics.grossProfit + COMPARISON_TOLERANCE >= objective.grossProfit
  }
}


function normalizeCalculation(
  calculation: PriceLandedCostComponentCalculation,
  ratePrecision: number,
): PriceLandedCostComponentCalculation {
  switch (calculation.type) {
    case 'percentage_of_purchase_cost':
    case 'percentage_of_current_subtotal':
      return {
        type: calculation.type,
        rate: roundPricingValue(calculation.rate, ratePrecision),
      }
    case 'fixed_per_unit':
    case 'fixed_total_by_quantity':
    case 'fixed_total_by_purchase_cost':
      return {
        type: calculation.type,
        amount: roundPricingValue(calculation.amount, ratePrecision),
      }
  }
}

function normalizeInput(
  input: PriceLandedCostInput,
  ratePrecision: number,
  quantityPrecision: number,
): PriceLandedCostInput {
  return {
    ...cloneInput(input),
    id: normalizeIdentifier(input.id),
    sourceBatchId: normalizeIdentifier(input.sourceBatchId),
    brandName: normalizeText(input.brandName),
    sourceCostCurrency: normalizeIdentifier(input.sourceCostCurrency),
    reportingCurrency: normalizeIdentifier(input.reportingCurrency),
    referenceExchangeRate: roundPricingValue(
      input.referenceExchangeRate,
      ratePrecision,
    ),
    products: input.products.map((product, index) => ({
      ...cloneProduct(product),
      id: normalizeIdentifier(product.id || `LANDED-PRODUCT-${index + 1}`),
      model: normalizeText(product.model),
      sku: normalizeText(product.sku),
      notes: normalizeText(product.notes),
      quantity: roundPricingValue(product.quantity, quantityPrecision),
    })),
    components: input.components.map((component, index) => ({
      ...cloneComponent(component),
      id: normalizeIdentifier(component.id || `LANDED-COMPONENT-${index + 1}`),
      label: normalizeText(component.label) ?? `Componente ${index + 1}`,
      calculation: normalizeCalculation(
        component.calculation,
        ratePrecision,
      ),
      productIds: component.productIds
        ? component.productIds.map(normalizeIdentifier)
        : null,
      notes: normalizeText(component.notes),
    })),
    scenarios: input.scenarios.map((scenario, index) => ({
      ...cloneScenario(scenario),
      id: normalizeIdentifier(scenario.id || `LANDED-SCENARIO-${index + 1}`),
      label: normalizeText(scenario.label) ?? `Escenario ${index + 1}`,
      purchaseCostChangeRate: roundPricingValue(
        scenario.purchaseCostChangeRate,
        ratePrecision,
      ),
      exchangeRate: roundPricingValue(scenario.exchangeRate, ratePrecision),
      componentChangeRate: roundPricingValue(
        scenario.componentChangeRate,
        ratePrecision,
      ),
      notes: normalizeText(scenario.notes),
    })),
    tiers: input.tiers.map((tier, index) => ({
      ...cloneTier(tier),
      id: normalizeIdentifier(tier.id || `LANDED-TIER-${index + 1}`),
      label: normalizeText(tier.label) ?? `Nivel ${index + 1}`,
      discountRate: roundPricingValue(tier.discountRate, ratePrecision),
      notes: normalizeText(tier.notes),
    })),
    commonListFactors: input.commonListFactors.map(
      (factor) => roundPricingValue(factor, ratePrecision),
    ),
    notes: normalizeText(input.notes),
  }
}

function isValidComponentCalculation(
  calculation: PriceLandedCostComponentCalculation,
): boolean {
  switch (calculation.type) {
    case 'percentage_of_purchase_cost':
    case 'percentage_of_current_subtotal':
      return Number.isFinite(calculation.rate) && calculation.rate >= 0
    case 'fixed_per_unit':
    case 'fixed_total_by_quantity':
    case 'fixed_total_by_purchase_cost':
      return Number.isFinite(calculation.amount) && calculation.amount >= 0
  }
}

function validateInput(
  input: PriceLandedCostInput,
): PriceLandedCostIssue[] {
  const issues: PriceLandedCostIssue[] = []
  const add = (item: PriceLandedCostIssue) => issues.push(item)
  const baseIssue = {
    scenarioId: null,
    tierId: null,
    productId: null,
    componentId: null,
    commonListFactor: null,
  }

  if (!input.id) {
    add({
      ...baseIssue,
      code: 'PRICE_LANDED_COST_INVALID_IDENTIFIER',
      severity: 'invalid',
      message: 'La simulación requiere un identificador temporal.',
    })
  }

  if (!input.sourceBatchId) {
    add({
      ...baseIssue,
      code: 'PRICE_LANDED_COST_INVALID_SOURCE_BATCH',
      severity: 'invalid',
      message: 'La simulación requiere la referencia de la matriz por lote.',
    })
  }

  if (!input.sourceCostCurrency || !input.reportingCurrency) {
    add({
      ...baseIssue,
      code: 'PRICE_LANDED_COST_INVALID_CURRENCY',
      severity: 'invalid',
      message: 'La moneda de costo y la moneda de reporte son obligatorias.',
    })
  }

  if (!Number.isFinite(input.referenceExchangeRate) || input.referenceExchangeRate <= 0) {
    add({
      ...baseIssue,
      code: 'PRICE_LANDED_COST_INVALID_REFERENCE_EXCHANGE_RATE',
      severity: 'invalid',
      message: 'El tipo de cambio de referencia debe ser mayor a cero.',
    })
  }

  if (
    input.listPriceBasis !== 'reference_purchase_cost' &&
    input.listPriceBasis !== 'reference_landed_cost'
  ) {
    add({
      ...baseIssue,
      code: 'PRICE_LANDED_COST_INVALID_IDENTIFIER',
      severity: 'invalid',
      message: 'La base del precio de lista no es válida.',
    })
  }

  if (input.products.length === 0) {
    add({
      ...baseIssue,
      code: 'PRICE_LANDED_COST_EMPTY_PRODUCTS',
      severity: 'invalid',
      message: 'Captura al menos un producto para calcular el costo aterrizado.',
    })
  }

  const productIds = new Set<string>()
  input.products.forEach((product) => {
    if (productIds.has(product.id)) {
      add({
        ...baseIssue,
        code: 'PRICE_LANDED_COST_DUPLICATE_PRODUCT_ID',
        severity: 'invalid',
        message: `El producto ${product.id} está duplicado.`,
        productId: product.id,
      })
    }
    productIds.add(product.id)

    if (
      !product.id ||
      !Number.isFinite(product.cost) ||
      product.cost <= 0 ||
      !Number.isFinite(product.quantity) ||
      product.quantity < 0
    ) {
      add({
        ...baseIssue,
        code: 'PRICE_LANDED_COST_INVALID_PRODUCT',
        severity: 'invalid',
        message: `${productLabel(product)} requiere costo mayor a cero y cantidad no negativa.`,
        productId: product.id || null,
      })
    }
  })

  if (!input.products.some((product) => product.quantity > 0)) {
    add({
      ...baseIssue,
      code: 'PRICE_LANDED_COST_INVALID_PRODUCT',
      severity: 'invalid',
      message: 'Al menos un producto debe tener cantidad mayor a cero.',
    })
  }

  const componentIds = new Set<string>()
  input.components.forEach((component) => {
    if (componentIds.has(component.id)) {
      add({
        ...baseIssue,
        code: 'PRICE_LANDED_COST_DUPLICATE_COMPONENT_ID',
        severity: 'invalid',
        message: `El componente ${component.id} está duplicado.`,
        componentId: component.id,
      })
    }
    componentIds.add(component.id)

    if (
      !component.id ||
      !component.label ||
      !isValidComponentCalculation(component.calculation)
    ) {
      add({
        ...baseIssue,
        code: 'PRICE_LANDED_COST_INVALID_COMPONENT',
        severity: 'invalid',
        message: `${component.label || component.id || 'Componente'} contiene una base o valor inválido.`,
        componentId: component.id || null,
      })
    }

    const scopedIds = component.productIds ?? []
    const scopedSet = new Set<string>()
    scopedIds.forEach((productId) => {
      if (scopedSet.has(productId) || !productIds.has(productId)) {
        add({
          ...baseIssue,
          code: 'PRICE_LANDED_COST_UNKNOWN_COMPONENT_PRODUCT',
          severity: 'invalid',
          message: `${component.label}: el producto ${productId} no existe o está repetido en el alcance.`,
          productId,
          componentId: component.id,
        })
      }
      scopedSet.add(productId)
    })
  })

  if (input.scenarios.length === 0) {
    add({
      ...baseIssue,
      code: 'PRICE_LANDED_COST_EMPTY_SCENARIOS',
      severity: 'invalid',
      message: 'Captura al menos un escenario de costo aterrizado.',
    })
  }

  const scenarioIds = new Set<string>()
  input.scenarios.forEach((scenario) => {
    if (scenarioIds.has(scenario.id)) {
      add({
        ...baseIssue,
        code: 'PRICE_LANDED_COST_DUPLICATE_SCENARIO_ID',
        severity: 'invalid',
        message: `El escenario ${scenario.id} está duplicado.`,
        scenarioId: scenario.id,
      })
    }
    scenarioIds.add(scenario.id)

    if (
      !scenario.id ||
      !scenario.label ||
      !Number.isFinite(scenario.purchaseCostChangeRate) ||
      scenario.purchaseCostChangeRate <= -1 ||
      !Number.isFinite(scenario.exchangeRate) ||
      scenario.exchangeRate <= 0 ||
      !Number.isFinite(scenario.componentChangeRate) ||
      scenario.componentChangeRate <= -1
    ) {
      add({
        ...baseIssue,
        code: 'PRICE_LANDED_COST_INVALID_SCENARIO',
        severity: 'invalid',
        message: `${scenario.label || scenario.id}: costo y componentes deben variar más de -100%, y el TC debe ser mayor a cero.`,
        scenarioId: scenario.id || null,
      })
    }
  })

  if (input.tiers.length === 0) {
    add({
      ...baseIssue,
      code: 'PRICE_LANDED_COST_EMPTY_TIERS',
      severity: 'invalid',
      message: 'Captura al menos un nivel comercial.',
    })
  }

  const tierIds = new Set<string>()
  input.tiers.forEach((tier) => {
    if (tierIds.has(tier.id)) {
      add({
        ...baseIssue,
        code: 'PRICE_LANDED_COST_DUPLICATE_TIER_ID',
        severity: 'invalid',
        message: `El nivel ${tier.id} está duplicado.`,
        tierId: tier.id,
      })
    }
    tierIds.add(tier.id)

    if (
      !tier.id ||
      !tier.label ||
      !Number.isFinite(tier.discountRate) ||
      tier.discountRate < 0 ||
      tier.discountRate >= 1 ||
      !isValidTierObjective(tier.objective)
    ) {
      add({
        ...baseIssue,
        code: 'PRICE_LANDED_COST_INVALID_TIER',
        severity: 'invalid',
        message: `${tier.label || tier.id}: descuento u objetivo inválido.`,
        tierId: tier.id || null,
      })
    }
  })

  if (input.commonListFactors.length === 0) {
    add({
      ...baseIssue,
      code: 'PRICE_LANDED_COST_EMPTY_FACTORS',
      severity: 'invalid',
      message: 'Captura al menos un factor común candidato.',
    })
  }

  const factors = new Set<number>()
  input.commonListFactors.forEach((factor) => {
    if (!Number.isFinite(factor) || factor <= 0) {
      add({
        ...baseIssue,
        code: 'PRICE_LANDED_COST_INVALID_FACTOR',
        severity: 'invalid',
        message: 'Todos los factores comunes deben ser mayores a cero.',
        commonListFactor: factor,
      })
      return
    }

    if (factors.has(factor)) {
      add({
        ...baseIssue,
        code: 'PRICE_LANDED_COST_DUPLICATE_FACTOR',
        severity: 'invalid',
        message: `El factor ${factor.toLocaleString('es-MX')}x está duplicado.`,
        commonListFactor: factor,
      })
    }
    factors.add(factor)
  })

  return issues
}

interface ScenarioProductCost {
  product: PriceLandedCostProductInput
  adjustedCostInSourceCurrency: number
  purchaseCostUnit: number
  purchaseCostTotal: number
}

interface RawWaterfallStep {
  order: number
  component: PriceLandedCostComponentInput
  basisAmount: number
  effectiveRateOrAmount: number
  allocationWeight: number | null
  openingSubtotal: number
  unitImpact: number
  totalImpact: number
  closingSubtotal: number
}

interface WaterfallEvaluation {
  landedCost: number
  steps: RawWaterfallStep[]
  allocationUnavailable: boolean
}

function componentApplies(
  component: PriceLandedCostComponentInput,
  productId: string,
): boolean {
  return !component.productIds || component.productIds.includes(productId)
}

function effectiveCalculationValue(
  calculation: PriceLandedCostComponentCalculation,
  componentChangeRate: number,
): number {
  const multiplier = 1 + componentChangeRate

  switch (calculation.type) {
    case 'percentage_of_purchase_cost':
    case 'percentage_of_current_subtotal':
      return calculation.rate * multiplier
    case 'fixed_per_unit':
    case 'fixed_total_by_quantity':
    case 'fixed_total_by_purchase_cost':
      return calculation.amount * multiplier
  }
}

function evaluateWaterfall(
  productCost: ScenarioProductCost,
  allProductCosts: readonly ScenarioProductCost[],
  components: readonly PriceLandedCostComponentInput[],
  componentChangeRate: number,
  moneyPrecision: number,
  ratePrecision: number,
): WaterfallEvaluation {
  let subtotal = roundPricingValue(productCost.purchaseCostUnit, moneyPrecision)
  const steps: RawWaterfallStep[] = []
  let allocationUnavailable = false

  components.forEach((component, componentIndex) => {
    if (!componentApplies(component, productCost.product.id)) {
      return
    }

    const scopedCosts = allProductCosts.filter((candidate) =>
      candidate.product.quantity > 0 &&
      componentApplies(component, candidate.product.id),
    )
    const value = effectiveCalculationValue(
      component.calculation,
      componentChangeRate,
    )
    let basisAmount = 0
    let unsignedUnitImpact = 0
    let allocationWeight: number | null = null

    switch (component.calculation.type) {
      case 'percentage_of_purchase_cost':
        basisAmount = productCost.purchaseCostUnit
        unsignedUnitImpact = basisAmount * value
        break
      case 'percentage_of_current_subtotal':
        basisAmount = subtotal
        unsignedUnitImpact = basisAmount * value
        break
      case 'fixed_per_unit':
        basisAmount = 1
        unsignedUnitImpact = value
        break
      case 'fixed_total_by_quantity': { // total amount in reporting currency
        const totalQuantity = scopedCosts.reduce(
          (total, item) => total + item.product.quantity,
          0,
        )
        basisAmount = totalQuantity

        if (totalQuantity <= 0 || productCost.product.quantity <= 0) {
          allocationUnavailable = true
          return
        }

        allocationWeight = productCost.product.quantity / totalQuantity
        unsignedUnitImpact = (value * allocationWeight) / productCost.product.quantity
        break
      }
      case 'fixed_total_by_purchase_cost': {
        const totalPurchaseCost = scopedCosts.reduce(
          (total, item) => total + item.purchaseCostTotal,
          0,
        )
        basisAmount = totalPurchaseCost

        if (totalPurchaseCost <= 0 || productCost.product.quantity <= 0) {
          allocationUnavailable = true
          return
        }

        allocationWeight = productCost.purchaseCostTotal / totalPurchaseCost
        unsignedUnitImpact = (value * allocationWeight) / productCost.product.quantity
        break
      }
    }

    const sign = component.direction === 'subtract' ? -1 : 1
    const unitImpact = roundPricingValue(
      unsignedUnitImpact * sign,
      moneyPrecision,
    )
    const openingSubtotal = subtotal
    const closingSubtotal = roundPricingValue(
      openingSubtotal + unitImpact,
      moneyPrecision,
    )

    steps.push({
      order: componentIndex + 1,
      component,
      basisAmount: roundPricingValue(basisAmount, moneyPrecision),
      effectiveRateOrAmount: roundPricingValue(value, ratePrecision),
      allocationWeight: allocationWeight === null
        ? null
        : roundPricingValue(allocationWeight, ratePrecision),
      openingSubtotal,
      unitImpact,
      totalImpact: roundPricingValue(
        unitImpact * productCost.product.quantity,
        moneyPrecision,
      ),
      closingSubtotal,
    })

    subtotal = closingSubtotal
  })

  return {
    landedCost: subtotal,
    steps,
    allocationUnavailable,
  }
}

function buildScenarioProductCosts(
  products: readonly PriceLandedCostProductInput[],
  purchaseCostChangeRate: number,
  exchangeRate: number,
  moneyPrecision: number,
): ScenarioProductCost[] {
  return products.map((product) => {
    const adjustedCostInSourceCurrency = roundPricingValue(
      product.cost * (1 + purchaseCostChangeRate),
      moneyPrecision,
    )
    const purchaseCostUnit = roundPricingValue(
      adjustedCostInSourceCurrency * exchangeRate,
      moneyPrecision,
    )

    return {
      product,
      adjustedCostInSourceCurrency,
      purchaseCostUnit,
      purchaseCostTotal: roundPricingValue(
        purchaseCostUnit * product.quantity,
        moneyPrecision,
      ),
    }
  })
}

function toWaterfallSteps(
  rawSteps: readonly RawWaterfallStep[],
  landedCost: number,
  sellingPrice: number | null,
  moneyPrecision: number,
  ratePrecision: number,
): PriceLandedCostWaterfallStep[] {
  return rawSteps.map((step) => ({
    order: step.order,
    componentId: step.component.id,
    componentLabel: step.component.label,
    category: step.component.category,
    direction: step.component.direction,
    calculationType: step.component.calculation.type,
    basisAmount: step.basisAmount,
    effectiveRateOrAmount: step.effectiveRateOrAmount,
    allocationWeight: step.allocationWeight,
    openingSubtotal: step.openingSubtotal,
    unitImpact: step.unitImpact,
    totalImpact: step.totalImpact,
    closingSubtotal: step.closingSubtotal,
    grossProfitImpact: roundPricingValue(-step.totalImpact, moneyPrecision),
    grossMarginImpact: sellingPrice && sellingPrice > 0
      ? roundPricingValue(-step.unitImpact / sellingPrice, ratePrecision)
      : null,
    shareOfLandedCost: landedCost !== 0
      ? roundPricingValue(step.unitImpact / landedCost, ratePrecision)
      : null,
  }))
}

function createProductResult(
  input: PriceLandedCostInput,
  scenario: PriceLandedCostScenarioInput,
  tier: PriceTierLadderTierInput,
  commonListFactor: number,
  scenarioProductCost: ScenarioProductCost,
  allScenarioProductCosts: readonly ScenarioProductCost[],
  referenceProductCost: ScenarioProductCost,
  allReferenceProductCosts: readonly ScenarioProductCost[],
  moneyPrecision: number,
  ratePrecision: number,
): PriceLandedCostProductResult {
  const referenceWaterfall = evaluateWaterfall(
    referenceProductCost,
    allReferenceProductCosts,
    input.components,
    0,
    moneyPrecision,
    ratePrecision,
  )
  const stressedWaterfall = evaluateWaterfall(
    scenarioProductCost,
    allScenarioProductCosts,
    input.components,
    scenario.componentChangeRate,
    moneyPrecision,
    ratePrecision,
  )
  const listPriceBasisAmount = input.listPriceBasis === 'reference_landed_cost'
    ? referenceWaterfall.landedCost
    : referenceProductCost.purchaseCostUnit
  const candidateListPrice = roundPricingValue(
    listPriceBasisAmount * commonListFactor,
    moneyPrecision,
  )
  const design = evaluatePriceDesign({
    id: `${input.id}::${scenario.id}::${tier.id}::${scenarioProductCost.product.id}::${commonListFactor}`,
    identity: {
      brandName: input.brandName,
      model: scenarioProductCost.product.model,
      sku: scenarioProductCost.product.sku,
    },
    currency: input.reportingCurrency,
    cost: stressedWaterfall.landedCost,
    discountRate: tier.discountRate,
    objective: {
      type: 'list_price',
      listPrice: candidateListPrice,
    },
    notes: input.notes,
  }, {
    moneyPrecision,
    ratePrecision,
  })
  const requiredDesign = evaluatePriceDesign({
    id: `${input.id}::REQUIRED::${scenario.id}::${tier.id}::${scenarioProductCost.product.id}`,
    identity: {
      brandName: input.brandName,
      model: scenarioProductCost.product.model,
      sku: scenarioProductCost.product.sku,
    },
    currency: input.reportingCurrency,
    cost: stressedWaterfall.landedCost,
    discountRate: tier.discountRate,
    objective: toDesignObjective(tier.objective),
    notes: input.notes,
  }, {
    moneyPrecision,
    ratePrecision,
  })
  const metrics = design.metrics
  const requiredListFactor = requiredDesign.metrics && listPriceBasisAmount > 0
    ? roundPricingValue(
      requiredDesign.metrics.listPrice / listPriceBasisAmount,
      ratePrecision,
    )
    : null
  const factorGap = requiredListFactor === null
    ? null
    : roundPricingValue(
      commonListFactor - requiredListFactor,
      ratePrecision,
    )
  const meetsObjective = metrics
    ? objectiveIsMet(metrics, tier.objective)
    : null
  const quantity = scenarioProductCost.product.quantity
  const waterfall = toWaterfallSteps(
    stressedWaterfall.steps,
    stressedWaterfall.landedCost,
    metrics?.sellingPrice ?? null,
    moneyPrecision,
    ratePrecision,
  )

  return {
    key: `${scenario.id}::${commonListFactor}::${tier.id}::${scenarioProductCost.product.id}`,
    product: cloneProduct(scenarioProductCost.product),
    quantity,
    baseCostInSourceCurrency: scenarioProductCost.product.cost,
    adjustedCostInSourceCurrency: scenarioProductCost.adjustedCostInSourceCurrency,
    referencePurchaseCost: referenceProductCost.purchaseCostUnit,
    stressedPurchaseCost: scenarioProductCost.purchaseCostUnit,
    referenceLandedCost: referenceWaterfall.landedCost,
    landedCost: stressedWaterfall.landedCost,
    landedCostDelta: roundPricingValue(
      stressedWaterfall.landedCost - referenceWaterfall.landedCost,
      moneyPrecision,
    ),
    landedCostUpliftRate: scenarioProductCost.purchaseCostUnit !== 0
      ? roundPricingValue(
        (stressedWaterfall.landedCost - scenarioProductCost.purchaseCostUnit) /
          scenarioProductCost.purchaseCostUnit,
        ratePrecision,
      )
      : null,
    listPriceBasisAmount,
    candidateListPrice,
    requiredListFactor,
    factorGap,
    design,
    metrics,
    meetsObjective,
    purchaseCostTotal: scenarioProductCost.purchaseCostTotal,
    landedCostTotal: roundPricingValue(
      stressedWaterfall.landedCost * quantity,
      moneyPrecision,
    ),
    totalListPrice: roundPricingValue(
      (metrics?.listPrice ?? 0) * quantity,
      moneyPrecision,
    ),
    totalSellingPrice: roundPricingValue(
      (metrics?.sellingPrice ?? 0) * quantity,
      moneyPrecision,
    ),
    totalGrossProfit: roundPricingValue(
      (metrics?.grossProfit ?? 0) * quantity,
      moneyPrecision,
    ),
    waterfall,
  }
}

function feasibilityFromCounts(
  calculableCount: number,
  meetsCount: number,
  belowCount: number,
): PriceLandedCostFeasibility {
  if (calculableCount === 0) {
    return 'invalid'
  }

  if (belowCount === 0 && meetsCount === calculableCount) {
    return 'fully_feasible'
  }

  if (meetsCount === 0) {
    return 'not_feasible'
  }

  return 'partially_feasible'
}

function buildComponentSummaries(
  products: readonly PriceLandedCostProductResult[],
  components: readonly PriceLandedCostComponentInput[],
  totalLandedCost: number,
  totalSellingPrice: number,
  moneyPrecision: number,
  ratePrecision: number,
): PriceLandedCostComponentSummary[] {
  return components.map((component) => {
    const totalImpact = products.reduce((total, product) => {
      const step = product.waterfall.find(
        (candidate) => candidate.componentId === component.id,
      )

      return total + (step?.totalImpact ?? 0)
    }, 0)

    return {
      componentId: component.id,
      componentLabel: component.label,
      category: component.category,
      direction: component.direction,
      totalImpact: roundPricingValue(totalImpact, moneyPrecision),
      grossProfitImpact: roundPricingValue(-totalImpact, moneyPrecision),
      grossMarginImpact: totalSellingPrice > 0
        ? roundPricingValue(-totalImpact / totalSellingPrice, ratePrecision)
        : null,
      shareOfLandedCost: totalLandedCost !== 0
        ? roundPricingValue(totalImpact / totalLandedCost, ratePrecision)
        : null,
    }
  })
}

function buildCell(
  input: PriceLandedCostInput,
  scenario: PriceLandedCostScenarioInput,
  scenarioOrder: number,
  commonListFactor: number,
  factorOrder: number,
  tier: PriceTierLadderTierInput,
  tierOrder: number,
  scenarioProductCosts: readonly ScenarioProductCost[],
  referenceProductCosts: readonly ScenarioProductCost[],
  moneyPrecision: number,
  ratePrecision: number,
): PriceLandedCostCell {
  const activeScenarioCosts = scenarioProductCosts.filter(
    (item) => item.product.quantity > 0,
  )
  const products = activeScenarioCosts.map((scenarioProductCost) => {
    const referenceProductCost = referenceProductCosts.find(
      (item) => item.product.id === scenarioProductCost.product.id,
    ) ?? scenarioProductCost

    return createProductResult(
      input,
      scenario,
      tier,
      commonListFactor,
      scenarioProductCost,
      scenarioProductCosts,
      referenceProductCost,
      referenceProductCosts,
      moneyPrecision,
      ratePrecision,
    )
  })
  const calculableProducts = products.filter((product) => product.metrics !== null)
  const meetsProducts = calculableProducts.filter(
    (product) => product.meetsObjective === true,
  )
  const belowProducts = calculableProducts.filter(
    (product) => product.meetsObjective === false,
  )
  const totalUnits = products.reduce(
    (total, product) => total + product.quantity,
    0,
  )
  const meetsUnits = meetsProducts.reduce(
    (total, product) => total + product.quantity,
    0,
  )
  const referencePurchaseCostTotal = products.reduce(
    (total, product) => total + product.referencePurchaseCost * product.quantity,
    0,
  )
  const stressedPurchaseCostTotal = products.reduce(
    (total, product) => total + product.purchaseCostTotal,
    0,
  )
  const referenceLandedCostTotal = products.reduce(
    (total, product) => total + product.referenceLandedCost * product.quantity,
    0,
  )
  const landedCostTotal = products.reduce(
    (total, product) => total + product.landedCostTotal,
    0,
  )
  const totalListPrice = products.reduce(
    (total, product) => total + product.totalListPrice,
    0,
  )
  const totalSellingPrice = products.reduce(
    (total, product) => total + product.totalSellingPrice,
    0,
  )
  const totalGrossProfit = products.reduce(
    (total, product) => total + product.totalGrossProfit,
    0,
  )
  const requiredProducts = products.filter(
    (product) => product.requiredListFactor !== null,
  )
  const limitingProduct = requiredProducts.reduce<PriceLandedCostProductResult | null>(
    (current, product) => {
      if (!current) {
        return product
      }

      return (product.requiredListFactor ?? -Infinity) >
        (current.requiredListFactor ?? -Infinity)
        ? product
        : current
    },
    null,
  )
  const minimumRequiredFactor = limitingProduct?.requiredListFactor ?? null
  const margins = calculableProducts.flatMap((product) =>
    product.metrics ? [product.metrics.grossMargin] : [],
  )
  const componentSummaries = buildComponentSummaries(
    products,
    input.components,
    landedCostTotal,
    totalSellingPrice,
    moneyPrecision,
    ratePrecision,
  )

  return {
    key: `${scenario.id}::${commonListFactor}::${tier.id}`,
    order: scenarioOrder * input.commonListFactors.length * input.tiers.length +
      factorOrder * input.tiers.length + tierOrder + 1,
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    scenarioOrder,
    purchaseCostChangeRate: scenario.purchaseCostChangeRate,
    exchangeRate: scenario.exchangeRate,
    componentChangeRate: scenario.componentChangeRate,
    referenceExchangeRate: input.referenceExchangeRate,
    commonListFactor,
    factorOrder,
    tierId: tier.id,
    tierLabel: tier.label,
    tierOrder,
    discountRate: tier.discountRate,
    objective: cloneObjective(tier.objective),
    listPriceBasis: input.listPriceBasis,
    minimumRequiredFactor,
    factorGapToMinimum: minimumRequiredFactor === null
      ? null
      : roundPricingValue(
        commonListFactor - minimumRequiredFactor,
        ratePrecision,
      ),
    feasibility: feasibilityFromCounts(
      calculableProducts.length,
      meetsProducts.length,
      belowProducts.length,
    ),
    totalUnits: roundPricingValue(totalUnits, DEFAULT_QUANTITY_PRECISION),
    productCount: products.length,
    calculableProductCount: calculableProducts.length,
    meetsObjectiveProductCount: meetsProducts.length,
    belowObjectiveProductCount: belowProducts.length,
    volumeCoverageRate: totalUnits > 0
      ? roundPricingValue(meetsUnits / totalUnits, ratePrecision)
      : 0,
    referencePurchaseCostTotal: roundPricingValue(
      referencePurchaseCostTotal,
      moneyPrecision,
    ),
    stressedPurchaseCostTotal: roundPricingValue(
      stressedPurchaseCostTotal,
      moneyPrecision,
    ),
    referenceLandedCostTotal: roundPricingValue(
      referenceLandedCostTotal,
      moneyPrecision,
    ),
    landedCostTotal: roundPricingValue(landedCostTotal, moneyPrecision),
    landedCostImpact: roundPricingValue(
      landedCostTotal - referencePurchaseCostTotal,
      moneyPrecision,
    ),
    landedCostUpliftRate: stressedPurchaseCostTotal !== 0
      ? roundPricingValue(
        (landedCostTotal - stressedPurchaseCostTotal) /
          stressedPurchaseCostTotal,
        ratePrecision,
      )
      : null,
    totalListPrice: roundPricingValue(totalListPrice, moneyPrecision),
    totalSellingPrice: roundPricingValue(totalSellingPrice, moneyPrecision),
    totalGrossProfit: roundPricingValue(totalGrossProfit, moneyPrecision),
    grossMargin: roundPricingValue(
      calculatePriceGrossMargin(totalSellingPrice, landedCostTotal),
      ratePrecision,
    ),
    weightedNetFactorOnLandedCost: landedCostTotal > 0
      ? roundPricingValue(totalSellingPrice / landedCostTotal, ratePrecision)
      : 0,
    minimumGrossMargin: margins.length > 0 ? Math.min(...margins) : null,
    maximumGrossMargin: margins.length > 0 ? Math.max(...margins) : null,
    limitingProductId: limitingProduct?.product.id ?? null,
    limitingProductLabel: limitingProduct
      ? productLabel(limitingProduct.product)
      : null,
    products,
    componentSummaries,
  }
}

function buildScenarioSummaries(
  input: PriceLandedCostInput,
  cells: readonly PriceLandedCostCell[],
): PriceLandedCostScenarioSummary[] {
  return input.scenarios.map((scenario) => {
    const scenarioCells = cells.filter(
      (cell) => cell.scenarioId === scenario.id,
    )
    const calculable = scenarioCells.filter(
      (cell) => cell.feasibility !== 'invalid',
    )
    const criticalCell = calculable.reduce<PriceLandedCostCell | null>(
      (current, cell) => {
        if (!current) {
          return cell
        }

        const currentRequired = current.minimumRequiredFactor ?? -Infinity
        const nextRequired = cell.minimumRequiredFactor ?? -Infinity

        if (nextRequired !== currentRequired) {
          return nextRequired > currentRequired ? cell : current
        }

        return cell.grossMargin < current.grossMargin ? cell : current
      },
      null,
    )
    const componentTotals = new Map<string, PriceLandedCostComponentSummary>()
    scenarioCells.forEach((cell) => {
      cell.componentSummaries.forEach((component) => {
        const current = componentTotals.get(component.componentId)
        if (!current || Math.abs(component.totalImpact) > Math.abs(current.totalImpact)) {
          componentTotals.set(component.componentId, component)
        }
      })
    })
    const largestComponent = [...componentTotals.values()].reduce<PriceLandedCostComponentSummary | null>(
      (current, component) => {
        if (!current) {
          return component
        }

        return component.totalImpact > current.totalImpact
          ? component
          : current
      },
      null,
    )
    const margins = calculable.map((cell) => cell.grossMargin)
    const grossProfits = calculable.map((cell) => cell.totalGrossProfit)
    const requiredFactors = calculable.flatMap((cell) =>
      cell.minimumRequiredFactor === null ? [] : [cell.minimumRequiredFactor],
    )
    const landedTotals = calculable.map((cell) => cell.landedCostTotal)
    const upliftRates = calculable.flatMap((cell) =>
      cell.landedCostUpliftRate === null ? [] : [cell.landedCostUpliftRate],
    )

    return {
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      purchaseCostChangeRate: scenario.purchaseCostChangeRate,
      exchangeRate: scenario.exchangeRate,
      componentChangeRate: scenario.componentChangeRate,
      cellCount: scenarioCells.length,
      fullyFeasibleCellCount: scenarioCells.filter(
        (cell) => cell.feasibility === 'fully_feasible',
      ).length,
      partiallyFeasibleCellCount: scenarioCells.filter(
        (cell) => cell.feasibility === 'partially_feasible',
      ).length,
      notFeasibleCellCount: scenarioCells.filter(
        (cell) => cell.feasibility === 'not_feasible',
      ).length,
      invalidCellCount: scenarioCells.filter(
        (cell) => cell.feasibility === 'invalid',
      ).length,
      minimumGrossMargin: margins.length > 0 ? Math.min(...margins) : null,
      minimumTotalGrossProfit: grossProfits.length > 0
        ? Math.min(...grossProfits)
        : null,
      maximumRequiredFactor: requiredFactors.length > 0
        ? Math.max(...requiredFactors)
        : null,
      maximumLandedCostTotal: landedTotals.length > 0
        ? Math.max(...landedTotals)
        : null,
      maximumLandedCostUpliftRate: upliftRates.length > 0
        ? Math.max(...upliftRates)
        : null,
      criticalTierId: criticalCell?.tierId ?? null,
      criticalTierLabel: criticalCell?.tierLabel ?? null,
      criticalProductId: criticalCell?.limitingProductId ?? null,
      criticalProductLabel: criticalCell?.limitingProductLabel ?? null,
      largestCostComponentId: largestComponent?.componentId ?? null,
      largestCostComponentLabel: largestComponent?.componentLabel ?? null,
    }
  })
}

function buildFactorSummaries(
  input: PriceLandedCostInput,
  cells: readonly PriceLandedCostCell[],
): PriceLandedCostFactorSummary[] {
  return input.commonListFactors.map((factor) => {
    const factorCells = cells.filter(
      (cell) => cell.commonListFactor === factor,
    )
    const validCells = factorCells.filter(
      (cell) => cell.feasibility !== 'invalid',
    )
    const margins = validCells.map((cell) => cell.grossMargin)
    const grossProfits = validCells.map((cell) => cell.totalGrossProfit)
    const coverageRates = validCells.map((cell) => cell.volumeCoverageRate)

    return {
      commonListFactor: factor,
      cellCount: factorCells.length,
      fullyFeasibleCellCount: factorCells.filter(
        (cell) => cell.feasibility === 'fully_feasible',
      ).length,
      partiallyFeasibleCellCount: factorCells.filter(
        (cell) => cell.feasibility === 'partially_feasible',
      ).length,
      notFeasibleCellCount: factorCells.filter(
        (cell) => cell.feasibility === 'not_feasible',
      ).length,
      invalidCellCount: factorCells.filter(
        (cell) => cell.feasibility === 'invalid',
      ).length,
      minimumVolumeCoverageRate: coverageRates.length > 0
        ? Math.min(...coverageRates)
        : 0,
      minimumGrossMargin: margins.length > 0 ? Math.min(...margins) : null,
      minimumTotalGrossProfit: grossProfits.length > 0
        ? Math.min(...grossProfits)
        : null,
      fullyFeasibleAcrossAllScenariosAndTiers:
        factorCells.length > 0 &&
        factorCells.every((cell) => cell.feasibility === 'fully_feasible'),
    }
  })
}

export function evaluatePriceLandedCost(
  input: PriceLandedCostInput,
  options?: PriceLandedCostOptions,
): PriceLandedCostResult {
  const moneyPrecision = options?.moneyPrecision ?? DEFAULT_MONEY_PRECISION
  const ratePrecision = options?.ratePrecision ?? DEFAULT_RATE_PRECISION
  const quantityPrecision = options?.quantityPrecision ?? DEFAULT_QUANTITY_PRECISION
  const normalizedInput = normalizeInput(
    input,
    ratePrecision,
    quantityPrecision,
  )
  const validationIssues = validateInput(normalizedInput)

  if (validationIssues.some((item) => item.severity === 'invalid')) {
    return invalidResult(normalizedInput, validationIssues)
  }

  const issues: PriceLandedCostIssue[] = [...validationIssues]
  const referenceProductCosts = buildScenarioProductCosts(
    normalizedInput.products,
    0,
    normalizedInput.referenceExchangeRate,
    moneyPrecision,
  )
  const cells: PriceLandedCostCell[] = []

  normalizedInput.scenarios.forEach((scenario, scenarioOrder) => {
    const scenarioProductCosts = buildScenarioProductCosts(
      normalizedInput.products,
      scenario.purchaseCostChangeRate,
      scenario.exchangeRate,
      moneyPrecision,
    )

    normalizedInput.commonListFactors.forEach((factor, factorOrder) => {
      normalizedInput.tiers.forEach((tier, tierOrder) => {
        const cell = buildCell(
          normalizedInput,
          scenario,
          scenarioOrder,
          factor,
          factorOrder,
          tier,
          tierOrder,
          scenarioProductCosts,
          referenceProductCosts,
          moneyPrecision,
          ratePrecision,
        )
        cells.push(cell)

        cell.products.forEach((product) => {
          if (product.landedCost <= 0) {
            issues.push({
              code: 'PRICE_LANDED_COST_NON_POSITIVE_WATERFALL',
              severity: 'invalid',
              message: `${productLabel(product.product)} produce un costo aterrizado no positivo en ${scenario.label}.`,
              scenarioId: scenario.id,
              tierId: tier.id,
              productId: product.product.id,
              componentId: null,
              commonListFactor: factor,
            })
          }

          if (product.meetsObjective === false) {
            issues.push({
              code: 'PRICE_LANDED_COST_BELOW_OBJECTIVE',
              severity: 'warning',
              message: `${productLabel(product.product)} queda debajo del objetivo en ${scenario.label} / ${tier.label} con factor ${factor.toLocaleString('es-MX')}x.`,
              scenarioId: scenario.id,
              tierId: tier.id,
              productId: product.product.id,
              componentId: null,
              commonListFactor: factor,
            })
          }
        })
      })
    })
  })

  if (cells.length === 0) {
    issues.push({
      code: 'PRICE_LANDED_COST_NO_CALCULABLE_ROWS',
      severity: 'invalid',
      message: 'No se generaron combinaciones calculables.',
      scenarioId: null,
      tierId: null,
      productId: null,
      componentId: null,
      commonListFactor: null,
    })
  }

  if (issues.some((item) => item.severity === 'invalid')) {
    return invalidResult(normalizedInput, issues)
  }

  const scenarioSummaries = buildScenarioSummaries(normalizedInput, cells)
  const factorSummaries = buildFactorSummaries(normalizedInput, cells)
  const requiredFactors = cells.flatMap((cell) =>
    cell.minimumRequiredFactor === null ? [] : [cell.minimumRequiredFactor],
  )
  const upliftRates = cells.flatMap((cell) =>
    cell.landedCostUpliftRate === null ? [] : [cell.landedCostUpliftRate],
  )
  const criticalScenario = scenarioSummaries.reduce<PriceLandedCostScenarioSummary | null>(
    (current, scenario) => {
      if (!current) {
        return scenario
      }

      const currentFactor = current.maximumRequiredFactor ?? -Infinity
      const nextFactor = scenario.maximumRequiredFactor ?? -Infinity

      if (nextFactor !== currentFactor) {
        return nextFactor > currentFactor ? scenario : current
      }

      const currentMargin = current.minimumGrossMargin ?? Infinity
      const nextMargin = scenario.minimumGrossMargin ?? Infinity

      return nextMargin < currentMargin ? scenario : current
    },
    null,
  )
  const summary = {
    productCount: normalizedInput.products.filter(
      (product) => product.quantity > 0,
    ).length,
    componentCount: normalizedInput.components.length,
    scenarioCount: normalizedInput.scenarios.length,
    tierCount: normalizedInput.tiers.length,
    factorCount: normalizedInput.commonListFactors.length,
    cellCount: cells.length,
    fullyFeasibleCellCount: cells.filter(
      (cell) => cell.feasibility === 'fully_feasible',
    ).length,
    partiallyFeasibleCellCount: cells.filter(
      (cell) => cell.feasibility === 'partially_feasible',
    ).length,
    notFeasibleCellCount: cells.filter(
      (cell) => cell.feasibility === 'not_feasible',
    ).length,
    invalidCellCount: cells.filter(
      (cell) => cell.feasibility === 'invalid',
    ).length,
    belowObjectiveProductCount: cells.reduce(
      (total, cell) => total + cell.belowObjectiveProductCount,
      0,
    ),
    fullyFeasibleFactorCount: factorSummaries.filter(
      (item) => item.fullyFeasibleAcrossAllScenariosAndTiers,
    ).length,
    globalMaximumRequiredFactor: requiredFactors.length > 0
      ? Math.max(...requiredFactors)
      : null,
    maximumLandedCostUpliftRate: upliftRates.length > 0
      ? Math.max(...upliftRates)
      : null,
  }
  const hasWarnings = issues.some((item) => item.severity === 'warning')

  return {
    available: true,
    methodology: PRICE_LANDED_COST_METHODOLOGY,
    executionMode: 'simulation-only',
    isolation: {
      mutatesCatalogPrice: false,
      mutatesSourceCost: false,
      persistsLandedCost: false,
      fetchesLiveExchangeRate: false,
      writesBusinessRepository: false,
      writesOtherWorkspaces: false,
    },
    status: hasWarnings ? 'warning' : 'valid',
    input: cloneInput(normalizedInput),
    cells,
    scenarioSummaries,
    factorSummaries,
    summary,
    criticalScenarioId: criticalScenario?.scenarioId ?? null,
    criticalScenarioLabel: criticalScenario?.scenarioLabel ?? null,
    issues,
    explainability: [
      'El costo aterrizado se construyó en el orden explícito de los componentes capturados.',
      'Los porcentajes sobre subtotal utilizan el subtotal acumulado al momento de aplicar cada componente.',
      'Los cargos fijos totales se distribuyeron por cantidad o por valor de compra según la base seleccionada.',
      `El precio de lista candidato quedó fijado sobre ${normalizedInput.listPriceBasis === 'reference_landed_cost' ? 'el costo aterrizado de referencia' : 'el costo de compra convertido de referencia'}; los escenarios de estrés no lo recalcularon automáticamente.`,
      'El impacto de cada componente en GP es el signo contrario de su impacto en costo cuando el precio neto permanece fijo.',
      'No se consultó un tipo de cambio en vivo y no se modificó ni persistió ningún costo, factor o precio.',
    ],
  }
}
