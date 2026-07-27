const BUSINESS_PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

export function normalizeBusinessIdentifier(
  value: string,
): string | null {
  const normalizedValue =
    value
      .trim()
      .toLocaleUpperCase('es-MX')
      .replace(/\s+/g, ' ')

  return normalizedValue || null
}

export function normalizeBusinessPeriodId(
  value: string,
): string | null {
  const normalizedValue =
    value.trim()

  if (
    !BUSINESS_PERIOD_PATTERN.test(
      normalizedValue,
    )
  ) {
    return null
  }

  return normalizedValue
}

export function getBrandTargetId(
  periodId: string,
  brandId: string,
): string {
  return `${periodId}::${brandId}`
}
