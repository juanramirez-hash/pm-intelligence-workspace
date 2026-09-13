import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  loadSalesDataset,
} from '../../server/services/salesReadService.js'

function buildPool({
  salesRows = [],
  importRows = [
    {
      id: 77,
      file_name: 'sales.xlsx',
      uploaded_at: new Date('2026-09-11T12:00:00.000Z'),
    },
  ],
} = {}) {
  const query = vi.fn(async (sql) => {
    if (
      sql.includes('FROM data_imports')
    ) {
      return {
        rowCount:
          importRows.length,
        rows:
          importRows,
      }
    }

    if (
      sql.includes('FROM sales_facts')
    ) {
      return {
        rowCount:
          salesRows.length,
        rows:
          salesRows,
      }
    }

    throw new Error(
      `Unexpected query: ${sql}`,
    )
  })

  const release =
    vi.fn()

  const pool = {
    connect: vi
      .fn()
      .mockResolvedValue({
        query,
        release,
      }),
  }

  return {
    pool,
    query,
    release,
  }
}

function getSalesQueryCall(
  query,
) {
  const salesQueryCall =
    query.mock.calls.find(
      ([sql]) => sql.includes(
        'FROM sales_facts',
      ),
    )

  expect(
    salesQueryCall,
  ).toBeDefined()

  return salesQueryCall
}

function getImportQueryCall(
  query,
) {
  const importQueryCall =
    query.mock.calls.find(
      ([sql]) => sql.includes(
        'FROM data_imports',
      ),
    )

  expect(
    importQueryCall,
  ).toBeDefined()

  return importQueryCall
}

describe(
  'loadSalesDataset',
  () => {
    it(
      'loads the latest completed sales import before reading facts',
      async () => {
        const {
          pool,
          query,
          release,
        } = buildPool()

        await loadSalesDataset(
          pool,
          {
            scope: 'all',
            brandIds: [],
          },
        )

        const [
          importSql,
        ] = getImportQueryCall(
          query,
        )

        expect(
          importSql,
        ).toContain(
          "dataset_type = 'sales'",
        )

        expect(
          importSql,
        ).toContain(
          "status = 'completed'",
        )

        expect(
          importSql,
        ).toContain(
          'LIMIT 1',
        )

        expect(
          release,
        ).toHaveBeenCalledOnce()
      },
    )

    it(
      'loads the complete dataset for all scope from latest import only',
      async () => {
        const {
          pool,
          query,
          release,
        } = buildPool()

        await loadSalesDataset(
          pool,
          {
            scope: 'all',
            brandIds: [],
          },
        )

        const [
          salesSql,
          salesParams,
        ] = getSalesQueryCall(
          query,
        )

        expect(
          salesSql,
        ).toContain(
          'import_id',
        )

        expect(
          salesSql,
        ).not.toContain(
          'ANY($2::TEXT[])',
        )

        expect(
          salesParams,
        ).toEqual([
          77,
        ])

        expect(
          release,
        ).toHaveBeenCalledOnce()
      },
    )

    it(
      'filters assigned scope by canonical brand ids inside latest import only',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await loadSalesDataset(
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
          salesSql,
          salesParams,
        ] = getSalesQueryCall(
          query,
        )

        expect(
          salesSql,
        ).toContain(
          'import_id',
        )

        expect(
          salesSql,
        ).toContain(
          'ANY($2::TEXT[])',
        )

        expect(
          salesSql,
        ).toContain(
          'REGEXP_REPLACE',
        )

        expect(
          salesSql,
        ).toContain(
          'UPPER',
        )

        expect(
          salesParams,
        ).toEqual([
          77,
          [
            'ALTER',
            'MIKROTIK',
          ],
        ])
      },
    )

    it(
      'returns no sales rows when assigned scope has no brands',
      async () => {
        const {
          pool,
          query,
        } = buildPool()

        await loadSalesDataset(
          pool,
          {
            scope: 'assigned',
            brandIds: [],
          },
        )

        const [
          salesSql,
          salesParams,
        ] = getSalesQueryCall(
          query,
        )

        expect(
          salesSql,
        ).toContain(
          'import_id',
        )

        expect(
          salesSql,
        ).toContain(
          'ANY($2::TEXT[])',
        )

        expect(
          salesParams,
        ).toEqual([
          77,
          [],
        ])
      },
    )

    it(
      'returns null when there is no completed sales import',
      async () => {
        const {
          pool,
          query,
          release,
        } = buildPool({
          importRows: [],
        })

        const dataset =
          await loadSalesDataset(
            pool,
            {
              scope: 'all',
              brandIds: [],
            },
          )

        expect(
          dataset,
        ).toBeNull()

        expect(
          query.mock.calls.some(
            ([sql]) => sql.includes(
              'FROM sales_facts',
            ),
          ),
        ).toBe(false)

        expect(
          release,
        ).toHaveBeenCalledOnce()
      },
    )

    it(
      'preserves sales row mapping after access filtering',
      async () => {
        const saleDate =
          new Date(
            '2026-09-01T00:00:00.000Z',
          )

        const uploadedAt =
          new Date(
            '2026-09-11T12:00:00.000Z',
          )

        const {
          pool,
        } = buildPool({
          salesRows: [
            {
              sale_date:
                saleDate,
              brand:
                'ALTER',
              revenue:
                '100.50',
              gross_profit:
                '25.25',
              customer_id:
                '123456',
              customer_name:
                'Cliente Demo',
              product_name:
                'Producto Demo',
              product_code:
                'SKU-1',
              model:
                'MODEL-1',
              product_status:
                'A',
              quantity:
                '2',
              document_number:
                'FAC-1',
              location:
                'CDMX',
              sales_rep:
                'Vendedor',
              currency:
                'MXN',
            },
          ],
          importRows: [
            {
              id:
                77,
              file_name:
                'sales.xlsx',
              uploaded_at:
                uploadedAt,
            },
          ],
        })

        const dataset =
          await loadSalesDataset(
            pool,
            {
              scope: 'assigned',
              brandIds: [
                'ALTER',
              ],
            },
          )

        expect(
          dataset,
        ).toEqual({
          normalizedRows: [
            {
              date:
                '2026-09-01',
              brand:
                'ALTER',
              revenue:
                100.5,
              grossProfit:
                25.25,
              customerId:
                '123456',
              customerName:
                'Cliente Demo',
              productName:
                'Producto Demo',
              productCode:
                'SKU-1',
              model:
                'MODEL-1',
              productStatus:
                'A',
              quantity:
                2,
              documentNumber:
                'FAC-1',
              location:
                'CDMX',
              salesRep:
                'Vendedor',
              currency:
                'MXN',
            },
          ],
          lastImportedFile:
            'sales.xlsx',
          lastImportedAt:
            '2026-09-11T12:00:00.000Z',
        })
      },
    )
  },
)