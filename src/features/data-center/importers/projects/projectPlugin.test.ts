import {
  describe,
  expect,
  it,
} from 'vitest'

import { runImportEngine } from '../../engine/importEngine'
import { projectImportPlugin } from './projectPlugin'

const rows = [
  {
    'Internal ID': 3807,
    ID: 'PROY3807',
    Name: 'KOBLENZ Qro y Cuautitlan',
    'Cliente (Proyecto)': '030200 CLIENTE DE PRUEBA SA DE CV',
    'Marca principal': 'UNV (UNIVIEW)',
    'Moneda del proyecto': 'USD',
    Status: '06 Surtido parcialmente',
    'Probabilidad de cierre (%)': 100,
    'Fecha estimada de facturacion': new Date('2026-07-31T00:00:00.000Z'),
    'Monto por cerrar (USD)': 1000,
    'Proyecto repetido': 'No',
  },
  {
    'Internal ID': 4000,
    ID: 'PROY4000',
    Name: 'Proyecto potencial',
    'Marca principal': 'BELDEN',
    'Moneda del proyecto': 'USD',
    Status: '04 Pendiente por integrador',
    'Probabilidad de cierre (%)': 40,
    'Fecha estimada de facturacion': '2026-08-15',
    'Monto por cerrar (USD)': 6000,
    'Proyecto repetido': 'Si',
  },
]

describe('projectImportPlugin', () => {
  it('normaliza status, fecha de facturacion y monto por cerrar', () => {
    const result = runImportEngine(projectImportPlugin, rows)

    expect(result.valid).toBe(true)
    expect(result.processedRows).toBe(2)
    expect(result.summary.matureProjects).toBe(1)
    expect(result.summary.potentialProjects).toBe(1)
    expect(result.summary.duplicateProjects).toBe(1)
    expect(result.summary.matureAmountToCloseUsd).toBe(1000)
    expect(result.normalizedRows[0]).toMatchObject({
      internalId: '3807',
      projectId: 'PROY3807',
      customerId: '030200',
      statusCode: '06',
      forecastStage: 'mature',
      estimatedBillingDate: '2026-07-31',
      amountToClose: 1000,
      isDuplicate: false,
    })
  })
})
