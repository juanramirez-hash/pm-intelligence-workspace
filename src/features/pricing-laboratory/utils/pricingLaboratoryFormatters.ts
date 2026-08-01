import type {
  PriceEngineeringScenarioBasis,
} from '../../../core/business/pricing'

export function formatPricingMoney(
  value: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  const normalizedCurrency = currency?.trim().toUpperCase() || 'MXN'

  try {
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    })
  } catch {
    return `${normalizedCurrency} ${value.toLocaleString('es-MX', {
      maximumFractionDigits: 2,
    })}`
  }
}

export function formatPricingPercentage(
  value: number | null | undefined,
  fractionDigits = 1,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  return value.toLocaleString('es-MX', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function formatPricingFactor(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  return `${value.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })}×`
}

export function formatPricingDeltaMoney(
  value: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatPricingMoney(value, currency)}`
}

export function formatPricingDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return 'Sin fecha efectiva'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatPricingBasis(
  basis: PriceEngineeringScenarioBasis | null,
  currency: string | null | undefined,
): string {
  if (!basis) {
    return 'Sin base calculable'
  }

  switch (basis.type) {
    case 'selling_price':
      return `Precio de venta ${formatPricingMoney(basis.sellingPrice, currency)}`
    case 'discount_rate':
      return `Descuento ${formatPricingPercentage(basis.discountRate)}`
    case 'target_gross_margin':
      return `Margen objetivo ${formatPricingPercentage(basis.grossMargin)}`
    case 'target_gross_profit':
      return `GP objetivo ${formatPricingMoney(basis.grossProfit, currency)}`
    case 'selling_price_factor':
      return `Factor ${formatPricingFactor(basis.factor)}`
    case 'additional_discount':
      return `Descuento adicional ${formatPricingPercentage(basis.discountRate)} sobre ${
        basis.applyTo === 'list_price'
          ? 'lista'
          : 'precio vigente'
      }`
  }
}
