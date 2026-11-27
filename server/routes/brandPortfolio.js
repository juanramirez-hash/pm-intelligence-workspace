// MB-001C: year over year comparison of a portfolio of brands, for the
// "Marcas" directory.
//
// GET /api/brand-portfolio/year-over-year?view=mine|all&period=YYYY-MM
//
// - view=mine: the user's effective brands (assistants included), like
//   /api/my-day and the directory. view=all: ALL the sales with no brand
//   filter (brands without a PM included), only for scope 'all'; otherwise 403
//   (the same rule as /api/my-day?view=all).
// - The windows, year to date and annual close are the ones of the brand page
//   (brandRules.js, brandsService.yearWindowsQuery); customers, products and
//   documents are distinct over the whole portfolio, not a sum of brands.
// - Annual quota = sum of the monthly quotas of the included brands
//   (view=all: every quota loaded); monthsWithTarget / complete as in the brand
//   page.
// - Gross profit and margin reveal the cost: null plus costHidden unless the
//   user has cost access to every included brand.

import { Router } from 'express'

import {
  requireBrandScope,
  resolveCostScope,
} from '../middleware/requireBrandScope.js'

import {
  handleRouteError,
} from '../services/actionValidation.js'

import {
  BRAND_RULES,
  assembleYearComparison,
  buildYearWindowPlan,
  costVisibleForPortfolio,
  periodOptions,
  resolveBrandPeriod,
} from '../services/brandRules.js'

import {
  annualTargetFrom,
  loadPortfolioTargetsRange,
  loadPortfolioYearWindows,
} from '../services/brandsService.js'

import {
  loadDataCutoff,
} from '../services/myDayService.js'

import {
  resolveMyDayBrandSource,
  resolveMyDayView,
} from './myDay.js'

export function createBrandPortfolioRouter(pool) {
  const router = Router()

  router.use(requireBrandScope)
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  router.get('/year-over-year', async (req, res) => {
    try {
      const view = resolveMyDayView(req.query.view)
      const source = resolveMyDayBrandSource(req.authUser, view)
      const dataCutoff = await loadDataCutoff(pool)
      const period = resolveBrandPeriod(req.query.period, dataCutoff)
      // null = all the sales (no brand filter).
      const brandKeys = source.mode === 'all-brands' ? null : source.brandKeys
      const costVisible = costVisibleForPortfolio(resolveCostScope(req.authUser), brandKeys)
      const base = {
        ok: true,
        view,
        brandSource: source.mode,
        brandCount: brandKeys === null ? null : brandKeys.length,
        period,
        periods: periodOptions(dataCutoff),
        dataCutoff,
        costHidden: !costVisible,
      }

      if (source.mode === 'none') {
        return res.json({ ...base, reason: 'no-brand-assignments', yearOverYear: null })
      }

      if (!period) {
        return res.json({ ...base, reason: 'no-sales-data', yearOverYear: null })
      }

      const plan = buildYearWindowPlan(period, dataCutoff)
      const targetYear = Number(period.slice(0, 4))
      const [windows, targetRows] = await Promise.all([
        plan.available ? loadPortfolioYearWindows(pool, brandKeys, plan.windows) : new Map(),
        plan.available
          ? loadPortfolioTargetsRange(pool, brandKeys, `${targetYear}-01`, `${targetYear}-12`)
          : [],
      ])

      return res.json({
        ...base,
        yearOverYear: assembleYearComparison(plan, windows, {
          costVisible,
          annualTarget: annualTargetFrom(targetRows, targetYear),
        }),
        rules: BRAND_RULES,
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo consultar el comparativo de la cartera')
    }
  })

  return router
}
