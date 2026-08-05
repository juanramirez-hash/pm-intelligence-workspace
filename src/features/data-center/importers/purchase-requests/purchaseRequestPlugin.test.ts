import {
  describe,
  expect,
  it,
} from 'vitest'

import { runImportEngine } from '../../engine/importEngine'
import { purchaseRequestImportPlugin } from './purchaseRequestPlugin'

const purchaseRequestRow = {
  ID: 'SC16238',
  'Maximum of FECHA DE SOLICITUD':
    new Date('2025-01-03T00:00:00.000Z'),
  'Document Number': 'P1007330',
  'ESTATUS SC': 'Procesada',
  CODIGO: 'PRODUCTO-001',
  MARCA: 'MARCA UNO',
  MODELO: 'MODELO-001',
  DESCRIPCION: 'Producto de prueba',
  Estatus: 'Disponible',
  QTY: 10,
  'Document Number_1': 'PO22832',
  'AUTORIZADO POR CAJA': 'Autorizado',
  'ANTICIPO?': 'No requiere',
  'ESTATUS PEDIDO': 'Pendiente',
  Status: 'Pendiente',
  'YA SE PIDIO?': 'Sí',
  EJECUTIVO: 'Ejecutivo Uno',
  PROVEEDOR: 'Proveedor esperado',
  Name: 'Proveedor real',
  'Comprador asignado': 'Comprador Uno',
  'Internal ID': '16238',
}

describe('purchaseRequestImportPlugin', () => {
  it('deduplica solicitudes exactas y conserva identidades y proveedores', () => {
    const result = runImportEngine(
      purchaseRequestImportPlugin,
      [
        purchaseRequestRow,
        { ...purchaseRequestRow },
      ],
    )

    expect(result.valid).toBe(true)
    expect(result.processedRows).toBe(1)

    expect(result.summary.totalRequests).toBe(1)
    expect(
      result.summary.requestsWithPurchaseOrder,
    ).toBe(1)
    expect(
      result.summary.requestsWithoutPurchaseOrder,
    ).toBe(0)
    expect(
      result.summary.duplicateSourceRows,
    ).toBe(1)

    expect(result.normalizedRows[0])
      .toMatchObject({
        purchaseRequestNumber: 'SC16238',
        sourceInternalId: '16238',
        salesOrderNumber: 'P1007330',
        relatedPurchaseOrderNumber: 'PO22832',
        preferredSupplierName:
          'Proveedor esperado',
        actualSupplierName:
          'Proveedor real',
        orderStatus: 'Pendiente',
        periodId: '2025-01',
        duplicateOccurrences: 1,
      })
  })

  it('conserva solicitudes sin PO y distingue ausencia de cantidad', () => {
    const result = runImportEngine(
      purchaseRequestImportPlugin,
      [
        {
          ...purchaseRequestRow,
          ID: 'SC16239',
          'Internal ID': '16239',
          'Document Number_1': '- None -',
          QTY: '',
          'Comentarios compras/trafico':
            'ERROR: Field Is Restricted',
          Proyecto: 'PROY2835',
          'Comprador asignado': '',
        },
      ],
    )

    expect(result.valid).toBe(true)
    expect(result.processedRows).toBe(1)

    expect(result.summary.totalRequests).toBe(1)
    expect(
      result.summary.requestsWithPurchaseOrder,
    ).toBe(0)
    expect(
      result.summary.requestsWithoutPurchaseOrder,
    ).toBe(1)
    expect(
      result.summary.requestsMissingQuantity,
    ).toBe(1)
    expect(
      result.summary.requestsWithProject,
    ).toBe(1)
    expect(
      result.summary
        .requestsWithAssignedBuyer,
    ).toBe(0)

    expect(result.normalizedRows[0])
      .toMatchObject({
        purchaseRequestNumber: 'SC16239',
        relatedPurchaseOrderNumber: null,
        quantity: null,
        projectId: 'PROY2835',
        assignedBuyer: null,
        purchasingTrafficComments: null,
      })
  })
})