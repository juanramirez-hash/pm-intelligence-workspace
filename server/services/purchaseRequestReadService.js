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

export async function loadPurchaseRequestDataset(
  pool,
) {
  const [
    requestsResult,
    importResult,
  ] = await Promise.all([
    pool.query(
      `
        SELECT
          request_key,
          source_row_number,
          duplicate_occurrences,
          purchase_request_number,
          source_internal_id,
          request_date,
          period_id,
          sales_order_number,
          related_purchase_order_number,
          request_status,
          source_item_status,
          order_status,
          item_code,
          brand,
          model,
          description,
          quantity,
          cash_authorization_status,
          advance_payment_note,
          already_ordered_status,
          executive_name,
          stock_quantity,
          available_for_sale_quantity,
          cash_release_date,
          request_expiration_date,
          expected_purchase_order_arrival_date,
          preferred_supplier_name,
          actual_supplier_name,
          branch,
          item_blocked_for_request_status,
          rma_order_status,
          purchasing_traffic_comments,
          project_id,
          project_estimated_delivery_date,
          request_estimated_delivery_date,
          created_by,
          source_elapsed_days,
          express_shipping_paid_status,
          project_warehouse_order_status,
          assigned_buyer,
          process_date
        FROM purchase_requests
        ORDER BY
          request_date,
          purchase_request_number
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
          dataset_type = 'purchaseRequests'
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
    requestsResult.rows.length === 0 &&
    !latestImport
  ) {
    return null
  }

  const normalizedRows =
    requestsResult.rows.map(
      (row) => ({
        requestKey:
          row.request_key,

        sourceRowNumber:
          Number(
            row.source_row_number,
          ),

        duplicateOccurrences:
          Number(
            row.duplicate_occurrences,
          ),

        purchaseRequestNumber:
          row.purchase_request_number,

        sourceInternalId:
          row.source_internal_id,

        requestDate:
          dateOnlyOrNull(
            row.request_date,
          ),

        periodId:
          row.period_id,

        salesOrderNumber:
          row.sales_order_number,

        relatedPurchaseOrderNumber:
          row.related_purchase_order_number,

        requestStatus:
          row.request_status,

        sourceItemStatus:
          row.source_item_status,

        orderStatus:
          row.order_status,

        itemCode:
          row.item_code,

        brand:
          row.brand,

        model:
          row.model,

        description:
          row.description,

        quantity:
          numberOrNull(
            row.quantity,
          ),

        cashAuthorizationStatus:
          row.cash_authorization_status,

        advancePaymentNote:
          row.advance_payment_note,

        alreadyOrderedStatus:
          row.already_ordered_status,

        executiveName:
          row.executive_name,

        stockQuantity:
          numberOrNull(
            row.stock_quantity,
          ),

        availableForSaleQuantity:
          numberOrNull(
            row.available_for_sale_quantity,
          ),

        cashReleaseDate:
          dateOnlyOrNull(
            row.cash_release_date,
          ),

        requestExpirationDate:
          dateOnlyOrNull(
            row.request_expiration_date,
          ),

        expectedPurchaseOrderArrivalDate:
          dateOnlyOrNull(
            row.expected_purchase_order_arrival_date,
          ),

        preferredSupplierName:
          row.preferred_supplier_name,

        actualSupplierName:
          row.actual_supplier_name,

        branch:
          row.branch,

        itemBlockedForRequestStatus:
          row.item_blocked_for_request_status,

        rmaOrderStatus:
          row.rma_order_status,

        purchasingTrafficComments:
          row.purchasing_traffic_comments,

        projectId:
          row.project_id,

        projectEstimatedDeliveryDate:
          dateOnlyOrNull(
            row.project_estimated_delivery_date,
          ),

        requestEstimatedDeliveryDate:
          dateOnlyOrNull(
            row.request_estimated_delivery_date,
          ),

        createdBy:
          row.created_by,

        sourceElapsedDays:
          numberOrNull(
            row.source_elapsed_days,
          ),

        expressShippingPaidStatus:
          row.express_shipping_paid_status,

        projectWarehouseOrderStatus:
          row.project_warehouse_order_status,

        assignedBuyer:
          row.assigned_buyer,

        processDate:
          dateOnlyOrNull(
            row.process_date,
          ),
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