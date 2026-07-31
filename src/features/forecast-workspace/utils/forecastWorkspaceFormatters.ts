export function formatForecastCurrency(
  value: number | null,
  compact = false,
): string {
  if (value === null || !Number.isFinite(value)) {
    return '—'
  }

  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? 'compact' : 'standard',
  })
}

export function formatForecastInteger(
  value: number | null,
): string {
  if (value === null || !Number.isFinite(value)) {
    return '—'
  }

  return value.toLocaleString('es-MX', {
    maximumFractionDigits: 0,
  })
}

export function formatForecastDecimal(
  value: number | null,
  maximumFractionDigits = 1,
): string {
  if (value === null || !Number.isFinite(value)) {
    return '—'
  }

  return value.toLocaleString('es-MX', {
    maximumFractionDigits,
  })
}

export function formatForecastPercentage(
  value: number | null,
  maximumFractionDigits = 1,
): string {
  if (value === null || !Number.isFinite(value)) {
    return '—'
  }

  return value.toLocaleString('es-MX', {
    style: 'percent',
    maximumFractionDigits,
  })
}

export function formatForecastDate(
  value: string | null,
): string {
  if (!value) {
    return '—'
  }

  const date = new Date(`${value.slice(0, 10)}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatForecastCoverage(
  value: number | null,
): string {
  if (value === null || !Number.isFinite(value)) {
    return 'Sin cálculo'
  }

  if (value === 0) {
    return '0 meses'
  }

  return `${formatForecastDecimal(value, 1)} meses`
}
