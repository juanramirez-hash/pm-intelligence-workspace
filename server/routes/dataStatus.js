import { Router } from 'express'

export function createDataStatusRouter(
  pool,
) {
  const router = Router()

  router.get(
    '/status',
    async (_req, res) => {
      try {
        const result =
          await pool.query(`
            SELECT
              (SELECT COUNT(*) FROM data_imports) AS data_imports,
              (SELECT COUNT(*) FROM sales_facts) AS sales,
              (SELECT COUNT(*) FROM purchase_requests) AS purchase_requests,
              (SELECT COUNT(*) FROM purchase_orders) AS purchase_orders,
              (SELECT COUNT(*) FROM project_billings) AS project_billings,
              (SELECT COUNT(*) FROM exchange_rates) AS exchange_rates,
              (SELECT COUNT(*) FROM inventory_snapshots) AS inventory,
              (SELECT COUNT(*) FROM brand_targets) AS targets,
              (SELECT COUNT(*) FROM pricing_records) AS pricing,
              (SELECT COUNT(*) FROM products) AS products,
              (SELECT COUNT(*) FROM projects) AS projects
          `)

        return res.json({
          ok: true,
          datasets: result.rows[0],
        })
      } catch (error) {
        console.error(
          'Data status query failed:',
          error,
        )

        return res
          .status(500)
          .json({
            ok: false,
            error:
              'Data status query failed',
          })
      }
    },
  )

  return router
}