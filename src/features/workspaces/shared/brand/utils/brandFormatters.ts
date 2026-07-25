export function formatBrandCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    },
  ).format(value)
}

export function formatBrandPercentage(
  value: number | null,
): string {
  if (value === null) {
    return 'Sin comparación'
  }

  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'percent',
      maximumFractionDigits: 1,
    },
  ).format(value)
}

export function formatBrandInteger(
  value: number,
): string {
  return new Intl.NumberFormat(
    'es-MX',
    {
      maximumFractionDigits: 0,
    },
  ).format(value)
}