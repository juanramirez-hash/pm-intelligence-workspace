import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessInventoryPosition,
} from '../entities/inventoryPosition'

import type {
  BusinessPurchaseOrderLine,
} from '../entities/purchaseOrder'

import type {
  BusinessDataModel,
} from '../models/businessDataModel'

import {
  PurchasingInventoryQueries,
} from './purchasingInventoryQueries'

function inventoryPosition(
  overrides:
    Partial<BusinessInventoryPosition>,
): BusinessInventoryPosition {
  return {
    id: '2026-07-30::P-1::CDMX',
    snapshotDate: '2026-07-30',
    productId: 'P-1',
    productName: 'Producto 1',
    productCode: 'SKU-1',
    brandId: 'UNV',
    model: null,
    locationId: 'CDMX',
    identityStatus: 'current_master',
    onHand: 10,
    available: 7,
    committed: 3,
    inTransit: 0,
    onOrder: 0,
    unitCost: 100,
    inventoryValue: 1000,
    currency: 'MXN',
    sourceRows: 1,
    ...overrides,
  }
}

function purchaseOrderLine(
  overrides:
    Partial<BusinessPurchaseOrderLine>,
): BusinessPurchaseOrderLine {
  return {
    id: 'PO-1::1',
    purchaseOrderId: 'PO-1',
    purchaseOrderNumber: 'PO-1',

    sourceRowNumber: 2,
    duplicateOccurrences: 0,

    sourceInternalId: null,
    sourceSecondaryInternalId: null,
    purchaseOrderReference: null,

    purchaseOrderDate: '2026-07-20',
    periodId: '2026-07',
    expectedReceiptDate: '2026-07-29',

    status: 'Open',
    mainMemo: null,

    supplierId: 'SUP-1',
    supplierName: 'Proveedor Uno',
    currency: 'USD',

    lineType: 'product',
    itemCode: 'SKU-1',
    brandId: 'UNV',
    lineMemo: null,
    quantity: 5,
    amountForeignCurrency: 500,
    weight: null,

    supplierLeadTimeDays: null,
    supplierExpressLeadTimeDays: null,
    inventoryDays: null,

    shipmentNumber: null,
    shipmentStatus: null,
    zone: null,
    purchasingExecutive: 'Buyer Uno',

    coffDate: null,
    atdDate: null,
    ataDate: null,
    atwDate: null,

    department: null,
    valueClassification: null,
    valueScore: null,
    amountClassification: null,

    ...overrides,
  }
}

describe(
  'PurchasingInventoryQueries',
  () => {
    it(
      'usa solo el ultimo corte de inventario y expone el riesgo compuesto por itemCode',
      () => {
        const oldPosition =
          inventoryPosition({
            id: '2026-07-29::P-1::CDMX',
            snapshotDate:
              '2026-07-29',
            available: 10,
          })

        const latestPosition =
          inventoryPosition({
            id: '2026-07-30::P-1::CDMX',
            snapshotDate:
              '2026-07-30',
            available: 0,
          })

        const line =
          purchaseOrderLine({})

        const model = {
          inventoryPositions:
            new Map([
              [
                oldPosition.id,
                oldPosition,
              ],
              [
                latestPosition.id,
                latestPosition,
              ],
            ]),

          purchaseOrderLines:
            new Map([
              [
                line.id,
                line,
              ],
            ]),

          purchaseRequests:
            new Map(),
        } as BusinessDataModel

        const queries =
          new PurchasingInventoryQueries(
            model,
            '2026-07-30',
          )

        const report =
          queries.getReport()

        expect(
          report.snapshotDate,
        ).toBe('2026-07-30')

        expect(
          report.items,
        ).toHaveLength(1)

        expect(
          report.items[0]?.inventory.available,
        ).toBe(0)

        expect(
          report.items[0]?.purchasing.overduePurchaseOrders,
        ).toBe(1)

        expect(
          queries.findByItemCode(
            ' sku-1 ',
          )?.itemCode,
        ).toBe('SKU-1')

        expect(
          queries
            .getNoAvailableStockWithOpenPurchaseOrder(),
        ).toHaveLength(1)

        expect(
          queries
            .getNoAvailableStockWithOverduePurchaseOrder(),
        ).toHaveLength(1)

        expect(
          queries
            .getNoAvailableStockWithoutOpenPurchaseOrder(),
        ).toHaveLength(0)
      },
    )

    it(
      'devuelve copias defensivas del reporte',
      () => {
        const position =
          inventoryPosition({})

        const model = {
          inventoryPositions:
            new Map([
              [
                position.id,
                position,
              ],
            ]),

          purchaseOrderLines:
            new Map(),

          purchaseRequests:
            new Map(),
        } as BusinessDataModel

        const queries =
          new PurchasingInventoryQueries(
            model,
            '2026-07-30',
          )

        const first =
          queries.getReport()

        if (first.items[0]) {
          first.items[0].inventory.available =
            -999
        }

        const second =
          queries.getReport()

        expect(
          second.items[0]?.inventory.available,
        ).toBe(7)

        expect(
          second.items[0]?.inventory,
        ).not.toBe(
          first.items[0]?.inventory,
        )

        expect(
          second.items[0]?.purchasing.suppliers,
        ).not.toBe(
          first.items[0]?.purchasing.suppliers,
        )
      },
    )
  },
)