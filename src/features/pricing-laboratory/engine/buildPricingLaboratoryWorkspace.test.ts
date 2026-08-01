import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  buildBusinessDataModel,
} from '../../../core/business/builders'

import {
  BusinessRepository,
} from '../../../core/business/repository'

import type {
  NormalizedProductMasterRow,
} from '../../data-center/importers/products/productMasterTypes'

import {
  buildPricingLaboratoryWorkspace,
} from './buildPricingLaboratoryWorkspace'

function productMasterRow(
  name: string,
  model: string,
  brand: string,
): NormalizedProductMasterRow {
  return {
    erpInternalId: null,
    name,
    code: name,
    model,
    brand,
    vendorCode: null,
    vendorName: null,
    description: null,
    classification: null,
    commercialStatus: null,
    trend: null,
    category: null,
    subcategory1: null,
    subcategory2: null,
    createdAt: null,
    updatedAt: null,
    averageCostUsd: null,
    totalValue: null,
    currency: null,
    inventoryValueMxn: null,
    inventoryValueUsd: null,
    lastPurchaseDate: null,
    lastSaleDate: null,
    unitsSoldLast90Days: null,
    preferredVendor: null,
    productClass: null,
    secondaryCategory1: null,
    secondaryCategory2: null,
    quantityPricingSchedule: null,
    formulaText: null,
    onHand: null,
    onOrder: null,
    catalogStatus: null,
    inactiveForPurchases: null,
    showOnPortal: null,
    supersededBy: null,
    blockPurchaseRequests: null,
    directSubstitute: null,
    benchmarkS: null,
    benchmarkT: null,
    benchmarkO: null,
  }
}

function createRepository(): BusinessRepository {
  return new BusinessRepository(
    buildBusinessDataModel([], {
      productMaster: [
        productMasterRow('P-1', 'IPC-ONE', 'UNV'),
        productMasterRow('P-2', 'UPS-TWO', 'ENSON'),
      ],
      prices: [
        {
          id: 'PRICE-P1-MXN-OLD',
          productId: 'P-1',
          brandId: 'UNV',
          currency: 'MXN',
          cost: 95,
          listPrice: 210,
          sellingPrice: 155,
          effectiveDate: '2026-06-01',
          source: 'erp',
        },
        {
          id: 'PRICE-P1-MXN-CURRENT',
          productId: 'P-1',
          brandId: 'UNV',
          currency: 'MXN',
          cost: 100,
          listPrice: 220,
          sellingPrice: 160,
          effectiveDate: '2026-07-01',
          source: 'erp',
          sourceReference: 'pricing.xlsx#MXN',
        },
        {
          id: 'PRICE-P1-USD-CURRENT',
          productId: 'P-1',
          brandId: 'UNV',
          currency: 'USD',
          cost: 5,
          listPrice: 11,
          sellingPrice: 8,
          effectiveDate: '2026-07-01',
          source: 'erp',
        },
        {
          id: 'PRICE-P2-MXN-CURRENT',
          productId: 'P-2',
          brandId: 'ENSON',
          currency: 'MXN',
          cost: 200,
          listPrice: 400,
          sellingPrice: 320,
          effectiveDate: '2026-07-01',
          source: 'erp',
        },
      ],
      priceScenarios: [
        {
          id: 'STORED-P1-PROMO',
          priceId: 'PRICE-P1-MXN-CURRENT',
          name: 'Promoción histórica',
          kind: 'promotion',
          pricingGroupId: 'PROMOTION',
          sellingPrice: 150,
          source: 'manual',
          sourceReference: 'SIM-001',
        },
      ],
    }),
  )
}

describe('PL-005 Pricing Laboratory Workspace Model', () => {
  it('publica opciones sin ejecutar escenarios antes de seleccionar producto', () => {
    const workspace = buildPricingLaboratoryWorkspace(
      createRepository(),
    )

    expect(workspace.status).toBe('awaiting_selection')
    expect(workspace.unavailableReason).toBe(
      'product_selection_required',
    )
    expect(workspace.selection.products).toHaveLength(2)
    expect(workspace.scenarios).toEqual([])
    expect(workspace.isolation.writesOtherWorkspaces).toBe(false)
  })

  it('exige moneda explícita cuando el producto tiene más de un canal', () => {
    const workspace = buildPricingLaboratoryWorkspace(
      createRepository(),
      {
        productId: 'p-1',
      },
    )

    expect(workspace.status).toBe('awaiting_selection')
    expect(workspace.unavailableReason).toBe(
      'currency_selection_required',
    )
    expect(
      workspace.selection.currencies.map((item) => item.currency),
    ).toEqual(['MXN', 'USD'])
  })

  it('orquesta plantillas y escenarios almacenados sin elegir un precio recomendado', () => {
    const repository = createRepository()
    const workspace = buildPricingLaboratoryWorkspace(
      repository,
      {
        productId: 'P-1',
        currency: 'MXN',
        selectedScenarioKey: 'template:silver-mxn',
        templates: [{
          id: 'SILVER-MXN',
          templateId: 'SILVER',
          basis: {
            type: 'discount_rate',
            discountRate: 0.46,
          },
          sourceReference: 'LAB-INPUT',
        }],
      },
    )

    expect(workspace.status).toBe('ready')
    expect(workspace.available).toBe(true)
    expect(workspace.source).toMatchObject({
      priceId: 'PRICE-P1-MXN-CURRENT',
      productId: 'P-1',
      model: 'IPC-ONE',
      currency: 'MXN',
    })
    expect(workspace.scenarios.map((item) => item.origin)).toEqual([
      'template',
      'stored',
    ])
    expect(workspace.summary).toMatchObject({
      totalRows: 2,
      templateRows: 1,
      storedRows: 1,
      selectedScenarioKey: 'TEMPLATE:SILVER-MXN',
    })
    expect(workspace.selectedScenario).toMatchObject({
      key: 'TEMPLATE:SILVER-MXN',
      evaluationStatus: 'valid',
      metrics: {
        sellingPrice: 118.8,
      },
    })
    expect(
      repository.prices.findById(
        'PRICE-P1-MXN-CURRENT',
      )?.sellingPrice,
    ).toBe(160)
    expect(workspace.explainability.join(' ')).not.toContain(
      'recomendado',
    )
  })

  it('clasifica configuraciones inválidas sin impedir comparar las válidas', () => {
    const workspace = buildPricingLaboratoryWorkspace(
      createRepository(),
      {
        productId: 'P-2',
        currency: 'MXN',
        includeStoredScenarios: false,
        templates: [
          {
            id: 'VALID-CUSTOM',
            templateId: 'CUSTOM',
            basis: {
              type: 'target_gross_margin',
              grossMargin: 0.3,
            },
          },
          {
            id: 'INVALID-SCOPE',
            templateId: 'PROJECT',
            basis: {
              type: 'selling_price',
              sellingPrice: 250,
            },
            scope: {
              brandIds: [],
            },
          },
        ],
      },
    )

    expect(workspace.status).toBe('partial')
    expect(workspace.summary.validEvaluations).toBe(1)
    expect(workspace.summary.invalidEvaluations).toBe(1)
    expect(workspace.scenarios[0]?.metrics).not.toBeNull()
    expect(workspace.scenarios[1]).toMatchObject({
      orchestrationStatus: 'invalid',
      metrics: null,
    })
  })

  it('mantiene los escenarios bloqueados como resultados comparables', () => {
    const workspace = buildPricingLaboratoryWorkspace(
      createRepository(),
      {
        productId: 'P-2',
        currency: 'MXN',
        includeStoredScenarios: false,
        defaultGuardrails: [{
          type: 'minimum_gross_margin',
          threshold: 0.25,
          severity: 'blocking',
        }],
        templates: [{
          id: 'LOW-MARGIN',
          templateId: 'CUSTOM',
          basis: {
            type: 'selling_price',
            sellingPrice: 210,
          },
        }],
      },
    )

    expect(workspace.status).toBe('ready')
    expect(workspace.summary.blockedEvaluations).toBe(1)
    expect(workspace.scenarios[0]).toMatchObject({
      evaluationStatus: 'blocked',
      metrics: {
        sellingPrice: 210,
      },
    })
  })

  it('marca selección de escenario inexistente sin seleccionar otro automáticamente', () => {
    const workspace = buildPricingLaboratoryWorkspace(
      createRepository(),
      {
        productId: 'P-2',
        currency: 'MXN',
        selectedScenarioKey: 'TEMPLATE:UNKNOWN',
        templates: [{
          id: 'CUSTOM-1',
          templateId: 'CUSTOM',
          basis: {
            type: 'selling_price_factor',
            factor: 1.8,
          },
        }],
      },
    )

    expect(workspace.status).toBe('partial')
    expect(workspace.selectedScenario).toBeNull()
    expect(workspace.summary.selectedScenarioKey).toBeNull()
    expect(workspace.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'WORKSPACE_SELECTED_SCENARIO_NOT_FOUND',
        }),
      ]),
    )
  })

  it('devuelve contrato no disponible cuando falta Business Repository', () => {
    const workspace = buildPricingLaboratoryWorkspace(
      null,
      {
        productId: 'P-1',
        currency: 'MXN',
      },
    )

    expect(workspace.available).toBe(false)
    expect(workspace.status).toBe('unavailable')
    expect(workspace.unavailableReason).toBe(
      'repository_unavailable',
    )
    expect(workspace.executionMode).toBe('simulation-only')
  })

  it('devuelve copias aisladas en ejecuciones consecutivas', () => {
    const repository = createRepository()
    const request = {
      productId: 'P-1',
      currency: 'USD',
      includeStoredScenarios: false,
      templates: [{
        id: 'USD-CUSTOM',
        templateId: 'CUSTOM' as const,
        basis: {
          type: 'selling_price' as const,
          sellingPrice: 7.5,
        },
      }],
    }
    const first = buildPricingLaboratoryWorkspace(
      repository,
      request,
    )

    if (!first.source || !first.scenarios[0]?.metrics) {
      throw new Error('Expected a materialized workspace')
    }

    first.source.metrics.sellingPrice = 1
    first.scenarios[0].metrics.sellingPrice = 1

    const second = buildPricingLaboratoryWorkspace(
      repository,
      request,
    )

    expect(second.source?.metrics.sellingPrice).toBe(8)
    expect(second.scenarios[0]?.metrics?.sellingPrice).toBe(7.5)
  })
})
