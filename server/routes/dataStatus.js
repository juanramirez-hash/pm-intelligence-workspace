// NAV-001: "Datos al corte" of the top bar.
//
// GET /api/status/data-cutoff
//
// Session only, no brand scope: it returns dates (sales cutoff and the last
// import of sales, inventory and purchases), never business data, so every
// signed-in user can read it, scopes 'pricing' and 'legacy' included. Two
// small reads: MAX(sale_date) (indexed) and the last completed import per
// dataset. It never reads the /api/data/* datasets.

import { Router } from 'express'

import {
  handleRouteError,
} from '../services/actionValidation.js'

import {
  loadDataCutoff,
} from '../services/myDayService.js'

import {
  AVAILABILITY_SOURCES,
  loadLatestImports,
} from '../services/myDayAvailabilityService.js'

import {
  MY_DAY_AVAILABILITY_RULES,
  sourceFreshness,
} from '../services/myDayAvailabilityRules.js'

export function createDataStatusRouter(pool, now = () => new Date()) {
  const router = Router()

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  router.get('/data-cutoff', async (_req, res) => {
    try {
      const [salesCutoff, imports] = await Promise.all([
        loadDataCutoff(pool),
        loadLatestImports(pool),
      ])
      const at = now()
      const source = (datasetType, dataCutoff = null) => sourceFreshness(
        {
          lastImportedAt: imports.get(datasetType)?.uploadedAt ?? null,
          dataCutoff,
        },
        at,
      )
      const sources = {
        sales: source(AVAILABILITY_SOURCES.sales, salesCutoff),
        inventory: source(AVAILABILITY_SOURCES.inventory),
        purchases: source(AVAILABILITY_SOURCES.purchases),
      }

      return res.json({
        ok: true,
        salesCutoff,
        staleAfterDays: MY_DAY_AVAILABILITY_RULES.freshness.staleAfterDays,
        anyStale: Object.values(sources).some((item) => item.stale === true),
        sources,
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo consultar la fecha de corte')
    }
  })

  return router
}
