import type { CubeQuery } from '../shared';

/**
 * Valida una consulta antes de ser ejecutada.
 */
export class CubeQueryValidator {
  public validate(query: CubeQuery): void {
    if (!query.metric) {
      throw new Error('CubeQuery.metric is required.');
    }

    if (query.limit !== undefined && query.limit <= 0) {
      throw new Error('CubeQuery.limit must be greater than zero.');
    }

    if (
      query.filter?.periodFrom &&
      query.filter?.periodTo &&
      query.filter.periodFrom > query.filter.periodTo
    ) {
      throw new Error(
        'CubeQuery.periodFrom cannot be greater than periodTo.',
      );
    }
  }
}