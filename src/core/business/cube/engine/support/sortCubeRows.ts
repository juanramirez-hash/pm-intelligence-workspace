import type {
  CubeQuery,
  CubeResultRow,
} from '../../shared';

/**
 * Ordena filas del Business Cube por dimensión o valor.
 */
export function sortCubeRows(
  rows: readonly CubeResultRow[],
  query: CubeQuery,
): CubeResultRow[] {
  const order =
    query.order ?? 'asc';

  return [...rows].sort(
    (first, second) => {
      if (
        query.orderBy === query.metric
      ) {
        return order === 'asc'
          ? first.value - second.value
          : second.value - first.value;
      }

      const firstDimension =
        first.dimension ?? '';

      const secondDimension =
        second.dimension ?? '';

      return order === 'asc'
        ? firstDimension.localeCompare(
            secondDimension,
          )
        : secondDimension.localeCompare(
            firstDimension,
          );
    },
  );
}