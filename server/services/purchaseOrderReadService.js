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

function dateOnlyOrNull(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (value instanceof Date) {
    return value
      .toISOString()
      .slice(0, 10)
  }

  const text =
    String(value)

  return text.length >= 10
    ? text.slice(0, 10)
    : text
}

export async function loadPurchaseOrderDataset(
  pool,
) {
  const [
    purchaseOrdersResult,
    importResult,
  ] = await Promise.all([
    pool.query(
      `
        SELECT
          id,
          import_id,
          line_key,
          source_row_number,
          duplicate_occurrences,
          purchase_order_number,
          source_internal_id,
          source_secondary_internal_id,
          purchase_order_reference,
          purchase_order_date,
          period_id,
          expected_receipt_date,
          status,
          main_memo,
          supplier_id,
          supplier_name,
          currency,
          line_type,
          item_code,
          brand,
          line_memo,
          quantity,
          amount_foreign_currency,
          weight,
          supplier_lead_time_days,
          supplier_express_lead_time_days,
          inventory_days,
          shipment_number,
          shipment_status,
          zone,
          purchasing_executive,
          coff_date,
          atd_date,
          ata_date,
          atw_date,
          department,
          value_classification,
          value_score,
          amount_classification
        FROM purchase_orders
        ORDER BY
          purchase_order_date,
          purchase_order_number,
          line_key
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
          dataset_type = 'purchases'
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
    purchaseOrdersResult.rows.length === 0 &&
    !latestImport
  ) {
    return null
  }

  const normalizedRows =
    purchaseOrdersResult.rows.map(
      (row) => ({
        lineKey:
          row.line_key,

        sourceRowNumber:
          Number(
            row.source_row_number,
          ),

        duplicateOccurrences:
          Number(
            row.duplicate_occurrences,
          ),

        purchaseOrderNumber:
          row.purchase_order_number,

        sourceInternalId:
          row.source_internal_id,

        sourceSecondaryInternalId:
          row.source_secondary_internal_id,

        purchaseOrderReference:
          row.purchase_order_reference,

        purchaseOrderDate:
          dateOnlyOrNull(
            row.purchase_order_date,
          ),

        periodId:
          row.period_id,

        expectedReceiptDate:
          dateOnlyOrNull(
            row.expected_receipt_date,
          ),

        status:
          row.status,

        mainMemo:
          row.main_memo,

        supplierId:
          row.supplier_id,

        supplierName:
          row.supplier_name,

        currency:
          row.currency,

        lineType:
          row.line_type,

        itemCode:
          row.item_code,

        brand:
          row.brand,

        lineMemo:
          row.line_memo,

        quantity:
          numberOrNull(
            row.quantity,
          ),

        amountForeignCurrency:
          numberOrNull(
            row.amount_foreign_currency,
          ),

        weight:
          numberOrNull(
            row.weight,
          ),

        supplierLeadTimeDays:
          numberOrNull(
            row.supplier_lead_time_days,
          ),

        supplierExpressLeadTimeDays:
          numberOrNull(
            row.supplier_express_lead_time_days,
          ),

        inventoryDays:
          numberOrNull(
            row.inventory_days,
          ),

        shipmentNumber:
          row.shipment_number,

        shipmentStatus:
          row.shipment_status,

        zone:
          row.zone,

        purchasingExecutive:
          row.purchasing_executive,

        coffDate:
          dateOnlyOrNull(
            row.coff_date,
          ),

        atdDate:
          dateOnlyOrNull(
            row.atd_date,
          ),

        ataDate:
          dateOnlyOrNull(
            row.ata_date,
          ),

        atwDate:
          dateOnlyOrNull(
            row.atw_date,
          ),

        department:
          row.department,

        valueClassification:
          row.value_classification,

        valueScore:
          numberOrNull(
            row.value_score,
          ),

        amountClassification:
          row.amount_classification,
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