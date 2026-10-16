function numberOrZero(value) {
  const parsed = Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : 0
}

function ratio(
  numerator,
  denominator,
) {
  return denominator === 0
    ? 0
    : numerator / denominator
}

function emptyMetrics() {
  return {
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents: 0,
  }
}

function subtractMetrics(
  total,
  project,
) {
  return {
    revenue:
      total.revenue -
      project.revenue,

    grossProfit:
      total.grossProfit -
      project.grossProfit,

    quantity:
      total.quantity -
      project.quantity,

    documents:
      Math.max(
        0,
        total.documents -
          project.documents,
      ),
  }
}

function createPeriodQuality() {
  return {
    matched: new Set(),
    missing: new Set(),
    pending: new Set(),
    conflicts: new Set(),
    voided: new Set(),
    materialVoided: new Set(),
    zeroValueVoided: new Set(),
    creditNotes: new Set(),
  }
}

const classificationSql = `
  WITH sales_cutoff AS (
    SELECT
      MAX(sale_date) AS cutoff
    FROM sales_facts
  ),

  billing_source AS (
    SELECT
      id,
      line_key,
      internal_id,

      CASE
        WHEN NULLIF(
          BTRIM(internal_id),
          ''
        ) IS NOT NULL
          THEN internal_id
        ELSE
          REGEXP_REPLACE(
            UPPER(
              BTRIM(
                COALESCE(
                  document_number,
                  ''
                )
              )
            ),
            '[[:space:]]+',
            ' ',
            'g'
          )
      END AS document_id,

      project_id,

      NULLIF(
        REGEXP_REPLACE(
          UPPER(
            BTRIM(
              COALESCE(
                customer_id,
                ''
              )
            )
          ),
          '[[:space:]]+',
          ' ',
          'g'
        ),
        ''
      ) AS customer_id,

      REGEXP_REPLACE(
        UPPER(
          BTRIM(
            COALESCE(
              document_number,
              ''
            )
          )
        ),
        '[[:space:]]+',
        ' ',
        'g'
      ) AS document_number,

      document_type,
      billing_date,
      period_id,
      currency,
      is_voided,
      amount,
      quantity
    FROM project_billings
  ),

  billing_documents AS (
    SELECT
      document_id,

      (
        ARRAY_AGG(
          project_id
          ORDER BY
            billing_date,
            document_number,
            line_key
        )
      )[1] AS project_id,

      (
        ARRAY_AGG(
          customer_id
          ORDER BY
            billing_date,
            document_number,
            line_key
        )
      )[1] AS customer_id,

      (
        ARRAY_AGG(
          document_number
          ORDER BY
            billing_date,
            document_number,
            line_key
        )
      )[1] AS document_number,

      (
        ARRAY_AGG(
          document_type
          ORDER BY
            billing_date,
            document_number,
            line_key
        )
      )[1] AS document_type,

      (
        ARRAY_AGG(
          billing_date
          ORDER BY
            billing_date,
            document_number,
            line_key
        )
      )[1] AS billing_date,

      (
        ARRAY_AGG(
          period_id
          ORDER BY
            billing_date,
            document_number,
            line_key
        )
      )[1] AS billing_period_id,

      (
        ARRAY_AGG(
          currency
          ORDER BY
            billing_date,
            document_number,
            line_key
        )
      )[1] AS currency,

      BOOL_OR(
        is_voided
      ) AS is_voided,

      SUM(amount) AS source_amount,
      SUM(quantity) AS source_quantity,
      COUNT(*) AS billing_line_count
    FROM billing_source
    GROUP BY document_id
  ),

  active_counts AS (
    SELECT
      document_number,

      COUNT(*) FILTER (
        WHERE NOT is_voided
      ) AS active_count
    FROM billing_documents
    GROUP BY document_number
  ),

  sales_source AS (
    SELECT
      sale_date,
      period_id,

      REGEXP_REPLACE(
        UPPER(
          BTRIM(
            COALESCE(
              document_number,
              ''
            )
          )
        ),
        '[[:space:]]+',
        ' ',
        'g'
      ) AS document_number,

      NULLIF(
        REGEXP_REPLACE(
          UPPER(
            BTRIM(
              COALESCE(
                customer_id,
                ''
              )
            )
          ),
          '[[:space:]]+',
          ' ',
          'g'
        ),
        ''
      ) AS customer_id,

      revenue,
      gross_profit,
      quantity
    FROM sales_facts
    WHERE
      NULLIF(
        BTRIM(document_number),
        ''
      ) IS NOT NULL
  ),

  sales_documents AS (
    SELECT
      document_number,

      MIN(sale_date) AS first_date,
      MAX(sale_date) AS last_date,

      SUM(revenue) AS revenue,
      SUM(gross_profit) AS gross_profit,
      SUM(quantity) AS quantity,

      COUNT(*) AS line_count,

      ARRAY_AGG(
        DISTINCT period_id
      ) FILTER (
        WHERE period_id IS NOT NULL
      ) AS period_ids,

      ARRAY_AGG(
        DISTINCT customer_id
      ) FILTER (
        WHERE customer_id IS NOT NULL
      ) AS customer_ids
    FROM sales_source
    GROUP BY document_number
  )

  SELECT
    billing.document_id,
    billing.project_id,
    billing.customer_id,
    billing.document_number,
    billing.document_type,

    billing.billing_date::TEXT
      AS billing_date,

    billing.billing_period_id,
    billing.currency,
    billing.is_voided,

    billing.source_amount,
    billing.source_quantity,
    billing.billing_line_count,

    COALESCE(
      counts.active_count,
      0
    ) AS active_count,

    sales.document_number IS NOT NULL
      AS sales_document_present,

    COALESCE(
      sales.revenue,
      0
    ) AS sales_revenue,

    COALESCE(
      sales.gross_profit,
      0
    ) AS sales_gross_profit,

    COALESCE(
      sales.quantity,
      0
    ) AS sales_quantity,

    COALESCE(
      sales.line_count,
      0
    ) AS sales_line_count,

    COALESCE(
      sales.period_ids,
      ARRAY[]::TEXT[]
    ) AS sales_period_ids,

    COALESCE(
      sales.customer_ids,
      ARRAY[]::TEXT[]
    ) AS sales_customer_ids,

    cutoff.cutoff::TEXT
      AS sales_data_cutoff,

    (
      ABS(
        COALESCE(
          sales.revenue,
          0
        )
      ) > 0.0001
      OR
      ABS(
        COALESCE(
          sales.gross_profit,
          0
        )
      ) > 0.0001
      OR
      ABS(
        COALESCE(
          sales.quantity,
          0
        )
      ) > 0.0001
    ) AS sales_material,

    (
      cutoff.cutoff IS NOT NULL
      AND
      billing.billing_date >
        cutoff.cutoff
    ) AS after_sales_cutoff,

    (
      NULLIF(
        BTRIM(
          COALESCE(
            billing.project_id,
            ''
          )
        ),
        ''
      ) IS NOT NULL
      AND
      NOT EXISTS (
        SELECT 1
        FROM projects project
        WHERE
          project.project_id =
            billing.project_id
      )
    ) AS orphan_project,

    (
      sales.document_number IS NOT NULL
      AND
      NOT (
        billing.billing_period_id =
          ANY(
            COALESCE(
              sales.period_ids,
              ARRAY[]::TEXT[]
            )
          )
      )
    ) AS period_mismatch,

    (
      billing.customer_id IS NOT NULL
      AND
      sales.document_number IS NOT NULL
      AND
      NOT (
        billing.customer_id =
          ANY(
            COALESCE(
              sales.customer_ids,
              ARRAY[]::TEXT[]
            )
          )
      )
    ) AS customer_mismatch,

    (
      sales.document_number IS NOT NULL
      AND
      billing.document_type =
        'credit_note'
      AND
      COALESCE(
        sales.revenue,
        0
      ) > 0
    ) AS credit_note_sign_anomaly,

    CASE
      WHEN billing.is_voided
        THEN 'voided'

      WHEN COALESCE(
        counts.active_count,
        0
      ) > 1
        THEN 'conflict'

      WHEN sales.document_number
        IS NULL
      THEN
        CASE
          WHEN
            cutoff.cutoff IS NOT NULL
            AND
            billing.billing_date >
              cutoff.cutoff
          THEN 'pending_cutoff'
          ELSE 'missing_sales_document'
        END

      ELSE 'matched'
    END AS status

  FROM billing_documents billing

  LEFT JOIN active_counts counts
    ON counts.document_number =
      billing.document_number

  LEFT JOIN sales_documents sales
    ON sales.document_number =
      billing.document_number

  CROSS JOIN sales_cutoff cutoff

  ORDER BY
    billing.document_number,
    billing.project_id,
    billing.document_id
`

const salesPeriodSql = `
  WITH sales_source AS (
    SELECT
      sale_date,
      period_id,

      REGEXP_REPLACE(
        UPPER(
          BTRIM(
            COALESCE(
              document_number,
              ''
            )
          )
        ),
        '[[:space:]]+',
        ' ',
        'g'
      ) AS document_number,

      revenue,
      gross_profit,
      quantity
    FROM sales_facts
  )

  SELECT
    period_id,

    SUM(revenue) AS revenue,
    SUM(gross_profit) AS gross_profit,
    SUM(quantity) AS quantity,

    COUNT(
      DISTINCT NULLIF(
        document_number,
        ''
      )
    ) AS documents

  FROM sales_source
  GROUP BY period_id

  UNION ALL

  SELECT
    NULL AS period_id,

    SUM(revenue) AS revenue,
    SUM(gross_profit) AS gross_profit,
    SUM(quantity) AS quantity,

    COUNT(
      DISTINCT NULLIF(
        document_number,
        ''
      )
    ) AS documents

  FROM sales_source

  ORDER BY period_id NULLS LAST
`

const projectPeriodSql = `
  WITH sales_source AS (
    SELECT
      period_id,

      REGEXP_REPLACE(
        UPPER(
          BTRIM(
            COALESCE(
              document_number,
              ''
            )
          )
        ),
        '[[:space:]]+',
        ' ',
        'g'
      ) AS document_number,

      revenue,
      gross_profit,
      quantity
    FROM sales_facts
  )

  SELECT
    period_id,

    SUM(revenue) AS revenue,
    SUM(gross_profit) AS gross_profit,
    SUM(quantity) AS quantity,

    COUNT(
      DISTINCT document_number
    ) AS documents

  FROM sales_source

  WHERE
    document_number =
      ANY($1::TEXT[])

  GROUP BY period_id
  ORDER BY period_id
`

const cutoffSql = `
  SELECT
    (
      SELECT
        MAX(sale_date)::TEXT
      FROM sales_facts
    ) AS sales_data_cutoff,

    (
      SELECT
        MAX(billing_date)::TEXT
      FROM project_billings
    ) AS project_billing_data_cutoff
`

export async function loadProjectBillingReconciliationSummary(
  pool,
) {
  const classificationResult =
    await pool.query(
      classificationSql,
    )

  const documents =
    classificationResult.rows

  const matchedDocumentNumbers =
    Array.from(
      new Set(
        documents
          .filter(
            (document) =>
              document.status ===
              'matched',
          )
          .map(
            (document) =>
              document.document_number,
          )
          .filter(Boolean),
      ),
    )

  const [
    salesPeriodResult,
    projectPeriodResult,
    cutoffResult,
  ] = await Promise.all([
    pool.query(
      salesPeriodSql,
    ),

    pool.query(
      projectPeriodSql,
      [matchedDocumentNumbers],
    ),

    pool.query(
      cutoffSql,
    ),
  ])

  const totalRow =
    salesPeriodResult.rows.find(
      (row) =>
        row.period_id === null,
    )

  const total = {
    revenue:
      numberOrZero(
        totalRow?.revenue,
      ),

    grossProfit:
      numberOrZero(
        totalRow?.gross_profit,
      ),

    quantity:
      numberOrZero(
        totalRow?.quantity,
      ),

    documents:
      numberOrZero(
        totalRow?.documents,
      ),
  }

  const project = {
    revenue: 0,
    grossProfit: 0,
    quantity: 0,
    documents:
      matchedDocumentNumbers.length,
  }

  for (const document of documents) {
    if (
      document.status !==
      'matched'
    ) {
      continue
    }

    project.revenue +=
      numberOrZero(
        document.sales_revenue,
      )

    project.grossProfit +=
      numberOrZero(
        document.sales_gross_profit,
      )

    project.quantity +=
      numberOrZero(
        document.sales_quantity,
      )
  }

  const projectPeriods =
    new Map(
      projectPeriodResult.rows.map(
        (row) => [
          row.period_id,
          {
            revenue:
              numberOrZero(
                row.revenue,
              ),

            grossProfit:
              numberOrZero(
                row.gross_profit,
              ),

            quantity:
              numberOrZero(
                row.quantity,
              ),

            documents:
              numberOrZero(
                row.documents,
              ),
          },
        ],
      ),
    )

  const qualityByPeriod =
    new Map()

  const getPeriodQuality =
    (periodId) => {
      let quality =
        qualityByPeriod.get(
          periodId,
        )

      if (!quality) {
        quality =
          createPeriodQuality()

        qualityByPeriod.set(
          periodId,
          quality,
        )
      }

      return quality
    }

  const missingSalesDocumentNumbers =
    new Set()

  const conflictDocumentNumbers =
    new Set()

  const orphanProjectIds =
    new Set()

  const periodMismatchDocuments =
    new Set()

  const customerMismatchDocuments =
    new Set()

  const creditNoteSignAnomalyDocuments =
    new Set()

  const voidedDocumentsPresentInSales =
    new Set()

  const pendingCutoffDocumentNumbers =
    new Set()

  const materialVoidedDocumentsPresentInSales =
    new Set()

  const zeroValueVoidedDocumentsPresentInSales =
    new Set()

  let activeBillingDocuments = 0
  let matchedBillingDocuments = 0
  let missingBillingDocuments = 0
  let pendingCutoffBillingDocuments = 0
  let voidedBillingDocuments = 0
  let conflictBillingDocuments = 0
  let creditNoteDocuments = 0

  for (const document of documents) {
    const documentNumber =
      document.document_number

    const periodId =
      document.billing_period_id

    const periodQuality =
      getPeriodQuality(
        periodId,
      )

    if (!document.is_voided) {
      activeBillingDocuments += 1

      if (
        document.document_type ===
        'credit_note'
      ) {
        creditNoteDocuments += 1

        periodQuality
          .creditNotes
          .add(
            documentNumber,
          )
      }
    }

    if (
      document.orphan_project &&
      document.project_id
    ) {
      orphanProjectIds.add(
        document.project_id,
      )
    }

    switch (
      document.status
    ) {
      case 'matched':
        matchedBillingDocuments += 1

        periodQuality
          .matched
          .add(
            documentNumber,
          )

        if (
          document.period_mismatch
        ) {
          periodMismatchDocuments.add(
            documentNumber,
          )
        }

        if (
          document.customer_mismatch
        ) {
          customerMismatchDocuments.add(
            documentNumber,
          )
        }

        if (
          document.credit_note_sign_anomaly
        ) {
          creditNoteSignAnomalyDocuments.add(
            documentNumber,
          )
        }

        break

      case 'missing_sales_document':
        missingBillingDocuments += 1

        missingSalesDocumentNumbers.add(
          documentNumber,
        )

        periodQuality
          .missing
          .add(
            documentNumber,
          )

        break

      case 'pending_cutoff':
        pendingCutoffBillingDocuments += 1

        pendingCutoffDocumentNumbers.add(
          documentNumber,
        )

        periodQuality
          .pending
          .add(
            documentNumber,
          )

        break

      case 'conflict':
        conflictBillingDocuments += 1

        conflictDocumentNumbers.add(
          documentNumber,
        )

        periodQuality
          .conflicts
          .add(
            documentNumber,
          )

        break

      case 'voided':
        voidedBillingDocuments += 1

        periodQuality
          .voided
          .add(
            documentNumber,
          )

        if (
          document.sales_document_present
        ) {
          voidedDocumentsPresentInSales.add(
            documentNumber,
          )

          if (
            document.sales_material
          ) {
            materialVoidedDocumentsPresentInSales.add(
              documentNumber,
            )

            periodQuality
              .materialVoided
              .add(
                documentNumber,
              )
          } else {
            zeroValueVoidedDocumentsPresentInSales.add(
              documentNumber,
            )

            periodQuality
              .zeroValueVoided
              .add(
                documentNumber,
              )
          }
        }

        break

      default:
        break
    }
  }

  const salesPeriods =
    salesPeriodResult.rows
      .filter(
        (row) =>
          row.period_id !== null,
      )
      .sort(
        (left, right) =>
          left.period_id
            .localeCompare(
              right.period_id,
            ),
      )

  const periods =
    salesPeriods.map(
      (row) => {
        const periodId =
          row.period_id

        const totalMetrics = {
          revenue:
            numberOrZero(
              row.revenue,
            ),

          grossProfit:
            numberOrZero(
              row.gross_profit,
            ),

          quantity:
            numberOrZero(
              row.quantity,
            ),

          documents:
            numberOrZero(
              row.documents,
            ),
        }

        const projectMetrics =
          projectPeriods.get(
            periodId,
          ) ??
          emptyMetrics()

        const periodQuality =
          qualityByPeriod.get(
            periodId,
          ) ??
          createPeriodQuality()

        const matched =
          periodQuality
            .matched.size

        const missing =
          periodQuality
            .missing.size

        const conflicts =
          periodQuality
            .conflicts.size

        const eligible =
          matched +
          missing +
          conflicts

        return {
          periodId,

          total:
            totalMetrics,

          project:
            projectMetrics,

          transactional:
            subtractMetrics(
              totalMetrics,
              projectMetrics,
            ),

          projectRevenueShare:
            ratio(
              projectMetrics.revenue,
              totalMetrics.revenue,
            ),

          reconciliationCoverage:
            eligible === 0
              ? 1
              : ratio(
                  matched,
                  eligible,
                ),

          matchedBillingDocuments:
            matched,

          missingBillingDocuments:
            missing,

          pendingCutoffBillingDocuments:
            periodQuality
              .pending.size,

          conflictBillingDocuments:
            conflicts,

          voidedBillingDocuments:
            periodQuality
              .voided.size,

          materialVoidedDocuments:
            periodQuality
              .materialVoided.size,

          zeroValueVoidedDocuments:
            periodQuality
              .zeroValueVoided.size,

          creditNoteDocuments:
            periodQuality
              .creditNotes.size,
        }
      },
    )

  const currentPeriodId =
    periods.at(-1)
      ?.periodId ?? null

  const currentPeriod =
    currentPeriodId
      ? periods.find(
          (period) =>
            period.periodId ===
            currentPeriodId,
        )
      : undefined

  const historicalPeriods =
    periods.filter(
      (period) =>
        period.periodId !==
        currentPeriodId,
    )

  const historicalMatched =
    historicalPeriods.reduce(
      (sum, period) =>
        sum +
        period
          .matchedBillingDocuments,
      0,
    )

  const historicalEligible =
    historicalPeriods.reduce(
      (sum, period) =>
        sum +
        period
          .matchedBillingDocuments +
        period
          .missingBillingDocuments +
        period
          .conflictBillingDocuments,
      0,
    )

  const currentPeriodBlockingDocumentNumbers =
    new Set()

  const historicalExceptionDocumentNumbers =
    new Set()

  for (const document of documents) {
    const materialException =
      document.status ===
        'missing_sales_document' ||
      document.status ===
        'conflict' ||
      (
        document.status ===
          'voided' &&
        document.sales_material
      ) ||
      document
        .credit_note_sign_anomaly

    if (!materialException) {
      continue
    }

    if (
      document.billing_period_id ===
      currentPeriodId
    ) {
      currentPeriodBlockingDocumentNumbers.add(
        document.document_number,
      )
    } else {
      historicalExceptionDocumentNumbers.add(
        document.document_number,
      )
    }
  }

  const eligibleBillingDocuments =
    matchedBillingDocuments +
    missingBillingDocuments +
    conflictDocumentNumbers.size

  const cutoffs =
    cutoffResult.rows[0] ?? {}

  return {
    generatedAt:
      new Date()
        .toISOString(),

    total,

    project,

    transactional:
      subtractMetrics(
        total,
        project,
      ),

    periods,

    quality: {
      activeBillingDocuments,
      matchedBillingDocuments,
      missingBillingDocuments,
      voidedBillingDocuments,
      conflictBillingDocuments,
      creditNoteDocuments,

      coverageRate:
        eligibleBillingDocuments === 0
          ? 1
          : ratio(
              matchedBillingDocuments,
              eligibleBillingDocuments,
            ),

      currentPeriodId,

      currentPeriodCoverageRate:
        currentPeriod
          ?.reconciliationCoverage ??
        1,

      historicalCoverageRate:
        historicalEligible === 0
          ? 1
          : ratio(
              historicalMatched,
              historicalEligible,
            ),

      salesDataCutoff:
        cutoffs
          .sales_data_cutoff ??
        null,

      projectBillingDataCutoff:
        cutoffs
          .project_billing_data_cutoff ??
        null,

      pendingCutoffBillingDocuments,

      missingSalesDocumentNumbers:
        [
          ...missingSalesDocumentNumbers,
        ].sort(),

      conflictDocumentNumbers:
        [
          ...conflictDocumentNumbers,
        ].sort(),

      orphanProjectIds:
        [
          ...orphanProjectIds,
        ].sort(),

      periodMismatchDocuments:
        [
          ...periodMismatchDocuments,
        ].sort(),

      customerMismatchDocuments:
        [
          ...customerMismatchDocuments,
        ].sort(),

      creditNoteSignAnomalyDocuments:
        [
          ...creditNoteSignAnomalyDocuments,
        ].sort(),

      voidedDocumentsPresentInSales:
        [
          ...voidedDocumentsPresentInSales,
        ].sort(),

      pendingCutoffDocumentNumbers:
        [
          ...pendingCutoffDocumentNumbers,
        ].sort(),

      materialVoidedDocumentsPresentInSales:
        [
          ...materialVoidedDocumentsPresentInSales,
        ].sort(),

      zeroValueVoidedDocumentsPresentInSales:
        [
          ...zeroValueVoidedDocumentsPresentInSales,
        ].sort(),

      currentPeriodBlockingDocumentNumbers:
        [
          ...currentPeriodBlockingDocumentNumbers,
        ].sort(),

      historicalExceptionDocumentNumbers:
        [
          ...historicalExceptionDocumentNumbers,
        ].sort(),
    },
  }
}