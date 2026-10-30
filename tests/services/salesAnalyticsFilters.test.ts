import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  groupSalesSegmentation,
  summarizeSalesSegmentation,
} from '../../server/services/salesAnalyticsService.js'

function buildPool() {
  const query = vi.fn(
    async () => ({
      rowCount: 0,
      rows: [],
    }),
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
  'sales server-side segmentation filters',
  () => {
    it(
      'keeps the existing unfiltered query path unchanged',
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
          params,
        ] = query.mock.calls[0]

        expect(sql).not.toContain(
          'filtered_canonical_sales AS',
        )
        expect(params).toEqual([])
      },
    )

    it(
      'applies all list filters with normalizeValue-compatible parameters',
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
            periodIds: [' 2026-10 '],
            brandIds: [' Mériva  '],
            customerIds: [' José   Núñez '],
            productIds: [' Producto Á '],
            locationIds: [' México   Norte '],
            salesRepresentativeIds: [
              ' Raúl   Pérez ',
            ],
          },
        )

        const [
          sql,
          params,
        ] = query.mock.calls[0]

        expect(sql).toContain(
          'filtered_canonical_sales AS',
        )
        expect(sql).toContain(
          'filtered_sales_segments AS',
        )
        // The period is filtered once, when reading sales_facts.
        expect(sql).not.toContain(
          'BTRIM(canonical.period_id)',
        )
        expect(params).toEqual([
          ['2026-10'],
          ['MERIVA'],
          ['JOSE NUNEZ'],
          ['PRODUCTO A'],
          ['MEXICO NORTE'],
          ['RAUL PEREZ'],
        ])
      },
    )

    it(
      'uses inclusive date boundaries',
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
            dateFrom: '2026-01-01',
            dateTo: '2026-10-28',
          },
        )

        const [
          sql,
          params,
        ] = query.mock.calls[0]
        const compactSql =
          sql.replace(/\s+/g, ' ')

        expect(compactSql).toContain(
          'canonical.sale_date::TEXT >= $1',
        )
        expect(compactSql).toContain(
          'canonical.sale_date::TEXT <= $2',
        )
        expect(params).toEqual([
          '2026-01-01',
          '2026-10-28',
        ])
      },
    )

    it(
      'offsets filter parameters after assigned brand access scope',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await groupSalesSegmentation(
          pool,
          'brand',
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
          },
        )

        const [
          sql,
          params,
        ] = query.mock.calls[0]

        expect(sql).toContain(
          'ANY($1::TEXT[])',
        )
        expect(sql).toContain(
          'ANY($2::TEXT[])',
        )
        expect(sql).toContain(
          'ANY($3::TEXT[])',
        )
        expect(sql).not.toContain(
          'ANY($4::TEXT[])',
        )
        expect(params).toEqual([
          [
            'UNVUNIVIEW',
            'BELDEN',
          ],
          ['2026-10'],
          ['012035'],
        ])
      },
    )

    it(
      'filters a period-only request once, when reading sales_facts',
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
            periodIds: ['2026-10'],
          },
        )

        const [
          sql,
          params,
        ] = query.mock.calls[0]
        const compactSql =
          sql.replace(/\s+/g, ' ')

        expect(compactSql).toContain(
          'FROM sales_facts WHERE period_id = ANY($1::TEXT[])',
        )
        expect(sql).not.toContain(
          'BTRIM(canonical.period_id)',
        )
        expect(sql).not.toContain(
          'filtered_canonical_sales AS',
        )
        expect(params).toEqual([
          ['2026-10'],
        ])
      },
    )

    it(
      'keeps the other filters unchanged when no period is requested',
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
            brandIds: [' Mériva  '],
          },
        )

        const [
          sql,
          params,
        ] = query.mock.calls[0]
        const compactSql =
          sql.replace(/\s+/g, ' ')

        expect(compactSql).not.toContain(
          'period_id = ANY(',
        )
        expect(sql).toContain(
          'filtered_canonical_sales AS',
        )
        expect(sql).toContain(
          'BTRIM(canonical.brand_id)',
        )
        expect(compactSql).toContain(
          '= ANY($1::TEXT[])',
        )
        expect(params).toEqual([
          ['MERIVA'],
        ])
      },
    )

    it(
      'normalizes search accents case and whitespace without unaccent extension',
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
            searchTerm: '  José   Núñez  ',
          },
        )

        const [
          sql,
          params,
        ] = query.mock.calls[0]

        expect(sql).toContain(
          'NORMALIZE(',
        )
        expect(sql).toContain(
          "U&'[\\0300-\\036F]'",
        )
        expect(sql).not.toContain(
          'unaccent(',
        )
        expect(params).toEqual([
          'JOSE NUNEZ',
        ])
      },
    )

    it(
      'searches ids and brand customer and product labels',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await groupSalesSegmentation(
          pool,
          'product',
          {
            scope: 'all',
            brandIds: [],
          },
          {
            searchTerm: 'camera',
          },
        )

        const [sql] =
          query.mock.calls[0]

        expect(sql).toContain(
          'filter_brand_labels AS',
        )
        expect(sql).toContain(
          'filter_customer_sales_labels AS',
        )
        expect(sql).toContain(
          'filter_product_fallback_labels AS',
        )
        expect(sql).toContain(
          'canonical.period_id',
        )
        expect(sql).toContain(
          'canonical.location_id',
        )
        expect(sql).toContain(
          'canonical.sales_representative_id',
        )
      },
    )

    it(
      'uses filtered canonical rows for documents and filtered segments for metrics',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await groupSalesSegmentation(
          pool,
          'customer',
          {
            scope: 'all',
            brandIds: [],
          },
          {
            brandIds: ['UNV (UNIVIEW)'],
          },
        )

        const [sql] =
          query.mock.calls[0]
        const compactSql =
          sql.replace(/\s+/g, ' ')

        expect(compactSql).toContain(
          'FROM filtered_canonical_sales AS canonical',
        )
        expect(compactSql).toContain(
          'FROM filtered_sales_segments AS segment',
        )
      },
    )

    it(
      'ignores empty filter lists and whitespace-only search terms',
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
            periodIds: [],
            brandIds: [],
            searchTerm: '   ',
          },
        )

        const [
          sql,
          params,
        ] = query.mock.calls[0]

        expect(sql).not.toContain(
          'filtered_canonical_sales AS',
        )
        expect(params).toEqual([])
      },
    )
  },
)
