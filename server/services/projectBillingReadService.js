function numberOrZero(
  value,
) {
  const parsed =
    Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : 0
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

export async function loadProjectBillingDataset(
  pool,
) {
  const [
    billingsResult,
    importResult,
  ] = await Promise.all([
    pool.query(
      `
        SELECT
          line_key,
          duplicate_occurrences,
          internal_id,
          project_id,
          project_description,
          end_user,
          customer_id,
          customer_name,
          primary_brand,
          item_code,
          model,
          brand,
          quantity,
          amount,
          billing_date,
          period_id,
          document_number,
          document_type,
          document_status,
          created_from,
          related_document_status,
          currency,
          is_voided,
          estimated_close_date,
          estimated_billing_date,
          estimated_delivery_date,
          sales_representative,
          sales_location,
          assigned_business_developer,
          purchase_description
        FROM project_billings
        ORDER BY
          billing_date,
          document_number,
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
          dataset_type = 'projectBillings'
          AND status = 'completed'
        ORDER BY id DESC
        LIMIT 1
      `,
    ),
  ])

  const latestImport =
    importResult.rows[0] ?? null

  if (
    billingsResult.rows.length === 0 &&
    !latestImport
  ) {
    return null
  }

  const normalizedRows =
    billingsResult.rows.map(
      (row) => ({
        lineKey:
          row.line_key,

        duplicateOccurrences:
          numberOrZero(
            row.duplicate_occurrences,
          ),

        internalId:
          row.internal_id,

        projectId:
          row.project_id,

        projectDescription:
          row.project_description,

        endUser:
          row.end_user,

        customerId:
          row.customer_id,

        customerName:
          row.customer_name,

        primaryBrand:
          row.primary_brand,

        itemCode:
          row.item_code,

        model:
          row.model,

        brand:
          row.brand,

        quantity:
          numberOrZero(
            row.quantity,
          ),

        amount:
          numberOrZero(
            row.amount,
          ),

        date:
          dateOnlyOrNull(
            row.billing_date,
          ),

        periodId:
          row.period_id,

        documentNumber:
          row.document_number,

        documentType:
          row.document_type,

        documentStatus:
          row.document_status,

        createdFrom:
          row.created_from,

        relatedDocumentStatus:
          row.related_document_status,

        currency:
          row.currency,

        isVoided:
          Boolean(
            row.is_voided,
          ),

        estimatedCloseDate:
          dateOnlyOrNull(
            row.estimated_close_date,
          ),

        estimatedBillingDate:
          dateOnlyOrNull(
            row.estimated_billing_date,
          ),

        estimatedDeliveryDate:
          dateOnlyOrNull(
            row.estimated_delivery_date,
          ),

        salesRepresentative:
          row.sales_representative,

        salesLocation:
          row.sales_location,

        assignedBusinessDeveloper:
          row.assigned_business_developer,

        purchaseDescription:
          row.purchase_description,
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