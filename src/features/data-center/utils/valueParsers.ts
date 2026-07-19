import * as XLSX from 'xlsx'

function isEmptyValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  )
}

export function parseString(value: unknown): string | null {
  if (isEmptyValue(value)) {
    return null
  }

  const parsedValue = String(value).trim()

  return parsedValue || null
}

export function parseNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (isEmptyValue(value)) {
    return 0
  }

  const normalizedValue = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^\d,.-]/g, '')

  if (!normalizedValue) {
    return 0
  }

  const decimalSeparator =
    normalizedValue.includes(',') && normalizedValue.includes('.')
      ? normalizedValue.lastIndexOf(',') > normalizedValue.lastIndexOf('.')
        ? ','
        : '.'
      : normalizedValue.includes(',')
        ? ','
        : '.'

  let numericValue = normalizedValue

  if (decimalSeparator === ',') {
    numericValue = numericValue
      .replace(/\./g, '')
      .replace(',', '.')
  } else {
    numericValue = numericValue.replace(/,/g, '')
  }

  const parsedValue = Number(numericValue)

  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export function parseCurrency(value: unknown): number {
  return parseNumber(value)
}

export function parsePercentage(value: unknown): number | null {
  if (isEmptyValue(value)) {
    return null
  }

  const stringValue = String(value).trim()
  const parsedValue = parseNumber(value)

  if (!Number.isFinite(parsedValue)) {
    return null
  }

  if (stringValue.includes('%')) {
    return parsedValue / 100
  }

  return Math.abs(parsedValue) > 1
    ? parsedValue / 100
    : parsedValue
}

export function parseExcelDate(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString()
  }

  if (typeof value === 'number') {
    const parsedDate = XLSX.SSF.parse_date_code(value)

    if (!parsedDate) {
      return null
    }

    const date = new Date(
      Date.UTC(
        parsedDate.y,
        parsedDate.m - 1,
        parsedDate.d,
        parsedDate.H ?? 0,
        parsedDate.M ?? 0,
        Math.floor(parsedDate.S ?? 0),
      ),
    )

    return Number.isNaN(date.getTime())
      ? null
      : date.toISOString()
  }

  const stringValue = parseString(value)

  if (!stringValue) {
    return null
  }

  const parsedTimestamp = Date.parse(stringValue)

  if (Number.isNaN(parsedTimestamp)) {
    return null
  }

  return new Date(parsedTimestamp).toISOString()
}

export function parseIdentifier(value: unknown): string | null {
  if (isEmptyValue(value)) {
    return null
  }

  return String(value).trim()
}