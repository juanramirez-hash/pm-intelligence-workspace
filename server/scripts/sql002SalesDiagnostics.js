import 'dotenv/config'

import {
  pool,
} from '../db/pool.js'

import {
  loadSalesProductIdentityDiagnostics,
} from '../services/salesAnalyticsService.js'

async function main() {
  try {
    const result =
      await loadSalesProductIdentityDiagnostics(
        pool,
        {
          scope: 'all',
          brandIds: [],
        },
      )

    console.log(
      JSON.stringify(
        {
          sql002: 'sales-product-identity-diagnostics',
          scope: 'all',
          generatedAt:
            new Date().toISOString(),
          result,
        },
        null,
        2,
      ),
    )
  } catch (error) {
    console.error(
      'SQL-002 Sales diagnostics failed:',
      error,
    )

    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

await main()