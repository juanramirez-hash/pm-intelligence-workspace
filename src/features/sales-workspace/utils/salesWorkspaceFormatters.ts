export function formatSalesCurrency(
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

export function formatSalesInteger(
  value: number,
): string {
  return new Intl.NumberFormat(
    'es-MX',
    {
      maximumFractionDigits: 0,
    },
  ).format(value)
}

export function formatSalesPercentage(
  value: number | null,
  options: {
    signed?: boolean
    suffix?: string
  } = {},
): string {
  if (value === null) {
    return 'Sin comparación'
  }

  const prefix =
    options.signed &&
    value > 0
      ? '+'
      : ''

  return `${prefix}${new Intl.NumberFormat(
    'es-MX',
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  ).format(value)}${options.suffix ?? '%'}`
}
