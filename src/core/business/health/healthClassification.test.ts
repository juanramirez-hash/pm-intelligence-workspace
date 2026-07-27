import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  classifyBusinessHealthScore,
} from './healthClassification'

describe(
  'classifyBusinessHealthScore',
  () => {
    it.each([
      [100, 'excellent'],
      [95, 'excellent'],
      [94.9, 'very-healthy'],
      [85, 'very-healthy'],
      [70, 'healthy'],
      [55, 'attention'],
      [40, 'risk'],
      [39.9, 'critical'],
      [0, 'critical'],
      [null, 'not-evaluable'],
    ] as const)(
      'clasifica %s como %s',
      (score, expectedGrade) => {
        expect(
          classifyBusinessHealthScore(score)
            .grade,
        ).toBe(expectedGrade)
      },
    )
  },
)
