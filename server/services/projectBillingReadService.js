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

export async function loadProjectBillingSummary(
  pool,
) {
  const [
    summaryResult,
    importResult,
  ] = await Promise.all([
    pool.query(
      `
        WITH document_rows AS (
          SELECT DISTINCT ON (
            CASE
              WHEN COALESCE(internal_id, '') <> ''
                THEN internal_id
              ELSE COALESCE(document_number, '')
            END
          )
            CASE
              WHEN COALESCE(internal_id, '') <> ''
                THEN internal_id
              ELSE COALESCE(document_number, '')
            END AS document_id,
            document_type,
            currency,
            project_id,
            is_voided
          FROM project_billings
          ORDER BY
            CASE
              WHEN COALESCE(internal_id, '') <> ''
                THEN internal_id
              ELSE COALESCE(document_number, '')
            END,
            is_voided DESC,
            billing_date,
            document_number,
            line_key
        )
        SELECT
          MIN(billing_date) AS period_start,
          MAX(billing_date) AS period_end,
          COUNT(*)::integer AS total_lines,
          (
            SELECT COUNT(*)::integer
            FROM document_rows
          ) AS unique_documents,
          COUNT(
            DISTINCT COALESCE(
              project_id,
              ''
            )
          )::integer AS unique_projects,
          (
            SELECT COUNT(*)::integer
            FROM document_rows
            WHERE document_type = 'invoice'
          ) AS invoice_documents,
          (
            SELECT COUNT(*)::integer
            FROM document_rows
            WHERE document_type = 'credit_note'
          ) AS credit_note_documents,
          (
            SELECT COUNT(*)::integer
            FROM document_rows
            WHERE document_type = 'other'
          ) AS other_documents,
          (
            SELECT COUNT(*)::integer
            FROM document_rows
            WHERE is_voided = TRUE
          ) AS voided_documents,
          COALESCE(
            SUM(duplicate_occurrences),
            0
          )::integer AS duplicate_source_lines,
          (
            SELECT COUNT(*)::integer
            FROM document_rows
            WHERE
              currency IS NULL
              OR currency = ''
          ) AS documents_missing_currency,
          (
            SELECT COUNT(*)::integer
            FROM document_rows
            WHERE
              project_id IS NULL
              OR project_id = ''
          ) AS documents_missing_project,
          ROUND(
            COALESCE(
              SUM(amount) FILTER (
                WHERE
                  is_voided = FALSE
                  AND currency = 'MXN'
              ),
              0
            )::numeric,
            2
          ) AS source_amount_mxn,
          ROUND(
            COALESCE(
              SUM(amount) FILTER (
                WHERE
                  is_voided = FALSE
                  AND currency = 'USD'
              ),
              0
            )::numeric,
            2
          ) AS source_amount_usd,
          COALESCE(
            ARRAY_AGG(
              DISTINCT currency
              ORDER BY currency
            ) FILTER (
              WHERE
                currency IS NOT NULL
                AND currency <> ''
            ),
            ARRAY[]::text[]
          ) AS currencies
        FROM project_billings
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

  const row =
    summaryResult.rows[0] ?? null

  const latestImport =
    importResult.rows[0] ?? null

  const totalLines =
    Number(
      row?.total_lines ?? 0,
    )

  if (
    totalLines === 0 &&
    !latestImport
  ) {
    return null
  }

  return {
    summary: {
      periodStart:
        dateOnlyOrNull(
          row?.period_start,
        ),

      periodEnd:
        dateOnlyOrNull(
          row?.period_end,
        ),

      totalLines,

      uniqueDocuments:
        Number(
          row?.unique_documents ?? 0,
        ),

      uniqueProjects:
        Number(
          row?.unique_projects ?? 0,
        ),

      invoiceDocuments:
        Number(
          row?.invoice_documents ?? 0,
        ),

      creditNoteDocuments:
        Number(
          row?.credit_note_documents ?? 0,
        ),

      otherDocuments:
        Number(
          row?.other_documents ?? 0,
        ),

      voidedDocuments:
        Number(
          row?.voided_documents ?? 0,
        ),

      duplicateSourceLines:
        Number(
          row?.duplicate_source_lines ?? 0,
        ),

      documentsMissingCurrency:
        Number(
          row?.documents_missing_currency ?? 0,
        ),

      documentsMissingProject:
        Number(
          row?.documents_missing_project ?? 0,
        ),

      sourceAmountMxn:
        numberOrZero(
          row?.source_amount_mxn,
        ),

      sourceAmountUsd:
        numberOrZero(
          row?.source_amount_usd,
        ),

      currencies:
        Array.isArray(
          row?.currencies,
        )
          ? row.currencies
          : [],

      processedRows:
        totalLines,

      ignoredRows:
        Number(
          latestImport
            ?.ignored_rows ?? 0,
        ),
    },

    lastImportedFile:
      latestImport
        ?.file_name ?? '',

    lastImportedAt:
      latestImport
        ?.uploaded_at ?? '',
  }
}