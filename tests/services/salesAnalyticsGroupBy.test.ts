import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  groupSalesSegmentation,
} from '../../server/services/salesAnalyticsService.js'

interface GroupRow {
  id: string
  label?: string
  revenue?: number | string
  gross_profit?: number | string
  quantity?: number | string
  documents?: number | string
  customer_count?: number | string
  product_count?: number | string
  row_count?: number | string
}

interface PoolOptions {
  rows?: GroupRow[]
  queryError?: Error
}

function buildPool({
  rows = [],
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
        rowCount: rows.length,
        rows,
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
    typeof groupSalesSegmentation
  >[0]

  return {
    pool,
    query,
    release,
  }
}

describe(
  'groupSalesSegmentation',
  () => {
    it(
      'maps SQL groups to the current SalesSegmentationGroup contract',
      async () => {
        const {
          pool,
          release,
        } = buildPool({
          rows: [
            {
              id: 'UNV',
              label: 'UNV',
              revenue: '1000.50',
              gross_profit: '250.25',
              quantity: '12.5',
              documents: '4',
              customer_count: '3',
              product_count: '5',
              row_count: '8',
            },
          ],
        })

        const result =
          await groupSalesSegmentation(
            pool,
            'brand',
          )

        expect(result).toEqual([
          {
            id: 'UNV',
            label: 'UNV',
            revenue: 1000.5,
            grossProfit: 250.25,
            grossMargin:
              (250.25 / 1000.5) * 100,
            quantity: 12.5,
            documents: 4,
            customerCount: 3,
            productCount: 5,
            rowCount: 8,
          },
        ])

        expect(
          release,
        ).toHaveBeenCalledOnce()
      },
    )

    it(
      'uses the six current segmentation dimensions',
      async () => {
        const dimensions = [
          ['period', 'period_id'],
          ['brand', 'brand_id'],
          ['customer', 'customer_id'],
          ['product', 'product_id'],
          ['location', 'location_id'],
          [
            'salesRepresentative',
            'sales_representative_id',
          ],
        ] as const

        for (const [
          dimension,
          column,
        ] of dimensions) {
          const {
            pool,
            query,
          } = buildPool()

          await groupSalesSegmentation(
            pool,
            dimension,
          )

          const [
            sql,
          ] = query.mock.calls[0]

          expect(sql).toContain(
            `segment.${column} AS id`,
          )
          expect(sql).toContain(
            `canonical.${column} AS id`,
          )
        }
      },
    )

    it(
      'reconstructs brand customer and product labels from canonical sources',
      async () => {
        const labelExpectations = [
          [
            'brand',
            'brand_labels AS',
          ],
          [
            'customer',
            'customer_sales_labels AS',
          ],
          [
            'product',
            'product_fallback_labels AS',
          ],
        ] as const

        for (const [
          dimension,
          expectedSql,
        ] of labelExpectations) {
          const {
            pool,
            query,
          } = buildPool()

          await groupSalesSegmentation(
            pool,
            dimension,
          )

          const [
            sql,
          ] = query.mock.calls[0]

          expect(sql).toContain(
            expectedSql,
          )
        }
      },
    )

    it(
      'counts distinct documents and customers/products per dimension',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await groupSalesSegmentation(
          pool,
          'brand',
        )

        const [
          sql,
        ] = query.mock.calls[0]
        const compactSql =
          sql.replace(/\s+/g, ' ')

        expect(compactSql).toContain(
          'COUNT( DISTINCT canonical.document_number )',
        )
        expect(compactSql).toContain(
          'COUNT( DISTINCT segment.customer_id )',
        )
        expect(compactSql).toContain(
          'COUNT( DISTINCT segment.product_id )',
        )
      },
    )

    it(
      'sorts periods by id ascending and other dimensions by revenue descending',
      async () => {
        const periodPool = buildPool({
          rows: [
            {
              id: '2026-02',
              revenue: 500,
            },
            {
              id: '2026-01',
              revenue: 1000,
            },
          ],
        })

        const periods =
          await groupSalesSegmentation(
            periodPool.pool,
            'period',
          )

        expect(
          periods.map((group: { id: string }) => group.id),
        ).toEqual([
          '2026-01',
          '2026-02',
        ])

        const brandPool = buildPool({
          rows: [
            {
              id: 'LOW',
              label: 'Low',
              revenue: 100,
            },
            {
              id: 'HIGH',
              label: 'High',
              revenue: 200,
            },
          ],
        })

        const brands =
          await groupSalesSegmentation(
            brandPool.pool,
            'brand',
          )

        expect(
          brands.map((group: { id: string }) => group.id),
        ).toEqual([
          'HIGH',
          'LOW',
        ])
      },
    )

    it(
      'applies assigned brand scope before reconciliation and customer labeling',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await groupSalesSegmentation(
          pool,
          'customer',
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

        const compactSql =
          sql.replace(/\s+/g, ' ')

        expect(
          sql.match(/ANY\(\$1::TEXT\[\]\)/g),
        ).toHaveLength(3)
        expect(compactSql).toContain(
          'candidate.scope_brand_key = ANY($1',
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
      'rejects unsupported dimensions before opening a connection',
      async () => {
        const connect = vi.fn()
        const pool = {
          connect,
        } as unknown as Parameters<
          typeof groupSalesSegmentation
        >[0]

        await expect(
          groupSalesSegmentation(
            pool,
            'invalid' as 'brand',
          ),
        ).rejects.toThrow(
          'Unsupported sales segmentation dimension: invalid',
        )

        expect(connect).not.toHaveBeenCalled()
      },
    )

    it(
      'releases the connection when the group query fails',
      async () => {
        const queryError =
          new Error(
            'Sales group query failed',
          )

        const {
          pool,
          release,
        } = buildPool({
          queryError,
        })

        await expect(
          groupSalesSegmentation(
            pool,
            'brand',
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
