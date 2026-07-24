/**
 * Métricas oficiales disponibles para consultas del Business Cube.
 */
export type CubeMetric =
  | 'revenue'
  | 'grossProfit'
  | 'grossMargin'
  | 'quantity'
  | 'documents'
  | 'customers'
  | 'products'
  | 'brands'
  | 'averageTicket';

/**
 * Dimensiones oficiales disponibles para agrupación y filtrado.
 */
export type CubeDimension =
  | 'period'
  | 'year'
  | 'quarter'
  | 'month'
  | 'customer'
  | 'brand'
  | 'product'
  | 'salesRepresentative'
  | 'location'
  | 'currency';

/**
 * Dirección de ordenamiento.
 */
export type CubeSortOrder = 'asc' | 'desc';

/**
 * Nivel temporal utilizado por una consulta.
 */
export type CubePeriodGranularity =
  | 'year'
  | 'quarter'
  | 'month'
  | 'day';

/**
 * Valor escalar permitido dentro de una dimensión.
 */
export type CubeDimensionValue = string;

/**
 * Identificador ISO de periodo.
 *
 * Ejemplos:
 * - 2026
 * - 2026-Q3
 * - 2026-07
 * - 2026-07-23
 */
export type CubePeriodId = string;