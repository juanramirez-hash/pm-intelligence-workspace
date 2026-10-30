import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  readFileSync,
} from 'node:fs'

const readSource = (
  path: string,
) =>
  readFileSync(
    new URL(
      `../../${path}`,
      import.meta.url,
    ),
    'utf8',
  )

describe(
  'sales fallback owner cache integration',
  () => {
    it(
      'defines the cache without import_id restrictions',
      () => {
        const migration =
          readSource(
            'server/migrations/035_sales_fallback_owner_candidates.sql',
          )

        expect(migration).toContain(
          'CREATE MATERIALIZED VIEW public.sales_fallback_owner_candidates',
        )
        expect(migration).toContain(
          'CREATE OR REPLACE FUNCTION public.refresh_sales_fallback_owner_candidates',
        )
        expect(migration).toContain(
          'REFRESH MATERIALIZED VIEW public.sales_fallback_owner_candidates',
        )
        expect(migration).not.toContain(
          'import_id',
        )
      },
    )

    for (const service of [
      'server/services/salesImportService.js',
      'server/services/salesChunkImportService.js',
      'server/services/productChunkImportService.js',
    ]) {
      it(
        `refreshes fallback owners before COMMIT in ${service}`,
        () => {
          const source =
            readSource(service)

          const refreshIndex =
            source.lastIndexOf(
              'refresh_sales_fallback_owner_candidates(FALSE)',
            )

          const commitIndex =
            source.lastIndexOf(
              "client.query('COMMIT')",
            )

          expect(refreshIndex).toBeGreaterThan(
            -1,
          )
          expect(commitIndex).toBeGreaterThan(
            refreshIndex,
          )
        },
      )
    }
  },
)
