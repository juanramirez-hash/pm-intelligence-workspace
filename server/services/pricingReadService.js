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

export async function loadPricingDataset(
  pool,
) {
  const [
    pricingResult,
    importResult,
  ] = await Promise.all([
    pool.query(
      `
        SELECT
          source_price_id,
          product_id,
          brand_id,
          currency,
          cost,
          list_price,
          selling_price,
          pricing_group_id,
          effective_date,
          source,
          source_reference,
          source_row_number,
          source_channel,
          model,
          purchase_currency,
          quantity_pricing_schedule,
          usd_channel_skipped_for_currency_mismatch
        FROM pricing_records
        ORDER BY
          source_row_number,
          source_channel,
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
          dataset_type = 'pricing'
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
    pricingResult.rows.length === 0 &&
    !latestImport
  ) {
    return null
  }

  const normalizedRows =
    pricingResult.rows.map(
      (row) => ({
        id:
          row.source_price_id,

        productId:
          row.product_id,

        brandId:
          row.brand_id,

        currency:
          row.currency,

        cost:
          numberOrZero(
            row.cost,
          ),

        listPrice:
          numberOrZero(
            row.list_price,
          ),

        sellingPrice:
          numberOrNull(
            row.selling_price,
          ),

        pricingGroupId:
          row.pricing_group_id,

        effectiveDate:
          dateOnlyOrNull(
            row.effective_date,
          ),

        source:
          row.source ?? 'unknown',

        sourceReference:
          row.source_reference,

        sourceRowNumber:
          Number(
            row.source_row_number,
          ),

        sourceChannel:
          row.source_channel,

        model:
          row.model,

        purchaseCurrency:
          row.purchase_currency,

        quantityPricingSchedule:
          row.quantity_pricing_schedule,

        usdChannelSkippedForCurrencyMismatch:
          Boolean(
            row.usd_channel_skipped_for_currency_mismatch,
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
      timestampOrNull(
        latestImport
          ?.uploaded_at,
      ),
  }
}