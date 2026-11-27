// MD-001 "Mi día": the PM's brands for the data cutoff month.
//
// GET /api/my-day?period=YYYY-MM&view=
// GET /api/my-day/lost-customers?period=&inactivePeriods=&basePeriods=&brand=&limit=&offset=&view=
//
// MD-002 availability:
// GET /api/my-day/stock-alerts?brand=&limit=&view=
// GET /api/my-day/stock-alerts/:kind?brand=&limit=&offset=&view=  (out-of-stock | low-stock)
// GET /api/my-day/arrivals?brand=&limit=&offset=&view=&status=  (upcoming | overdue)
//
// The brands always come from the user's assignments in PostgreSQL
// (req.authUser.brandIds), never from the client; only the brand filter is
// accepted, and only inside those brands. view=all (scope 'all' only) shows
// every brand.

import { Router } from 'express'

import {
  normalizeBrandKey,
  normalizeBrandKeys,
  resolveCostScope,
} from '../middleware/requireBrandScope.js'

import {
  handleRouteError,
  httpError,
  pageInteger,
  periodId,
} from '../services/actionValidation.js'

import {
  loadBusinessCalendar,
} from '../services/businessCalendar.js'

import {
  MY_DAY_RULES,
  buildMyDayBrands,
  buildMyDayPortfolio,
  resolvePeriodWindow,
  withTemplateWorkingDays,
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

import {
  ARRIVAL_ROW_STATUSES,
  MY_DAY_AVAILABILITY_RULES,
  buildArrivals,
  buildStockAlerts,
  pageRows,
  resolveInventoryCoverage,
  resolveSalesWindow,
  selectArrivalRows,
  sourceFreshness,
} from '../services/myDayAvailabilityRules.js'

import {
  AVAILABILITY_SOURCES,
  groupLinesByItem,
  loadInventoryCoverage,
  loadInventoryItemRecords,
  loadInventoryItems,
  loadItemSales,
  loadLatestImports,
  loadPendingPurchaseOrderLines,
} from '../services/myDayAvailabilityService.js'

const VALID_SCOPES = new Set(['all', 'assigned'])
const VALID_VIEWS = new Set(['mine', 'all'])
const STOCK_ALERT_KINDS = new Set(['out-of-stock', 'low-stock'])

/**
 * MD-003-HOTFIX1: arrivals status filter. Not sent = every row (the MD-002
 * response); 'upcoming' or 'overdue'; anything else is 400.
 */
export function resolveArrivalStatus(value) {
  if (value === undefined) {
    return null
  }

  if (typeof value !== 'string' || !ARRIVAL_ROW_STATUSES.includes(value)) {
    throw httpError(400, 'Estatus de llegada inválido')
  }

  return value
}

/** view: 'mine' (default) or 'all'; anything else is 400. */
export function resolveMyDayView(value) {
  if (value === undefined) {
    return 'mine'
  }

  if (typeof value !== 'string' || !VALID_VIEWS.has(value)) {
    throw httpError(400, 'Vista inválida')
  }

  return value
}

/**
 * - assigned: the user has brand assignments (any scope); only those.
 * - all-brands: scope 'all' without assignments, or view=all; every brand
 *   (MD-001: every brand with sales or target in the period or the previous
 *   one).
 * - none: no assignments and no full scope.
 * Scopes without commercial access ('pricing', 'legacy') are rejected, as in
 * requireBrandScope. view=all without scope 'all' is 403.
 */
export function resolveMyDayBrandSource(authUser, requestedView) {
  if (!authUser) {
    throw httpError(401, 'Authentication required')
  }

  if (!VALID_SCOPES.has(authUser.scope)) {
    throw httpError(403, 'Brand access scope is invalid')
  }

  if (resolveMyDayView(requestedView) === 'all') {
    if (authUser.scope !== 'all') {
      throw httpError(403, 'Vista no permitida')
    }

    return { mode: 'all-brands', brandKeys: [] }
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

/**
 * Brands of the availability blocks: null = every brand (all-brands mode,
 * "- Unassigned -" included). The brand filter must be inside the user's
 * brands.
 */
export function resolveAvailabilityBrandKeys(source, requestedBrand) {
  if (requestedBrand === undefined) {
    return source.mode === 'all-brands' ? null : source.brandKeys
  }

  const requested = normalizeBrandKey(requestedBrand)

  if (
    !requested ||
    (source.mode !== 'all-brands' && !source.brandKeys.includes(requested))
  ) {
    throw httpError(403, 'Marca fuera del alcance del usuario')
  }

  return [requested]
}

function availabilitySources(imports, dataCutoff, now = new Date()) {
  const source = (datasetType, cutoff = null) => sourceFreshness(
    {
      lastImportedAt: imports.get(datasetType)?.uploadedAt ?? null,
      dataCutoff: cutoff,
    },
    now,
  )

  return {
    inventory: source(AVAILABILITY_SOURCES.inventory),
    purchases: source(AVAILABILITY_SOURCES.purchases),
    sales: source(AVAILABILITY_SOURCES.sales, dataCutoff),
  }
}

const EMPTY_PAGE = Object.freeze({ total: 0, hasMore: false, rows: [] })

/**
 * Shared part of both stock alert routes. Returns the response base and,
 * when there is data, the classified alerts.
 */
async function loadStockAlerts(pool, req) {
  const source = resolveMyDayBrandSource(req.authUser, req.query.view)
  const view = resolveMyDayView(req.query.view)
  const brandKeys = source.mode === 'none'
    ? []
    : resolveAvailabilityBrandKeys(source, req.query.brand)
  const [dataCutoff, imports] = await Promise.all([
    loadDataCutoff(pool),
    loadLatestImports(pool),
  ])
  const salesWindow = resolveSalesWindow(dataCutoff)
  const base = {
    ok: true,
    view,
    dataCutoff,
    brandSource: source.mode,
    salesWindow,
    rules: MY_DAY_AVAILABILITY_RULES,
    sources: availabilitySources(imports, dataCutoff),
    inventoryCoverage: null,
  }
  const inventoryImport = imports.get(AVAILABILITY_SOURCES.inventory)

  if (source.mode === 'none') {
    return { base, reason: 'no-brand-assignments' }
  }

  if (!inventoryImport) {
    return { base, reason: 'no-inventory-data' }
  }

  if (!dataCutoff) {
    return { base, reason: 'no-sales-data' }
  }

  // MD-002-HOTFIX1: item records when the import has them (every article,
  // with or without quantities); otherwise the positions, flagged.
  const { coverage, hasCatalogStatus } = resolveInventoryCoverage(
    await loadInventoryCoverage(pool, inventoryImport.importId),
  )

  base.inventoryCoverage = coverage

  if (!hasCatalogStatus) {
    return { base, reason: 'catalog-status-missing' }
  }

  const items = await (
    coverage.source === 'items'
      ? loadInventoryItemRecords
      : loadInventoryItems
  )(
    pool,
    inventoryImport.importId,
    brandKeys,
  )
  const itemKeys = items
    .filter((item) => item.catalogStatus === MY_DAY_AVAILABILITY_RULES.catalogStatus)
    .map((item) => item.itemKey)
  const [salesByItem, lines] = await Promise.all([
    loadItemSales(pool, itemKeys, salesWindow),
    // Stock alerts show no amounts: no cost is read.
    loadPendingPurchaseOrderLines(pool, { itemKeys }, { mode: 'none' }),
  ])

  return {
    base,
    alerts: buildStockAlerts({
      items,
      salesByItem,
      linesByItem: groupLinesByItem(lines),
      window: salesWindow,
      cutoff: dataCutoff,
    }),
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
      const source = resolveMyDayBrandSource(req.authUser, req.query.view)
      const [dataCutoff, calendar] = await Promise.all([
        loadDataCutoff(pool),
        loadBusinessCalendar(pool),
      ])
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

      // CAL-001: business days = Monday to Friday minus the calendar.
      const window = resolvePeriodWindow(period, dataCutoff, calendar)

      if (window.periodStatus === 'after-cutoff') {
        return res.json(emptyResponse({
          period,
          dataCutoff,
          periodStatus: window.periodStatus,
          workingDays: window.workingDays,
          calendarMissingYears: window.calendarMissingYears,
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
        // The quota template (working_days) is informative; the calendar rules.
        workingDays: withTemplateWorkingDays(
          window.workingDays,
          [...targets.values()].map((target) => target.workingDays),
        ),
        calendarMissingYears: window.calendarMissingYears,
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
      const source = resolveMyDayBrandSource(req.authUser, req.query.view)
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

  router.get('/stock-alerts', async (req, res) => {
    try {
      const limit = pageInteger(
        req.query.limit,
        MY_DAY_AVAILABILITY_RULES.summaryLimit,
        100,
        1,
      )
      const { base, reason, alerts } = await loadStockAlerts(pool, req)

      if (!alerts) {
        return res.json({
          ...base,
          limit,
          reason,
          outOfStock: EMPTY_PAGE,
          lowStock: EMPTY_PAGE,
          dataQuality: null,
        })
      }

      const complete = base.inventoryCoverage.complete

      return res.json({
        ...base,
        limit,
        outOfStock: { ...pageRows(alerts.outOfStock, limit), complete },
        lowStock: { ...pageRows(alerts.lowStock, limit), complete },
        dataQuality: alerts.dataQuality,
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo consultar la disponibilidad')
    }
  })

  router.get('/stock-alerts/:kind', async (req, res) => {
    try {
      const kind = req.params.kind

      if (!STOCK_ALERT_KINDS.has(kind)) {
        throw httpError(400, 'Tipo de alerta inválido')
      }

      const limit = pageInteger(req.query.limit, 50, 500, 1)
      const offset = pageInteger(req.query.offset, 0, 1000000)
      const { base, reason, alerts } = await loadStockAlerts(pool, req)

      if (!alerts) {
        return res.json({
          ...base,
          kind,
          limit,
          offset,
          reason,
          ...EMPTY_PAGE,
          dataQuality: null,
        })
      }

      return res.json({
        ...base,
        kind,
        limit,
        offset,
        ...pageRows(
          kind === 'out-of-stock' ? alerts.outOfStock : alerts.lowStock,
          limit,
          offset,
        ),
        complete: base.inventoryCoverage.complete,
        dataQuality: alerts.dataQuality,
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo consultar la disponibilidad')
    }
  })

  router.get('/arrivals', async (req, res) => {
    try {
      const source = resolveMyDayBrandSource(req.authUser, req.query.view)
      const view = resolveMyDayView(req.query.view)
      const limit = pageInteger(req.query.limit, 50, 500, 1)
      const offset = pageInteger(req.query.offset, 0, 1000000)
      const status = resolveArrivalStatus(req.query.status)
      const brandKeys = source.mode === 'none'
        ? []
        : resolveAvailabilityBrandKeys(source, req.query.brand)
      const [dataCutoff, imports] = await Promise.all([
        loadDataCutoff(pool),
        loadLatestImports(pool),
      ])
      const base = {
        ok: true,
        view,
        dataCutoff,
        brandSource: source.mode,
        rules: MY_DAY_AVAILABILITY_RULES,
        sources: availabilitySources(imports, dataCutoff),
        // MD-003-HOTFIX1: 'all' when no status was sent.
        status: status ?? 'all',
        limit,
        offset,
      }
      const empty = (reason) => res.json({
        ...base,
        reason,
        window: null,
        summary: null,
        ...EMPTY_PAGE,
      })

      if (source.mode === 'none') {
        return empty('no-brand-assignments')
      }

      if (!dataCutoff) {
        return empty('no-sales-data')
      }

      if (!imports.get(AVAILABILITY_SOURCES.purchases)) {
        return empty('no-purchase-data')
      }

      const lines = await loadPendingPurchaseOrderLines(
        pool,
        { brandKeys },
        resolveCostScope(req.authUser),
      )
      const arrivals = buildArrivals({ lines, cutoff: dataCutoff })

      return res.json({
        ...base,
        window: arrivals.window,
        // Counts of both statuses, whatever status was requested.
        summary: arrivals.summary,
        ...pageRows(selectArrivalRows(arrivals.rows, status), limit, offset),
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudieron consultar las llegadas')
    }
  })

  return router
}
