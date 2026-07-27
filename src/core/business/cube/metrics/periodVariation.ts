export function calculatePeriodVariation(
  currentValue: number,
  previousValue: number,
): number | null {
  if (
    !Number.isFinite(currentValue) ||
    !Number.isFinite(previousValue) ||
    previousValue === 0
  ) {
    return null;
  }

  return (
    currentValue - previousValue
  ) / Math.abs(previousValue);
}
