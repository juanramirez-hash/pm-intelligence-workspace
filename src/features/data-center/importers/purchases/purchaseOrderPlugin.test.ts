import {
  describe,
  expect,
  it,
} from 'vitest'

import { runImportEngine } from '../../engine/importEngine'
import { purchaseOrderImportPlugin } from './purchaseOrderPlugin'

const purchaseOrderRow = {
  'Internal ID': '90001',
  'Document Number': 'PO22832',
  'PO/Check Number': 'PO22832',
  Date: new Date('2025-01-03T00:00:00.000Z'),
  'Due Date/Receive By':
    new Date('2025-01-15T00:00:00.000Z'),
  Status: 'Pending Receipt',
  ITEM: 'PRODUCTO-001',
  Memo: 'Producto de prueba',
  Quantity: 10,
  'Amount (Foreign Currency)': 1000,
  Currency: 'MXN',
  ID: 'PROV001',
  Name: 'Proveedor de prueba',
  'Ejecutivo de Compras': 'Comprador Uno',
}

describe('purchaseOrderImportPlugin', () => {
  it('deduplica lineas exactas y conserva PO, periodo e importe', () => {
    const result = runImportEngine(
      purchaseOrderImportPlugin,
      [
        purchaseOrderRow,
        { ...purchaseOrderRow },
      ],
    )

    expect(result.valid).toBe(true)
    expect(result.processedRows).toBe(1)

    expect(result.summary.totalOrders).toBe(1)
    expect(result.summary.totalLines).toBe(1)
    expect(
      result.summary.duplicateSourceLines,
    ).toBe(1)
    expect(result.summary.productLines).toBe(1)

    expect(
      result.summary.amountsByCurrency,
    ).toEqual([
      {
        currency: 'MXN',
        totalAmount: 1000,
      },
    ])

    expect(result.normalizedRows[0])
      .toMatchObject({
        purchaseOrderNumber: 'PO22832',
        purchaseOrderReference: 'PO22832',
        itemCode: 'PRODUCTO-001',
        lineType: 'product',
        periodId: '2025-01',
        duplicateOccurrences: 1,
      })
  })

  it('clasifica impuestos, descuentos y ajustes', () => {
    const result = runImportEngine(
      purchaseOrderImportPlugin,
      [
        {
          ...purchaseOrderRow,
          'Internal ID': '90002',
          ITEM: 'COMPRAS NACIONAL',
          Memo: 'IVA',
          Quantity: -1,
          'Amount (Foreign Currency)': 160,
        },
        {
          ...purchaseOrderRow,
          'Internal ID': '90003',
          ITEM:
            'DESCUENTO PROVEEDOR GARANTIAS',
          Memo: 'Descuento',
          Quantity: '',
          'Amount (Foreign Currency)': -100,
        },
        {
          ...purchaseOrderRow,
          'Internal ID': '90004',
          ITEM: '',
          Memo: 'Ajuste manual',
          Quantity: '',
          'Amount (Foreign Currency)': 50,
        },
      ],
    )

    expect(result.valid).toBe(true)
    expect(result.processedRows).toBe(3)

    expect(result.summary.totalOrders).toBe(1)
    expect(result.summary.taxLines).toBe(1)
    expect(result.summary.discountLines).toBe(1)
    expect(result.summary.adjustmentLines).toBe(1)
    expect(result.summary.productLines).toBe(0)

    expect(
      result.normalizedRows.map(
        (row) => row.lineType,
      ),
    ).toEqual([
      'tax',
      'discount',
      'adjustment',
    ])
  })
})