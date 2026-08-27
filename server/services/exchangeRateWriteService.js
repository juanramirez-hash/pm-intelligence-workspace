import {
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

export async function saveExchangeRateDataset(
  pool,
  {
    fileName,
    uploadedByUserId,
    rows,
    ignoredRows = 0,
  },
) {
  if (!Array.isArray(rows)) {
    throw new TypeError(
      'Exchange Rate rows must be an array',
    )
  }

  const client =
    await pool.connect()

  let importId = null

  try {
    const importRecord =
      await createDataImport(
        client,
        {
          datasetType:
            'exchangeRates',

          fileName,
          uploadedByUserId,

          importMode:
            'upsert',

          sourceRowCount:
            rows.length,

          metadata: {
            direct: true,
          },
        },
      )

    importId =
      Number(importRecord.id)

    await client.query('BEGIN')

    let insertedRows = 0
    let updatedRows = 0

    for (const row of rows) {
      if (
        typeof row.periodId !== 'string' ||
        typeof row.sourceCurrency !== 'string' ||
        typeof row.targetCurrency !== 'string'
      ) {
        throw new TypeError(
          'Exchange Rate identity is invalid',
        )
      }

      const rate =
        Number(row.rate)

      if (
        !Number.isFinite(rate) ||
        rate <= 0
      ) {
        throw new TypeError(
          'Exchange Rate value must be greater than zero',
        )
      }

      const existingResult =
        await client.query(
          `
            SELECT id
            FROM exchange_rates
            WHERE
              period_id = $1
              AND source_currency = $2
              AND target_currency = $3
            FOR UPDATE
          `,
          [
            row.periodId,
            row.sourceCurrency,
            row.targetCurrency,
          ],
        )

      await client.query(
        `
          INSERT INTO exchange_rates (
            import_id,
            period_id,
            source_currency,
            target_currency,
            rate,
            source_reference,
            effective_date,
            recorded_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )
          ON CONFLICT (
            period_id,
            source_currency,
            target_currency
          )
          DO UPDATE SET
            import_id =
              EXCLUDED.import_id,
            rate =
              EXCLUDED.rate,
            source_reference =
              EXCLUDED.source_reference,
            effective_date =
              EXCLUDED.effective_date,
            recorded_at =
              EXCLUDED.recorded_at,
            updated_at =
              NOW()
        `,
        [
          importId,
          row.periodId,
          row.sourceCurrency,
          row.targetCurrency,
          rate,
          row.sourceReference ?? null,
          row.effectiveDate ?? null,
          row.recordedAt ??
            new Date().toISOString(),
        ],
      )

      if (
        existingResult.rowCount &&
        existingResult.rowCount > 0
      ) {
        updatedRows += 1
      } else {
        insertedRows += 1
      }
    }

    const completed =
      await completeDataImport(
        client,
        importId,
        {
          processedRows:
            rows.length,

          insertedRows,
          updatedRows,
          ignoredRows,
        },
      )

    await client.query('COMMIT')

    return {
      import: completed,
      insertedRows,
      updatedRows,
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error(
        'Exchange Rate rollback failed:',
        rollbackError,
      )
    }

    if (importId !== null) {
      try {
        await failDataImport(
          client,
          importId,
          error instanceof Error
            ? error.message
            : 'Unknown Exchange Rate persistence error',
        )
      } catch (auditError) {
        console.error(
          'Exchange Rate audit update failed:',
          auditError,
        )
      }
    }

    throw error
  } finally {
    client.release()
  }
}