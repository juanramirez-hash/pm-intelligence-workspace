import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  calculateAttainmentRatio,
  calculateMetricAttainment,
  calculateRevenuePace,
} from './targetAttainmentCalculations'

describe(
  'target attainment calculations',
  () => {
    it(
      'no divide entre cero',
      () => {
        expect(
          calculateAttainmentRatio(
            100,
            0,
          ),
        ).toBeNull()
      },
    )

    it(
      'mantiene variacion aunque un objetivo cero no tenga razon de cumplimiento',
      () => {
        expect(
          calculateMetricAttainment(
            25,
            0,
          ),
        ).toEqual({
          actual: 25,
          target: 0,
          variance: 25,
          attainment: null,
        })
      },
    )

    it(
      'clasifica el ritmo exacto como on-plan',
      () => {
        expect(
          calculateRevenuePace(
            500,
            1_000,
            20,
            10,
          ).status,
        ).toBe('on-plan')
      },
    )
  },
)
