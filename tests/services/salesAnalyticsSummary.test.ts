import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  summarizeSalesSegmentation,
} from '../../server/services/salesAnalyticsService.js'

interface SummaryRow {
  revenue?: number | string
  gross_profit?: number | string
  quantity?: number | string
  documents?: number | string
  customer_count?: number | string
  brand_count?: number | string
  product_count?: number | string
  row_count?: number | string
  segment_count?: number | string
}

interface PoolOptions {
  summaryRow?: SummaryRow
  queryError?: Error
}

function buildPool({
  summaryRow = {},
  queryError,
}: PoolOptions = {}) {
  const query = vi.fn(
    async (
      _sql: string,
      ..._params: unknown[]
    ) => {
      if (queryError) {
        throw queryError
      }

      return {
        rowCount: 1,
        rows: [summaryRow],
      }
    },
  )

  const release = vi.fn()

  const pool = {
    connect: vi
      .fn()
      .mockResolvedValue({
        query,
        release,
      }),
  } as unknown as Parameters<
    typeof summarizeSalesSegmentation
  >[0]

  return {
    pool,
    query,
    release,
  }
}

describe(
  'summarizeSalesSegmentation',
  () => {
    it(
      'maps the SQL summary to the current SalesSegmentationSummary contract',
      async () => {
        const {
          pool,
          release,
        } = buildPool({
          summaryRow: {
            revenue: '1000.50',
            gross_profit: '250.25',
            quantity: '12.5',
            documents: '4',
            customer_count: '3',
            brand_count: '2',
            product_count: '5',
            row_count: '8',
            segment_count: '6',
          },
        })

        const result =
          await summarizeSalesSegmentation(
            pool,
          )

        expect(result).toEqual({
          revenue: 1000.5,
          grossProfit: 250.25,
          grossMargin:
            (250.25 / 1000.5) * 100,
          quantity: 12.5,
          documents: 4,
          customerCount: 3,
          brandCount: 2,
          productCount: 5,
          rowCount: 8,
          segmentCount: 6,
        })

        expect(
          release,
        ).toHaveBeenCalledOnce()
      },
    )

    it(
      'returns zero gross margin when revenue is zero',
      async () => {
        const {
          pool,
        } = buildPool({
          summaryRow: {
            revenue: 0,
            gross_profit: 10,
          },
        })

        const result =
          await summarizeSalesSegmentation(
            pool,
          )

        expect(result.revenue).toBe(0)
        expect(result.grossProfit).toBe(10)
        expect(result.grossMargin).toBe(0)
      },
    )

    it(
      'builds canonical product identity before the analytical grain',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await summarizeSalesSegmentation(
          pool,
        )

        const [
          sql,
        ] = query.mock.calls[0]

        expect(sql).toContain(
          'fallback_owners AS',
        )
        expect(sql).toContain(
          'canonical_sales AS',
        )
        expect(sql).toContain(
          'sales_segments AS',
        )
        expect(sql).toContain(
          "'AMBIGUOUS::'",
        )
        expect(sql).toContain(
          "'SALES::'",
        )

        const compactSql =
          sql.replace(/\s+/g, ' ')

        expect(compactSql).toContain(
          'ORDER BY candidate.base_id, candidate.first_sale_date, candidate.first_sale_id',
        )
        expect(compactSql).toContain(
          'FROM public.sales_fallback_owner_candidates AS candidate',
        )

        expect(compactSql).toContain(
          'MERIVA TECHNOLOGY - STREAMAX',
        )
        expect(compactSql).toContain(
          'STREAMAX - MERIVA',
        )
      },
    )

    it(
      'uses the same analytical grain as BusinessSalesSegment',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await summarizeSalesSegmentation(
          pool,
        )

        const [
          sql,
        ] = query.mock.calls[0]

        const compactSql =
          sql.replace(/\s+/g, ' ')

        expect(compactSql).toMatch(
          /GROUP BY sale_date, period_id, brand_id, customer_id, product_id, location_id, sales_representative_id/,
        )

        expect(compactSql).toContain(
          'COUNT(DISTINCT document_number)',
        )
        expect(compactSql).toContain(
          'COUNT( DISTINCT segment.customer_id )',
        )
        expect(compactSql).toContain(
          'COUNT( DISTINCT segment.brand_id )',
        )
        expect(compactSql).toContain(
          'COUNT( DISTINCT segment.product_id )',
        )
      },
    )

    it(
      'applies assigned brand scope before reconciliation',
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
              'ALTER',
              'C-DATA',
            ],
          },
        )

        const [
          sql,
          params,
        ] = query.mock.calls[0]

        expect(sql).toContain(
          'ANY($1::TEXT[])',
        )
        expect(params).toEqual([
          [
            'ALTER',
            'CDATA',
          ],
        ])
      },
    )

    it(
      'releases the connection when the summary query fails',
      async () => {
        const queryError =
          new Error(
            'Sales summary query failed',
          )

        const {
          pool,
          release,
        } = buildPool({
          queryError,
        })

        await expect(
          summarizeSalesSegmentation(
            pool,
          ),
        ).rejects.toThrow(
          queryError,
        )

        expect(
          release,
        ).toHaveBeenCalledOnce()
      },
    )
  },
)
