import 'dotenv/config'

import {
  pool,
} from '../db/pool.js'

import {
  loadSalesProductIdentityDiagnostics,
  summarizeSalesSegmentation,
} from '../services/salesAnalyticsService.js'

async function main() {
  try {
    const access = {
      scope: 'all',
      brandIds: [],
    }

    const [
      identityDiagnostics,
      summary,
    ] = await Promise.all([
      loadSalesProductIdentityDiagnostics(
        pool,
        access,
      ),
      summarizeSalesSegmentation(
        pool,
        access,
      ),
    ])

    console.log(
      JSON.stringify(
        {
          sql002:
            'sales-server-side-analytics',
          scope: 'all',
          generatedAt:
            new Date().toISOString(),
          identityDiagnostics,
          summary,
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
