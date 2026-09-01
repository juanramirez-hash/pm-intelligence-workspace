import type {
  NormalizationResult,
} from '../../engine/importPlugin'

import type {
  CustomerMasterField,
} from './customerMasterColumnAliases'

import type {
  NormalizedCustomerMasterRow,
  RawCustomerMasterRow,
} from './customerMasterTypes'

import type {
  CustomerMasterValidationResult,
} from './customerMasterValidator'

function getValue(
  row: RawCustomerMasterRow,
  validation: CustomerMasterValidationResult,
  field: CustomerMasterField,
): unknown {
  const column =
    validation.columnMap[field]

  return column
    ? row[column]
    : null
}

function text(
  value: unknown,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const normalized =
    String(value)
      .trim()
      .replace(/\s+/g, ' ')

  if (!normalized) {
    return null
  }

  if (
    normalized
      .toLocaleUpperCase('es-MX') ===
    '- NONE -'
  ) {
    return null
  }

  return normalized
}

function identifier(
  value: unknown,
): string | null {
  const valueText = text(value)

  return valueText
    ? valueText
      .toLocaleUpperCase('es-MX')
    : null
}

function customerIdValue(
  value: unknown,
): string | null {
  const valueText = text(value)

  if (!valueText) {
    return null
  }

  const sixDigitPrefix =
    valueText.match(
      /^(\d{6})(?:\s|$)/,
    )

  if (sixDigitPrefix?.[1]) {
    return sixDigitPrefix[1]
  }

  return valueText
    .toLocaleUpperCase('es-MX')
}

function booleanValue(
  value: unknown,
): boolean {
  const normalized =
    identifier(value)

  if (!normalized) {
    return false
  }

  return [
    'T',
    'TRUE',
    'SI',
    'SÍ',
    'YES',
    'Y',
    '1',
  ].includes(normalized)
}

function dateValue(
  value: unknown,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(
      value.getTime(),
    )
      ? null
      : value
        .toISOString()
        .slice(0, 10)
  }

  if (typeof value === 'number') {
    return null
  }

  const valueText = text(value)

  if (!valueText) {
    return null
  }

  const parsed =
    new Date(valueText)

  return Number.isNaN(
    parsed.getTime(),
  )
    ? null
    : parsed
      .toISOString()
      .slice(0, 10)
}

export function normalizeCustomerMasterRows(
  rows: RawCustomerMasterRow[],
  validation: CustomerMasterValidationResult,
): NormalizationResult<NormalizedCustomerMasterRow> {
  const normalizedRows:
    NormalizedCustomerMasterRow[] = []

  let ignoredRows = 0

  for (const row of rows) {
    const customerId =
      customerIdValue(
        getValue(
          row,
          validation,
          'customerId',
        ),
      )

    const name =
      text(
        getValue(
          row,
          validation,
          'name',
        ),
      )

    if (!customerId || !name) {
      ignoredRows += 1
      continue
    }

    normalizedRows.push({
      internalId:
        identifier(
          getValue(
            row,
            validation,
            'internalId',
          ),
        ),

      customerId,
      name,

      isDuplicate:
        booleanValue(
          getValue(
            row,
            validation,
            'isDuplicate',
          ),
        ),

      primaryContact:
        text(
          getValue(
            row,
            validation,
            'primaryContact',
          ),
        ),

      category:
        text(
          getValue(
            row,
            validation,
            'category',
          ),
        ),

      salesRep:
        text(
          getValue(
            row,
            validation,
            'salesRep',
          ),
        ),

      salesRepLocation:
        text(
          getValue(
            row,
            validation,
            'salesRepLocation',
          ),
        ),

      assignedKam:
        text(
          getValue(
            row,
            validation,
            'assignedKam',
          ),
        ),

      lastSaleDate:
        dateValue(
          getValue(
            row,
            validation,
            'lastSaleDate',
          ),
        ),

      inactiveDate:
        dateValue(
          getValue(
            row,
            validation,
            'inactiveDate',
          ),
        ),

      phone:
        text(
          getValue(
            row,
            validation,
            'phone',
          ),
        ),

      email:
        text(
          getValue(
            row,
            validation,
            'email',
          ),
        ),

      location:
        text(
          getValue(
            row,
            validation,
            'location',
          ),
        ),

      hasPhysicalLocation:
        booleanValue(
          getValue(
            row,
            validation,
            'hasPhysicalLocation',
          ),
        ),

      department:
        text(
          getValue(
            row,
            validation,
            'department',
          ),
        ),

      specialtyBrands:
        text(
          getValue(
            row,
            validation,
            'specialtyBrands',
          ),
        ),

      previousSalesRep:
        text(
          getValue(
            row,
            validation,
            'previousSalesRep',
          ),
        ),

      customerRegistrationForm:
        text(
          getValue(
            row,
            validation,
            'customerRegistrationForm',
          ),
        ),

      priceLevel:
        text(
          getValue(
            row,
            validation,
            'priceLevel',
          ),
        ),

      whatsapp:
        text(
          getValue(
            row,
            validation,
            'whatsapp',
          ),
        ),

      serviceSegment:
        text(
          getValue(
            row,
            validation,
            'serviceSegment',
          ),
        ),

      taxId:
        text(
          getValue(
            row,
            validation,
            'taxId',
          ),
        ),

      catalogDelivered:
        booleanValue(
          getValue(
            row,
            validation,
            'catalogDelivered',
          ),
        ),

      registrationDate:
        dateValue(
          getValue(
            row,
            validation,
            'registrationDate',
          ),
        ),

      portalAccessBlocked:
        booleanValue(
          getValue(
            row,
            validation,
            'portalAccessBlocked',
          ),
        ),

      contactLetter:
        text(
          getValue(
            row,
            validation,
            'contactLetter',
          ),
        ),

      billingVersion:
        text(
          getValue(
            row,
            validation,
            'billingVersion',
          ),
        ),

      salesClassification:
        text(
          getValue(
            row,
            validation,
            'salesClassification',
          ),
        ),

      frequencyClassification:
        text(
          getValue(
            row,
            validation,
            'frequencyClassification',
          ),
        ),

      purchaseAmountClassification:
        text(
          getValue(
            row,
            validation,
            'purchaseAmountClassification',
          ),
        ),

      permanentFreeLocalShipping:
        booleanValue(
          getValue(
            row,
            validation,
            'permanentFreeLocalShipping',
          ),
        ),
    })
  }

  return {
    rows: normalizedRows,
    ignoredRows,
  }
}