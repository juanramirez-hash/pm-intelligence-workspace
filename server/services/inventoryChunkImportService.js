import {
  cancelDataImport,
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

export async function startInventoryChunkImport(
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
          datasetType:
            'inventory',
          fileName,
          uploadedByUserId,
          importMode:
            'replace-snapshot',
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

export async function appendInventoryChunk(
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
      'Inventory chunk rows must be an array',
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
        'Inventory import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'inventory'
    ) {
      throw new Error(
        'Import does not belong to inventory',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Inventory import is not processing',
      )
    }

    const existingChunk =
      await client.query(
        `
          SELECT
            row_count
          FROM inventory_import_chunks
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
      const row =
        rows[index]

      await client.query(
        `
          INSERT INTO inventory_import_staging (
            import_id,
            source_row_number,
            snapshot_date,
            product_name,
            product_code,
            brand,
            model,
            location,
            on_hand,
            available,
            committed,
            in_transit,
            on_order,
            unit_cost,
            inventory_value,
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
            $16
          )
        `,
        [
          importId,
          sourceRowOffset +
            index +
            1,
          row.snapshotDate,
          row.productName,
          row.productCode,
          row.brand,
          row.model,
          row.location,
          row.onHand,
          row.available,
          row.committed,
          row.inTransit,
          row.onOrder,
          row.unitCost,
          row.inventoryValue,
          row.currency,
        ],
      )

      insertedRows += 1
    }

    await client.query(
      `
        INSERT INTO inventory_import_chunks (
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
        'Inventory chunk rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function cancelInventoryChunkImport(
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
        'Inventory import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'inventory'
    ) {
      throw new Error(
        'Import does not belong to inventory',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Inventory import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          DELETE
          FROM inventory_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const chunksResult =
      await client.query(
        `
          DELETE
          FROM inventory_import_chunks
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
        'Inventory import could not be cancelled',
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
        'Inventory cancel rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function finalizeInventoryChunkImport(
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
        'Inventory import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'inventory'
    ) {
      throw new Error(
        'Import does not belong to inventory',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Inventory import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          SELECT
            COUNT(*)::integer
              AS row_count,
            MIN(snapshot_date)
              AS period_start,
            MAX(snapshot_date)
              AS period_end,
            ARRAY_AGG(
              DISTINCT snapshot_date
              ORDER BY snapshot_date
            ) FILTER (
              WHERE snapshot_date
                IS NOT NULL
            )
              AS snapshot_dates,
            BOOL_OR(
              snapshot_date IS NULL
            )
              AS contains_null_snapshot
          FROM inventory_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const staging =
      stagingResult.rows[0]

    const stagedRows =
      Number(
        staging?.row_count ?? 0,
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
        `Inventory import row count mismatch: expected ${expectedRows}, received ${stagedRows}`,
      )
    }

    const snapshotDates =
      Array.isArray(
        staging?.snapshot_dates,
      )
        ? staging.snapshot_dates
        : []

    let replacedRows = 0

    if (
      snapshotDates.length > 0
    ) {
      const deleted =
        await client.query(
          `
            DELETE
            FROM inventory_snapshots
            WHERE snapshot_date =
              ANY($1::date[])
          `,
          [snapshotDates],
        )

      replacedRows +=
        deleted.rowCount ?? 0
    }

    if (
      staging
        ?.contains_null_snapshot ===
      true
    ) {
      const deleted =
        await client.query(
          `
            DELETE
            FROM inventory_snapshots
            WHERE snapshot_date IS NULL
          `,
        )

      replacedRows +=
        deleted.rowCount ?? 0
    }

    let insertedRows = 0

    if (stagedRows > 0) {
      const insertResult =
        await client.query(
          `
            INSERT INTO inventory_snapshots (
              import_id,
              snapshot_date,
              product_name,
              product_code,
              brand,
              model,
              location,
              on_hand,
              available,
              committed,
              in_transit,
              on_order,
              unit_cost,
              inventory_value,
              currency
            )
            SELECT
              staging.import_id,
              staging.snapshot_date,
              staging.product_name,
              staging.product_code,
              staging.brand,
              staging.model,
              staging.location,
              staging.on_hand,
              staging.available,
              staging.committed,
              staging.in_transit,
              staging.on_order,
              staging.unit_cost,
              staging.inventory_value,
              staging.currency
            FROM inventory_import_staging staging
            WHERE staging.import_id = $1
            ORDER BY
              staging.source_row_number
          `,
          [importId],
        )

      insertedRows =
        insertResult.rowCount ?? 0
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
              'snapshotDates',
              $4::date[],
              'containsNullSnapshot',
              $5::boolean
            )
        WHERE id = $1
      `,
      [
        importId,
        staging?.period_start ??
          null,
        staging?.period_end ??
          null,
        snapshotDates,
        staging
          ?.contains_null_snapshot ===
          true,
      ],
    )

    const completed =
      await completeDataImport(
        client,
        importId,
        {
          processedRows:
            stagedRows,
          insertedRows,
          replacedRows,
          ignoredRows,
        },
      )

    await client.query(
      `
        DELETE
        FROM inventory_import_staging
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query(
      `
        DELETE
        FROM inventory_import_chunks
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query('COMMIT')

    return {
      import: completed,
      snapshotDates,
      insertedRows,
      replacedRows,
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error(
        'Inventory finalize rollback failed:',
        rollbackError,
      )
    }

    try {
      await failDataImport(
        client,
        importId,
        error instanceof Error
          ? error.message
          : 'Unknown inventory finalize error',
      )
    } catch (auditError) {
      console.error(
        'Inventory finalize audit update failed:',
        auditError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}