// MB-001 brand page, served by the server.
//
// GET /api/brands                       directory of the user's brands
// GET /api/brands/:brand                header: team, status, 4 indicators, open actions
// GET /api/brands/:brand/sales          month vs month, year vs year, series, documents
// GET /api/brands/:brand/sales/export   lines of the period for "Exportar detalle"
// GET /api/brands/:brand/customers      filter = activos | por-recuperar | suben | bajan
// GET /api/brands/:brand/products       filter = vendidos | por-recuperar | agotados
//
// The brand is identified by brand_key but the URL accepts the sales name,
// the normalized name or the key (UNV (UNIVIEW), unv (uniview), UNVUNIVIEW).
// Scope: effective brands of requireBrandScope (assistants included); a brand
// outside it is a 403. A known brand without sales in the period answers 200
// with zeros / missing values. Gross profit and margin reveal the cost: null
// plus costHidden when the user has no cost access to the brand.

import { Router } from 'express'

import {
  normalizeBrandKey,
  requireBrandScope,
  resolveCostScope,
  resolveRequestedBrandKey,
} from '../middleware/requireBrandScope.js'

import {
  handleRouteError,
  httpError,
  pageInteger,
} from '../services/actionValidation.js'

import {
  listActions,
} from '../services/actionService.js'

import {
  BRAND_RULES,
  assembleMonthComparison,
  assembleYearComparison,
  buildMonthlySeries,
  buildYearWindowPlan,
  costVisibleForBrand,
  periodOptions,
  resolveBrandPeriod,
} from '../services/brandRules.js'

import {
  annualTargetFrom,
  loadAllBrandKeys,
  loadBrandIdentity,
  loadBrandSalesDates,
  loadBrandTeam,
  loadCustomerRows,
  loadDocuments,
  loadExportLines,
  loadInventoryForItems,
  loadLostProducts,
  loadMonthlySeriesRows,
  loadProductRows,
  loadTargetsRange,
  loadYearWindows,
} from '../services/brandsService.js'

import {
  loadBusinessCalendar,
} from '../services/businessCalendar.js'

import {
  MY_DAY_RULES,
  buildMyDayBrands,
  resolvePeriodWindow,
  withTemplateWorkingDays,
} from '../services/myDayRules.js'

import {
  countLostCustomers,
  labelBrands,
  loadActiveBeforePrevious,
  loadBrandLabels,
  loadDataCutoff,
  loadLostCustomers,
  loadTargets,
  loadWindowMetrics,
  resolveLossWindow,
} from '../services/myDayService.js'

import {
  MY_DAY_AVAILABILITY_RULES,
  buildStockAlerts,
  pageRows,
  resolveInventoryCoverage,
  resolveSalesWindow,
  sourceFreshness,
} from '../services/myDayAvailabilityRules.js'

import {
  groupLinesByItem,
  loadInventoryCoverage,
  loadInventoryItemRecords,
  loadInventoryItems,
  loadItemSales,
  loadLatestImports,
  loadPendingPurchaseOrderLines,
} from '../services/myDayAvailabilityService.js'

import {
  monthEnd,
  shiftMonth,
} from '../services/metricPeriods.js'

import {
  resolveMyDayBrandSource,
  resolveMyDayView,
} from './myDay.js'

const LIFECYCLE_STATUSES = new Set(['active', 'new', 'recovered', 'lost', 'inactive'])
const TREND_STATUSES = new Set(['growing', 'stable', 'declining', 'without_comparison'])
const SALES_SECTIONS = ['comparison', 'yoy', 'series', 'documents']
const OPEN_ACTION_STATUSES = ['open', 'in_progress', 'blocked']
const HEADER_ACTIONS = 5

// -- Request helpers ---------------------------------------------------------

/** Brand of the URL as brand_key; 400 when invalid, 403 outside the scope. */
export function resolveBrandParam(req) {
  if (normalizeBrandKey(req.params.brand) === null) {
    throw httpError(400, 'Marca inválida')
  }

  const brandKey = resolveRequestedBrandKey(req, req.params.brand)

  if (!brandKey) {
    throw httpError(403, 'Marca fuera del alcance del usuario')
  }

  return brandKey
}

function pagingOf(query, fallback = BRAND_RULES.pageLimit.default) {
  return {
    limit: pageInteger(query.limit, fallback, BRAND_RULES.pageLimit.max, 1),
    offset: pageInteger(query.offset, 0, 1000000),
  }
}

function oneOf(value, allowed, name, fallback) {
  if (value === undefined) {
    return fallback
  }

  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw httpError(400, `${name} inválido`)
  }

  return value
}

/** Brand, data cutoff, selected period, cost visibility and MD-001 window. */
async function loadContext(pool, req) {
  const brandKey = resolveBrandParam(req)
  const [dataCutoff, identity, calendar] = await Promise.all([
    loadDataCutoff(pool),
    loadBrandIdentity(pool, brandKey),
    loadBusinessCalendar(pool),
  ])

  if (!identity.known) {
    throw httpError(404, 'Marca no encontrada')
  }

  const period = resolveBrandPeriod(req.query.period, dataCutoff)

  return {
    brandKey,
    brandLabel: identity.label,
    identity,
    dataCutoff,
    period,
    periods: periodOptions(dataCutoff),
    costVisible: costVisibleForBrand(resolveCostScope(req.authUser), brandKey),
    // CAL-001: business days = Monday to Friday minus the calendar.
    calendar,
    window: period ? resolvePeriodWindow(period, dataCutoff, calendar) : null,
  }
}

const baseOf = (context) => ({
  ok: true,
  brandKey: context.brandKey,
  brandLabel: context.brandLabel,
  period: context.period,
  periods: context.periods,
  dataCutoff: context.dataCutoff,
  costHidden: !context.costVisible,
})

/** Gross profit fields of a row, hidden as null without cost access. */
function withoutCost(row, fields, costVisible) {
  if (costVisible) {
    return row
  }

  const hidden = { ...row }

  for (const field of fields) {
    hidden[field] = null
  }

  return hidden
}

const BRAND_COST_FIELDS = [
  'grossProfit',
  'grossMargin',
  'previousGrossProfit',
  'previousGrossMargin',
  'marginVariation',
]

/** One MD-001 brand row for each brand, without the portfolio-only share. */
function buildBrandRows({ window, brands, metrics, targets, activeBeforePrevious, lostCustomers }) {
  return buildMyDayBrands({
    window,
    brands,
    current: metrics.current,
    previous: metrics.previous,
    targets,
    activeBeforePrevious,
    lostCustomers,
  }).map(({ participation: _participation, ...row }) => row)
}

const hasSalesIn = (metrics) => Boolean(metrics) && (metrics.documents > 0 || metrics.revenue !== 0)

// -- Router -------------------------------------------------------------------

export function createBrandsRouter(pool) {
  const router = Router()

  router.use(requireBrandScope)
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Directory ------------------------------------------------------------------
  router.get('/', async (req, res) => {
    try {
      const view = resolveMyDayView(req.query.view)
      const source = resolveMyDayBrandSource(req.authUser, view)
      const status = oneOf(req.query.status, [...LIFECYCLE_STATUSES], 'status')
      const trend = oneOf(req.query.trend, [...TREND_STATUSES], 'trend')
      const attention = oneOf(req.query.attention, ['true', 'false'], 'attention')
      const sales = oneOf(req.query.sales, ['with', 'without'], 'sales')
      const sort = oneOf(req.query.sort, ['revenue', 'name', 'variation'], 'sort', 'revenue')
      const text = typeof req.query.q === 'string' ? req.query.q.trim() : ''
      const { limit, offset } = pagingOf(req.query)
      const [dataCutoff, calendar] = await Promise.all([
        loadDataCutoff(pool),
        loadBusinessCalendar(pool),
      ])
      const period = resolveBrandPeriod(req.query.period, dataCutoff)
      const base = {
        ok: true,
        view,
        brandSource: source.mode,
        period,
        periods: periodOptions(dataCutoff),
        dataCutoff,
        limit,
        offset,
        rules: { ...BRAND_RULES, status: MY_DAY_RULES },
      }
      const empty = (reason) => res.json({
        ...base,
        reason,
        summary: null,
        total: 0,
        hasMore: false,
        rows: [],
      })

      if (source.mode === 'none') {
        return empty('no-brand-assignments')
      }

      if (!period) {
        return empty('no-sales-data')
      }

      const window = resolvePeriodWindow(period, dataCutoff, calendar)
      const brandKeys = source.mode === 'all-brands'
        ? await loadAllBrandKeys(pool)
        : source.brandKeys
      const lossWindow = resolveLossWindow(
        period,
        dataCutoff,
        MY_DAY_RULES.lostCustomers.inactivePeriods,
        MY_DAY_RULES.lostCustomers.basePeriods,
      )
      const [labels, metrics, targets, activeBeforePrevious, lostCustomers, salesDates] =
        await Promise.all([
          loadBrandLabels(pool, brandKeys),
          loadWindowMetrics(pool, brandKeys, window.comparison),
          loadTargets(pool, brandKeys, period),
          loadActiveBeforePrevious(pool, brandKeys, window.previousPeriod),
          lossWindow ? countLostCustomers(pool, brandKeys, lossWindow) : new Map(),
          loadBrandSalesDates(pool, brandKeys),
        ])
      const costScope = resolveCostScope(req.authUser)
      const all = buildBrandRows({
        window,
        brands: labelBrands(brandKeys, labels, req.authUser.brandIds),
        metrics,
        targets,
        activeBeforePrevious,
        lostCustomers,
      }).map((row) => ({
        ...withoutCost(row, BRAND_COST_FIELDS, costVisibleForBrand(costScope, row.brandKey)),
        hasSalesInPeriod: hasSalesIn(metrics.current.get(row.brandKey)),
        lastSaleDate: salesDates.get(row.brandKey)?.lastSaleDate ?? null,
        firstSaleDate: salesDates.get(row.brandKey)?.firstSaleDate ?? null,
      }))
      const normalized = (value) => value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLocaleLowerCase('es-MX')
      const needle = normalized(text)
      const filtered = all.filter((row) =>
        (!needle || normalized(`${row.brandLabel} ${row.brandKey}`).includes(needle)) &&
        (!status || row.lifecycleStatus === status) &&
        (!trend || row.trendStatus === trend) &&
        (!attention || row.requiresAttention === (attention === 'true')) &&
        (!sales || row.hasSalesInPeriod === (sales === 'with')),
      )

      if (sort === 'name') {
        filtered.sort((left, right) => left.brandLabel.localeCompare(right.brandLabel, 'es-MX'))
      } else if (sort === 'variation') {
        filtered.sort((left, right) =>
          (right.revenueVariationPercentage ?? -Infinity) - (left.revenueVariationPercentage ?? -Infinity) ||
          left.brandLabel.localeCompare(right.brandLabel, 'es-MX'),
        )
      }

      const byLifecycle = {}

      for (const row of all) {
        byLifecycle[row.lifecycleStatus] = (byLifecycle[row.lifecycleStatus] ?? 0) + 1
      }

      return res.json({
        ...base,
        periodStatus: window.periodStatus,
        // CAL-001: the quota template is informative; the calendar rules.
        workingDays: withTemplateWorkingDays(
          window.workingDays,
          [...targets.values()].map((target) => target.workingDays),
        ),
        calendarMissingYears: window.calendarMissingYears,
        comparison: window.comparison,
        summary: {
          brands: all.length,
          withSales: all.filter((row) => row.hasSalesInPeriod).length,
          withoutSales: all.filter((row) => !row.hasSalesInPeriod).length,
          requiringAttention: all.filter((row) => row.requiresAttention).length,
          byLifecycle,
        },
        ...pageRows(filtered, limit, offset),
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo consultar el directorio de marcas')
    }
  })

  // Header ---------------------------------------------------------------------
  router.get('/:brand', async (req, res) => {
    try {
      const context = await loadContext(pool, req)
      const base = baseOf(context)

      if (!context.period) {
        return res.json({ ...base, reason: 'no-sales-data', brand: null })
      }

      const { brandKey, window } = context
      const lossWindow = resolveLossWindow(
        context.period,
        context.dataCutoff,
        MY_DAY_RULES.lostCustomers.inactivePeriods,
        MY_DAY_RULES.lostCustomers.basePeriods,
      )
      const [metrics, targets, activeBeforePrevious, lostCustomers, team, actions] =
        await Promise.all([
          loadWindowMetrics(pool, [brandKey], window.comparison),
          loadTargets(pool, [brandKey], context.period),
          loadActiveBeforePrevious(pool, [brandKey], window.previousPeriod),
          lossWindow ? countLostCustomers(pool, [brandKey], lossWindow) : new Map(),
          loadBrandTeam(pool, brandKey),
          listActions(
            pool,
            req.brandScope,
            { brandKey, statuses: OPEN_ACTION_STATUSES },
            { limit: HEADER_ACTIONS },
          ),
        ])
      const [row] = buildBrandRows({
        window,
        brands: [{ brandKey, brandLabel: context.brandLabel }],
        metrics,
        targets,
        activeBeforePrevious,
        lostCustomers,
      })
      const current = metrics.current.get(brandKey)

      return res.json({
        ...base,
        periodStatus: window.periodStatus,
        workingDays: withTemplateWorkingDays(
          window.workingDays,
          [...targets.values()].map((target) => target.workingDays),
        ),
        calendarMissingYears: window.calendarMissingYears,
        comparison: window.comparison,
        hasSalesInPeriod: hasSalesIn(current),
        firstSaleDate: context.identity.firstSaleDate,
        lastSaleDate: context.identity.lastSaleDate,
        brand: withoutCost(row, BRAND_COST_FIELDS, context.costVisible),
        team,
        actions: {
          total: Number(actions.summary?.total ?? 0),
          overdue: Number(actions.summary?.overdue ?? 0),
          immediateOpen: Number(actions.summary?.immediate_open ?? 0),
          rows: actions.rows.map((action) => ({
            id: action.id,
            title: action.title,
            priority: action.priority,
            status: action.status,
            horizon: action.horizon,
            dueDate: action.due_date,
            ownerName: action.owner_name ?? null,
            daysOverdue: Number(action.days_overdue ?? 0),
          })),
        },
        rules: { ...BRAND_RULES, status: MY_DAY_RULES },
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo consultar la marca')
    }
  })

  // Sales ----------------------------------------------------------------------
  router.get('/:brand/sales', async (req, res) => {
    try {
      const context = await loadContext(pool, req)
      const requested = typeof req.query.sections === 'string'
        ? req.query.sections.split(',').map((item) => item.trim()).filter(Boolean)
        : SALES_SECTIONS

      if (requested.length === 0 || requested.some((item) => !SALES_SECTIONS.includes(item))) {
        throw httpError(400, 'Secciones inválidas')
      }

      const { limit, offset } = pagingOf(req.query)
      const base = { ...baseOf(context), sections: requested, limit, offset }

      if (!context.period) {
        return res.json({ ...base, reason: 'no-sales-data' })
      }

      const { brandKey, period, dataCutoff, costVisible, window, calendar } = context
      const wants = (section) => requested.includes(section)
      const plan = wants('yoy') ? buildYearWindowPlan(period, dataCutoff, calendar) : null
      const seriesFrom = shiftMonth(period, -(BRAND_RULES.seriesMonths - 1))
      const targetYear = Number(period.slice(0, 4))
      const targetsFrom = [seriesFrom, `${targetYear}-01`].sort()[0]
      const targetsTo = [period, `${targetYear}-12`].sort().at(-1)
      const [month, windows, seriesRows, targetRows, documents] = await Promise.all([
        wants('comparison') && window.comparison
          ? loadWindowMetrics(pool, [brandKey], window.comparison)
          : null,
        plan?.available ? loadYearWindows(pool, brandKey, plan.windows) : new Map(),
        wants('series') ? loadMonthlySeriesRows(pool, brandKey, seriesFrom, period) : [],
        wants('series') || wants('yoy')
          ? loadTargetsRange(pool, brandKey, targetsFrom, targetsTo)
          : [],
        wants('documents')
          ? loadDocuments(pool, brandKey, `${period}-01`, monthEnd(period), { limit, offset })
          : null,
      ])
      const body = { ...base }

      if (wants('comparison')) {
        body.monthOverMonth = assembleMonthComparison(
          window,
          month?.current.get(brandKey),
          month?.previous.get(brandKey),
          costVisible,
          calendar,
        )
      }

      if (wants('yoy')) {
        body.yearOverYear = assembleYearComparison(plan, windows, {
          costVisible,
          annualTarget: annualTargetFrom(targetRows, targetYear),
        })
      }

      if (wants('series')) {
        body.series = buildMonthlySeries({
          endPeriod: period,
          metricRows: seriesRows,
          targetRows,
          cutoff: dataCutoff,
          costVisible,
        })
      }

      if (documents) {
        body.documents = {
          total: documents.total,
          lines: documents.lines,
          revenue: documents.revenue,
          grossProfit: costVisible ? documents.grossProfit : null,
          hasMore: documents.hasMore,
          rows: documents.rows.map((row) => withoutCost(row, ['grossProfit'], costVisible)),
        }
      }

      return res.json({ ...body, rules: BRAND_RULES })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudieron consultar las ventas de la marca')
    }
  })

  router.get('/:brand/sales/export', async (req, res) => {
    try {
      const context = await loadContext(pool, req)
      const base = baseOf(context)

      if (!context.period) {
        return res.json({ ...base, reason: 'no-sales-data', columns: [], rows: [] })
      }

      const { brandKey, period, costVisible } = context
      const from = `${period}-01`
      const to = monthEnd(period)
      const result = await loadExportLines(pool, brandKey, from, to, BRAND_RULES.exportMaxRows)
      const columns = exportColumns(costVisible)

      return res.json({
        ...base,
        dateFrom: from,
        dateTo: to,
        maxRows: BRAND_RULES.exportMaxRows,
        truncated: result.truncated,
        total: result.rows.length,
        columns,
        rows: result.rows.map((row) => exportRow(row, costVisible)),
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudo preparar la exportación')
    }
  })

  // Customers --------------------------------------------------------------------
  router.get('/:brand/customers', async (req, res) => {
    try {
      const context = await loadContext(pool, req)
      const filter = oneOf(req.query.filter, BRAND_RULES.customerFilters, 'filter', 'activos')
      const { limit, offset } = pagingOf(req.query)
      const base = { ...baseOf(context), filter, limit, offset }

      if (!context.period) {
        return res.json({ ...base, reason: 'no-sales-data', counts: null, hasMore: false, rows: [] })
      }

      const { brandKey, window, costVisible } = context
      const lossWindow = resolveLossWindow(
        context.period,
        context.dataCutoff,
        MY_DAY_RULES.lostCustomers.inactivePeriods,
        MY_DAY_RULES.lostCustomers.basePeriods,
      )
      const lostCount = lossWindow
        ? (await countLostCustomers(pool, [brandKey], lossWindow)).get(brandKey) ?? 0
        : 0

      if (filter === 'por-recuperar') {
        const lost = lossWindow
          ? await loadLostCustomers(pool, [brandKey], lossWindow, { limit, offset })
          : { hasMore: false, rows: [] }
        const counts = window.comparison
          ? (await loadCustomerRows(pool, brandKey, window.comparison, 'activos', { limit: 1, offset: 0 })).counts
          : null

        return res.json({
          ...base,
          counts: counts ? { ...counts, 'por-recuperar': lostCount } : { 'por-recuperar': lostCount },
          lossWindow,
          hasMore: lost.hasMore,
          rows: lost.rows.map((row) => withoutCost(
            {
              customerId: row.customerId,
              customerName: row.customerName ?? null,
              baseRevenue: row.baseRevenue,
              baseGrossProfit: row.baseGrossProfit,
              activeMonths: row.activeMonths,
              lastSaleDate: row.lastSaleDate,
              avgMonthlyRevenue: row.avgMonthlyRevenue,
            },
            ['baseGrossProfit'],
            costVisible,
          )),
        })
      }

      if (!window.comparison) {
        return res.json({ ...base, counts: null, hasMore: false, rows: [], reason: 'no-comparison-window' })
      }

      const result = await loadCustomerRows(pool, brandKey, window.comparison, filter, { limit, offset })

      return res.json({
        ...base,
        comparison: window.comparison,
        counts: { ...result.counts, 'por-recuperar': lostCount },
        hasMore: result.hasMore,
        rows: result.rows.map((row) => withoutCost(
          {
            ...row,
            variation: row.revenue - row.previousRevenue,
            variationPercentage: variationOf(row.revenue, row.previousRevenue),
          },
          ['grossProfit', 'previousGrossProfit'],
          costVisible,
        )),
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudieron consultar los clientes de la marca')
    }
  })

  // Products ---------------------------------------------------------------------
  router.get('/:brand/products', async (req, res) => {
    try {
      const context = await loadContext(pool, req)
      const filter = oneOf(req.query.filter, BRAND_RULES.productFilters, 'filter', 'vendidos')
      const { limit, offset } = pagingOf(req.query)
      const base = { ...baseOf(context), filter, limit, offset }

      if (!context.period) {
        return res.json({ ...base, reason: 'no-sales-data', total: 0, hasMore: false, rows: [] })
      }

      const { brandKey, window, costVisible, dataCutoff } = context
      const imports = await loadLatestImports(pool)
      const inventoryImport = imports.get('inventory') ?? null
      const sources = {
        inventory: sourceFreshness({ lastImportedAt: inventoryImport?.uploadedAt ?? null }),
      }

      if (filter === 'agotados') {
        return res.json({
          ...base,
          sources,
          ...(await loadOutOfStock(pool, brandKey, inventoryImport, dataCutoff, { limit, offset })),
        })
      }

      let page
      let total

      if (filter === 'vendidos') {
        if (!window.comparison) {
          return res.json({ ...base, sources, reason: 'no-comparison-window', total: 0, hasMore: false, rows: [] })
        }

        page = await loadProductRows(pool, brandKey, window.comparison, { limit, offset })
        total = page.soldTotal
      } else {
        const lossWindow = resolveLossWindow(
          context.period,
          dataCutoff,
          MY_DAY_RULES.lostCustomers.inactivePeriods,
          MY_DAY_RULES.lostCustomers.basePeriods,
        )

        page = lossWindow
          ? await loadLostProducts(pool, brandKey, lossWindow, { limit, offset })
          : { total: 0, hasMore: false, rows: [] }
        total = page.total
      }

      // Stock and catalog status come from the latest inventory import.
      const coverage = inventoryImport
        ? resolveInventoryCoverage(await loadInventoryCoverage(pool, inventoryImport.importId))
        : null
      const stock = inventoryImport && coverage?.coverage.source === 'items'
        ? await loadInventoryForItems(pool, inventoryImport.importId, page.rows.map((row) => row.itemKey))
        : null

      return res.json({
        ...base,
        sources,
        comparison: filter === 'vendidos' ? window.comparison : undefined,
        inventoryCoverage: coverage?.coverage ?? null,
        reason: inventoryImport ? undefined : 'no-inventory-data',
        total,
        hasMore: page.hasMore,
        rows: page.rows.map((row) => {
          const item = stock?.get(row.itemKey) ?? null

          return withoutCost(
            {
              ...row,
              variation: filter === 'vendidos' ? row.revenue - row.previousRevenue : undefined,
              variationPercentage: filter === 'vendidos' ? variationOf(row.revenue, row.previousRevenue) : undefined,
              // Missing inventory data stays missing (null), never 0.
              onHand: item?.onHand ?? null,
              pendingReceiptUnits: item?.pendingReceiptUnits ?? null,
              catalogStatus: item?.catalogStatus ?? null,
              lastSaleDate: item?.lastSaleDate ?? null,
            },
            ['grossProfit', 'previousGrossProfit', 'baseGrossProfit'],
            costVisible,
          )
        }),
      })
    } catch (error) {
      return handleRouteError(res, error, 'No se pudieron consultar los productos de la marca')
    }
  })

  return router
}

// -- Pieces ---------------------------------------------------------------------

function variationOf(current, previous) {
  if (previous === 0) {
    return current === 0 ? 0 : null
  }

  return (current - previous) / previous
}

export function exportColumns(costVisible) {
  const columns = [
    { key: 'saleDate', label: 'Fecha' },
    { key: 'documentNumber', label: 'Documento' },
    { key: 'customerId', label: 'ID cliente' },
    { key: 'customerName', label: 'Cliente' },
    { key: 'salesRep', label: 'Vendedor' },
    { key: 'location', label: 'Ubicación' },
    { key: 'productCode', label: 'Código de producto' },
    { key: 'model', label: 'Modelo' },
    { key: 'quantity', label: 'Unidades' },
    { key: 'revenue', label: 'Venta' },
  ]

  return costVisible
    ? [
      ...columns,
      { key: 'grossProfit', label: 'Utilidad bruta' },
      { key: 'grossMargin', label: 'Margen' },
    ]
    : columns
}

/** Without cost access the gross profit and margin columns are not even sent. */
export function exportRow(row, costVisible) {
  const { grossProfit, ...visible } = row

  return costVisible
    ? {
      ...visible,
      grossProfit,
      grossMargin: row.revenue !== 0 ? grossProfit / row.revenue : null,
    }
    : visible
}

/** DE LINEA items of the brand with zero stock (MD-002 rules), paged. */
async function loadOutOfStock(pool, brandKey, inventoryImport, dataCutoff, { limit, offset }) {
  if (!inventoryImport) {
    return { reason: 'no-inventory-data', inventoryCoverage: null, total: 0, hasMore: false, rows: [] }
  }

  const { coverage, hasCatalogStatus } = resolveInventoryCoverage(
    await loadInventoryCoverage(pool, inventoryImport.importId),
  )

  if (!hasCatalogStatus) {
    return { reason: 'catalog-status-missing', inventoryCoverage: coverage, total: 0, hasMore: false, rows: [] }
  }

  const items = await (coverage.source === 'items' ? loadInventoryItemRecords : loadInventoryItems)(
    pool,
    inventoryImport.importId,
    [brandKey],
  )
  const salesWindow = resolveSalesWindow(dataCutoff)
  const itemKeys = items
    .filter((item) => item.catalogStatus === MY_DAY_AVAILABILITY_RULES.catalogStatus)
    .map((item) => item.itemKey)
  const [salesByItem, lines] = await Promise.all([
    loadItemSales(pool, itemKeys, salesWindow),
    loadPendingPurchaseOrderLines(pool, { itemKeys }, { mode: 'none' }),
  ])
  const alerts = buildStockAlerts({
    items,
    salesByItem,
    linesByItem: groupLinesByItem(lines),
    window: salesWindow,
    cutoff: dataCutoff,
  })

  return {
    inventoryCoverage: coverage,
    salesWindow,
    ...pageRows(alerts.outOfStock, limit, offset),
  }
}
