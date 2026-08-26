function numberOrNull(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const parsed =
    Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : null
}

function stringOrNull(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString()
  }

  return String(value)
}

export async function loadProductDataset(
  pool,
) {
  const [
    productsResult,
    importResult,
  ] = await Promise.all([
    pool.query(
      `
        SELECT
          id,
          import_id,
          erp_internal_id,
          name,
          code,
          model,
          brand,
          vendor_code,
          vendor_name,
          description,
          classification,
          commercial_status,
          trend,
          category,
          subcategory1,
          subcategory2,
          source_created_at,
          source_updated_at,
          average_cost_usd,
          total_value,
          currency,
          inventory_value_mxn,
          inventory_value_usd,
          last_purchase_date,
          last_sale_date,
          units_sold_last_90_days,
          preferred_vendor,
          product_class,
          secondary_category1,
          secondary_category2,
          quantity_pricing_schedule,
          formula_text,
          on_hand,
          on_order,
          catalog_status,
          inactive_for_purchases,
          show_on_portal,
          superseded_by,
          block_purchase_requests,
          direct_substitute,
          benchmark_s,
          benchmark_t,
          benchmark_o
        FROM products
        ORDER BY
          name,
          id
      `,
    ),

    pool.query(
      `
        SELECT
          file_name,
          uploaded_at,
          ignored_rows
        FROM data_imports
        WHERE
          dataset_type = 'products'
          AND status = 'completed'
        ORDER BY
          id DESC
        LIMIT 1
      `,
    ),
  ])

  const latestImport =
    importResult.rows[0] ?? null

  if (
    productsResult.rows.length === 0 &&
    !latestImport
  ) {
    return null
  }

  const normalizedRows =
    productsResult.rows.map(
      (row) => ({
        erpInternalId:
          row.erp_internal_id,

        name:
          row.name,

        code:
          row.code,

        model:
          row.model,

        brand:
          row.brand,

        vendorCode:
          row.vendor_code,

        vendorName:
          row.vendor_name,

        description:
          row.description,

        classification:
          row.classification,

        commercialStatus:
          row.commercial_status,

        trend:
          row.trend,

        category:
          row.category,

        subcategory1:
          row.subcategory1,

        subcategory2:
          row.subcategory2,

        createdAt:
          stringOrNull(
            row.source_created_at,
          ),

        updatedAt:
          stringOrNull(
            row.source_updated_at,
          ),

        averageCostUsd:
          numberOrNull(
            row.average_cost_usd,
          ),

        totalValue:
          numberOrNull(
            row.total_value,
          ),

        currency:
          row.currency,

        inventoryValueMxn:
          numberOrNull(
            row.inventory_value_mxn,
          ),

        inventoryValueUsd:
          numberOrNull(
            row.inventory_value_usd,
          ),

        lastPurchaseDate:
          stringOrNull(
            row.last_purchase_date,
          ),

        lastSaleDate:
          stringOrNull(
            row.last_sale_date,
          ),

        unitsSoldLast90Days:
          numberOrNull(
            row.units_sold_last_90_days,
          ),

        preferredVendor:
          row.preferred_vendor,

        productClass:
          row.product_class,

        secondaryCategory1:
          row.secondary_category1,

        secondaryCategory2:
          row.secondary_category2,

        quantityPricingSchedule:
          row.quantity_pricing_schedule,

        formulaText:
          row.formula_text,

        onHand:
          numberOrNull(
            row.on_hand,
          ),

        onOrder:
          numberOrNull(
            row.on_order,
          ),

        catalogStatus:
          row.catalog_status,

        inactiveForPurchases:
          row.inactive_for_purchases,

        showOnPortal:
          row.show_on_portal,

        supersededBy:
          row.superseded_by,

        blockPurchaseRequests:
          row.block_purchase_requests,

        directSubstitute:
          row.direct_substitute,

        benchmarkS:
          row.benchmark_s,

        benchmarkT:
          row.benchmark_t,

        benchmarkO:
          row.benchmark_o,
      }),
    )

  return {
    normalizedRows,

    ignoredRows:
      Number(
        latestImport
          ?.ignored_rows ?? 0,
      ),

    lastImportedFile:
      latestImport
        ?.file_name ?? null,

    lastImportedAt:
      latestImport
        ?.uploaded_at ?? null,
  }
}