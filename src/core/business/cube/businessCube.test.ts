import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  BusinessRepository,
} from '../repository';

import {
  createMinimalBusinessModel,
} from '../testing/createMinimalBusinessModel';

import {
  buildBusinessCube,
} from './businessCubeBuilder';

describe(
  'BusinessCube',
  () => {
    it(
      'returns monthly revenue grouped by period',
      () => {
        const model =
          createMinimalBusinessModel();

        const repository =
          new BusinessRepository(
            model,
          );

        const cube =
          buildBusinessCube(
            repository,
          );

        const result =
          cube.customers.query({
            metric: 'revenue',
            groupBy: 'period',
            periodGranularity:
              'month',
          });

        expect(
          result.metric,
        ).toBe(
          'revenue',
        );

        expect(
          result.groupBy,
        ).toBe(
          'period',
        );

        expect(
          result.total,
        ).toBe(
          350,
        );

        expect(
          result.rows,
        ).toEqual([
          {
            dimension:
              '2026-01',
            value: 100,
          },
          {
            dimension:
              '2026-02',
            value: 250,
          },
        ]);
      },
    );
  },
);