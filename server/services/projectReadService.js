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

function timestampOrNull(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed =
    new Date(value)

  return Number.isNaN(
    parsed.getTime(),
  )
    ? String(value)
    : parsed.toISOString()
}

export async function loadProjectDataset(
  pool,
) {
  const [
    projectsResult,
    importResult,
  ] = await Promise.all([
    pool.query(
      `
        SELECT
          internal_id,
          project_id,
          name,
          end_user,
          customer_id,
          customer_name,
          sales_executive,
          location,
          assigned_business_developer,
          assigned_product_manager,
          project_group,
          primary_brand,
          source_created_at,
          elapsed_days,
          currency,
          status_code,
          status_label,
          forecast_stage,
          closing_probability,
          estimated_close_date,
          estimated_billing_date,
          amount_to_close,
          observations,
          assigned_engineer,
          approximate_amount,
          invoiced_amount,
          report_amount_to_invoice,
          amount_to_invoice,
          is_duplicate
        FROM projects
        ORDER BY project_id
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
          dataset_type = 'projects'
          AND status = 'completed'
        ORDER BY id DESC
        LIMIT 1
      `,
    ),
  ])

  const latestImport =
    importResult.rows[0] ?? null

  if (
    projectsResult.rows.length === 0 &&
    !latestImport
  ) {
    return null
  }

  const normalizedRows =
    projectsResult.rows.map(
      (row) => ({
        internalId:
          row.internal_id,

        projectId:
          row.project_id,

        name:
          row.name,

        endUser:
          row.end_user,

        customerId:
          row.customer_id,

        customerName:
          row.customer_name,

        salesExecutive:
          row.sales_executive,

        location:
          row.location,

        assignedBusinessDeveloper:
          row.assigned_business_developer,

        assignedProductManager:
          row.assigned_product_manager,

        group:
          row.project_group,

        primaryBrand:
          row.primary_brand,

        createdAt:
          timestampOrNull(
            row.source_created_at,
          ),

        elapsedDays:
          numberOrNull(
            row.elapsed_days,
          ),

        currency:
          row.currency,

        statusCode:
          row.status_code,

        statusLabel:
          row.status_label,

        forecastStage:
          row.forecast_stage,

        closingProbability:
          numberOrNull(
            row.closing_probability,
          ),

        estimatedCloseDate:
          dateOnlyOrNull(
            row.estimated_close_date,
          ),

        estimatedBillingDate:
          dateOnlyOrNull(
            row.estimated_billing_date,
          ),

        amountToClose:
          numberOrNull(
            row.amount_to_close,
          ),

        observations:
          row.observations,

        assignedEngineer:
          row.assigned_engineer,

        approximateAmount:
          numberOrNull(
            row.approximate_amount,
          ),

        invoicedAmount:
          numberOrNull(
            row.invoiced_amount,
          ),

        reportAmountToInvoice:
          numberOrNull(
            row.report_amount_to_invoice,
          ),

        amountToInvoice:
          numberOrNull(
            row.amount_to_invoice,
          ),

        isDuplicate:
          Boolean(
            row.is_duplicate,
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