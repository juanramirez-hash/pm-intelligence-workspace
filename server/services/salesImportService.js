import {
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

function getPeriodId(
  date,
) {
  return date.slice(0, 7)
}

function getPeriodBounds(
  rows,
) {
  if (rows.length === 0) {
    return {
      periodStart: null,
      periodEnd: null,
      periodIds: [],
    }
  }

  const dates = rows
    .map((row) => row.date)
    .sort()

  const periodIds = [
    ...new Set(
      rows.map((row) =>
        getPeriodId(row.date),
      ),
    ),
  ].sort()

  return {
    periodStart: dates[0],
    periodEnd:
      dates[dates.length - 1],
    periodIds,
  }
}

export async function importSalesDataset(
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
      'Sales rows must be an array',
    )
  }

  if (
    typeof fileName !== 'string' ||
    fileName.trim() === ''
  ) {
    throw new TypeError(
      'Sales fileName is required',
    )
  }

  if (
    uploadedByUserId === null ||
    uploadedByUserId === undefined
  ) {
    throw new TypeError(
      'Sales uploadedByUserId is required',
    )
  }

  const {
    periodStart,
    periodEnd,
    periodIds,
  } = getPeriodBounds(rows)

  if (rows.length === 0) {
    const client =
      await pool.connect()

    let importRecord

    try {
      importRecord =
        await createDataImport(
          client,
          {
            datasetType: 'sales',
            fileName,
            uploadedByUserId,
            importMode:
              'replace-periods',
            periodStart,
            periodEnd,
            sourceRowCount: 0,
            checksumSha256,
            metadata: {
              periodIds,
            },
          },
        )

      const completed =
        await completeDataImport(
          client,
          importRecord.id,
          {
            processedRows: 0,
            insertedRows: 0,
            replacedRows: 0,
            ignoredRows,
          },
        )

      return {
        import: completed,
        periodIds,
      }
    } finally {
      client.release()
    }
  }

  const client =
    await pool.connect()

  let importRecord = null

  try {
    importRecord =
      await createDataImport(
        client,
        {
          datasetType: 'sales',
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

    await client.query('BEGIN')

    const replacedResult =
      await client.query(
        `
          DELETE FROM sales_facts
          WHERE period_id = ANY($1::text[])
        `,
        [periodIds],
      )

    let insertedRows = 0

    for (
      let index = 0;
      index < rows.length;
      index += 1
    ) {
      const row = rows[index]

      await client.query(
        `
          INSERT INTO sales_facts (
            import_id,
            sale_date,
            period_id,
            brand,
            revenue,
            gross_profit,
            customer_id,
            customer_name,
            product_name,
            product_code,
            model,
            product_status,
            quantity,
            document_number,
            location,
            sales_rep,
            currency,
            source_row_number
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17,
            $18
          )
        `,
        [
          importRecord.id,
          row.date,
          getPeriodId(row.date),
          row.brand,
          row.revenue,
          row.grossProfit,
          row.customerId,
          row.customerName,
          row.productName ?? null,
          row.productCode ?? null,
          row.model,
          row.productStatus ?? null,
          row.quantity,
          row.documentNumber,
          row.location,
          row.salesRep,
          row.currency,
          index + 1,
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
      replacedRows:
        replacedResult.rowCount ?? 0,
      ignoredRows,
    },
  )

await client.query('COMMIT')

return {
  import: completed,
  periodIds,
}
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error(
        'Sales import rollback failed:',
        rollbackError,
      )
    }

    if (importRecord?.id) {
      try {
        await failDataImport(
          client,
          importRecord.id,
          error instanceof Error
            ? error.message
            : 'Unknown sales import error',
        )
      } catch (auditError) {
        console.error(
          'Sales import audit update failed:',
          auditError,
        )
      }
    }

    throw error
  } finally {
    client.release()
  }
}