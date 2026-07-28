import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  NormalizedProductMasterRow,
} from '../../../features/data-center/importers/products/productMasterTypes'

import type {
  NormalizedSalesRow,
} from '../../../features/data-center/importers/sales/salesTypes'

import {
  buildBusinessDataModel,
} from '../builders'

import {
  BusinessRepository,
} from './businessRepository'

function createProductMasterRow(
  overrides: Partial<NormalizedProductMasterRow> = {},
): NormalizedProductMasterRow {
  return {
    erpInternalId: '1001',
    code: 'CI-IPC-A',
    model: 'IPC-A',
    brand: 'UNV',
    vendorCode: 'V-001',
    vendorName: 'Uniview Technologies',
    description: 'Cámara IP profesional',
    classification: 'Video vigilancia',
    commercialStatus: 'A',
    trend: 'Crecimiento',
    category: 'CCTV',
    subcategory1: 'Cámaras IP',
    subcategory2: 'Bullet',
    createdAt: '2025-01-15',
    updatedAt: '2026-06-30',
    averageCostUsd: 80,
    totalValue: 800,
    currency: 'USD',
    inventoryValueMxn: 15000,
    inventoryValueUsd: 800,
    lastPurchaseDate: '2026-06-01',
    lastSaleDate: '2026-06-20',
    unitsSoldLast90Days: 10,
    preferredVendor: 'Uniview Technologies',
    productClass: 'CCTV',
    secondaryCategory1: 'Cámaras IP',
    secondaryCategory2: 'Bullet',
    quantityPricingSchedule: null,
    formulaText: null,
    onHand: 10,
    onOrder: 5,
    catalogStatus: 'Activo',
    inactiveForPurchases: false,
    showOnPortal: true,
    supersededBy: null,
    blockPurchaseRequests: false,
    directSubstitute: null,
    benchmarkS: null,
    benchmarkT: null,
    benchmarkO: null,
    ...overrides,
  }
}

function createRepository(): BusinessRepository {
  const rows: NormalizedSalesRow[] = [
    {
      date: '2026-06-20',
      brand: 'UNV',
      revenue: 1000,
      grossProfit: 250,
      customerId: '100001',
      customerName: 'Cliente Uno',
      model: 'IPC-A',
      quantity: 2,
      documentNumber: 'F001',
      location: 'CDMX',
      salesRep: 'Ana',
      currency: 'MXN',
    },
    {
      date: '2026-06-21',
      brand: 'UNV',
      revenue: 500,
      grossProfit: 100,
      customerId: '100002',
      customerName: 'Cliente Dos',
      model: 'SIN-CATALOGO',
      quantity: 1,
      documentNumber: 'F002',
      location: 'QRO',
      salesRep: 'Luis',
      currency: 'MXN',
    },
  ]

  const productMaster = [
    createProductMasterRow(),
    createProductMasterRow({
      erpInternalId: '1002',
      code: 'CI-IPC-B',
      model: 'IPC-B',
      description: 'Producto disponible sin venta',
      commercialStatus: 'B',
      subcategory2: 'Turret',
      secondaryCategory2: 'Turret',
      onHand: 4,
    }),
  ]

  return new BusinessRepository(
    buildBusinessDataModel(
      rows,
      { productMaster },
    ),
  )
}

describe('PMC-004 ERP Catalog Enrichment', () => {
  it('enriquece el producto conciliado con campos canónicos', () => {
    const product =
      createRepository().product.findByCode('ci-ipc-a')

    expect(product?.identitySource).toBe('product_master')
    expect(product?.id).toBe('CI-IPC-A')
    expect(product?.vendorName).toBe('Uniview Technologies')
    expect(product?.classification).toBe('Video vigilancia')
    expect(product?.category).toBe('CCTV')
    expect(product?.subcategory1).toBe('Cámaras IP')
    expect(product?.subcategory2).toBe('Bullet')
    expect(product?.createdAt).toBe('2025-01-15')
    expect(product?.updatedAt).toBe('2026-06-30')
    expect(product?.revenue).toBe(1000)
  })

  it('conserva productos de catálogo aunque no tengan ventas', () => {
    const product =
      createRepository().product.findByCode('CI-IPC-B')

    expect(product).toBeDefined()
    expect(product?.identitySource).toBe('product_master')
    expect(product?.revenue).toBe(0)
    expect(product?.activePeriods.size).toBe(0)
    expect(product?.subcategory2).toBe('Turret')
  })

  it('consulta atributos enriquecidos mediante índices', () => {
    const products = createRepository().product

    expect(products.findByVendor('uniview technologies')).toHaveLength(2)
    expect(products.findByClassification('video vigilancia')).toHaveLength(2)
    expect(products.findByCategory(' cctv ')).toHaveLength(2)
    expect(products.findBySubcategory1('cámaras ip')).toHaveLength(2)
    expect(products.findBySubcategory2('bullet')).toHaveLength(1)
    expect(products.findBySubcategory2('turret')).toHaveLength(1)
    expect(products.findByCatalogStatus('activo')).toHaveLength(2)
    expect(products.findByCommercialStatus('A')).toHaveLength(1)
    expect(products.findByCommercialStatus('B')).toHaveLength(1)
  })

  it('distingue productos del catálogo y productos fallback de ventas', () => {
    const products = createRepository().product

    expect(
      products.findCatalogProducts().map((product) => product.id),
    ).toEqual(['CI-IPC-A', 'CI-IPC-B'])

    expect(
      products.findSalesFallbackProducts().map((product) => product.id),
    ).toEqual(['SIN-CATALOGO'])
  })
})
