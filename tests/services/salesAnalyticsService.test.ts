import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  loadSalesProductIdentityDiagnostics,
} from '../../server/services/salesAnalyticsService.js'

interface DiagnosticRow {
  total_rows?: number | string
  matched_rows?: number | string
  matched_by_name?: number | string
  matched_historical_unlisted?: number | string
  matched_by_erp_code?: number | string
  matched_by_brand_model?: number | string
  ambiguous_rows?: number | string
  ambiguous_by_name?: number | string
  ambiguous_by_erp_code?: number | string
  ambiguous_by_brand_model?: number | string
  unmatched_rows?: number | string
  missing_identity_rows?: number | string
}

interface PoolOptions {
  diagnosticRow?: DiagnosticRow
  queryError?: Error
}

function buildPool({
  diagnosticRow = {},
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
        rows: [diagnosticRow],
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
  typeof loadSalesProductIdentityDiagnostics
>[0]

  return {
    pool,
    query,
    release,
  }
}

type QueryMock =
  ReturnType<typeof buildPool>['query']

function getAnalyticsQueryCall(
  query: QueryMock,
) {
  const call =
    query.mock.calls[0]

  if (!call) {
    throw new Error(
      'Expected an analytics query',
    )
  }

  return call
}

describe(
  'loadSalesProductIdentityDiagnostics',
  () => {
    it(
      'maps the SQL reconciliation summary to numbers and calculates match rate',
      async () => {
        const {
          pool,
          release,
        } = buildPool({
          diagnosticRow: {
            total_rows: '20',
            matched_rows: '15',
            matched_by_name: '8',
            matched_historical_unlisted:
              '2',
            matched_by_erp_code: '3',
            matched_by_brand_model: '2',
            ambiguous_rows: '3',
            ambiguous_by_name: '1',
            ambiguous_by_erp_code: '1',
            ambiguous_by_brand_model: '1',
            unmatched_rows: '2',
            missing_identity_rows: '1',
          },
        })

        const result =
          await loadSalesProductIdentityDiagnostics(
            pool,
            {
              scope: 'all',
              brandIds: [],
            },
          )

        expect(result).toEqual({
          totalRows: 20,
          matchedRows: 15,
          matchedByName: 8,
          matchedHistoricalUnlisted: 2,
          matchedByErpCode: 3,
          matchedByBrandAndModel: 2,
          ambiguousRows: 3,
          ambiguousByName: 1,
          ambiguousByErpCode: 1,
          ambiguousByBrandAndModel: 1,
          unmatchedRows: 2,
          missingIdentityRows: 1,
          matchRate: 75,
        })

        expect(
          release,
        ).toHaveBeenCalledOnce()
      },
    )

    it(
      'returns zero match rate when there are no sales rows',
      async () => {
        const {
          pool,
        } = buildPool({
          diagnosticRow: {
            total_rows: 0,
            matched_rows: 0,
          },
        })

        const result =
          await loadSalesProductIdentityDiagnostics(
            pool,
          )

        expect(result.totalRows).toBe(0)
        expect(result.matchedRows).toBe(0)
        expect(result.matchRate).toBe(0)
      },
    )

    it(
      'builds the reconciliation indexes for name, code, and brand plus model',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await loadSalesProductIdentityDiagnostics(
          pool,
          {
            scope: 'all',
            brandIds: [],
          },
        )

        const [
          sql,
          params,
        ] = getAnalyticsQueryCall(
          query,
        )

        expect(sql).toContain(
          'product_name_index AS',
        )
        expect(sql).toContain(
          'product_code_index AS',
        )
        expect(sql).toContain(
          'product_brand_model_index AS',
        )

        expect(sql).toContain(
          'FROM products',
        )
        expect(sql).toContain(
          'FROM sales_facts',
        )

        expect(params).toEqual([])
      },
    )

    it(
      'preserves reconciliation precedence name then ERP code then brand and model',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await loadSalesProductIdentityDiagnostics(
          pool,
        )

        const [
          sql,
        ] = getAnalyticsQueryCall(
          query,
        )

        const compactSql =
          sql.replace(/\s+/g, ' ')

        const namePosition =
          compactSql.indexOf(
            "sales.product_name_key IS NOT NULL",
          )

        const codePosition =
          compactSql.indexOf(
            "sales.product_code_key IS NOT NULL",
            namePosition + 1,
          )

        const brandModelPosition =
          compactSql.indexOf(
            "sales.brand_key IS NOT NULL",
            codePosition + 1,
          )

        expect(namePosition).toBeGreaterThan(
          -1,
        )
        expect(codePosition).toBeGreaterThan(
          namePosition,
        )
        expect(
          brandModelPosition,
        ).toBeGreaterThan(
          codePosition,
        )
      },
    )

    it(
      'contains all required reconciliation outcomes',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await loadSalesProductIdentityDiagnostics(
          pool,
        )

        const [
          sql,
        ] = getAnalyticsQueryCall(
          query,
        )

        expect(sql).toContain(
          "'matched_by_name'",
        )
        expect(sql).toContain(
          "'ambiguous_name'",
        )
        expect(sql).toContain(
          "'matched_by_erp_code'",
        )
        expect(sql).toContain(
          "'ambiguous_erp_code'",
        )
        expect(sql).toContain(
          "'matched_by_brand_model'",
        )
        expect(sql).toContain(
          "'ambiguous_brand_model'",
        )
        expect(sql).toContain(
          "'historical_unlisted'",
        )
        expect(sql).toContain(
          "'product_not_found'",
        )
        expect(sql).toContain(
          "'missing_product_identity'",
        )
      },
    )

    it(
      'does not restrict sales history by import or period',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await loadSalesProductIdentityDiagnostics(
          pool,
          {
            scope: 'all',
            brandIds: [],
          },
        )

        const [
          sql,
        ] = getAnalyticsQueryCall(
          query,
        )

        const salesSource =
          sql
            .split(
              'normalized_sales AS',
            )[0]

        expect(salesSource).not.toMatch(
          /\bimport_id\b/i,
        )
        expect(salesSource).not.toMatch(
          /\bperiod_id\b/i,
        )
      },
    )

    it(
      'filters assigned brands before product reconciliation',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await loadSalesProductIdentityDiagnostics(
          pool,
          {
            scope: 'assigned',
            brandIds: [
              'ALTER',
              'MIKROTIK',
            ],
          },
        )

        const [
          sql,
          params,
        ] = getAnalyticsQueryCall(
          query,
        )

        const compactSql =
          sql.replace(/\s+/g, ' ')

        expect(compactSql).toMatch(
          /FROM sales_facts WHERE REGEXP_REPLACE\(\s*UPPER\(brand\),\s*'\[\^A-Z0-9\]',\s*'',\s*'g'\s*\) = ANY\(\$1::TEXT\[\]\)/,
        )

        expect(params).toEqual([
          [
            'ALTER',
            'MIKROTIK',
          ],
        ])
      },
    )

    it(
      'normalizes and deduplicates assigned brands with spaces and hyphens',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await loadSalesProductIdentityDiagnostics(
          pool,
          {
            scope: 'assigned',
            brandIds: [
              'C-DATA',
              'MARCAS VARIAS',
              'PLATINUM TOOLS',
              'NCS JAGUAR',
              ' mikrotik ',
              'SONOFF',
              'CDATA',
            ],
          },
        )

        const [
          _sql,
          params,
        ] = getAnalyticsQueryCall(
          query,
        )

        expect(params).toEqual([
          [
            'CDATA',
            'MARCASVARIAS',
            'PLATINUMTOOLS',
            'NCSJAGUAR',
            'MIKROTIK',
            'SONOFF',
          ],
        ])
      },
    )

    it(
      'keeps an empty assigned scope as an empty SQL brand filter',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await loadSalesProductIdentityDiagnostics(
          pool,
          {
            scope: 'assigned',
            brandIds: [],
          },
        )

        const [
          sql,
          params,
        ] = getAnalyticsQueryCall(
          query,
        )

        expect(sql).toContain(
          'ANY($1::TEXT[])',
        )
        expect(params).toEqual([
          [],
        ])
      },
    )

    it(
      'releases the connection when the analytics query fails',
      async () => {
        const queryError =
          new Error(
            'Sales analytics query failed',
          )

        const {
          pool,
          release,
        } = buildPool({
          queryError,
        })

        await expect(
          loadSalesProductIdentityDiagnostics(
            pool,
            {
              scope: 'all',
              brandIds: [],
            },
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