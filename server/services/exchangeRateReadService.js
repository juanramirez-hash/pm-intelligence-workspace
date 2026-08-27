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

export async function loadExchangeRateDataset(
  pool,
) {
  const [
    ratesResult,
    importResult,
  ] = await Promise.all([
    pool.query(
      `
        SELECT
          period_id,
          source_currency,
          target_currency,
          rate,
          source_reference,
          effective_date,
          recorded_at
        FROM exchange_rates
        ORDER BY
          period_id,
          source_currency,
          target_currency
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
          dataset_type = 'exchangeRates'
          AND status = 'completed'
        ORDER BY id DESC
        LIMIT 1
      `,
    ),
  ])

  const latestImport =
    importResult.rows[0] ?? null

  if (
    ratesResult.rows.length === 0 &&
    !latestImport
  ) {
    return null
  }

  const normalizedRows =
    ratesResult.rows.map(
      (row) => ({
        periodId:
          row.period_id,

        sourceCurrency:
          row.source_currency,

        targetCurrency:
          row.target_currency,

        rate:
          numberOrZero(
            row.rate,
          ),

        sourceReference:
          row.source_reference,

        effectiveDate:
          dateOnlyOrNull(
            row.effective_date,
          ),

        recordedAt:
          timestampOrNull(
            row.recorded_at,
          ) ?? '',
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
      timestampOrNull(
        latestImport
          ?.uploaded_at,
      ),
  }
}