/**
 * Shared, presentation-agnostic metrics exposed by the Business Cube.
 *
 * Percentage-like values are returned as decimal ratios:
 * - 0.25 represents 25%
 * - -0.10 represents -10%
 */
export interface BusinessCubeMetrics {
  grossMargin(
    revenue: number,
    grossProfit: number,
  ): number | null;

  averageTicket(
    revenue: number,
    documents: number,
  ): number | null;

  periodVariation(
    currentValue: number,
    previousValue: number,
  ): number | null;
}
