import {
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

function getPeriodIds(
  rows,
) {
  return [
    ...new Set(
      rows.map(
        (row) =>
          row.periodId,
      ),
    ),
  ].sort()
}

function getPeriodBounds(
  periodIds,
) {
  if (
    periodIds.length === 0
  ) {
    return {
      periodStart: null,
      periodEnd: null,
    }
  }

  return {
    periodStart:
      `${periodIds[0]}-01`,

    periodEnd:
      `${periodIds[
        periodIds.length - 1
      ]}-01`,
  }
}

export async function importTargetDataset(
  pool,
  {
    rows,
    fileName,
    uploadedByUserId,
    ignoredRows = 0,
    checksumSha256 = null,
  },
) {
  if (!Array.isArray(rows)) {
    throw new TypeError(
      'Target rows must be an array',
    )
  }

  if (
    typeof fileName !== 'string' ||
    fileName.trim() === ''
  ) {
    throw new TypeError(
      'Target fileName is required',
    )
  }

  if (
    uploadedByUserId === null ||
    uploadedByUserId === undefined
  ) {
    throw new TypeError(
      'Target uploadedByUserId is required',
    )
  }

  const periodIds =
    getPeriodIds(rows)

  const {
    periodStart,
    periodEnd,
  } = getPeriodBounds(
    periodIds,
  )

  const client =
    await pool.connect()

  let importRecord = null

  try {
    importRecord =
      await createDataImport(
        client,
        {
          datasetType:
            'salesTargets',

          fileName,

          uploadedByUserId,

          importMode:
            'replace-periods',

          periodStart,

          periodEnd,

          sourceRowCount:
            rows.length +
            ignoredRows,

          checksumSha256,

          metadata: {
            periodIds,
          },
        },
      )

    await client.query(
      'BEGIN',
    )

    let replacedRows = 0

    if (
      periodIds.length > 0
    ) {
      const deleted =
        await client.query(
          `
            DELETE
            FROM brand_targets
            WHERE
              period_id =
              ANY($1::text[])
          `,
          [
            periodIds,
          ],
        )

      replacedRows =
        deleted.rowCount ?? 0
    }

    let insertedRows = 0

    for (
      let index = 0;
      index < rows.length;
      index += 1
    ) {
      const row =
        rows[index]

      await client.query(
        `
          INSERT INTO brand_targets (
            import_id,
            brand_id,
            period_id,
            target_revenue,
            target_gross_profit,
            target_gross_margin,
            working_days
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )
        `,
        [
          importRecord.id,
          row.brandId,
          row.periodId,
          row.targetRevenue ?? null,
          row.targetGrossProfit ?? null,
          row.targetGrossMargin ?? null,
          row.workingDays ?? null,
        ],
      )

      insertedRows += 1
    }

    const completed =
      await completeDataImport(
        client,
        importRecord.id,
        {
          processedRows:
            rows.length,

          insertedRows,

          replacedRows,

          ignoredRows,
        },
      )

    await client.query(
      'COMMIT',
    )

    return {
      import: completed,
      periodIds,
    }
  } catch (error) {
    try {
      await client.query(
        'ROLLBACK',
      )
    } catch (
      rollbackError
    ) {
      console.error(
        'Target import rollback failed:',
        rollbackError,
      )
    }

    if (
      importRecord?.id
    ) {
      try {
        await failDataImport(
          client,
          importRecord.id,
          error instanceof Error
            ? error.message
            : 'Unknown target import error',
        )
      } catch (
        auditError
      ) {
        console.error(
          'Target import audit update failed:',
          auditError,
        )
      }
    }

    throw error
  } finally {
    client.release()
  }
}