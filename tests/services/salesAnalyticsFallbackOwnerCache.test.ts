import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  summarizeSalesSegmentation,
} from '../../server/services/salesAnalyticsService.js'

function buildPool() {
  const query = vi.fn(
    async (
      _sql: string,
      _params?: unknown[],
    ) => ({
      rowCount: 1,
      rows: [
        {
          revenue: 0,
          gross_profit: 0,
          quantity: 0,
          documents: 0,
          customer_count: 0,
          brand_count: 0,
          product_count: 0,
          row_count: 0,
          segment_count: 0,
        },
      ],
    }),
  )

  const release = vi.fn()

  return {
    pool: {
      connect: vi.fn(
        async () => ({
          query,
          release,
        }),
      ),
    },
    query,
  }
}

describe(
  'sales analytics persisted fallback owner cache',
  () => {
    it(
      'pushes period filtering into sales_source and reads persisted owners',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await summarizeSalesSegmentation(
          pool,
          {
            scope: 'all',
            brandIds: [],
          },
          {
            periodIds: [
              '2026-10',
            ],
          },
        )

        const [
          sql,
          params,
        ] = query.mock.calls[0]

        const compactSql =
          sql.replace(
            /\s+/g,
            ' ',
          )

        expect(compactSql).toContain(
          'FROM sales_facts WHERE period_id = ANY($1::TEXT[])',
        )
        expect(compactSql).toContain(
          'FROM public.sales_fallback_owner_candidates AS candidate',
        )
        expect(compactSql).not.toContain(
          'BTRIM(canonical.period_id)',
        )
        expect(params).toEqual([
          [
            '2026-10',
          ],
        ])
      },
    )

    it(
      'reuses assigned brand scope for persisted owner selection',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await summarizeSalesSegmentation(
          pool,
          {
            scope: 'assigned',
            brandIds: [
              'UNV (UNIVIEW)',
              'BELDEN',
            ],
          },
          {
            periodIds: [
              '2026-10',
            ],
          },
        )

        const [
          sql,
          params,
        ] = query.mock.calls[0]

        const compactSql =
          sql.replace(
            /\s+/g,
            ' ',
          )

        expect(compactSql).toContain(
          'candidate.scope_brand_key = ANY($1::TEXT[])',
        )
        expect(compactSql).toContain(
          'period_id = ANY($2::TEXT[])',
        )
        expect(compactSql).not.toContain(
          'BTRIM(canonical.period_id)',
        )
        expect(compactSql).not.toContain(
          '$3',
        )
        expect(params).toEqual([
          [
            'UNVUNIVIEW',
            'BELDEN',
          ],
          [
            '2026-10',
          ],
        ])
      },
    )
  },
)
