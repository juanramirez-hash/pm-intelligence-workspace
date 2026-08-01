import type {
  BusinessPriceMarginBand,
} from '../entities/price'

function precisionFactor(precision: number): number {
  return 10 ** Math.max(0, Math.floor(precision))
}

export function roundPricingValue(
  value: number,
  precision = 2,
): number {
  const factor = precisionFactor(precision)
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function calculatePriceGrossProfit(
  sellingPrice: number,
  cost: number,
): number {
  return sellingPrice - cost
}

export function calculatePriceGrossMargin(
  sellingPrice: number,
  cost: number,
): number {
  if (sellingPrice === 0) {
    return 0
  }

  return (sellingPrice - cost) / sellingPrice
}

export function calculatePriceDiscountRate(
  listPrice: number,
  sellingPrice: number,
): number {
  if (listPrice === 0) {
    return 0
  }

  return 1 - (sellingPrice / listPrice)
}

export function calculatePriceFactor(
  listPrice: number,
  cost: number,
): number | null {
  if (cost === 0) {
    return null
  }

  return listPrice / cost
}

export function calculateSellingPriceFactor(
  sellingPrice: number,
  cost: number,
): number | null {
  if (cost === 0) {
    return null
  }

  return sellingPrice / cost
}

export function calculatePriceFromDiscount(
  listPrice: number,
  discountRate: number,
): number {
  return listPrice * (1 - discountRate)
}

export function calculatePriceAfterAdditionalDiscount(
  basePrice: number,
  additionalDiscountRate: number,
): number {
  return basePrice * (1 - additionalDiscountRate)
}

export function calculatePriceFromTargetGrossMargin(
  cost: number,
  targetGrossMargin: number,
): number | null {
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(targetGrossMargin) ||
    cost < 0 ||
    targetGrossMargin >= 1
  ) {
    return null
  }

  const price = cost / (1 - targetGrossMargin)
  return Number.isFinite(price) && price > 0
    ? price
    : null
}

export function calculatePriceFromTargetGrossProfit(
  cost: number,
  targetGrossProfit: number,
): number | null {
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(targetGrossProfit) ||
    cost < 0
  ) {
    return null
  }

  const price = cost + targetGrossProfit
  return Number.isFinite(price) && price > 0
    ? price
    : null
}

export function calculatePriceFromSellingFactor(
  cost: number,
  factor: number,
): number | null {
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(factor) ||
    cost < 0 ||
    factor <= 0
  ) {
    return null
  }

  const price = cost * factor
  return Number.isFinite(price) && price > 0
    ? price
    : null
}

export function classifyPriceMarginBand(
  grossMargin: number,
): BusinessPriceMarginBand {
  if (grossMargin < 0) {
    return 'negative'
  }

  if (grossMargin < 0.2) {
    return 'zero_to_20'
  }

  if (grossMargin < 0.25) {
    return '20_to_25'
  }

  if (grossMargin < 0.3) {
    return '25_to_30'
  }

  if (grossMargin < 0.35) {
    return '30_to_35'
  }

  return '35_plus'
}
