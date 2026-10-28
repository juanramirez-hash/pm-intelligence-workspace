import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  loadSalesSegmentationDetailRows,
} from '../../server/services/salesAnalyticsService.js'

type QueryCall = [string, unknown[]]

function buildPool(
  rows: Array<Record<string, unknown>> = [],
) {
  const calls: QueryCall[] = []
  const release = vi.fn()

  const query = vi.fn(
    async (
      sql: string,
      params: unknown[],
    ) => {
      calls.push([sql, params])

      return {
        rowCount: rows.length,
        rows,
      }
    },
  )

  const connect = vi.fn(
    async () => ({
      query,
      release,
    }),
  )

  const pool = {
    connect,
  } as unknown as Parameters<
    typeof loadSalesSegmentationDetailRows
  >[0]

  return {
    pool,
    calls,
    connect,
    query,
    release,
  }
}

describe(
  'loadSalesSegmentationDetailRows',
  () => {
    it(
      'maps the current SalesSegmentationDetailRow contract',
      async () => {
        const {
          pool,
        } = buildPool([
          {
            id:
              '2026-10-01::2026-10::BELDEN::012035::CB02BBEL05::002 CDMX:PROYECTOS::RH070 ESTHER VERON GONZALEZ',
            period_id: '2026-10',
            brand_id: 'BELDEN',
            brand_label: 'BELDEN',
            customer_id: '012035',
            customer_label:
              '012035 CYBERPUERTA SA DE CV',
            product_id: 'CB02BBEL05',
            product_label: '2412 006A1000',
            location_id:
              '002 CDMX:PROYECTOS',
            location_label:
              '002 CDMX:PROYECTOS',
            sales_representative_id:
              'RH070 ESTHER VERON GONZALEZ',
            sales_representative_label:
              'RH070 ESTHER VERON GONZALEZ',
            revenue: '100',
            gross_profit: '25',
            quantity: '3',
            documents: 2,
            row_count: 4,
          },
        ])

        const result =
          await loadSalesSegmentationDetailRows(
            pool,
          )

        expect(result).toEqual([
          {
            id:
              '2026-10-01::2026-10::BELDEN::012035::CB02BBEL05::002 CDMX:PROYECTOS::RH070 ESTHER VERON GONZALEZ',
            periodId: '2026-10',
            brandId: 'BELDEN',
            brandLabel: 'BELDEN',
            customerId: '012035',
            customerLabel:
              '012035 CYBERPUERTA SA DE CV',
            productId: 'CB02BBEL05',
            productLabel: '2412 006A1000',
            locationId:
              '002 CDMX:PROYECTOS',
            locationLabel:
              '002 CDMX:PROYECTOS',
            salesRepresentativeId:
              'RH070 ESTHER VERON GONZALEZ',
            salesRepresentativeLabel:
              'RH070 ESTHER VERON GONZALEZ',
            revenue: 100,
            grossProfit: 25,
            grossMargin: 25,
            quantity: 3,
            documents: 2,
            rowCount: 4,
          },
        ])
      },
    )

    it(
      'preserves null-dimension labels',
      async () => {
        const {
          pool,
        } = buildPool([
          {
            id:
              '2026-10-01::2026-10::BELDEN::NO_CUSTOMER::NO_PRODUCT::NO_LOCATION::NO_SALES_REP',
            period_id: '2026-10',
            brand_id: 'BELDEN',
            brand_label: 'BELDEN',
            customer_id: null,
            customer_label: 'Sin cliente',
            product_id: null,
            product_label: 'Sin producto',
            location_id: null,
            location_label: 'Sin ubicación',
            sales_representative_id: null,
            sales_representative_label:
              'Sin vendedor',
            revenue: '0',
            gross_profit: '0',
            quantity: '1',
            documents: 1,
            row_count: 1,
          },
        ])

        const [row] =
          await loadSalesSegmentationDetailRows(
            pool,
          )

        expect(row).toMatchObject({
          customerId: null,
          customerLabel: 'Sin cliente',
          productId: null,
          productLabel: 'Sin producto',
          locationId: null,
          locationLabel: 'Sin ubicación',
          salesRepresentativeId: null,
          salesRepresentativeLabel:
            'Sin vendedor',
          grossMargin: 0,
        })
      },
    )

    it(
      'counts distinct documents at the segment grain',
      async () => {
        const {
          pool,
          calls,
        } = buildPool()

        await loadSalesSegmentationDetailRows(
          pool,
        )

        const [sql] = calls[0] ?? ['', []]

        expect(sql).toContain(
          'DISTINCT canonical.document_number',
        )
        expect(sql).toContain(
          'IS NOT DISTINCT FROM',
        )
      },
    )

    it(
      'orders by revenue descending and segment id ascending',
      async () => {
        const {
          pool,
          calls,
        } = buildPool()

        await loadSalesSegmentationDetailRows(
          pool,
        )

        const [sql] = calls[0] ?? ['', []]

        expect(sql).toMatch(
          /ORDER BY\s+group_data\.revenue DESC,\s+group_data\.id ASC/,
        )
      },
    )

    it(
      'normalizes the detail limit like the in-memory query',
      async () => {
        const {
          pool,
          calls,
        } = buildPool()

        await loadSalesSegmentationDetailRows(
          pool,
          {
            scope: 'all',
            brandIds: [],
          },
          {},
          12.9,
        )

        const [, params] =
          calls[0] ?? ['', []]

        expect(
          params.at(-1),
        ).toBe(12)
      },
    )

    it(
      'returns no rows for a non-positive limit without opening a connection',
      async () => {
        const {
          pool,
          connect,
        } = buildPool()

        const result =
          await loadSalesSegmentationDetailRows(
            pool,
            {
              scope: 'all',
              brandIds: [],
            },
            {},
            0,
          )

        expect(result).toEqual([])
        expect(connect).not.toHaveBeenCalled()
      },
    )

    it(
      'preserves assigned access scope and active segmentation filters',
      async () => {
        const {
          pool,
          calls,
        } = buildPool()

        await loadSalesSegmentationDetailRows(
          pool,
          {
            scope: 'assigned',
            brandIds: [
              'UNV (UNIVIEW)',
              'BELDEN',
            ],
          },
          {
            periodIds: ['2026-10'],
            customerIds: ['012035'],
            searchTerm: '  José Núñez  ',
          },
          25,
        )

        const [sql, params] =
          calls[0] ?? ['', []]

        expect(sql).toContain(
          'ANY($1::TEXT[])',
        )
        expect(params[0]).toEqual([
          'UNVUNIVIEW',
          'BELDEN',
        ])
        expect(params).toContainEqual([
          '2026-10',
        ])
        expect(params).toContainEqual([
          '012035',
        ])
        expect(params).toContain(
          'JOSE NUNEZ',
        )
        expect(params.at(-1)).toBe(25)
      },
    )

    it(
      'reuses current brand customer and product label sources',
      async () => {
        const {
          pool,
          calls,
        } = buildPool()

        await loadSalesSegmentationDetailRows(
          pool,
        )

        const [sql] = calls[0] ?? ['', []]

        expect(sql).toContain(
          'brand_labels AS',
        )
        expect(sql).toContain(
          'customer_master_labels AS',
        )
        expect(sql).toContain(
          'product_master_labels AS',
        )
      },
    )

    it(
      'releases the database connection',
      async () => {
        const {
          pool,
          release,
        } = buildPool()

        await loadSalesSegmentationDetailRows(
          pool,
        )

        expect(release).toHaveBeenCalledTimes(1)
      },
    )
  },
)
