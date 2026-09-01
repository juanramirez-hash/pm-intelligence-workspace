import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  normalizeCustomerMasterRows,
} from './customerMasterNormalizer'

import {
  validateCustomerMasterHeaders,
} from './customerMasterValidator'

describe('Customer Master normalizer', () => {
  it('normaliza identidad, atributos comerciales, booleanos y fechas', () => {
    const row = {
      'Internal ID': ' 8030568 ',
      ID: '036736',
      Name: ' ATE SISTEMAS DE ENERGIA ',
      Duplicate: 'Yes',
      'Primary Contact': '- None -',
      Category: 'INTEGRADOR CORPORATIVO',
      'Sales Rep': 'RH1009',
      'Ubicacion del Vendedor': '002 CDMX',
      'KAM Asignado': '- None -',
      'Date of Last Sale':
        new Date(
          '2026-08-25T06:00:00.000Z',
        ),
      'Fecha de Baja': null,
      Phone: ' 5555555555 ',
      Email: ' cliente@example.com ',
      Ubicacion: '002 CDMX : VENTAS',
      'Local Fisico': 'No',
      Departamento:
        'COMERCIAL : TRANSACCIONES',
      'Marcas Especialidad':
        '- None -',
      'Ejecutivo de ventas anterior':
        'RH0999',
      'Formato Alta de Cliente':
        '- None -',
      'Price Level': 'L 24%',
      WHATSAPP: '- None -',
      'Segmento de atencion':
        'Premium',
      'RFC (120)': 'ABC123456XYZ',
      'Catalogo entregado': 'Yes',
      'Fecha de alta':
        new Date(
          '2023-10-19T06:00:00.000Z',
        ),
      'Bloquea Acceso Portal': 'No',
      'CARTA DE CONTACTOS':
        '- None -',
      'Versión de Facturación':
        'CFDI 4.0',
      'Clasificacion por ventas':
        'Activo',
      'CLASIFICACION VALOR (FRECUENCIA DE COMPRA)':
        'B',
      'CLASIFICACION MONTO DE COMPRA (HML)':
        'M',
      'Envio local sin costo permanente':
        'Yes',
    }

    const validation =
      validateCustomerMasterHeaders(
        Object.keys(row),
      )

    const result =
      normalizeCustomerMasterRows(
        [row],
        validation,
      )

    expect(validation.valid).toBe(true)
    expect(result.ignoredRows).toBe(0)
    expect(result.rows).toHaveLength(1)

    const customer = result.rows[0]

    expect(customer?.internalId)
      .toBe('8030568')

    expect(customer?.customerId)
      .toBe('036736')

    expect(customer?.name)
      .toBe(
        'ATE SISTEMAS DE ENERGIA',
      )

    expect(customer?.isDuplicate)
      .toBe(true)

    expect(customer?.primaryContact)
      .toBeNull()

    expect(customer?.assignedKam)
      .toBeNull()

    expect(customer?.specialtyBrands)
      .toBeNull()

    expect(
      customer?.customerRegistrationForm,
    ).toBeNull()

    expect(customer?.whatsapp)
      .toBeNull()

    expect(customer?.lastSaleDate)
      .toBe('2026-08-25')

    expect(customer?.registrationDate)
      .toBe('2023-10-19')

    expect(customer?.inactiveDate)
      .toBeNull()

    expect(customer?.hasPhysicalLocation)
      .toBe(false)

    expect(customer?.catalogDelivered)
      .toBe(true)

    expect(customer?.portalAccessBlocked)
      .toBe(false)

    expect(
      customer
        ?.permanentFreeLocalShipping,
    ).toBe(true)
  })

  it('extrae el prefijo de seis digitos de IDs contaminados', () => {
    const rows = [
      {
        ID:
          '008919 CIRCULO ALTERNATIVO SA DE CV',
        Name:
          'CIRCULO ALTERNATIVO SA DE CV',
      },
      {
        ID:
          '011928 JPCRD ACCESOS Y CONTROLES SA DE CV',
        Name:
          'JPCRD ACCESOS Y CONTROLES SA DE CV',
      },
      {
        ID:
          '020005 SISTEMAS SINTEL, SA DE CV',
        Name:
          'SISTEMAS SINTEL, SA DE CV',
      },
    ]

    const validation =
      validateCustomerMasterHeaders(
        Object.keys(rows[0] ?? {}),
      )

    const result =
      normalizeCustomerMasterRows(
        rows,
        validation,
      )

    expect(
      result.rows.map(
        (customer) =>
          customer.customerId,
      ),
    ).toEqual([
      '008919',
      '011928',
      '020005',
    ])
  })

  it('conserva IDs especiales que no tienen seis digitos', () => {
    const row = {
      ID: '1',
      Name: 'Cliente anónimo',
    }

    const validation =
      validateCustomerMasterHeaders(
        Object.keys(row),
      )

    const result =
      normalizeCustomerMasterRows(
        [row],
        validation,
      )

    expect(result.rows[0]?.customerId)
      .toBe('1')
  })

  it('ignora filas sin identidad obligatoria', () => {
    const rows = [
      {
        ID: '',
        Name: 'Cliente sin ID',
      },
      {
        ID: '000001',
        Name: '',
      },
    ]

    const validation =
      validateCustomerMasterHeaders([
        'ID',
        'Name',
      ])

    const result =
      normalizeCustomerMasterRows(
        rows,
        validation,
      )

    expect(result.rows)
      .toHaveLength(0)

    expect(result.ignoredRows)
      .toBe(2)
  })
})