import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  buildBusinessCubeMetrics,
} from './buildBusinessCubeMetrics';

describe(
  'BusinessCubeMetrics',
  () => {
    const metrics =
      buildBusinessCubeMetrics();

    it(
      'calculates gross margin as a decimal ratio',
      () => {
        expect(
          metrics.grossMargin(
            1_000,
            250,
          ),
        ).toBe(
          0.25,
        );
      },
    );

    it(
      'returns null when gross margin has no valid revenue base',
      () => {
        expect(
          metrics.grossMargin(
            0,
            250,
          ),
        ).toBeNull();
      },
    );

    it(
      'calculates average ticket per document',
      () => {
        expect(
          metrics.averageTicket(
            1_000,
            4,
          ),
        ).toBe(
          250,
        );
      },
    );

    it(
      'returns null when average ticket has no documents',
      () => {
        expect(
          metrics.averageTicket(
            1_000,
            0,
          ),
        ).toBeNull();
      },
    );

    it(
      'calculates period variation as a decimal ratio',
      () => {
        expect(
          metrics.periodVariation(
            120,
            100,
          ),
        ).toBeCloseTo(
          0.2,
        );
      },
    );

    it(
      'supports negative period variation',
      () => {
        expect(
          metrics.periodVariation(
            80,
            100,
          ),
        ).toBeCloseTo(
          -0.2,
        );
      },
    );

    it(
      'returns null when previous period is zero',
      () => {
        expect(
          metrics.periodVariation(
            120,
            0,
          ),
        ).toBeNull();
      },
    );
  },
);
