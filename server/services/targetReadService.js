export async function loadTargetDataset(
  pool,
) {
  const client =
    await pool.connect()

  try {
    const rowsResult =
      await client.query(
        `
          SELECT
            brand_id,
            period_id,
            target_revenue,
            target_gross_profit,
            target_gross_margin,
            working_days
          FROM brand_targets
          ORDER BY
            period_id,
            brand_id,
            id
        `,
      )

    const importResult =
      await client.query(
        `
          SELECT
            file_name,
            uploaded_at,
            ignored_rows
          FROM data_imports
          WHERE
            dataset_type = 'salesTargets'
            AND status = 'completed'
          ORDER BY
            completed_at DESC NULLS LAST,
            id DESC
          LIMIT 1
        `,
      )

    if (
      rowsResult.rowCount === 0
    ) {
      return null
    }

    const latestImport =
      importResult.rows[0] ?? null

    const normalizedRows =
      rowsResult.rows.map(
        (row) => ({
          brandId:
            row.brand_id,

          periodId:
            row.period_id,

          targetRevenue:
            row.target_revenue === null
              ? null
              : Number(
                  row.target_revenue,
                ),

          targetGrossProfit:
            row.target_gross_profit === null
              ? null
              : Number(
                  row.target_gross_profit,
                ),

          targetGrossMargin:
            row.target_gross_margin === null
              ? null
              : Number(
                  row.target_gross_margin,
                ),

          workingDays:
            row.working_days === null
              ? null
              : Number(
                  row.working_days,
                ),
        }),
      )

    return {
      normalizedRows,

      ignoredRows:
        latestImport?.ignored_rows ?? 0,

      lastImportedFile:
        latestImport?.file_name ??
        'PostgreSQL Sales Targets',

      lastImportedAt:
        latestImport?.uploaded_at
          ? new Date(
              latestImport.uploaded_at,
            ).toISOString()
          : new Date().toISOString(),
    }
  } finally {
    client.release()
  }
}