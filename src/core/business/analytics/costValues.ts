/**
 * Cost values can be missing (NULL): the user has no access to that
 * brand's costs (SEC-003A) or the source did not report them. Totals add
 * only the present values and count the missing ones; a total is NULL only
 * when every contributing value is missing. An empty set still totals 0.
 * With complete data every result is the same as a plain sum (SEC-003C).
 */

export function toCostValue(
  value: number | null | undefined,
): number | null {
  return value !== null &&
    value !== undefined &&
    Number.isFinite(value)
    ? value
    : null
}

export function addCostValue(
  total: number | null,
  value: number | null,
): number | null {
  return value === null
    ? total
    : (total ?? 0) + value
}

/** Total of `contributors` values; 0 when nothing contributed. */
export function finalizeCostTotal(
  total: number | null,
  contributors: number,
): number | null {
  return contributors === 0
    ? 0
    : total
}

/** Share of a cost value; NULL when either side is missing. */
export function costShare(
  value: number | null,
  total: number | null,
): number | null {
  if (value === null || total === null) {
    return null
  }

  return total > 0 ? value / total : 0
}

/** Descending order by cost value, missing values last. */
export function compareCostDescending(
  left: number | null,
  right: number | null,
): number {
  if (left === null || right === null) {
    return left === right
      ? 0
      : left === null
        ? 1
        : -1
  }

  return right - left
}
