import {
  describe,
  expect,
  it,
} from 'vitest'

import { runImportEngine } from '../../engine/importEngine'
import { projectBillingImportPlugin } from './projectBillingPlugin'

const invoiceRow = {
  'Internal ID': '41514271',
  Proyecto: 'PROY2835',
  Descripcion: 'Proyecto destinado a rutas',
  Name: 'Usuario final',
  Name_1: '032776 LINEAL SISTEMAS SA DE CV',
  'Marca principal en proyecto': 'STREAMAX - MERIVA',
  Item: 'MOB50MER10',
  Modelo: 'MBCE30',
  Marca: 'STREAMAX - MERIVA',
  Quantity: 50,
  Amount: 3087,
  Date: new Date('2025-01-03T00:00:00.000Z'),
  'Document Number': 'F00701105',
  'Status documento': 'Paid In Full',
  Currency: 'MXN',
}

describe('projectBillingImportPlugin', () => {
  it('deduplica lineas exactas y conserva documento, proyecto y periodo', () => {
    const result = runImportEngine(
      projectBillingImportPlugin,
      [invoiceRow, { ...invoiceRow }],
    )

    expect(result.valid).toBe(true)
    expect(result.processedRows).toBe(1)
    expect(result.summary.uniqueDocuments).toBe(1)
    expect(result.summary.duplicateSourceLines).toBe(1)
    expect(result.summary.sourceAmountMxn).toBe(3087)
    expect(result.normalizedRows[0]).toMatchObject({
      projectId: 'PROY2835',
      customerId: '032776',
      documentNumber: 'F00701105',
      documentType: 'invoice',
      periodId: '2025-01',
      duplicateOccurrences: 1,
    })
  })

  it('clasifica notas de credito y documentos anulados', () => {
    const result = runImportEngine(
      projectBillingImportPlugin,
      [
        {
          ...invoiceRow,
          'Internal ID': '500',
          'Document Number': 'NC176713',
          'Status documento': 'Voided',
          Amount: -6194.75,
        },
      ],
    )

    expect(result.summary.creditNoteDocuments).toBe(1)
    expect(result.summary.voidedDocuments).toBe(1)
    expect(result.summary.sourceAmountMxn).toBe(0)
  })
})
