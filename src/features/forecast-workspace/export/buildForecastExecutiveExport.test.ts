import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildForecastExecutiveSummary,
} from '../engine/buildForecastExecutiveSummary'

import type {
  ForecastWorkspaceModel,
} from '../types/forecastWorkspaceTypes'

import {
  buildForecastExecutiveExport,
} from './buildForecastExecutiveExport'

function workspaceFixture(): ForecastWorkspaceModel {
  return {
    available: true,
    officialAvailable: true,
    status: 'ready',
    unavailableReason: null,
    generatedAt: '2026-07-31T12:00:00.000Z',
    methodology: {
      baseline: 'baseline-v1',
      inventory: 'forecast-inventory-v1',
      projectAware: 'project-aware-v1',
    },
    scenarioId: 'expected',
    scenarios: [
      {
        id: 'conservative',
        label: 'Conservador',
        purpose: 'Protege el downside.',
        selected: false,
        portfolioRevenue: 900,
        portfolioGrossProfit: 225,
        portfolioQuantity: 90,
        portfolioGrossMargin: 0.25,
        targetAttainment: 0.9,
        official: true,
      },
      {
        id: 'expected',
        label: 'Esperado',
        purpose: 'Escenario central.',
        selected: true,
        portfolioRevenue: 1_000,
        portfolioGrossProfit: 250,
        portfolioQuantity: 100,
        portfolioGrossMargin: 0.25,
        targetAttainment: 1,
        official: true,
      },
      {
        id: 'accelerated',
        label: 'Acelerado',
        purpose: 'Captura upside.',
        selected: false,
        portfolioRevenue: 1_100,
        portfolioGrossProfit: 275,
        portfolioQuantity: 110,
        portfolioGrossMargin: 0.25,
        targetAttainment: 1.1,
        official: true,
      },
    ],
    filters: {
      search: '',
      brandId: 'all',
      coverage: 'all',
      priority: 'all',
      confidence: 'all',
    },
    filterOptions: {
      brands: [{ id: 'UNV', label: 'UNV' }],
      coverage: [
        'unavailable',
        'no-demand',
        'stockout',
        'shortage',
        'low',
        'balanced',
        'excess',
      ],
      priorities: [
        'critical',
        'high',
        'medium',
        'low',
        'none',
      ],
      confidenceLevels: ['high', 'medium', 'low'],
    },
    period: {
      currentPeriodId: '2026-07',
      dataCutoff: '2026-07-31',
      snapshotDate: '2026-07-30',
      periodStatus: 'in-progress',
      totalWorkingDays: 23,
      elapsedWorkingDays: 22,
      remainingWorkingDays: 1,
      progress: 22 / 23,
    },
    portfolio: {
      available: true,
      officialAvailable: true,
      actual: {
        revenue: 800,
        grossProfit: 200,
        quantity: 80,
      },
      projected: {
        revenue: 1_000,
        grossProfit: 250,
        quantity: 100,
      },
      projectedGrossMargin: 0.25,
      targetRevenue: 1_000,
      targetAttainment: 1,
      revenueGap: 0,
      requiredDailyRevenue: 200,
      targetStatus: 'on-track',
      confidenceScore: 90,
      confidenceLevel: 'high',
      origin: {
        actualTotal: {
          revenue: 800,
          grossProfit: 200,
          quantity: 80,
          documents: 8,
        },
        actualTransactional: {
          revenue: 600,
          grossProfit: 150,
          quantity: 60,
          documents: 6,
        },
        actualProjectBilling: {
          revenue: 200,
          grossProfit: 50,
          quantity: 20,
          documents: 2,
        },
        projectedTransactional: {
          revenue: 700,
          grossProfit: 175,
          quantity: 70,
        },
        projectBillingActual: {
          revenue: 200,
          grossProfit: 50,
          quantity: 20,
        },
        maturePipeline: {
          revenue: 100,
          grossProfit: 25,
          quantity: 0,
        },
        combined: {
          revenue: 1_000,
          grossProfit: 250,
          quantity: 90,
        },
      },
      explainability: ['La proyeccion combina metodos disponibles.'],
      limitations: [],
    },
    projectPipeline: {
      status: 'ready',
      officialAvailable: true,
      summary: {
        matureProjects: 1,
        matureIncludedProjects: 1,
        matureBlockedProjects: 0,
        matureRevenueMxn: 100,
        matureEstimatedGrossProfitMxn: 25,
        potentialProjects: 1,
        potentialAvailableProjects: 1,
        potentialRevenueMxn: 300,
        potentialWeightedRevenueMxn: 120,
        potentialEstimatedGrossProfitMxn: 75,
        missingExchangeRates: 0,
        grossProfitEstimateCoverage: 1,
        quantityAvailable: false,
      },
      contributions: [
        {
          id: 'PROY-1::2026-07',
          projectId: 'PROY-1',
          projectName: 'Proyecto Uno',
          brandId: 'UNV',
          statusCode: '05',
          statusLabel: '05 Esperando OC',
          forecastStage: 'mature',
          contributionStatus: 'included',
          estimatedBillingDate: '2026-07-31',
          periodId: '2026-07',
          closingProbability: 1,
          sourceCurrency: 'USD',
          sourceAmount: 5,
          exchangeRate: 20,
          convertedAmountMxn: 100,
          weightedAmountMxn: 100,
          conversionStatus: 'converted',
          estimatedGrossMargin: 0.25,
          estimatedGrossProfitMxn: 25,
          marginSource: 'historical-project-brand',
          issueCodes: [],
        },
      ],
      quality: {
        issues: [],
        blockingIssues: 0,
        warnings: 0,
        information: 0,
        reconciliationCoverage: 1,
        historicalReconciliationCoverage: 1,
        currentPeriodId: '2026-07',
        pendingCutoffDocuments: 0,
        salesDataCutoff: '2026-07-21',
        projectBillingDataCutoff: '2026-07-31',
        matureProjectsEvaluated: 1,
        matureProjectsIncluded: 1,
        matureProjectsBlocked: 0,
        potentialProjectsEvaluated: 1,
        potentialProjectsAvailable: 1,
        missingExchangeRates: 0,
        grossProfitEstimateCoverage: 1,
      },
    },
    inventory: {
      reportStatus: 'ready',
      productsAnalyzed: 2,
      filteredProducts: 2,
      productsWithProjectedDemand: 1,
      productsWithoutProjectedDemand: 1,
      criticalItems: 1,
      highPriorityItems: 0,
      availableUnits: 10,
      inboundUnits: 5,
      inventoryValue: 1_500,
      expectedDemandUnits: 12,
      remainingDemandUnits: 4,
      projectedAvailableAfterDemand: 6,
      projectedSupplyAfterDemand: 11,
      supersededInventoryProducts: 1,
      replacementRecoveries: 1,
      affectedInventoryValue: 500,
      coverage: {
        unavailable: 0,
        noDemand: 1,
        stockout: 1,
        shortage: 0,
        low: 0,
        balanced: 0,
        excess: 0,
      },
    },
    brands: [
      {
        brandId: 'UNV',
        label: 'UNV',
        officialAvailable: true,
        actual: {
          revenue: 800,
          grossProfit: 200,
          quantity: 80,
        },
        actualTransactional: {
          revenue: 600,
          grossProfit: 150,
          quantity: 60,
          documents: 6,
        },
        actualProjectBilling: {
          revenue: 200,
          grossProfit: 50,
          quantity: 20,
          documents: 2,
        },
        projectedTransactional: {
          revenue: 700,
          grossProfit: 175,
          quantity: 70,
        },
        maturePipeline: {
          revenue: 100,
          grossProfit: 25,
          quantity: 0,
        },
        projected: {
          revenue: 1_000,
          grossProfit: 250,
          quantity: 100,
        },
        potentialPipelineRevenue: 300,
        potentialWeightedPipelineRevenue: 120,
        matureProjects: 1,
        potentialProjects: 1,
        projectedGrossMargin: 0.25,
        targetRevenue: 1_000,
        targetAttainment: 1,
        revenueGap: 0,
        targetStatus: 'on-track',
        confidenceScore: 90,
        confidenceLevel: 'high',
        productsAnalyzed: 2,
        criticalProducts: 1,
        highPriorityProducts: 0,
        stockoutProducts: 1,
        shortageProducts: 0,
        lowCoverageProducts: 0,
        excessProducts: 0,
        noDemandProducts: 1,
        averageAvailableCoverageMonths: 1.2,
        riskScore: 95,
        navigation: {
          entityType: 'brand',
          entityId: 'UNV',
          label: 'UNV',
          href: '/brands/UNV',
        },
      },
    ],
    riskRanking: [
      {
        id: 'risk::P-OLD',
        category: 'risk',
        signalType: 'stockout',
        priority: 'critical',
        score: 95,
        title: 'Riesgo de agotamiento',
        rationale: 'Existe demanda sin disponibilidad.',
        recommendedAction: 'Validar reposicion inmediata.',
        productId: 'P-OLD',
        productName: 'Producto anterior',
        model: 'OLD-1',
        brandId: 'UNV',
        confidenceLevel: 'high',
        expectedDemandUnits: 12,
        remainingDemandUnits: 4,
        availableUnits: 0,
        inboundUnits: 0,
        availableCoverageMonths: 0,
        supplyCoverageMonths: 0,
        inventoryValue: 500,
        isSuperseded: true,
        navigation: {
          entityType: 'product',
          entityId: 'P-OLD',
          label: 'Producto anterior',
          href: '/products/P-OLD',
        },
        replacementNavigation: {
          entityType: 'product',
          entityId: 'P-NEW',
          label: 'Producto nuevo',
          href: '/products/P-NEW',
        },
      },
    ],
    opportunityRanking: [
      {
        id: 'opportunity::P-OLD',
        category: 'opportunity',
        signalType: 'replacement-recovery',
        priority: 'high',
        score: 80,
        title: 'Sustituto con disponibilidad',
        rationale: 'Existe un reemplazo conciliado.',
        recommendedAction: 'Acelerar la transicion comercial.',
        productId: 'P-OLD',
        productName: 'Producto anterior',
        model: 'OLD-1',
        brandId: 'UNV',
        confidenceLevel: 'high',
        expectedDemandUnits: 12,
        remainingDemandUnits: 4,
        availableUnits: 0,
        inboundUnits: 0,
        availableCoverageMonths: 0,
        supplyCoverageMonths: 0,
        inventoryValue: 500,
        isSuperseded: true,
        navigation: {
          entityType: 'product',
          entityId: 'P-OLD',
          label: 'Producto anterior',
          href: '/products/P-OLD',
        },
        replacementNavigation: {
          entityType: 'product',
          entityId: 'P-NEW',
          label: 'Producto nuevo',
          href: '/products/P-NEW',
        },
      },
    ],
    explainability: [
      'La proyeccion consume Forecast Baseline Engine.',
    ],
    limitations: [
      'Purchasing aun no esta conectado.',
    ],
  }
}

describe('FW-010 Forecast Executive Export', () => {
  it('genera resumen deterministico con escenario, filtros y hallazgos', () => {
    const summary = buildForecastExecutiveSummary(
      workspaceFixture(),
    )

    expect(summary.scenarioLabel).toBe('Esperado')
    expect(summary.overview).toContain('$1,000')
    expect(summary.outlook).toContain('objetivo')
    expect(summary.findings).toHaveLength(7)
    expect(summary.overview).toContain('Forecast transaccional')
  })

  it('construye las siete hojas Project-Aware y conserva navegacion', () => {
    const workspace = workspaceFixture()
    const payload = buildForecastExecutiveExport(
      {
        workspace,
        summary: buildForecastExecutiveSummary(workspace),
      },
      new Date('2026-07-31T18:00:00.000Z'),
    )

    expect(payload.fileName).toBe(
      'PM-Intelligence-Forecast-2026-07-Esperado.xlsx',
    )
    expect(payload.sheets.map((sheet) => sheet.name)).toEqual([
      'Resumen Ejecutivo',
      'Forecast por Marca',
      'Pipeline de Proyectos',
      'Riesgos por Producto',
      'Oportunidades',
      'Cobertura y Balance',
      'Metodologia y Fuentes',
    ])

    const projectRows = payload.sheets.find(
      (sheet) => sheet.name === 'Pipeline de Proyectos',
    )?.rows

    expect(projectRows?.[1]).toContain('PROY-1')
    expect(projectRows?.[1]).toContain('Incluido')

    const riskRows = payload.sheets.find(
      (sheet) => sheet.name === 'Riesgos por Producto',
    )?.rows

    expect(riskRows?.[1]).toContain('/products/P-OLD')
    expect(riskRows?.[1]).toContain('/products/P-NEW')

    const methodologyRows = payload.sheets.find(
      (sheet) => sheet.name === 'Metodologia y Fuentes',
    )?.rows

    expect(methodologyRows).toContainEqual([
      'Purchasing',
      'Fuente futura opcional; no bloquea Forecast',
    ])
  })
})
