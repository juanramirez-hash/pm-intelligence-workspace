// MD-002 "Mi día": availability rules (out of stock, low stock, purchase
// order arrivals). Pure functions; the SQL lives in
// myDayAvailabilityService.js. Every threshold and status list is here and is
// returned in the response as `rules`.

const freezeDeep = (value) => {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') {
      freezeDeep(child)
    }
  }

  return Object.freeze(value)
}

export const MY_DAY_AVAILABILITY_RULES = freezeDeep({
  // Item status, brand, stock and pending receipt come from the latest
  // completed inventory import (not from the Product Master).
  catalogStatus: 'DE LINEA',
  salesWindowMonths: 3,
  lowStockCoverageDays: 30,
  arrivalWindowDays: 14,
  purchaseOrders: {
    pendingStatuses: ['Pending Receipt', 'Pending Bill'],
    arrivedStatuses: ['Fully Billed'],
    lineType: 'product',
  },
  freshness: {
    staleAfterDays: 7,
    timeZone: 'America/Mexico_City',
  },
  summaryLimit: 20,
  notes: {
    itemKey:
      'Código de artículo de NetSuite ("Item" del inventario, "ITEM" de las PO, "Name" de ventas) en mayúsculas, sin espacios al inicio o al final y con espacios colapsados.',
    pendingReceiptUnits:
      'Suma de "Cantidad Actual en Orden" (on_order) de todas las sucursales del último inventario; NetSuite ya descuenta lo recibido. No usa la cantidad de las PO ni "Cantidad Actual en Tránsito" (traspasos entre sucursales).',
    salesWindow:
      'Días calendario: de la fecha de corte de ventas hacia atrás 3 meses. Venta diaria = unidades netas / días de la ventana; venta mensual = unidades netas / 3. Venta neta <= 0 cuenta como sin venta.',
    lastSaleDate:
      '"Fecha de ultima venta" del último inventario; vacía si NetSuite no la trae.',
    arrivals:
      'PO pendientes (Pending Receipt o Pending Bill, con cualquier estatus de embarque), solo líneas de producto. Montos por moneda, sin conversión.',
    arrivalStatus:
      'scheduled: PO pendiente con fecha estimada >= corte; overdue: solo PO con fecha estimada < corte; no-date: PO pendiente sin fecha estimada; no-po-data: en orden > 0 sin PO pendiente cargada; no-po: en orden = 0 (aunque haya PO pendiente, que se cuenta en dataQuality.purchaseOrdersWithoutOnOrder).',
    inventoryCoverage:
      'complete: true cuando el último inventario tiene un registro por artículo (inventory_items), incluidos los artículos sin ninguna cantidad, que NetSuite exporta con celdas vacías. Una carga anterior a MD-002-HOTFIX1 solo tiene posiciones: complete: false, y faltan los artículos sin ninguna cantidad (agotados sin PO); hay que recargar el inventario.',
  },
})

/**
 * Source of the items of the availability blocks (MD-002-HOTFIX1): the item
 * records when the import has them; otherwise the positions, flagged as
 * incomplete.
 */
export function resolveInventoryCoverage(summary) {
  if (summary.itemRecords > 0) {
    return {
      coverage: {
        complete: true,
        source: 'items',
        articles: summary.itemRecords,
        articlesWithPositions: summary.itemRecordsWithPositions,
        reason: null,
      },
      hasCatalogStatus: summary.itemRecordsWithStatus > 0,
    }
  }

  return {
    coverage: {
      complete: false,
      source: 'positions',
      articles: null,
      articlesWithPositions: summary.positionArticles,
      reason: 'inventory-loaded-before-item-records',
    },
    hasCatalogStatus: summary.positionsHaveStatus,
  }
}

const NO_CURRENCY = 'SIN_MONEDA'
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

function dayNumber(dateKey) {
  const match = DATE_ONLY.exec(dateKey ?? '')

  return match
    ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86_400_000
    : null
}

function dateKeyFromDayNumber(value) {
  return new Date(value * 86_400_000).toISOString().slice(0, 10)
}

export function addDays(dateKey, days) {
  const day = dayNumber(dateKey)

  return day === null ? null : dateKeyFromDayNumber(day + days)
}

/** Calendar days between two YYYY-MM-DD dates (same as DC-001). */
export function calendarDaysBetween(fromDateKey, toDateKey) {
  const from = dayNumber(fromDateKey)
  const to = dayNumber(toDateKey)

  return from === null || to === null ? null : Math.round(to - from)
}

/** YYYY-MM-DD of an instant in a time zone. */
export function localDateKey(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const part = (type) => parts.find((item) => item.type === type)?.value

  return `${part('year')}-${part('month')}-${part('day')}`
}

/**
 * Sales window: from the cutoff back N calendar months (end of month
 * clamped), both ends included. 2026-11-24 → 2026-08-25..2026-11-24, 92 days.
 */
export function resolveSalesWindow(
  cutoff,
  months = MY_DAY_AVAILABILITY_RULES.salesWindowMonths,
) {
  const match = DATE_ONLY.exec(cutoff ?? '')

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1 - months
  const day = Number(match[3])
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const start = new Date(Date.UTC(year, month, Math.min(day, lastDay)))
  const from = addDays(start.toISOString().slice(0, 10), 1)

  return {
    from,
    to: cutoff,
    days: calendarDaysBetween(from, cutoff) + 1,
    months,
  }
}

/**
 * Freshness of one source, like the DC-001 panel: the data cutoff when there
 * is one, otherwise the local date of the last completed import; stale after
 * staleAfterDays calendar days.
 */
export function sourceFreshness(
  { lastImportedAt, dataCutoff = null },
  now = new Date(),
  rules = MY_DAY_AVAILABILITY_RULES,
) {
  const { staleAfterDays, timeZone } = rules.freshness
  const imported = lastImportedAt ? new Date(lastImportedAt) : null
  const importedAt =
    imported && !Number.isNaN(imported.getTime()) ? imported.toISOString() : null
  const cutoff = dataCutoff && DATE_ONLY.test(dataCutoff) ? dataCutoff : null
  const referenceDate =
    cutoff ?? (importedAt ? localDateKey(importedAt, timeZone) : null)
  const today = localDateKey(now, timeZone)
  const daysSince = referenceDate && today
    ? calendarDaysBetween(referenceDate, today)
    : null

  return {
    lastImportedAt: importedAt,
    dataCutoff: cutoff,
    referenceDate,
    daysSince,
    status: daysSince === null
      ? 'no-data'
      : daysSince <= staleAfterDays ? 'up-to-date' : 'stale',
    stale: daysSince === null ? null : daysSince > staleAfterDays,
  }
}

const round = (value, decimals) => {
  const factor = 10 ** decimals

  return Math.round(value * factor) / factor
}

/** Sales metrics of one item over the window; net units <= 0 is no sale. */
export function itemSales(netUnits, window) {
  const units = Number.isFinite(netUnits) ? netUnits : 0
  const hasSales = units > 0 && Boolean(window?.days)

  return {
    netUnits: units,
    hasSales,
    avgMonthlyUnits: hasSales ? round(units / window.months, 2) : 0,
    avgDailyUnits: hasSales ? units / window.days : 0,
  }
}

/**
 * Next arrival of one item from its pending purchase order lines (any date).
 * on_order (NetSuite) decides whether something is still to be received.
 */
export function resolveArrival(pendingReceiptUnits, lines, cutoff) {
  const pending = Array.isArray(lines) ? lines : []

  if (!(pendingReceiptUnits > 0)) {
    return {
      arrivalStatus: 'no-po',
      nextArrival: null,
      purchaseOrderWithoutOnOrder: pending.length > 0,
    }
  }

  if (pending.length === 0) {
    return {
      arrivalStatus: 'no-po-data',
      nextArrival: null,
      purchaseOrderWithoutOnOrder: false,
    }
  }

  const byDate = (left, right) =>
    left.expectedReceiptDate.localeCompare(right.expectedReceiptDate) ||
    String(left.purchaseOrderNumber).localeCompare(String(right.purchaseOrderNumber))
  const dated = pending.filter((line) => line.expectedReceiptDate)
  const upcoming = dated.filter((line) => line.expectedReceiptDate >= cutoff).sort(byDate)
  const overdue = dated.filter((line) => line.expectedReceiptDate < cutoff).sort(byDate)

  let arrivalStatus
  let line

  if (upcoming.length > 0) {
    arrivalStatus = 'scheduled'
    line = upcoming[0]
  } else if (overdue.length > 0) {
    // The most delayed one.
    arrivalStatus = 'overdue'
    line = overdue[0]
  } else {
    arrivalStatus = 'no-date'
    line = [...pending].sort((left, right) =>
      String(left.purchaseOrderNumber).localeCompare(String(right.purchaseOrderNumber)),
    )[0]
  }

  return {
    arrivalStatus,
    nextArrival: {
      date: line.expectedReceiptDate ?? null,
      purchaseOrderNumber: line.purchaseOrderNumber,
      supplierName: line.supplierName ?? null,
      status: line.status ?? null,
      shipmentStatus: line.shipmentStatus ?? null,
      overdue: Boolean(line.expectedReceiptDate && line.expectedReceiptDate < cutoff),
      hasOverduePurchaseOrders: overdue.length > 0,
    },
    purchaseOrderWithoutOnOrder: false,
  }
}

function compareText(left, right) {
  return String(left ?? '').localeCompare(String(right ?? ''))
}

/**
 * Out of stock: average monthly sales desc; without sales, last sale date
 * desc; never sold (no date) last; then the item code.
 */
export function compareOutOfStock(left, right) {
  if (left.avgMonthlyUnits !== right.avgMonthlyUnits) {
    return right.avgMonthlyUnits - left.avgMonthlyUnits
  }

  if (left.lastSaleDate !== right.lastSaleDate) {
    if (!left.lastSaleDate) return 1
    if (!right.lastSaleDate) return -1

    return right.lastSaleDate.localeCompare(left.lastSaleDate)
  }

  return compareText(left.itemCode, right.itemCode)
}

/** Low stock: coverage asc, then daily sales desc, then the item code. */
export function compareLowStock(left, right) {
  return left.coverageDays - right.coverageDays ||
    right.avgDailyUnits - left.avgDailyUnits ||
    compareText(left.itemCode, right.itemCode)
}

/**
 * Classifies the items of the latest inventory.
 *
 * items: [{ itemKey, itemCode, brand, brandKey, catalogStatus, onHand,
 *   pendingReceiptUnits, lastSaleDate }]
 * salesByItem: Map(itemKey → net units in the window)
 * linesByItem: Map(itemKey → pending purchase order lines)
 */
export function buildStockAlerts({
  items,
  salesByItem,
  linesByItem,
  window,
  cutoff,
  rules = MY_DAY_AVAILABILITY_RULES,
}) {
  const outOfStock = []
  const lowStock = []
  const dataQuality = {
    items: items.length,
    itemsWithoutCatalogStatus: 0,
    itemsWithoutBrand: 0,
    onOrderWithoutPurchaseOrder: 0,
    purchaseOrdersWithoutOnOrder: 0,
  }

  for (const item of items) {
    if (!item.catalogStatus) {
      dataQuality.itemsWithoutCatalogStatus += 1
    }

    if (!item.brandKey) {
      dataQuality.itemsWithoutBrand += 1
    }

    if (item.catalogStatus !== rules.catalogStatus) {
      continue
    }

    const sales = itemSales(salesByItem.get(item.itemKey) ?? 0, window)
    let kind = null
    let coverageDays = null

    if (item.onHand <= 0) {
      kind = 'out-of-stock'
    } else if (sales.hasSales) {
      coverageDays = item.onHand / sales.avgDailyUnits

      if (coverageDays <= rules.lowStockCoverageDays) {
        kind = 'low-stock'
      }
    }

    if (!kind) {
      continue
    }

    const arrival = resolveArrival(
      item.pendingReceiptUnits,
      linesByItem.get(item.itemKey),
      cutoff,
    )

    if (arrival.arrivalStatus === 'no-po-data') {
      dataQuality.onOrderWithoutPurchaseOrder += 1
    }

    if (arrival.purchaseOrderWithoutOnOrder) {
      dataQuality.purchaseOrdersWithoutOnOrder += 1
    }

    const row = {
      itemKey: item.itemKey,
      itemCode: item.itemCode,
      brandKey: item.brandKey,
      brandLabel: item.brand ?? item.brandKey,
      catalogStatus: item.catalogStatus,
      onHand: item.onHand,
      pendingReceiptUnits: item.pendingReceiptUnits,
      // Branch positions of the article; 0 = no quantity in any branch.
      // null when read from positions (MD-002 loads).
      positions: item.positions ?? null,
      netUnits: sales.netUnits,
      avgMonthlyUnits: sales.avgMonthlyUnits,
      lastSaleDate: item.lastSaleDate ?? null,
      arrivalStatus: arrival.arrivalStatus,
      nextArrival: arrival.nextArrival,
    }

    if (kind === 'out-of-stock') {
      outOfStock.push(row)
    } else {
      lowStock.push({
        ...row,
        avgDailyUnits: round(sales.avgDailyUnits, 4),
        coverageDays: round(coverageDays, 1),
        // Unrounded, for the order.
        exactCoverageDays: coverageDays,
      })
    }
  }

  outOfStock.sort(compareOutOfStock)
  lowStock.sort((left, right) =>
    compareLowStock(
      { ...left, coverageDays: left.exactCoverageDays },
      { ...right, coverageDays: right.exactCoverageDays },
    ),
  )

  return {
    outOfStock,
    lowStock: lowStock.map(({ exactCoverageDays: _exact, ...row }) => row),
    dataQuality,
  }
}

export function pageRows(rows, limit, offset = 0) {
  return {
    total: rows.length,
    hasMore: offset + limit < rows.length,
    rows: rows.slice(offset, offset + limit),
  }
}

/** Arrival window: from the cutoff to cutoff + arrivalWindowDays. */
export function resolveArrivalWindow(
  cutoff,
  rules = MY_DAY_AVAILABILITY_RULES,
) {
  const to = addDays(cutoff, rules.arrivalWindowDays)

  return to ? { from: cutoff, to, days: rules.arrivalWindowDays } : null
}

function addAmount(target, line) {
  const currency = line.currency || NO_CURRENCY
  const entry = target[currency] ?? {
    amount: null,
    lines: 0,
    linesWithoutAmount: 0,
    linesHidden: 0,
  }

  entry.lines += 1

  if (!line.costVisible) {
    entry.linesHidden += 1
  } else if (line.amount === null || line.amount === undefined) {
    entry.linesWithoutAmount += 1
  } else {
    entry.amount = (entry.amount ?? 0) + line.amount
  }

  target[currency] = entry
}

/**
 * One row per purchase order with pending product lines expected inside the
 * window or overdue. Lines without an expected date are only counted.
 * Amounts stay by currency and are never converted (PUR-001); a hidden cost
 * is null, never 0 (SEC-003A).
 */
export function buildArrivals({ lines, cutoff, rules = MY_DAY_AVAILABILITY_RULES }) {
  const window = resolveArrivalWindow(cutoff, rules)
  const orders = new Map()
  const amountsByCurrency = {}
  let linesWithoutDate = 0
  let costHidden = false

  for (const line of lines) {
    if (!line.expectedReceiptDate) {
      linesWithoutDate += 1
      continue
    }

    if (line.expectedReceiptDate > window.to) {
      continue
    }

    const key = String(line.purchaseOrderNumber)
    const order = orders.get(key) ?? {
      purchaseOrderNumber: line.purchaseOrderNumber,
      supplierName: line.supplierName ?? null,
      statuses: new Set(),
      shipmentStatuses: new Set(),
      expectedReceiptDate: line.expectedReceiptDate,
      latestExpectedReceiptDate: line.expectedReceiptDate,
      brands: new Map(),
      items: new Set(),
      lines: 0,
      amountsByCurrency: {},
      costHidden: false,
    }

    order.statuses.add(line.status)
    if (line.shipmentStatus) order.shipmentStatuses.add(line.shipmentStatus)
    if (line.expectedReceiptDate < order.expectedReceiptDate) {
      order.expectedReceiptDate = line.expectedReceiptDate
    }
    if (line.expectedReceiptDate > order.latestExpectedReceiptDate) {
      order.latestExpectedReceiptDate = line.expectedReceiptDate
    }
    if (!order.brands.has(line.brandKey)) {
      order.brands.set(line.brandKey, line.brand ?? line.brandKey)
    }
    order.items.add(line.itemKey)
    order.lines += 1
    addAmount(order.amountsByCurrency, line)
    addAmount(amountsByCurrency, line)

    if (!line.costVisible) {
      order.costHidden = true
      costHidden = true
    }

    orders.set(key, order)
  }

  const rows = [...orders.values()]
    .map((order) => ({
      purchaseOrderNumber: order.purchaseOrderNumber,
      supplierName: order.supplierName,
      statuses: [...order.statuses].sort(),
      shipmentStatuses: [...order.shipmentStatuses].sort(),
      expectedReceiptDate: order.expectedReceiptDate,
      latestExpectedReceiptDate: order.latestExpectedReceiptDate,
      overdue: order.expectedReceiptDate < cutoff,
      brands: [...order.brands].map(([brandKey, brandLabel]) => ({ brandKey, brandLabel })),
      items: order.items.size,
      lines: order.lines,
      amountsByCurrency: order.amountsByCurrency,
      costHidden: order.costHidden,
    }))
    .sort((left, right) =>
      left.expectedReceiptDate.localeCompare(right.expectedReceiptDate) ||
      compareText(left.purchaseOrderNumber, right.purchaseOrderNumber),
    )

  return {
    window,
    rows,
    summary: {
      purchaseOrders: rows.length,
      upcoming: rows.filter((row) => !row.overdue).length,
      overdue: rows.filter((row) => row.overdue).length,
      linesWithoutDate,
      amountsByCurrency,
      costHidden,
    },
  }
}
