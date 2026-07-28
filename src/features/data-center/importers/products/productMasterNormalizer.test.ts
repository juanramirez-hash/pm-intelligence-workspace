import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  normalizeProductMasterRows,
} from './productMasterNormalizer'

import {
  validateProductMasterHeaders,
} from './productMasterValidator'

describe('PMC-004 Product Master normalizer', () => {
  it('materializa campos canónicos y conserva aliases legacy', () => {
    const row = {
      'Internal ID': ' 12345 ',
      Marca: 'UNV',
      Name: ' ci-ipc-a ',
      Modelo: 'IPC-A',
      'Vendor Name / Code': 'V-001',
      'Preferred Vendor': 'Uniview Technologies',
      Description: ' Cámara IP profesional ',
      Classification: 'Video vigilancia',
      'CLASIFICACION VALOR': 'A',
      Tendencia: 'Crecimiento',
      Class: 'CCTV',
      'Categoria secundaria 1': 'Cámaras IP',
      'Categoria secundaria 2': 'Bullet',
      'Date Created': '2025-01-15',
      'Last Modified': '2026-06-30',
      Estatus: 'Activo',
    }

    const validation =
      validateProductMasterHeaders(
        Object.keys(row),
      )

    const result =
      normalizeProductMasterRows(
        [row],
        validation,
      )

    expect(result.ignoredRows).toBe(0)
    expect(result.rows).toHaveLength(1)

    const product = result.rows[0]

    expect(product?.code).toBe('CI-IPC-A')
    expect(product?.erpInternalId).toBe('12345')
    expect(product?.vendorName).toBe('Uniview Technologies')
    expect(product?.classification).toBe('Video vigilancia')
    expect(product?.category).toBe('CCTV')
    expect(product?.subcategory1).toBe('Cámaras IP')
    expect(product?.subcategory2).toBe('Bullet')
    expect(product?.createdAt).toBe('2025-01-15')
    expect(product?.updatedAt).toBe('2026-06-30')

    expect(product?.preferredVendor).toBe('Uniview Technologies')
    expect(product?.productClass).toBe('CCTV')
    expect(product?.secondaryCategory1).toBe('Cámaras IP')
    expect(product?.secondaryCategory2).toBe('Bullet')
  })

  it('usa los campos legacy como fallback canónico', () => {
    const row = {
      Marca: 'UNV',
      Name: 'CI-IPC-B',
      Modelo: 'IPC-B',
      'Preferred Vendor': 'Proveedor Uno',
      Class: 'CCTV',
      'Categoria secundaria 1': 'Cámaras IP',
      'Categoria secundaria 2': 'Turret',
    }

    const validation =
      validateProductMasterHeaders(
        Object.keys(row),
      )

    const result =
      normalizeProductMasterRows(
        [row],
        validation,
      )

    const product = result.rows[0]

    expect(product?.vendorName).toBe('Proveedor Uno')
    expect(product?.classification).toBe('CCTV')
    expect(product?.category).toBe('CCTV')
    expect(product?.subcategory1).toBe('Cámaras IP')
    expect(product?.subcategory2).toBe('Turret')
  })
})
