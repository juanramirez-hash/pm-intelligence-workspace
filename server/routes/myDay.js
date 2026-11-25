// MD-001 "Mi día": the PM's brands for the data cutoff month.
//
// GET /api/my-day?period=YYYY-MM
// GET /api/my-day/lost-customers?period=&inactivePeriods=&basePeriods=&brand=&limit=&offset=
//
// The brands always come from the user's assignments in PostgreSQL
// (req.authUser.brandIds), never from the client; only the brand filter of
// lost-customers is accepted, and only inside those brands.

import { Router } from 'express'

import {
  normalizeBrandKey,
  normalizeBrandKeys,
} from '../middleware/requireBrandScope.js'

import {
  handleRouteError,
  httpError,
  pageInteger,
  periodId,
} from '../services/actionValidation.js'

import {
  MY_DAY_RULES,
  buildMyDayBrands,
  buildMyDayPortfolio,
  resolvePeriodWindow,
} from '../services/myDayRules.js'

import {
  countLostCustomers,
  labelBrands,
  loadActiveBeforePrevious,
  loadActiveBrandKeys,
  loadBrandLabels,
  loadDataCutoff,
  loadLostCustomers,
  loadTargets,
  loadWindowMetrics,
  resolveLossWindow,
} from '../services/myDayService.js'

import {
  shiftMonth,
} from '../services/metricPeriods.js'

const VALID_SCOPES = new Set(['all', 'assigned'])

/**
 * - assigned: the user has brand assignments (any scope); only those.
 * - all-brands: scope 'all' without assignments; every brand with sales or
 *   target in the period or the previous one.
 * - none: no assignments and no full scope.
 * Scopes without commercial access ('pricing', 'legacy') are rejected, as in
 * requireBrandScope.
 */
export function resolveMyDayBrandSource(authUser) {
  if (!authUser) {
    throw httpError(401, 'Authentication required')
  }

  if (!VALID_SCOPES.has(authUser.scope)) {
    throw httpError(403, 'Brand access scope is invalid')
  }

  const brandKeys = normalizeBrandKeys(authUser.brandIds)

  if (brandKeys.length > 0) {
    return { mode: 'assigned', brandKeys }
  }

  return authUser.scope === 'all'
    ? { mode: 'all-brands', brandKeys: [] }
    : { mode: 'none', brandKeys: [] }
}

async function resolveBrandKeys(pool, source, period) {
  if (source.mode === 'all-brands') {
    return loadActiveBrandKeys(pool, period, shiftMonth(period, -1))
  }

  return source.brandKeys
}

function resolvePeriod(query, dataCutoff) {
  if (query.period !== undefined) {
    return periodId(query.period)
  }

  return dataCutoff ? dataCutoff.slice(0, 7) : null
}

function emptyResponse(fields) {
  return {
    ok: true,
    rules: MY_DAY_RULES,
    portfolio: null,
    brands: [],
    ...fields,
  }
}

export function createMyDayRouter(pool) {
  const router = Router()

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  router.get('/', async (req, res) => {
    try {
      const source = resolveMyDayBrandSource(req.authUser)
      const dataCutoff = await loadDataCutoff(pool)
      const period = resolvePeriod(req.query, dataCutoff)

      if (source.mode === 'none') {
        return res.json(emptyResponse({
          period,
          dataCutoff,
          reason: 'no-brand-assignments',
        }))
      }

      if (!period) {
        return res.json(emptyResponse({
          period: null,
          dataCutoff,
          reason: 'no-sales-data',
        }))
      }

      const window = resolvePeriodWindow(period, dataCutoff)

      if (window.periodStatus === 'after-cutoff') {
        return res.json(emptyResponse({
          period,
          dataCutoff,
          periodStatus: window.periodStatus,
          workingDays: window.workingDays,
          comparison: null,
          reason: 'period-after-data-cutoff',
        }))
      }

      const brandKeys = await resolveBrandKeys(pool, source, period)
      const lossWindow = resolveLossWindow(
        period,
        dataCutoff,
        MY_DAY_RULES.lostCustomers.inactivePeriods,
        MY_DAY_RULES.lostCustomers.basePeriods,
      )

      const [labels, metrics, targets, activeBeforePrevious, lostCustomers] =
        await Promise.all([
          loadBrandLabels(pool, brandKeys),
          loadWindowMetrics(pool, brandKeys, window.comparison),
          loadTargets(pool, brandKeys, period),
          loadActiveBeforePrevious(pool, brandKeys, window.previousPeriod),
          lossWindow
            ? countLostCustomers(pool, brandKeys, lossWindow)
            : new Map(),
        ])

      const brands = buildMyDayBrands({
        window,
        brands: labelBrands(brandKeys, labels, req.authUser.brandIds),
        current: metrics.current,
        previous: metrics.previous,
        targets,
        activeBeforePrevious,
        lostCustomers,
      })

      return res.json({
        ok: true,
        period,
        dataCutoff,
        brandSource: source.mode,
        periodStatus: window.periodStatus,
        workingDays: window.workingDays,
        comparison: window.comparison,
        lostCustomersWindow: lossWindow,
        rules: MY_DAY_RULES,
        portfolio: buildMyDayPortfolio(brands, window),
        brands,
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo consultar Mi día')
    }
  })

  router.get('/lost-customers', async (req, res) => {
    try {
      const source = resolveMyDayBrandSource(req.authUser)
      const inactivePeriods = pageInteger(
        req.query.inactivePeriods,
        MY_DAY_RULES.lostCustomers.inactivePeriods,
        12,
        1,
      )
      const basePeriods = pageInteger(
        req.query.basePeriods,
        MY_DAY_RULES.lostCustomers.basePeriods,
        24,
        1,
      )
      const limit = pageInteger(req.query.limit, 50, 500, 1)
      const offset = pageInteger(req.query.offset, 0, 1000000)
      const dataCutoff = await loadDataCutoff(pool)
      const period = resolvePeriod(req.query, dataCutoff)
      const base = {
        ok: true,
        period,
        dataCutoff,
        inactivePeriods,
        basePeriods,
        limit,
        offset,
      }

      if (source.mode === 'none') {
        return res.json({
          ...base,
          window: null,
          hasMore: false,
          rows: [],
          reason: 'no-brand-assignments',
        })
      }

      const window = period
        ? resolveLossWindow(period, dataCutoff, inactivePeriods, basePeriods)
        : null

      if (!window) {
        return res.json({ ...base, window: null, hasMore: false, rows: [] })
      }

      let brandKeys = await resolveBrandKeys(pool, source, period)

      if (req.query.brand !== undefined) {
        const requested = normalizeBrandKey(req.query.brand)

        if (!requested || !brandKeys.includes(requested)) {
          throw httpError(403, 'Marca fuera del alcance del usuario')
        }

        brandKeys = [requested]
      }

      const [labels, lost] = await Promise.all([
        loadBrandLabels(pool, brandKeys),
        loadLostCustomers(pool, brandKeys, window, { limit, offset }),
      ])
      const brandLabels = new Map(
        labelBrands(brandKeys, labels, req.authUser.brandIds).map(
          (brand) => [brand.brandKey, brand.brandLabel],
        ),
      )

      return res.json({
        ...base,
        window,
        hasMore: lost.hasMore,
        rows: lost.rows.map((row) => ({
          ...row,
          brandLabel: brandLabels.get(row.brandKey) ?? row.brandKey,
        })),
      })
    } catch (error) {
      return handleRouteError(
        res,
        error,
        'No se pudieron consultar los clientes por recuperar',
      )
    }
  })

  return router
}
