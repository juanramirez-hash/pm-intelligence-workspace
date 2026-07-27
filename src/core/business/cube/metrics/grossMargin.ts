export function calculateGrossMargin(
  revenue: number,
  grossProfit: number,
): number | null {
  if (
    !Number.isFinite(revenue) ||
    !Number.isFinite(grossProfit) ||
    revenue === 0
  ) {
    return null;
  }

  return grossProfit / revenue;
}
