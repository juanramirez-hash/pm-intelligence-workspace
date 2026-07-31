import type {
  BusinessDataModel,
} from '../models'

import type {
  ForecastCapabilityProfile,
  ForecastDataFoundation,
  ForecastFoundationStatus,
  ForecastGranularityProfile,
  ForecastQualityIssue,
  ForecastSourceProfile,
  ForecastSourceStatus,
} from './forecastContracts'

import {
  FORECAST_METRICS,
  FORECAST_SCENARIOS,
} from './forecastContracts'

const MINIMUM_HISTORY_PERIODS = 3

function safeRatio(
  numerator: number,
  denominator: number,
): number | null {
  return denominator > 0
    ? numerator / denominator
    : null
}

function normalizePeriodIds(
  values: Iterable<string>,
): string[] {
  return [...new Set(values)]
    .filter((value) => /^\d{4}-\d{2}$/.test(value))
    .sort()
}

function nextPeriodId(
  periodId: string,
): string | null {
  const match = periodId.match(/^(\d{4})-(\d{2})$/)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null
  }

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

function findMissingPeriods(
  periodIds: readonly string[],
): string[] {
  const first = periodIds[0]
  const last = periodIds.at(-1)

  if (!first || !last) {
    return []
  }

  const available = new Set(periodIds)
  const missing: string[] = []
  let cursor = first

  while (cursor !== last) {
    const next = nextPeriodId(cursor)

    if (!next) {
      break
    }

    cursor = next

    if (!available.has(cursor) && cursor !== last) {
      missing.push(cursor)
    }
  }

  return missing
}

function sourceStatus(
  available: boolean,
  complete: boolean,
): ForecastSourceStatus {
  if (!available) {
    return 'unavailable'
  }

  return complete
    ? 'ready'
    : 'partial'
}

function capabilityStatus(
  available: boolean,
  complete: boolean,
): ForecastSourceStatus {
  return sourceStatus(available, complete)
}

function getActiveInventoryPositions(
  model: BusinessDataModel,
) {
  const positions = [
    ...(model.inventoryPositions ?? new Map()).values(),
  ]

  const latestSnapshotDate = positions
    .map((position) => position.snapshotDate)
    .filter((date): date is string => Boolean(date))
    .sort((left, right) => right.localeCompare(left))[0] ?? null

  if (latestSnapshotDate) {
    return positions.filter(
      (position) => position.snapshotDate === latestSnapshotDate,
    )
  }

  return positions.filter(
    (position) => position.snapshotDate === null,
  )
}

function buildSources(
  model: BusinessDataModel,
  currentPeriodId: string | null,
): {
  sources: ForecastSourceProfile[]
  targetCoverage: number | null
  workingDaysCoverage: number | null
  productMasterCoverage: number | null
  inventoryIdentityCoverage: number | null
  replacementRecords: number
} {
  const currentPeriod = currentPeriodId
    ? model.periods.get(currentPeriodId)
    : undefined

  const currentBrands = currentPeriod
    ? [...currentPeriod.brands]
    : []

  const currentTargets = currentPeriodId
    ? [...model.brandTargets.values()].filter(
        (target) => target.periodId === currentPeriodId,
      )
    : []

  const currentTargetedBrands = new Set(
    currentTargets
      .filter((target) => target.targetRevenue !== null)
      .map((target) => target.brandId),
  )

  const currentWorkingDaysBrands = new Set(
    currentTargets
      .filter((target) => target.workingDays !== null)
      .map((target) => target.brandId),
  )

  const targetCoverage = safeRatio(
    currentBrands.filter((brandId) => currentTargetedBrands.has(brandId)).length,
    currentBrands.length,
  )

  const workingDaysCoverage = safeRatio(
    currentBrands.filter((brandId) => currentWorkingDaysBrands.has(brandId)).length,
    currentBrands.length,
  )

  const analyticalProductIds = new Set(
    [...model.productPeriods.values()].map((period) => period.productId),
  )

  const masterProductIds = new Set(
    [...model.products.values()]
      .filter((product) => product.identitySource === 'product_master')
      .map((product) => product.id),
  )

  const masteredAnalyticalProducts = [...analyticalProductIds]
    .filter((productId) => masterProductIds.has(productId))
    .length

  const productMasterCoverage = safeRatio(
    masteredAnalyticalProducts,
    analyticalProductIds.size,
  )

  const replacementRecords = [...model.products.values()]
    .filter(
      (product) =>
        Boolean(product.supersededBy) ||
        Boolean(product.directSubstitute),
    )
    .length

  const inventoryPositions = getActiveInventoryPositions(model)

  const inventoryIdentityCoverage = safeRatio(
    inventoryPositions.filter(
      (position) => position.identityStatus === 'current_master',
    ).length,
    inventoryPositions.length,
  )

  const salesAvailable =
    model.processedRows > 0 &&
    model.periods.size > 0

  const targetAvailable = model.brandTargets.size > 0
  const targetComplete =
    targetAvailable &&
    targetCoverage === 1

  const workingDaysAvailable = currentTargets.some(
    (target) => target.workingDays !== null,
  )
  const workingDaysComplete =
    workingDaysAvailable &&
    workingDaysCoverage === 1

  const inventoryAvailable = inventoryPositions.length > 0
  const inventoryComplete =
    inventoryAvailable &&
    inventoryIdentityCoverage === 1

  const productMasterAvailable = masterProductIds.size > 0
  const productMasterComplete =
    productMasterAvailable &&
    productMasterCoverage === 1

  return {
    sources: [
      {
        id: 'sales-history',
        label: 'Histórico de ventas',
        role: 'required',
        status: salesAvailable ? 'ready' : 'unavailable',
        summary: salesAvailable
          ? 'Hechos mensuales disponibles para construir series históricas.'
          : 'No hay ventas normalizadas disponibles.',
        facts: {
          processedRows: model.processedRows,
          periods: model.periods.size,
          brands: model.brands.size,
          customers: model.customers.size,
          products: analyticalProductIds.size,
          dataStart: model.periodStart,
          dataCutoff: model.periodEnd,
        },
        notes: [
          'Fuente obligatoria para todos los Forecast Workspaces.',
          'Forecast Baseline Engine consume estos hechos sin modificar las ventas históricas.',
        ],
      },
      {
        id: 'commercial-targets',
        label: 'Objetivos comerciales',
        role: 'enrichment',
        status: sourceStatus(targetAvailable, targetComplete),
        summary: targetAvailable
          ? 'Objetivos por marca y periodo disponibles para medir cierre contra cuota.'
          : 'No hay objetivos comerciales cargados.',
        facts: {
          totalTargets: model.brandTargets.size,
          currentPeriodTargets: currentTargets.length,
          currentActiveBrands: currentBrands.length,
          currentTargetCoverage: targetCoverage,
        },
        notes: [
          'Los objetivos no son necesarios para pronosticar demanda, pero sí para proyectar cumplimiento.',
        ],
      },
      {
        id: 'working-days',
        label: 'Calendario laboral',
        role: 'enrichment',
        status: sourceStatus(
          workingDaysAvailable,
          workingDaysComplete,
        ),
        summary: workingDaysAvailable
          ? 'Días laborales disponibles dentro de los objetivos de marca.'
          : 'No hay días laborales disponibles para el periodo actual.',
        facts: {
          currentPeriodTargets: currentTargets.length,
          targetsWithWorkingDays: currentTargets.filter(
            (target) => target.workingDays !== null,
          ).length,
          currentWorkingDaysCoverage: workingDaysCoverage,
        },
        notes: [
          'El calendario laboral se conserva como dato declarado; Forecast no inventa días faltantes.',
        ],
      },
      {
        id: 'inventory',
        label: 'Inventario actual',
        role: 'enrichment',
        status: sourceStatus(inventoryAvailable, inventoryComplete),
        summary: inventoryAvailable
          ? 'Posiciones activas disponibles para futuras métricas de cobertura y agotamiento.'
          : 'No hay inventario conectado.',
        facts: {
          positions: inventoryPositions.length,
          products: new Set(
            inventoryPositions.map(
              (position) => position.productId ?? position.productName,
            ),
          ).size,
          locations: new Set(
            inventoryPositions.map((position) => position.locationId),
          ).size,
          identityCoverage: inventoryIdentityCoverage,
        },
        notes: [
          'Las unidades en tránsito y en orden se usarán como entradas agregadas hasta conectar Purchasing.',
        ],
      },
      {
        id: 'product-master',
        label: 'Product Master',
        role: 'enrichment',
        status: sourceStatus(
          productMasterAvailable,
          productMasterComplete,
        ),
        summary: productMasterAvailable
          ? 'Identidad, categoría de valor y sustituciones disponibles para enriquecer el forecast.'
          : 'No hay Product Master conectado.',
        facts: {
          masterProducts: masterProductIds.size,
          analyticalProducts: analyticalProductIds.size,
          masteredAnalyticalProducts,
          analyticalCoverage: productMasterCoverage,
          replacementRecords,
        },
        notes: [
          'Superseded y sustituto directo son atributos de contexto; no alteran hechos históricos.',
        ],
      },
      {
        id: 'purchasing',
        label: 'Purchasing Visibility',
        role: 'future',
        status: 'planned',
        summary: 'Dominio reservado para una etapa posterior y no bloqueante para Forecast.',
        facts: {
          connected: false,
          requiredForFw001: false,
        },
        notes: [
          'Executive y Forecast conservarán contratos opcionales para incorporar fechas de llegada en el futuro.',
        ],
      },
    ],
    targetCoverage,
    workingDaysCoverage,
    productMasterCoverage,
    inventoryIdentityCoverage,
    replacementRecords,
  }
}

function buildGranularities(
  model: BusinessDataModel,
  totalPeriods: number,
): ForecastGranularityProfile[] {
  const historyReady = totalPeriods >= MINIMUM_HISTORY_PERIODS

  return [
    {
      granularity: 'portfolio',
      priority: 'primary',
      status: capabilityStatus(
        model.periods.size > 0,
        historyReady,
      ),
      entityCount: model.periods.size > 0 ? 1 : 0,
      observationCount: model.periods.size,
      summary: 'Serie mensual consolidada de la operación.',
    },
    {
      granularity: 'brand',
      priority: 'primary',
      status: capabilityStatus(
        model.brandPeriods.size > 0,
        historyReady,
      ),
      entityCount: model.brands.size,
      observationCount: model.brandPeriods.size,
      summary: 'Granularidad principal para cuota, ritmo y cierre por marca.',
    },
    {
      granularity: 'product',
      priority: 'primary',
      status: capabilityStatus(
        model.productPeriods.size > 0,
        historyReady,
      ),
      entityCount: new Set(
        [...model.productPeriods.values()].map((period) => period.productId),
      ).size,
      observationCount: model.productPeriods.size,
      summary: 'Granularidad principal para demanda, cobertura y riesgo de inventario.',
    },
    {
      granularity: 'customer',
      priority: 'secondary',
      status: model.customerPeriods.size > 0
        ? 'planned'
        : 'unavailable',
      entityCount: model.customers.size,
      observationCount: model.customerPeriods.size,
      summary: 'Contrato reservado para una etapa posterior; no es granularidad primaria del baseline actual.',
    },
  ]
}

function findGranularityStatus(
  granularities: readonly ForecastGranularityProfile[],
  granularity: ForecastGranularityProfile['granularity'],
): ForecastSourceStatus {
  return granularities.find(
    (item) => item.granularity === granularity,
  )?.status ?? 'unavailable'
}

function combineStatus(
  statuses: readonly ForecastSourceStatus[],
): ForecastSourceStatus {
  if (statuses.every((status) => status === 'ready')) {
    return 'ready'
  }

  if (statuses.some((status) => status === 'ready' || status === 'partial')) {
    return 'partial'
  }

  if (statuses.some((status) => status === 'planned')) {
    return 'planned'
  }

  return 'unavailable'
}

function buildCapabilities(
  sources: readonly ForecastSourceProfile[],
  granularities: readonly ForecastGranularityProfile[],
  replacementRecords: number,
): ForecastCapabilityProfile[] {
  const statusBySource = new Map(
    sources.map((source) => [source.id, source.status]),
  )

  const salesStatus = statusBySource.get('sales-history') ?? 'unavailable'
  const targetStatus = statusBySource.get('commercial-targets') ?? 'unavailable'
  const workingDaysStatus = statusBySource.get('working-days') ?? 'unavailable'
  const inventoryStatus = statusBySource.get('inventory') ?? 'unavailable'
  const productMasterStatus = statusBySource.get('product-master') ?? 'unavailable'

  return [
    {
      id: 'portfolio-outlook',
      label: 'Proyección consolidada',
      status: findGranularityStatus(granularities, 'portfolio'),
      summary: 'Base mensual para proyectar venta, GP y cantidad del portafolio.',
      dependencies: ['sales-history'],
    },
    {
      id: 'brand-outlook',
      label: 'Proyección por marca',
      status: findGranularityStatus(granularities, 'brand'),
      summary: 'Base mensual por marca; los objetivos se usarán como contexto, no como hechos.',
      dependencies: ['sales-history'],
    },
    {
      id: 'product-demand',
      label: 'Demanda por producto',
      status: findGranularityStatus(granularities, 'product'),
      summary: 'Base mensual por producto para demanda y riesgo de inventario.',
      dependencies: ['sales-history'],
    },
    {
      id: 'customer-demand',
      label: 'Demanda por cliente',
      status: findGranularityStatus(granularities, 'customer'),
      summary: 'Contrato disponible como extensión secundaria para FW-003.',
      dependencies: ['sales-history'],
    },
    {
      id: 'target-pace',
      label: 'Ritmo contra objetivo',
      status: combineStatus([targetStatus, workingDaysStatus]),
      summary: 'Permitirá proyectar cumplimiento mensual usando objetivos y calendario laboral declarado.',
      dependencies: ['sales-history', 'commercial-targets', 'working-days'],
    },
    {
      id: 'inventory-coverage',
      label: 'Cobertura de inventario',
      status: combineStatus([
        findGranularityStatus(granularities, 'product'),
        inventoryStatus,
      ]),
      summary: 'Compara demanda proyectada contra disponibilidad y entradas agregadas mediante Forecast Inventory Intelligence.',
      dependencies: ['sales-history', 'inventory'],
    },
    {
      id: 'replacement-aware',
      label: 'Forecast sensible a sustituciones',
      status:
        productMasterStatus === 'unavailable'
          ? 'unavailable'
          : replacementRecords > 0
            ? combineStatus([productMasterStatus, salesStatus])
            : 'partial',
      summary: 'Analiza productos Superseded y sustitutos directos sin reescribir los hechos históricos.',
      dependencies: ['sales-history', 'product-master'],
    },
    {
      id: 'supply-aware',
      label: 'Forecast con fechas de abastecimiento',
      status: 'planned',
      summary: 'Se habilitará cuando Purchasing Visibility aporte órdenes y fechas de recepción.',
      dependencies: ['sales-history', 'inventory', 'purchasing'],
    },
  ]
}

function buildQualityIssues(
  model: BusinessDataModel,
  totalPeriods: number,
  missingPeriodIds: readonly string[],
  targetCoverage: number | null,
  workingDaysCoverage: number | null,
  productMasterCoverage: number | null,
  inventoryIdentityCoverage: number | null,
): ForecastQualityIssue[] {
  const issues: ForecastQualityIssue[] = []

  if (model.periods.size === 0 || model.processedRows === 0) {
    issues.push({
      code: 'NO_SALES_HISTORY',
      severity: 'blocking',
      message: 'Forecast requiere ventas históricas normalizadas.',
    })
  }

  if (totalPeriods > 0 && totalPeriods < MINIMUM_HISTORY_PERIODS) {
    issues.push({
      code: 'LIMITED_HISTORY',
      severity: 'warning',
      message: `Solo existen ${totalPeriods} periodos; el contrato inicial recomienda al menos ${MINIMUM_HISTORY_PERIODS}.`,
    })
  }

  if (missingPeriodIds.length > 0) {
    issues.push({
      code: 'NON_CONSECUTIVE_HISTORY',
      severity: 'warning',
      message: `La serie histórica tiene ${missingPeriodIds.length} periodos mensuales faltantes.`,
    })
  }

  if (targetCoverage === null) {
    issues.push({
      code: 'TARGETS_NOT_AVAILABLE',
      severity: 'warning',
      message: 'No es posible evaluar cobertura de objetivos para el periodo actual.',
    })
  } else if (targetCoverage < 1) {
    issues.push({
      code: 'PARTIAL_TARGET_COVERAGE',
      severity: 'warning',
      message: 'No todas las marcas activas tienen objetivo de venta para el periodo actual.',
    })
  }

  if (workingDaysCoverage === null) {
    issues.push({
      code: 'WORKING_DAYS_NOT_AVAILABLE',
      severity: 'warning',
      message: 'No hay calendario laboral declarado para el periodo actual.',
    })
  } else if (workingDaysCoverage < 1) {
    issues.push({
      code: 'PARTIAL_WORKING_DAYS_COVERAGE',
      severity: 'warning',
      message: 'No todas las marcas activas tienen días laborales declarados.',
    })
  }

  if (productMasterCoverage === null) {
    issues.push({
      code: 'PRODUCT_MASTER_NOT_AVAILABLE',
      severity: 'warning',
      message: 'No es posible enriquecer demanda con categoría y sustituciones.',
    })
  } else if (productMasterCoverage < 1) {
    issues.push({
      code: 'PARTIAL_PRODUCT_MASTER_COVERAGE',
      severity: 'warning',
      message: 'Una parte de los productos con venta no está conciliada con Product Master.',
    })
  }

  if (inventoryIdentityCoverage === null) {
    issues.push({
      code: 'INVENTORY_NOT_AVAILABLE',
      severity: 'information',
      message: 'Cobertura y agotamiento permanecerán sin evaluación hasta conectar inventario.',
    })
  } else if (inventoryIdentityCoverage < 1) {
    issues.push({
      code: 'PARTIAL_INVENTORY_IDENTITY',
      severity: 'warning',
      message: 'Existen posiciones de inventario sin identidad conciliada con Product Master.',
    })
  }

  issues.push({
    code: 'PURCHASING_PLANNED',
    severity: 'information',
    message: 'Purchasing queda reservado para la etapa final y no bloquea Forecast.',
  })

  return issues
}

function resolveFoundationStatus(
  model: BusinessDataModel,
  totalPeriods: number,
): ForecastFoundationStatus {
  if (model.processedRows === 0 || model.periods.size === 0) {
    return 'unavailable'
  }

  if (
    totalPeriods < MINIMUM_HISTORY_PERIODS ||
    model.brandPeriods.size === 0 ||
    model.productPeriods.size === 0
  ) {
    return 'partial'
  }

  return 'ready'
}

export function buildForecastDataFoundation(
  model: BusinessDataModel,
): ForecastDataFoundation {
  const periodIds = normalizePeriodIds(model.periods.keys())
  const currentPeriodId = periodIds.at(-1) ?? null
  const baselinePeriodIds = currentPeriodId
    ? periodIds.filter((periodId) => periodId !== currentPeriodId)
    : []
  const missingPeriodIds = findMissingPeriods(periodIds)

  const {
    sources,
    targetCoverage,
    workingDaysCoverage,
    productMasterCoverage,
    inventoryIdentityCoverage,
    replacementRecords,
  } = buildSources(model, currentPeriodId)

  const granularities = buildGranularities(model, periodIds.length)
  const capabilities = buildCapabilities(
    sources,
    granularities,
    replacementRecords,
  )
  const issues = buildQualityIssues(
    model,
    periodIds.length,
    missingPeriodIds,
    targetCoverage,
    workingDaysCoverage,
    productMasterCoverage,
    inventoryIdentityCoverage,
  )
  const status = resolveFoundationStatus(model, periodIds.length)

  return {
    generatedAt: new Date().toISOString(),
    status,
    available: status !== 'unavailable',
    currentPeriodId,
    dataCutoff: model.periodEnd,
    history: {
      periodIds,
      baselinePeriodIds,
      currentPeriodId,
      firstPeriodId: periodIds[0] ?? null,
      lastPeriodId: periodIds.at(-1) ?? null,
      dataStart: model.periodStart,
      dataCutoff: model.periodEnd,
      totalPeriods: periodIds.length,
      baselinePeriods: baselinePeriodIds.length,
      minimumHistoryPeriods: MINIMUM_HISTORY_PERIODS,
      missingPeriodIds,
      consecutive: missingPeriodIds.length === 0,
    },
    sources,
    capabilities,
    granularities,
    metrics: [...FORECAST_METRICS],
    scenarios: FORECAST_SCENARIOS.map((scenario) => ({ ...scenario })),
    quality: {
      issues,
      blockingIssues: issues.filter(
        (issue) => issue.severity === 'blocking',
      ).length,
      warnings: issues.filter(
        (issue) => issue.severity === 'warning',
      ).length,
      information: issues.filter(
        (issue) => issue.severity === 'information',
      ).length,
      targetCoverage,
      workingDaysCoverage,
      productMasterCoverage,
      inventoryIdentityCoverage,
    },
    constraints: [
      'FW-002 calcula un baseline determinista; no incorpora todavía cobertura de inventario ni Purchasing detallado.',
      'El forecast oficial se derivará de BusinessDataModel y BusinessRepository, no de una calculadora aislada.',
      'Un forecast manual futuro será un escenario u override explícito y nunca reemplazará los hechos base.',
      'Purchasing es una fuente opcional futura y no bloquea Forecast, Pricing Laboratory ni Executive Workspace.',
    ],
  }
}
