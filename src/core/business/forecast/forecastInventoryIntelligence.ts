import type {
  BusinessInventoryPosition,
} from '../entities/inventoryPosition'

import type {
  BusinessProduct,
} from '../entities/product'

import type {
  BusinessDataModel,
} from '../models'

import type {
  ForecastBaselineProjection,
  ForecastScenarioProjection,
} from './forecastProjectionContracts'

import {
  FORECAST_INVENTORY_THRESHOLDS,
} from './forecastInventoryContracts'

import type {
  ForecastCatalogContext,
  ForecastCoverageProfile,
  ForecastCoverageStatus,
  ForecastDemandProfile,
  ForecastInventoryIntelligenceReport,
  ForecastInventoryPriority,
  ForecastInventoryProfile,
  ForecastInventoryQualityProfile,
  ForecastInventoryReportStatus,
  ForecastInventorySignal,
  ForecastInventorySignalCategory,
  ForecastInventorySignalType,
  ForecastInventoryThresholds,
  ForecastProductInventoryInsight,
  ForecastReplacementContext,
} from './forecastInventoryContracts'

const METHODOLOGY_VERSION = 'forecast-inventory-v1' as const

interface InventoryAggregate {
  linked: boolean
  positions: number
  locations: number
  onHand: number
  available: number
  committed: number
  inTransit: number
  onOrder: number
  inbound: number
  inventoryValue: number
}

const EMPTY_INVENTORY: InventoryAggregate = {
  linked: false,
  positions: 0,
  locations: 0,
  onHand: 0,
  available: 0,
  committed: 0,
  inTransit: 0,
  onOrder: 0,
  inbound: 0,
  inventoryValue: 0,
}

function normalizeIdentifier(
  value: string | null | undefined,
): string {
  return (value ?? '')
    .trim()
    .toLocaleUpperCase('es-MX')
    .replace(/\s+/g, ' ')
}

function roundValue(
  value: number,
  decimals = 2,
): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function priorityFromScore(
  score: number,
): Exclude<ForecastInventoryPriority, 'none'> {
  if (score >= 85) {
    return 'critical'
  }

  if (score >= 65) {
    return 'high'
  }

  if (score >= 40) {
    return 'medium'
  }

  return 'low'
}

function latestInventoryCut(
  model: BusinessDataModel,
): {
  snapshotDate: string | null
  positions: BusinessInventoryPosition[]
} {
  const allPositions = [
    ...(model.inventoryPositions ?? new Map()).values(),
  ]

  const snapshotDate = allPositions
    .map((position) => position.snapshotDate)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null

  return {
    snapshotDate,
    positions: snapshotDate
      ? allPositions.filter(
          (position) => position.snapshotDate === snapshotDate,
        )
      : allPositions.filter(
          (position) => position.snapshotDate === null,
        ),
  }
}

function aggregatePositions(
  positions: readonly BusinessInventoryPosition[],
): InventoryAggregate {
  if (positions.length === 0) {
    return { ...EMPTY_INVENTORY }
  }

  const aggregate = positions.reduce<InventoryAggregate>(
    (result, position) => ({
      linked: true,
      positions: result.positions + 1,
      locations: 0,
      onHand: result.onHand + position.onHand,
      available: result.available + position.available,
      committed: result.committed + position.committed,
      inTransit: result.inTransit + position.inTransit,
      onOrder: result.onOrder + position.onOrder,
      inbound:
        result.inbound + position.inTransit + position.onOrder,
      inventoryValue:
        result.inventoryValue + position.inventoryValue,
    }),
    { ...EMPTY_INVENTORY },
  )

  aggregate.locations = new Set(
    positions.map((position) => position.locationId),
  ).size

  return aggregate
}

function indexInventoryByProduct(
  positions: readonly BusinessInventoryPosition[],
): Map<string, BusinessInventoryPosition[]> {
  const index = new Map<string, BusinessInventoryPosition[]>()

  for (const position of positions) {
    if (
      position.identityStatus !== 'current_master' ||
      !position.productId
    ) {
      continue
    }

    const key = normalizeIdentifier(position.productId)
    const current = index.get(key) ?? []
    current.push(position)
    index.set(key, current)
  }

  return index
}

function scenarioById(
  projection: ForecastBaselineProjection | undefined,
  id: ForecastScenarioProjection['id'],
): ForecastScenarioProjection | undefined {
  return projection?.scenarios.find(
    (scenario) => scenario.id === id,
  )
}

function buildDemandProfile(
  projection: ForecastBaselineProjection | undefined,
): ForecastDemandProfile {
  if (!projection) {
    return {
      actualQuantity: 0,
      conservativeQuantity: null,
      expectedQuantity: null,
      acceleratedQuantity: null,
      remainingExpectedQuantity: null,
      expectedDailyQuantity: null,
    }
  }

  const expectedQuantity = Math.max(0, projection.expected.quantity)
  const totalWorkingDays = projection.timing.totalWorkingDays

  return {
    actualQuantity: roundValue(projection.actual.quantity),
    conservativeQuantity: roundValue(
      scenarioById(projection, 'conservative')?.values.quantity ??
        expectedQuantity,
    ),
    expectedQuantity: roundValue(expectedQuantity),
    acceleratedQuantity: roundValue(
      scenarioById(projection, 'accelerated')?.values.quantity ??
        expectedQuantity,
    ),
    remainingExpectedQuantity: roundValue(
      Math.max(0, expectedQuantity - projection.actual.quantity),
    ),
    expectedDailyQuantity:
      totalWorkingDays !== null && totalWorkingDays > 0
        ? roundValue(expectedQuantity / totalWorkingDays, 4)
        : null,
  }
}

function coverageStatus(
  sourceAvailable: boolean,
  expectedQuantity: number | null,
  remainingExpectedQuantity: number | null,
  stock: number,
  coverageMonths: number | null,
  thresholds: ForecastInventoryThresholds,
): ForecastCoverageStatus {
  if (!sourceAvailable) {
    return 'unavailable'
  }

  if (expectedQuantity === null || expectedQuantity <= 0) {
    return 'no-demand'
  }

  if (stock <= 0) {
    return 'stockout'
  }

  if (
    remainingExpectedQuantity !== null &&
    remainingExpectedQuantity > 0 &&
    stock < remainingExpectedQuantity
  ) {
    return 'shortage'
  }

  if (
    coverageMonths !== null &&
    coverageMonths < thresholds.lowCoverageMonths
  ) {
    return 'low'
  }

  if (
    coverageMonths !== null &&
    coverageMonths >= thresholds.excessCoverageMonths
  ) {
    return 'excess'
  }

  return 'balanced'
}

function coverageValue(
  stock: number,
  expectedQuantity: number | null,
): number | null {
  if (expectedQuantity === null || expectedQuantity <= 0) {
    return null
  }

  return roundValue(Math.max(0, stock) / expectedQuantity, 4)
}

function coverageWorkingDays(
  stock: number,
  expectedDailyQuantity: number | null,
): number | null {
  if (
    expectedDailyQuantity === null ||
    expectedDailyQuantity <= 0
  ) {
    return null
  }

  return roundValue(
    Math.max(0, stock) / expectedDailyQuantity,
    2,
  )
}

function buildCoverageProfile(
  sourceAvailable: boolean,
  demand: ForecastDemandProfile,
  inventory: InventoryAggregate,
  thresholds: ForecastInventoryThresholds,
): ForecastCoverageProfile {
  const supply = inventory.available + inventory.inbound
  const availableMonths = coverageValue(
    inventory.available,
    demand.expectedQuantity,
  )
  const supplyMonths = coverageValue(
    supply,
    demand.expectedQuantity,
  )

  return {
    availableStatus: coverageStatus(
      sourceAvailable,
      demand.expectedQuantity,
      demand.remainingExpectedQuantity,
      inventory.available,
      availableMonths,
      thresholds,
    ),
    supplyStatus: coverageStatus(
      sourceAvailable,
      demand.expectedQuantity,
      demand.remainingExpectedQuantity,
      supply,
      supplyMonths,
      thresholds,
    ),
    availableMonths,
    availableWorkingDays: coverageWorkingDays(
      inventory.available,
      demand.expectedDailyQuantity,
    ),
    supplyMonths,
    supplyWorkingDays: coverageWorkingDays(
      supply,
      demand.expectedDailyQuantity,
    ),
  }
}

function productByReference(
  model: BusinessDataModel,
  reference: string,
): BusinessProduct | undefined {
  const normalizedReference = normalizeIdentifier(reference)

  if (!normalizedReference) {
    return undefined
  }

  const direct = model.products.get(normalizedReference)

  if (direct) {
    return direct
  }

  return [...model.products.values()].find((product) =>
    [product.id, product.name, product.code, product.sku]
      .map(normalizeIdentifier)
      .includes(normalizedReference),
  )
}

function buildCatalogContext(
  product: BusinessProduct | undefined,
): ForecastCatalogContext {
  const supersededBy = product?.supersededBy?.trim() || null
  const directSubstitute = product?.directSubstitute?.trim() || null

  return {
    commercialStatus: product?.commercialStatus ?? null,
    supersededBy,
    directSubstitute,
    isSuperseded: supersededBy !== null,
  }
}

function buildReplacementContext(
  model: BusinessDataModel,
  product: BusinessProduct | undefined,
  inventoryByProduct: Map<string, BusinessInventoryPosition[]>,
): ForecastReplacementContext | null {
  const reference =
    product?.directSubstitute?.trim() ||
    product?.supersededBy?.trim() ||
    null

  if (!reference) {
    return null
  }

  const referenceType = product?.directSubstitute?.trim()
    ? 'direct-substitute' as const
    : 'superseded-by' as const

  const replacement = productByReference(model, reference)
  const replacementId = replacement
    ? normalizeIdentifier(replacement.id)
    : null
  const inventory = replacementId
    ? aggregatePositions(inventoryByProduct.get(replacementId) ?? [])
    : { ...EMPTY_INVENTORY }

  return {
    referenceType,
    reference,
    resolved: replacement !== undefined,
    productId: replacement?.id ?? null,
    productName: replacement?.name ?? null,
    model: replacement?.model ?? null,
    available: roundValue(inventory.available),
    inTransit: roundValue(inventory.inTransit),
    onOrder: roundValue(inventory.onOrder),
    inbound: roundValue(inventory.inbound),
    locations: inventory.locations,
  }
}

function addSignal(
  signals: ForecastInventorySignal[],
  productId: string,
  type: ForecastInventorySignalType,
  category: ForecastInventorySignalCategory,
  score: number,
  title: string,
  rationale: string,
  evidence: ForecastInventorySignal['evidence'],
): void {
  const normalizedScore = Math.max(
    0,
    Math.min(100, Math.round(score)),
  )

  signals.push({
    id: `${type}::${productId}`,
    type,
    category,
    priority: priorityFromScore(normalizedScore),
    score: normalizedScore,
    title,
    rationale,
    evidence,
  })
}

function buildSignals(
  productId: string,
  inventorySourceAvailable: boolean,
  demand: ForecastDemandProfile,
  inventory: InventoryAggregate,
  coverage: ForecastCoverageProfile,
  catalog: ForecastCatalogContext,
  replacement: ForecastReplacementContext | null,
  thresholds: ForecastInventoryThresholds,
): ForecastInventorySignal[] {
  const signals: ForecastInventorySignal[] = []
  const expected = demand.expectedQuantity
  const remaining = demand.remainingExpectedQuantity
  const supply = inventory.available + inventory.inbound

  if (inventorySourceAvailable && expected !== null && expected > 0) {
    if (inventory.available <= 0) {
      addSignal(
        signals,
        productId,
        'stockout',
        'risk',
        95,
        'Riesgo de agotamiento',
        'Existe demanda mensual proyectada y no hay unidades disponibles en el corte actual.',
        {
          expectedQuantity: expected,
          remainingExpectedQuantity: remaining,
          available: inventory.available,
          inbound: inventory.inbound,
        },
      )
    } else if (
      remaining !== null &&
      remaining > 0 &&
      inventory.available < remaining
    ) {
      const shortageRatio =
        (remaining - inventory.available) / remaining

      addSignal(
        signals,
        productId,
        'current-period-shortage',
        'risk',
        85 + Math.min(10, shortageRatio * 10),
        'Cobertura insuficiente para el cierre',
        'La disponibilidad actual no cubre la demanda esperada restante del periodo.',
        {
          remainingExpectedQuantity: remaining,
          available: inventory.available,
          shortageUnits: roundValue(remaining - inventory.available),
        },
      )
    } else if (coverage.availableStatus === 'low') {
      addSignal(
        signals,
        productId,
        'low-coverage',
        'risk',
        65 + Math.min(
          20,
          (thresholds.lowCoverageMonths -
            (coverage.availableMonths ?? 0)) * 20,
        ),
        'Cobertura baja',
        'La disponibilidad representa menos de un mes de demanda esperada.',
        {
          availableMonths: coverage.availableMonths,
          thresholdMonths: thresholds.lowCoverageMonths,
          available: inventory.available,
          expectedQuantity: expected,
        },
      )
    }

    if (coverage.availableStatus === 'excess') {
      addSignal(
        signals,
        productId,
        'excess-stock',
        'risk',
        55 + Math.min(
          20,
          ((coverage.availableMonths ?? thresholds.excessCoverageMonths) -
            thresholds.excessCoverageMonths) * 5,
        ),
        'Inventario excedente frente al forecast',
        'La disponibilidad supera el umbral de meses de cobertura configurado para el baseline.',
        {
          availableMonths: coverage.availableMonths,
          thresholdMonths: thresholds.excessCoverageMonths,
          available: inventory.available,
          expectedQuantity: expected,
          inventoryValue: inventory.inventoryValue,
        },
      )
    }

    if (
      remaining !== null &&
      remaining > inventory.available &&
      supply >= remaining &&
      inventory.inbound > 0
    ) {
      addSignal(
        signals,
        productId,
        'inbound-recovery',
        'opportunity',
        58,
        'Entrada agregada recupera la cobertura',
        'Las unidades en tránsito y en orden cubren la brecha del periodo, pero aún no existen fechas de llegada.',
        {
          remainingExpectedQuantity: remaining,
          available: inventory.available,
          inbound: inventory.inbound,
          projectedSupply: supply,
        },
      )
    }
  }

  if (
    inventorySourceAvailable &&
    (expected === null || expected <= 0) &&
    supply > 0
  ) {
    addSignal(
      signals,
      productId,
      'no-projected-demand',
      'risk',
      72,
      'Inventario sin demanda proyectada',
      'El producto tiene inventario o entradas, pero Forecast Baseline no dispone de una demanda mensual proyectada.',
      {
        available: inventory.available,
        inbound: inventory.inbound,
        inventoryValue: inventory.inventoryValue,
        hasProjection: expected !== null,
      },
    )
  }

  if (catalog.isSuperseded && supply > 0) {
    addSignal(
      signals,
      productId,
      'superseded-inventory',
      'risk',
      78,
      'Inventario en producto Superseded',
      'El producto tiene una ruta de sustitución y conserva disponibilidad o entradas pendientes.',
      {
        supersededBy: catalog.supersededBy,
        directSubstitute: catalog.directSubstitute,
        available: inventory.available,
        inbound: inventory.inbound,
        inventoryValue: inventory.inventoryValue,
      },
    )
  }

  if (
    (catalog.isSuperseded || catalog.directSubstitute !== null) &&
    replacement &&
    !replacement.resolved
  ) {
    addSignal(
      signals,
      productId,
      'unresolved-replacement',
      'risk',
      62,
      'Referencia de sustitución no resuelta',
      'La referencia de reemplazo no pudo conciliarse con Product Master.',
      {
        reference: replacement.reference,
        referenceType: replacement.referenceType,
      },
    )
  }

  const currentHasCoverageRisk = signals.some((signal) =>
    [
      'stockout',
      'current-period-shortage',
      'low-coverage',
      'superseded-inventory',
    ].includes(signal.type),
  )

  if (
    currentHasCoverageRisk &&
    replacement?.resolved &&
    replacement.available > 0
  ) {
    addSignal(
      signals,
      productId,
      'replacement-recovery',
      'opportunity',
      70,
      'Sustituto con inventario disponible',
      'La ruta de sustitución resuelta tiene unidades disponibles que pueden apoyar la continuidad comercial.',
      {
        replacementProductId: replacement.productId,
        replacementAvailable: replacement.available,
        replacementInbound: replacement.inbound,
        replacementLocations: replacement.locations,
      },
    )
  }

  return signals.sort(
    (left, right) =>
      right.score - left.score ||
      left.type.localeCompare(right.type),
  )
}

function recommendedAction(
  signals: readonly ForecastInventorySignal[],
): string {
  const primary = signals[0]

  if (!primary) {
    return 'Mantener seguimiento del forecast y la cobertura en el siguiente corte.'
  }

  const actions: Record<ForecastInventorySignalType, string> = {
    stockout:
      'Validar reposición inmediata, transferencia interna o sustituto disponible.',
    'current-period-shortage':
      'Cubrir la brecha esperada del periodo y revisar entradas o sustitutos.',
    'low-coverage':
      'Revisar reposición antes de que la cobertura caiga por debajo de la demanda esperada.',
    'excess-stock':
      'Diseñar una acción comercial o ajuste de demanda para reducir cobertura excedente.',
    'no-projected-demand':
      'Revisar continuidad, promoción, sustitución o depuración del inventario sin forecast.',
    'inbound-recovery':
      'Dar seguimiento a las entradas agregadas y confirmar sus fechas de recepción.',
    'superseded-inventory':
      'Acelerar la transición comercial y definir salida del inventario del producto sustituido.',
    'replacement-recovery':
      'Canalizar oportunidades hacia el sustituto con disponibilidad confirmada.',
    'unresolved-replacement':
      'Corregir la referencia de sustitución en Product Master antes de usarla operativamente.',
  }

  return actions[primary.type]
}

function resolveItemStatus(
  projection: ForecastBaselineProjection | undefined,
  inventorySourceAvailable: boolean,
): ForecastInventoryReportStatus {
  if (!projection && !inventorySourceAvailable) {
    return 'unavailable'
  }

  if (!projection || !inventorySourceAvailable) {
    return 'partial'
  }

  return 'ready'
}

function resolveReportStatus(
  projections: readonly ForecastBaselineProjection[],
  inventorySourceAvailable: boolean,
  unresolvedInventoryPositions: number,
): ForecastInventoryReportStatus {
  if (projections.length === 0 && !inventorySourceAvailable) {
    return 'unavailable'
  }

  if (
    projections.length === 0 ||
    !inventorySourceAvailable ||
    unresolvedInventoryPositions > 0
  ) {
    return 'partial'
  }

  return 'ready'
}

function buildInventoryProfile(
  sourceAvailable: boolean,
  aggregate: InventoryAggregate,
  demand: ForecastDemandProfile,
): ForecastInventoryProfile {
  const remaining = demand.remainingExpectedQuantity

  return {
    sourceAvailable,
    linked: aggregate.linked,
    positions: aggregate.positions,
    locations: aggregate.locations,
    onHand: roundValue(aggregate.onHand),
    available: roundValue(aggregate.available),
    committed: roundValue(aggregate.committed),
    inTransit: roundValue(aggregate.inTransit),
    onOrder: roundValue(aggregate.onOrder),
    inbound: roundValue(aggregate.inbound),
    inventoryValue: roundValue(aggregate.inventoryValue),
    availableAfterRemainingDemand:
      remaining === null
        ? null
        : roundValue(aggregate.available - remaining),
    supplyAfterRemainingDemand:
      remaining === null
        ? null
        : roundValue(
            aggregate.available + aggregate.inbound - remaining,
          ),
  }
}

function buildInsight(
  model: BusinessDataModel,
  productId: string,
  projection: ForecastBaselineProjection | undefined,
  inventoryPositions: readonly BusinessInventoryPosition[],
  inventorySourceAvailable: boolean,
  snapshotDate: string | null,
  inventoryByProduct: Map<string, BusinessInventoryPosition[]>,
  thresholds: ForecastInventoryThresholds,
): ForecastProductInventoryInsight {
  const product = model.products.get(productId)
  const demand = buildDemandProfile(projection)
  const aggregate = aggregatePositions(inventoryPositions)
  const inventory = buildInventoryProfile(
    inventorySourceAvailable,
    aggregate,
    demand,
  )
  const coverage = buildCoverageProfile(
    inventorySourceAvailable,
    demand,
    aggregate,
    thresholds,
  )
  const catalog = buildCatalogContext(product)
  const replacement = buildReplacementContext(
    model,
    product,
    inventoryByProduct,
  )
  const signals = buildSignals(
    productId,
    inventorySourceAvailable,
    demand,
    aggregate,
    coverage,
    catalog,
    replacement,
    thresholds,
  )
  const primary = signals[0]
  const limitations: string[] = []

  if (!projection) {
    limitations.push(
      'No existe una serie de ventas utilizable para generar demanda mensual proyectada.',
    )
  }

  if (!inventorySourceAvailable) {
    limitations.push(
      'No existe un corte de inventario conectado; la cobertura no se calcula.',
    )
  } else if (!aggregate.linked) {
    limitations.push(
      'No existe una posición de inventario conciliada para este producto en el corte activo.',
    )
  }

  if (projection?.confidence.level === 'low') {
    limitations.push(
      'La proyección base tiene confianza baja y debe interpretarse como señal preliminar.',
    )
  }

  if (aggregate.inbound > 0) {
    limitations.push(
      'In transit y On order se consideran como entrada agregada sin fecha; Purchasing aún no está conectado.',
    )
  }

  if (replacement && !replacement.resolved) {
    limitations.push(
      'La referencia de sustitución no está conciliada con Product Master.',
    )
  }

  const explainability = [
    projection
      ? `Forecast esperado: ${demand.expectedQuantity ?? 0} unidades; demanda restante: ${demand.remainingExpectedQuantity ?? 0}.`
      : 'El producto no tiene una proyección base de demanda.',
    inventorySourceAvailable
      ? `Disponibilidad: ${inventory.available}; entradas agregadas: ${inventory.inbound}.`
      : 'Inventario no disponible para el cálculo.',
    coverage.availableMonths !== null
      ? `Cobertura disponible: ${coverage.availableMonths} meses; con entradas: ${coverage.supplyMonths ?? 0} meses.`
      : 'La cobertura mensual no se calcula sin una demanda esperada positiva.',
  ]

  if (replacement) {
    explainability.push(
      replacement.resolved
        ? `Reemplazo ${replacement.productId ?? replacement.reference}: ${replacement.available} unidades disponibles.`
        : `Referencia de reemplazo pendiente de resolver: ${replacement.reference}.`,
    )
  }

  return {
    id: `forecast-inventory::${productId}`,
    methodologyVersion: METHODOLOGY_VERSION,
    status: resolveItemStatus(
      projection,
      inventorySourceAvailable,
    ),
    currentPeriodId:
      projection?.currentPeriodId ??
      (model.periods.size > 0
        ? [...model.periods.keys()].sort().at(-1) ?? ''
        : ''),
    dataCutoff: projection?.dataCutoff ?? model.periodEnd,
    snapshotDate,
    productId,
    productName:
      product?.name ??
      projection?.entityLabel ??
      productId,
    model: product?.model ?? null,
    brandId:
      normalizeIdentifier(
        product?.brandId ?? product?.brand ?? null,
      ) || null,
    baselineConfidence: projection?.confidence.level ?? null,
    demand,
    inventory,
    coverage,
    catalog,
    replacement,
    priority: primary?.priority ?? 'none',
    score: primary?.score ?? 0,
    recommendedAction: recommendedAction(signals),
    signals,
    explainability,
    limitations: [...new Set(limitations)],
  }
}

function countSignal(
  items: readonly ForecastProductInventoryInsight[],
  type: ForecastInventorySignalType,
): number {
  return items.filter((item) =>
    item.signals.some((signal) => signal.type === type),
  ).length
}

function buildQuality(
  projections: readonly ForecastBaselineProjection[],
  inventoryByProduct: Map<string, BusinessInventoryPosition[]>,
  unresolvedInventoryPositions: number,
): ForecastInventoryQualityProfile {
  const projectionIds = new Set(
    projections
      .map((projection) => projection.entityId)
      .filter((value): value is string => Boolean(value))
      .map(normalizeIdentifier),
  )
  const inventoryIds = new Set(inventoryByProduct.keys())
  const projectedProductsWithoutInventory = [...projectionIds]
    .filter((productId) => !inventoryIds.has(productId))
    .length
  const inventoryProductsWithoutProjection = [...inventoryIds]
    .filter((productId) => !projectionIds.has(productId))
    .length
  const notes: string[] = []

  if (projectedProductsWithoutInventory > 0) {
    notes.push(
      `${projectedProductsWithoutInventory} productos proyectados no tienen una posición conciliada en el corte activo.`,
    )
  }

  if (inventoryProductsWithoutProjection > 0) {
    notes.push(
      `${inventoryProductsWithoutProjection} productos con inventario no tienen baseline de demanda.`,
    )
  }

  if (unresolvedInventoryPositions > 0) {
    notes.push(
      `${unresolvedInventoryPositions} posiciones de inventario no pueden vincularse a Product Master.`,
    )
  }

  return {
    productProjections: projectionIds.size,
    inventoryProducts: inventoryIds.size,
    projectedProductsWithoutInventory,
    inventoryProductsWithoutProjection,
    unresolvedInventoryPositions,
    notes,
  }
}

export class ForecastInventoryIntelligenceEngine {
  private readonly model: BusinessDataModel

  private readonly thresholds: ForecastInventoryThresholds

  constructor(
    model: BusinessDataModel,
    thresholds: ForecastInventoryThresholds =
      FORECAST_INVENTORY_THRESHOLDS,
  ) {
    this.model = model
    this.thresholds = {
      lowCoverageMonths: Math.max(
        0,
        thresholds.lowCoverageMonths,
      ),
      excessCoverageMonths: Math.max(
        thresholds.lowCoverageMonths,
        thresholds.excessCoverageMonths,
      ),
    }
  }

  build(
    productProjections: readonly ForecastBaselineProjection[],
  ): ForecastInventoryIntelligenceReport {
    const currentCut = latestInventoryCut(this.model)
    const inventorySourceAvailable = currentCut.positions.length > 0
    const inventoryByProduct = indexInventoryByProduct(
      currentCut.positions,
    )
    const unresolvedInventoryPositions = currentCut.positions.filter(
      (position) =>
        position.identityStatus === 'unresolved' ||
        !position.productId,
    ).length
    const projectionsByProduct = new Map(
      productProjections
        .filter(
          (projection): projection is ForecastBaselineProjection & {
            entityId: string
          } => Boolean(projection.entityId),
        )
        .map((projection) => [
          normalizeIdentifier(projection.entityId),
          projection,
        ]),
    )
    const productIds = new Set([
      ...projectionsByProduct.keys(),
      ...inventoryByProduct.keys(),
    ])
    const items = [...productIds]
      .map((productId) => buildInsight(
        this.model,
        productId,
        projectionsByProduct.get(productId),
        inventoryByProduct.get(productId) ?? [],
        inventorySourceAvailable,
        currentCut.snapshotDate,
        inventoryByProduct,
        this.thresholds,
      ))
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.inventory.inventoryValue -
            left.inventory.inventoryValue ||
          left.productName.localeCompare(right.productName),
      )

    const quality = buildQuality(
      productProjections,
      inventoryByProduct,
      unresolvedInventoryPositions,
    )
    const currentPeriodId = productProjections[0]?.currentPeriodId ??
      [...this.model.periods.keys()].sort().at(-1) ??
      null
    const dataCutoff = productProjections[0]?.dataCutoff ??
      this.model.periodEnd
    const affectedInventoryValue = items
      .filter((item) => item.signals.some(
        (signal) => signal.category === 'risk',
      ))
      .reduce(
        (total, item) => total + item.inventory.inventoryValue,
        0,
      )

    return {
      generatedAt: new Date().toISOString(),
      methodologyVersion: METHODOLOGY_VERSION,
      status: resolveReportStatus(
        productProjections,
        inventorySourceAvailable,
        unresolvedInventoryPositions,
      ),
      currentPeriodId,
      dataCutoff,
      snapshotDate: currentCut.snapshotDate,
      thresholds: { ...this.thresholds },
      summary: {
        productsAnalyzed: items.length,
        productsWithProjectedDemand: items.filter(
          (item) => (item.demand.expectedQuantity ?? 0) > 0,
        ).length,
        productsWithoutProjectedDemand: items.filter(
          (item) => (item.demand.expectedQuantity ?? 0) <= 0,
        ).length,
        criticalItems: items.filter(
          (item) => item.priority === 'critical',
        ).length,
        highPriorityItems: items.filter(
          (item) => item.priority === 'high',
        ).length,
        stockoutRisks: countSignal(items, 'stockout'),
        currentPeriodShortages: countSignal(
          items,
          'current-period-shortage',
        ),
        lowCoverageProducts: countSignal(items, 'low-coverage'),
        excessStockProducts: countSignal(items, 'excess-stock'),
        noProjectedDemandProducts: countSignal(
          items,
          'no-projected-demand',
        ),
        supersededInventoryProducts: countSignal(
          items,
          'superseded-inventory',
        ),
        inboundRecoveries: countSignal(items, 'inbound-recovery'),
        replacementRecoveries: countSignal(
          items,
          'replacement-recovery',
        ),
        affectedInventoryValue: roundValue(
          affectedInventoryValue,
        ),
      },
      quality,
      items,
    }
  }}
