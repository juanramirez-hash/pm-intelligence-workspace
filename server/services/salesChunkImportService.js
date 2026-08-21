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

export async function startSalesChunkImport(
  pool,
  {
    fileName,
    uploadedByUserId,
    sourceRowCount,
    checksumSha256 = null,
  },
) {
  const client =
    await pool.connect()

  try {
    const importRecord =
      await createDataImport(
        client,
        {
          datasetType: 'sales',
          fileName,
          uploadedByUserId,
          importMode:
            'replace-periods',
          sourceRowCount,
          checksumSha256,
          metadata: {
            chunked: true,
          },
        },
      )

    return importRecord
  } finally {
    client.release()
  }
}

export async function appendSalesChunk(
  pool,
  {
    importId,
    chunkIndex,
    rows,
    checksumSha256 = null,
    sourceRowOffset = 0,
  },
) {
  if (!Array.isArray(rows)) {
    throw new TypeError(
      'Sales chunk rows must be an array',
    )
  }

  const client =
    await pool.connect()

  try {
    await client.query('BEGIN')

    const existingChunk =
      await client.query(
        `
          SELECT
            row_count
          FROM sales_import_chunks
          WHERE
            import_id = $1
            AND chunk_index = $2
          FOR UPDATE
        `,
        [
          importId,
          chunkIndex,
        ],
      )

    if (
      existingChunk.rowCount &&
      existingChunk.rowCount > 0
    ) {
      await client.query('ROLLBACK')

      return {
        duplicate: true,
        insertedRows: 0,
      }
    }

    let insertedRows = 0

    for (
      let index = 0;
      index < rows.length;
      index += 1
    ) {
      const row = rows[index]

      await client.query(
        `
          INSERT INTO sales_import_staging (
            import_id,
            source_row_number,
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
            currency
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
          importId,
          sourceRowOffset +
            index +
            1,
          row.date,
          getPeriodId(
            row.date,
          ),
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
        ],
      )

      insertedRows += 1
    }

    await client.query(
      `
        INSERT INTO sales_import_chunks (
          import_id,
          chunk_index,
          row_count,
          checksum_sha256
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
      `,
      [
        importId,
        chunkIndex,
        insertedRows,
        checksumSha256,
      ],
    )

    await client.query('COMMIT')

    return {
      duplicate: false,
      insertedRows,
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error(
        'Sales chunk rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function finalizeSalesChunkImport(
  pool,
  {
    importId,
    ignoredRows = 0,
  },
) {
  const client =
    await pool.connect()

  try {
    await client.query('BEGIN')

    const importResult =
      await client.query(
        `
          SELECT
            id,
            status,
            source_row_count
          FROM data_imports
          WHERE id = $1
          FOR UPDATE
        `,
        [importId],
      )

    const importRecord =
      importResult.rows[0]

    if (!importRecord) {
      throw new Error(
        'Sales import not found',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Sales import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          SELECT
            COUNT(*)::integer
              AS row_count,
            MIN(sale_date)
              AS period_start,
            MAX(sale_date)
              AS period_end,
            ARRAY_AGG(
              DISTINCT period_id
              ORDER BY period_id
            )
              AS period_ids
          FROM sales_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const staging =
      stagingResult.rows[0]

    const stagedRows =
      Number(
        staging?.row_count ??
          0,
      )

    const expectedRows =
      Number(
        importRecord
          .source_row_count ??
          0,
      )

    if (
      stagedRows !== expectedRows
    ) {
      throw new Error(
        `Sales import row count mismatch: expected ${expectedRows}, received ${stagedRows}`,
      )
    }

    const periodIds =
      Array.isArray(
        staging?.period_ids,
      )
        ? staging.period_ids
        : []

    const replacedResult =
      periodIds.length > 0
        ? await client.query(
            `
              DELETE FROM sales_facts
              WHERE period_id =
                ANY($1::text[])
            `,
            [periodIds],
          )
        : {
            rowCount: 0,
          }

    if (stagedRows > 0) {
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
          SELECT
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
          FROM sales_import_staging
          WHERE import_id = $1
          ORDER BY
            source_row_number
        `,
        [importId],
      )
    }

    await client.query(
      `
        UPDATE data_imports
        SET
          period_start = $2,
          period_end = $3,
          metadata =
            metadata ||
            jsonb_build_object(
              'periodIds',
              $4::text[]
            )
        WHERE id = $1
      `,
      [
        importId,
        staging?.period_start ??
          null,
        staging?.period_end ??
          null,
        periodIds,
      ],
    )

    const completed =
      await completeDataImport(
        client,
        importId,
        {
          processedRows:
            stagedRows,
          insertedRows:
            stagedRows,
          replacedRows:
            replacedResult
              .rowCount ?? 0,
          ignoredRows,
        },
      )

    await client.query(
      `
        DELETE FROM sales_import_staging
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query(
      `
        DELETE FROM sales_import_chunks
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query('COMMIT')

    return {
      import: completed,
      periodIds,
      insertedRows:
        stagedRows,
      replacedRows:
        replacedResult
          .rowCount ?? 0,
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error(
        'Sales finalize rollback failed:',
        rollbackError,
      )
    }

    try {
      await failDataImport(
        client,
        importId,
        error instanceof Error
          ? error.message
          : 'Unknown sales finalize error',
      )
    } catch (auditError) {
      console.error(
        'Sales finalize audit update failed:',
        auditError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}