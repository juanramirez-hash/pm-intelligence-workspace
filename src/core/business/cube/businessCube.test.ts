import { describe, expect, it } from 'vitest';
import { BusinessRepository } from '../repository';
import { createMinimalBusinessModel } from '../testing/createMinimalBusinessModel';
import { buildBusinessCube } from './businessCubeBuilder';

function buildTestCube() {
  return buildBusinessCube(
    new BusinessRepository(createMinimalBusinessModel()),
  );
}

describe('BusinessCube', () => {
  it('returns monthly revenue grouped by period', () => {
    const result = buildTestCube().customers.query({
      metric: 'revenue',
      groupBy: 'period',
      periodGranularity: 'month',
    });

    expect(result.metric).toBe('revenue');
    expect(result.groupBy).toBe('period');
    expect(result.total).toBe(350);
    expect(result.rows).toEqual([
      { dimension: '2026-01', value: 100 },
      { dimension: '2026-02', value: 250 },
    ]);
  });

  it.each([
    ['grossProfit', 95],
    ['quantity', 9],
    ['documents', 5],
    ['customers', 3],
    ['products', 3],
    ['brands', 2],
  ] as const)('executes the %s monthly metric', (metric, expectedTotal) => {
    const result = buildTestCube().brands.query({
      metric,
      groupBy: 'period',
      periodGranularity: 'month',
    });

    expect(result.total).toBe(expectedTotal);
    expect(result.rows).toHaveLength(2);
  });

  it('calculates gross margin using the aggregate base', () => {
    const result = buildTestCube().brands.query({
      metric: 'grossMargin',
      groupBy: 'period',
      periodGranularity: 'month',
    });

    expect(result.total).toBeCloseTo(95 / 350);
    expect(result.rows[0]?.value).toBeCloseTo(0.2);
    expect(result.rows[1]?.value).toBeCloseTo(0.3);
  });

  it('calculates average ticket using aggregate revenue and documents', () => {
    const result = buildTestCube().products.query({
      metric: 'averageTicket',
      groupBy: 'period',
      periodGranularity: 'month',
    });

    expect(result.total).toBe(70);
    expect(result.rows[0]?.value).toBe(50);
    expect(result.rows[1]?.value).toBeCloseTo(250 / 3);
  });
});
