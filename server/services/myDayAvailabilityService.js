// MD-002 "Mi día": availability reads. Every brand list, status, date and
// import id travels as a query parameter. Items are joined by the NetSuite
// item code normalized the same way in every table (ITEM_KEY_SQL).

import {
  buildCostVisibilityCondition,
} from '../middleware/requireBrandScope.js'

import {
  MY_DAY_AVAILABILITY_RULES,
} from './myDayAvailabilityRules.js'

/** UPPER, BTRIM and collapsed spaces of a NetSuite item code column. */
export function itemKeySql(column) {
  return `UPPER(BTRIM(REGEXP_REPLACE(${column}, '\\s+', ' ', 'g')))`
}

export const AVAILABILITY_SOURCES = Object.freeze({
  inventory: 'inventory',
  purchases: 'purchases',
  sales: 'sales',
})

function toNumber(value) {
  if (value === null || value === undefined) {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

function toInstant(value) {
  if (value === null || value === undefined) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toDateKey(value) {
  if (value === null || value === undefined) {
    return null
  }

  return String(value).slice(0, 10)
}

/**
 * Last completed import per dataset (same order as the read services:
 * completed_at DESC NULLS LAST, id DESC). Datasets without imports are
 * missing from the map.
 */
export async function loadLatestImports(
  pool,
  datasetTypes = Object.values(AVAILABILITY_SOURCES),
) {
  const result = await pool.query(
    `SELECT DISTINCT ON (dataset_type)
            dataset_type, id, uploaded_at
       FROM data_imports
      WHERE dataset_type = ANY($1::TEXT[])
        AND status = 'completed'
      ORDER BY dataset_type, completed_at DESC NULLS LAST, id DESC`,
    [datasetTypes],
  )

  return new Map(
    result.rows.map((row) => [
      row.dataset_type,
      { importId: Number(row.id), uploadedAt: toInstant(row.uploaded_at) },
    ]),
  )
}

/**
 * What the inventory import has (MD-002-HOTFIX1): item records
 * (inventory_items, every article of the file) and positions
 * (inventory_snapshots, only articles with some quantity), and whether
 * either carries a catalog status (migration 038).
 */
export async function loadInventoryCoverage(pool, importId) {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM inventory_items
         WHERE import_id = $1)::INTEGER AS item_records,
       (SELECT COUNT(*) FROM inventory_items
         WHERE import_id = $1 AND positions > 0)::INTEGER AS item_records_with_positions,
       (SELECT COUNT(*) FROM inventory_items
         WHERE import_id = $1 AND catalog_status IS NOT NULL)::INTEGER AS item_records_with_status,
       (SELECT COUNT(DISTINCT ${itemKeySql('product_name')}) FROM inventory_snapshots
         WHERE import_id = $1)::INTEGER AS position_articles,
       EXISTS (
         SELECT 1 FROM inventory_snapshots
          WHERE import_id = $1 AND catalog_status IS NOT NULL
       ) AS positions_have_status`,
    [importId],
  )
  const row = result.rows[0] ?? {}

  return {
    itemRecords: Number(row.item_records ?? 0),
    itemRecordsWithPositions: Number(row.item_records_with_positions ?? 0),
    itemRecordsWithStatus: Number(row.item_records_with_status ?? 0),
    positionArticles: Number(row.position_articles ?? 0),
    positionsHaveStatus: row.positions_have_status === true,
  }
}

/**
 * One row per article of the import from inventory_items (MD-002-HOTFIX1),
 * articles without any quantity included. Same shape and brand filter as
 * loadInventoryItems. No costs: the table has none.
 */
export async function loadInventoryItemRecords(pool, importId, brandKeys) {
  const params = [importId]
  let brandFilter = ''

  if (brandKeys) {
    params.push(brandKeys)
    brandFilter = `WHERE brand_key(items.brand) = ANY($${params.length}::TEXT[])`
  }

  const result = await pool.query(
    `SELECT items.*, brand_key(items.brand) AS brand_key
       FROM (
         SELECT ${itemKeySql('item_code')} AS item_key,
                MIN(item_code) AS item_code,
                MAX(brand) AS brand,
                MAX(UPPER(BTRIM(catalog_status))) AS catalog_status,
                MAX(last_sale_date)::TEXT AS last_sale_date,
                SUM(on_hand) AS on_hand,
                SUM(on_order) AS on_order,
                SUM(positions) AS positions
           FROM inventory_items
          WHERE import_id = $1
          GROUP BY 1
       ) AS items
     ${brandFilter}
     ORDER BY items.item_key`,
    params,
  )

  return result.rows.map((row) => ({
    itemKey: row.item_key,
    itemCode: row.item_code,
    brand: row.brand ?? null,
    brandKey: row.brand_key ?? null,
    catalogStatus: row.catalog_status ?? null,
    lastSaleDate: toDateKey(row.last_sale_date),
    onHand: toNumber(row.on_hand) ?? 0,
    pendingReceiptUnits: toNumber(row.on_order) ?? 0,
    positions: toNumber(row.positions) ?? 0,
  }))
}

/**
 * One row per item of one inventory import: stock and pending receipt summed
 * over every branch. brandKeys null = every brand ("- Unassigned -"
 * included); otherwise brand_key(brand) inside the list.
 */
export async function loadInventoryItems(pool, importId, brandKeys) {
  const params = [importId]
  let brandFilter = ''

  if (brandKeys) {
    params.push(brandKeys)
    brandFilter = `WHERE brand_key(items.brand) = ANY($${params.length}::TEXT[])`
  }

  const result = await pool.query(
    `SELECT items.*, brand_key(items.brand) AS brand_key
       FROM (
         SELECT ${itemKeySql('product_name')} AS item_key,
                MIN(product_name) AS item_code,
                MAX(brand) AS brand,
                MAX(UPPER(BTRIM(catalog_status))) AS catalog_status,
                MAX(last_sale_date)::TEXT AS last_sale_date,
                SUM(on_hand) AS on_hand,
                SUM(COALESCE(on_order, 0)) AS on_order
           FROM inventory_snapshots
          WHERE import_id = $1
          GROUP BY 1
       ) AS items
     ${brandFilter}
     ORDER BY items.item_key`,
    params,
  )

  return result.rows.map((row) => ({
    itemKey: row.item_key,
    itemCode: row.item_code,
    brand: row.brand ?? null,
    brandKey: row.brand_key ?? null,
    catalogStatus: row.catalog_status ?? null,
    lastSaleDate: toDateKey(row.last_sale_date),
    onHand: toNumber(row.on_hand) ?? 0,
    pendingReceiptUnits: toNumber(row.on_order) ?? 0,
  }))
}

/** Net units sold per item between two dates (both included). */
export async function loadItemSales(pool, itemKeys, window) {
  if (itemKeys.length === 0 || !window) {
    return new Map()
  }

  const result = await pool.query(
    `SELECT ${itemKeySql('product_name')} AS item_key,
            SUM(quantity) AS units
       FROM sales_facts
      WHERE sale_date BETWEEN $1::DATE AND $2::DATE
        AND ${itemKeySql('product_name')} = ANY($3::TEXT[])
      GROUP BY 1`,
    [window.from, window.to, itemKeys],
  )

  return new Map(
    result.rows.map((row) => [row.item_key, toNumber(row.units) ?? 0]),
  )
}

/**
 * Pending purchase order lines (product lines, pending statuses, any date).
 * The amount follows the cost scope exactly like the purchases service: a
 * line without cost access has amount NULL and costVisible false.
 *
 * filter.itemKeys: only those items (stock alerts).
 * filter.brandKeys: null = every brand; otherwise brand_key(brand) inside.
 */
export async function loadPendingPurchaseOrderLines(
  pool,
  { itemKeys = null, brandKeys = null },
  costScope,
  rules = MY_DAY_AVAILABILITY_RULES,
) {
  if (Array.isArray(itemKeys) && itemKeys.length === 0) {
    return []
  }

  const params = [
    rules.purchaseOrders.lineType,
    rules.purchaseOrders.pendingStatuses,
  ]
  const filters = []

  if (itemKeys) {
    params.push(itemKeys)
    filters.push(`${itemKeySql('item_code')} = ANY($${params.length}::TEXT[])`)
  }

  if (brandKeys) {
    params.push(brandKeys)
    filters.push(`brand_key(brand) = ANY($${params.length}::TEXT[])`)
  }

  const costVisible = buildCostVisibilityCondition(costScope, 'brand', params)

  const result = await pool.query(
    `SELECT ${itemKeySql('item_code')} AS item_key,
            purchase_order_number,
            supplier_name,
            status,
            NULLIF(BTRIM(shipment_status), '') AS shipment_status,
            expected_receipt_date::TEXT AS expected_receipt_date,
            NULLIF(BTRIM(currency), '') AS currency,
            brand,
            brand_key(brand) AS brand_key,
            (${costVisible}) AS cost_visible,
            CASE WHEN ${costVisible} THEN amount_foreign_currency END AS amount
       FROM purchase_orders
      WHERE line_type = $1
        AND status = ANY($2::TEXT[])
        AND item_code IS NOT NULL
        ${filters.map((filter) => `AND ${filter}`).join('\n        ')}
      ORDER BY expected_receipt_date NULLS LAST, purchase_order_number`,
    params,
  )

  return result.rows.map((row) => ({
    itemKey: row.item_key,
    purchaseOrderNumber: row.purchase_order_number,
    supplierName: row.supplier_name ?? null,
    status: row.status,
    shipmentStatus: row.shipment_status ?? null,
    expectedReceiptDate: toDateKey(row.expected_receipt_date),
    currency: row.currency ?? null,
    brand: row.brand ?? null,
    brandKey: row.brand_key ?? null,
    costVisible: row.cost_visible === true,
    amount: toNumber(row.amount),
  }))
}

export function groupLinesByItem(lines) {
  const byItem = new Map()

  for (const line of lines) {
    const list = byItem.get(line.itemKey) ?? []

    list.push(line)
    byItem.set(line.itemKey, list)
  }

  return byItem
}
