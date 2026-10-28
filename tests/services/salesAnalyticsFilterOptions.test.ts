import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  loadSalesSegmentationFilterOptions,
} from '../../server/services/salesAnalyticsService.js'

type QueryCall = [string, unknown[]]

function getDimensionFromSql(sql: string): string {
  if (sql.includes('segment.brand_id AS id')) {
    return 'brand'
  }

  if (sql.includes('segment.customer_id AS id')) {
    return 'customer'
  }

  if (sql.includes('segment.product_id AS id')) {
    return 'product'
  }

  if (sql.includes('segment.location_id AS id')) {
    return 'location'
  }

  if (
    sql.includes(
      'segment.sales_representative_id AS id',
    )
  ) {
    return 'salesRepresentative'
  }

  throw new Error('Unknown dimension query')
}

function buildPool(
  rowsByDimension: Record<
    string,
    Array<Record<string, unknown>>
  > = {},
) {
  const calls: QueryCall[] = []
  const releases: ReturnType<typeof vi.fn>[] = []

  const connect = vi.fn(
    async () => {
      const release = vi.fn()
      releases.push(release)

      return {
        query: vi.fn(
          async (
            sql: string,
            params: unknown[],
          ) => {
            calls.push([sql, params])

            const dimension =
              getDimensionFromSql(sql)

            return {
              rowCount: 0,
              rows:
                rowsByDimension[dimension] ?? [],
            }
          },
        ),
        release,
      }
    },
  )

  const pool = {
    connect,
  } as unknown as Parameters<
    typeof loadSalesSegmentationFilterOptions
  >[0]

  return {
    pool,
    calls,
    connect,
    releases,
  }
}

describe(
  'loadSalesSegmentationFilterOptions',
  () => {
    it(
      'builds the five current Sales Workspace facets',
      async () => {
        const {
          pool,
          connect,
        } = buildPool()

        const result =
          await loadSalesSegmentationFilterOptions(
            pool,
            '2026-10',
          )

        expect(Object.keys(result)).toEqual([
          'brands',
          'customers',
          'products',
          'locations',
          'salesRepresentatives',
        ])
        expect(connect).toHaveBeenCalledTimes(5)
      },
    )

    it(
      'forces the selected period on every facet',
      async () => {
        const {
          pool,
          calls,
        } = buildPool()

        await loadSalesSegmentationFilterOptions(
          pool,
          '2026-10',
          {
            scope: 'all',
            brandIds: [],
          },
          {
            periodIds: ['2025-01'],
          },
        )

        expect(calls).toHaveLength(5)

        for (const [, params] of calls) {
          expect(params).toContainEqual([
            '2026-10',
          ])
          expect(params).not.toContainEqual([
            '2025-01',
          ])
        }
      },
    )

    it(
      'omits only the facet own dimension while keeping the others',
      async () => {
        const {
          pool,
          calls,
        } = buildPool()

        await loadSalesSegmentationFilterOptions(
          pool,
          '2026-10',
          {
            scope: 'all',
            brandIds: [],
          },
          {
            brandIds: ['BELDEN'],
            customerIds: ['012035'],
            productIds: ['CB02BBEL05'],
            locationIds: [
              '002 CDMX:PROYECTOS',
            ],
            salesRepresentativeIds: [
              'RH070 ESTHER VERON GONZALEZ',
            ],
          },
        )

        const byDimension =
          Object.fromEntries(
            calls.map(([sql, params]) => [
              getDimensionFromSql(sql),
              params,
            ]),
          )

        expect(byDimension.brand).not.toContainEqual([
          'BELDEN',
        ])
        expect(byDimension.brand).toContainEqual([
          '012035',
        ])

        expect(
          byDimension.customer,
        ).not.toContainEqual(['012035'])
        expect(byDimension.customer).toContainEqual([
          'BELDEN',
        ])

        expect(byDimension.product).not.toContainEqual([
          'CB02BBEL05',
        ])
        expect(byDimension.location).not.toContainEqual([
          '002 CDMX:PROYECTOS',
        ])
        expect(
          byDimension.salesRepresentative,
        ).not.toContainEqual([
          'RH070 ESTHER VERON GONZALEZ',
        ])
      },
    )

    it(
      'keeps search active for every facet',
      async () => {
        const {
          pool,
          calls,
        } = buildPool()

        await loadSalesSegmentationFilterOptions(
          pool,
          '2026-10',
          {
            scope: 'all',
            brandIds: [],
          },
          {
            searchTerm: '  José Núñez ',
          },
        )

        for (const [, params] of calls) {
          expect(params).toContain('JOSE NUNEZ')
        }
      },
    )

    it(
      'preserves assigned access scope in all facet queries',
      async () => {
        const {
          pool,
          calls,
        } = buildPool()

        await loadSalesSegmentationFilterOptions(
          pool,
          '2026-10',
          {
            scope: 'assigned',
            brandIds: [
              'UNV (UNIVIEW)',
              'BELDEN',
            ],
          },
        )

        for (const [sql, params] of calls) {
          expect(sql).toContain(
            'ANY($1::TEXT[])',
          )
          expect(params[0]).toEqual([
            'UNVUNIVIEW',
            'BELDEN',
          ])
        }
      },
    )

    it(
      'maps options to id label revenue and sorts them by label',
      async () => {
        const {
          pool,
        } = buildPool({
          brand: [
            {
              id: 'ZKTECO',
              label: 'ZKTECO',
              revenue: '100',
              gross_profit: '20',
              quantity: '1',
              documents: 1,
              customer_count: 1,
              product_count: 1,
              row_count: 1,
            },
            {
              id: 'AJAX',
              label: 'AJAX',
              revenue: '50',
              gross_profit: '10',
              quantity: '1',
              documents: 1,
              customer_count: 1,
              product_count: 1,
              row_count: 1,
            },
          ],
        })

        const result =
          await loadSalesSegmentationFilterOptions(
            pool,
            '2026-10',
          )

        expect(result.brands).toEqual([
          {
            id: 'AJAX',
            label: 'AJAX',
            revenue: 50,
          },
          {
            id: 'ZKTECO',
            label: 'ZKTECO',
            revenue: 100,
          },
        ])
      },
    )

    it(
      'releases all five database connections',
      async () => {
        const {
          pool,
          releases,
        } = buildPool()

        await loadSalesSegmentationFilterOptions(
          pool,
          '2026-10',
        )

        expect(releases).toHaveLength(5)

        for (const release of releases) {
          expect(release).toHaveBeenCalledTimes(1)
        }
      },
    )
  },
)
