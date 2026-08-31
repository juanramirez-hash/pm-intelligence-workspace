import {
  cancelDataImport,
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

export async function startPricingChunkImport(
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
    return await createDataImport(
      client,
      {
        datasetType:
          'pricing',

        fileName,
        uploadedByUserId,

        importMode:
          'replace-all',

        sourceRowCount,
        checksumSha256,

        metadata: {
          chunked: true,
        },
      },
    )
  } finally {
    client.release()
  }
}

export async function appendPricingChunk(
  pool,
  {
    importId,
    chunkIndex,
    rows,
    checksumSha256 = null,
  },
) {
  if (!Array.isArray(rows)) {
    throw new TypeError(
      'Pricing chunk rows must be an array',
    )
  }

  const client =
    await pool.connect()

  try {
    await client.query('BEGIN')

    const importResult =
      await client.query(
        `
          SELECT
            id,
            dataset_type,
            status
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
        'Pricing import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'pricing'
    ) {
      throw new Error(
        'Import does not belong to pricing',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Pricing import is not processing',
      )
    }

    const existingChunk =
      await client.query(
        `
          SELECT
            row_count
          FROM pricing_import_chunks
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

    for (const row of rows) {
      await client.query(
        `
          INSERT INTO pricing_import_staging (
            import_id,
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
          row.id ?? null,
          row.productId,
          row.brandId,
          row.currency,
          row.cost,
          row.listPrice,
          row.sellingPrice ?? null,
          row.pricingGroupId ?? null,
          row.effectiveDate ?? null,
          row.source ?? null,
          row.sourceReference ?? null,
          row.sourceRowNumber,
          row.sourceChannel,
          row.model ?? null,
          row.purchaseCurrency ?? null,
          row.quantityPricingSchedule ?? null,
          Boolean(
            row.usdChannelSkippedForCurrencyMismatch,
          ),
        ],
      )

      insertedRows += 1
    }

    await client.query(
      `
        INSERT INTO pricing_import_chunks (
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
        'Pricing chunk rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function cancelPricingChunkImport(
  pool,
  {
    importId,
    reason =
      'Import cancelled by user',
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
            dataset_type,
            status
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
        'Pricing import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'pricing'
    ) {
      throw new Error(
        'Import does not belong to pricing',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Pricing import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          DELETE
          FROM pricing_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const chunksResult =
      await client.query(
        `
          DELETE
          FROM pricing_import_chunks
          WHERE import_id = $1
        `,
        [importId],
      )

    const cancelled =
      await cancelDataImport(
        client,
        importId,
        reason,
      )

    if (!cancelled) {
      throw new Error(
        'Pricing import could not be cancelled',
      )
    }

    await client.query('COMMIT')

    return {
      import: cancelled,

      deletedStagingRows:
        stagingResult.rowCount ?? 0,

      deletedChunks:
        chunksResult.rowCount ?? 0,
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error(
        'Pricing cancel rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function finalizePricingChunkImport(
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
            dataset_type,
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
        'Pricing import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'pricing'
    ) {
      throw new Error(
        'Import does not belong to pricing',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Pricing import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          SELECT
            COUNT(*)::integer AS row_count
          FROM pricing_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const stagedRows =
      Number(
        stagingResult.rows[0]
          ?.row_count ?? 0,
      )

    const expectedRows =
      Number(
        importRecord
          .source_row_count ?? 0,
      )

    if (
      stagedRows !== expectedRows
    ) {
      throw new Error(
        `Pricing import row count mismatch: expected ${expectedRows}, received ${stagedRows}`,
      )
    }

    const deleted =
      await client.query(
        `
          DELETE
          FROM pricing_records
        `,
      )

    const replacedRows =
      deleted.rowCount ?? 0

    let insertedRows = 0

    if (stagedRows > 0) {
      const insertResult =
        await client.query(
          `
            WITH explicit_rows AS (
              SELECT DISTINCT ON (
                source_price_id
              )
                *
              FROM pricing_import_staging
              WHERE
                import_id = $1
                AND source_price_id IS NOT NULL
              ORDER BY
                source_price_id,
                source_row_number DESC,
                id DESC
            ),

            fallback_rows AS (
              SELECT DISTINCT ON (
                product_id,
                currency,
                COALESCE(
                  effective_date,
                  DATE '0001-01-01'
                )
              )
                *
              FROM pricing_import_staging
              WHERE
                import_id = $1
                AND source_price_id IS NULL
              ORDER BY
                product_id,
                currency,
                COALESCE(
                  effective_date,
                  DATE '0001-01-01'
                ),
                source_row_number DESC,
                id DESC
            ),

            canonical_rows AS (
              SELECT *
              FROM explicit_rows

              UNION ALL

              SELECT *
              FROM fallback_rows
            )

            INSERT INTO pricing_records (
              import_id,
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
            )
            SELECT
              import_id,
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
            FROM canonical_rows
            ORDER BY
              source_row_number,
              source_channel
          `,
          [importId],
        )

      insertedRows =
        insertResult.rowCount ?? 0
    }

    const completed =
      await completeDataImport(
        client,
        importId,
        {
          processedRows:
            insertedRows,

          insertedRows,
          replacedRows,
          ignoredRows,
        },
      )

    await client.query(
      `
        DELETE
        FROM pricing_import_staging
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query(
      `
        DELETE
        FROM pricing_import_chunks
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query('COMMIT')

    return {
      import: completed,
      insertedRows,
      replacedRows,
      duplicateRows:
        Math.max(
          0,
          stagedRows - insertedRows,
        ),
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error(
        'Pricing finalize rollback failed:',
        rollbackError,
      )
    }

    try {
      await failDataImport(
        client,
        importId,
        error instanceof Error
          ? error.message
          : 'Unknown pricing finalize error',
      )
    } catch (auditError) {
      console.error(
        'Pricing finalize audit update failed:',
        auditError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}