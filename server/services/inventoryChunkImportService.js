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
            currency,
            catalog_status,
            last_sale_date
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
          // MD-002 (migration 038); older clients do not send them.
          row.catalogStatus ?? null,
          row.lastSaleDate ?? null,
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

// MD-002-HOTFIX1: one record per article of the file (inventory_items,
// migration 039). No costs are accepted.

export const INVENTORY_ITEMS_MAX_PER_CHUNK = 1000

// Positions and item totals must match within this tolerance on finalize.
export const INVENTORY_ITEMS_TOTAL_TOLERANCE = 0.0001

const ITEM_QUANTITY_FIELDS = [
  'onHand',
  'committed',
  'available',
  'inTransit',
  'onOrder',
]

function inventoryHttpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode })
}

function optionalText(value, field, index) {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== 'string' || value.length > 500) {
    throw inventoryHttpError(
      400,
      `Inventory item ${index}: ${field} is invalid`,
    )
  }

  const trimmed = value.trim()

  return trimmed === '' ? null : trimmed
}

/** Validates and normalizes one chunk of item records (400 on error). */
export function validateInventoryItems(items) {
  if (!Array.isArray(items)) {
    throw inventoryHttpError(400, 'Inventory items must be an array')
  }

  if (items.length > INVENTORY_ITEMS_MAX_PER_CHUNK) {
    throw inventoryHttpError(
      400,
      `Inventory items chunk exceeds ${INVENTORY_ITEMS_MAX_PER_CHUNK} records`,
    )
  }

  return items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw inventoryHttpError(400, `Inventory item ${index} is invalid`)
    }

    const itemCode = optionalText(item.itemCode, 'itemCode', index)

    if (!itemCode) {
      throw inventoryHttpError(400, `Inventory item ${index}: itemCode is required`)
    }

    const lastSaleDate = item.lastSaleDate ?? null

    if (
      lastSaleDate !== null &&
      (typeof lastSaleDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(lastSaleDate))
    ) {
      throw inventoryHttpError(400, `Inventory item ${index}: lastSaleDate is invalid`)
    }

    const quantities = {}

    for (const field of ITEM_QUANTITY_FIELDS) {
      const value = item[field] ?? 0

      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw inventoryHttpError(400, `Inventory item ${index}: ${field} is invalid`)
      }

      quantities[field] = value
    }

    const positions = item.positions ?? 0

    if (!Number.isInteger(positions) || positions < 0) {
      throw inventoryHttpError(400, `Inventory item ${index}: positions is invalid`)
    }

    return {
      itemCode,
      brand: optionalText(item.brand, 'brand', index),
      catalogStatus: optionalText(item.catalogStatus, 'catalogStatus', index),
      lastSaleDate,
      ...quantities,
      positions,
    }
  })
}

/**
 * Stores one chunk of item records of a processing inventory import.
 * Re-sending the same chunk is harmless (ON CONFLICT DO NOTHING); the count
 * is checked on finalize.
 */
export async function appendInventoryItems(
  pool,
  {
    importId,
    items,
  },
) {
  const records = validateInventoryItems(items)
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
      throw inventoryHttpError(404, 'Inventory import not found')
    }

    if (importRecord.dataset_type !== 'inventory') {
      throw inventoryHttpError(409, 'Import does not belong to inventory')
    }

    if (importRecord.status !== 'processing') {
      throw inventoryHttpError(409, 'Inventory import is not processing')
    }

    let insertedItems = 0

    if (records.length > 0) {
      const column = (field) => records.map((record) => record[field])
      const insertResult =
        await client.query(
          `
            INSERT INTO inventory_items (
              import_id,
              item_code,
              brand,
              catalog_status,
              last_sale_date,
              on_hand,
              committed,
              available,
              in_transit,
              on_order,
              positions
            )
            SELECT
              $1,
              item.item_code,
              item.brand,
              item.catalog_status,
              item.last_sale_date,
              item.on_hand,
              item.committed,
              item.available,
              item.in_transit,
              item.on_order,
              item.positions
            FROM UNNEST(
              $2::TEXT[],
              $3::TEXT[],
              $4::TEXT[],
              $5::DATE[],
              $6::NUMERIC[],
              $7::NUMERIC[],
              $8::NUMERIC[],
              $9::NUMERIC[],
              $10::NUMERIC[],
              $11::INTEGER[]
            ) AS item (
              item_code,
              brand,
              catalog_status,
              last_sale_date,
              on_hand,
              committed,
              available,
              in_transit,
              on_order,
              positions
            )
            ON CONFLICT (import_id, item_code) DO NOTHING
          `,
          [
            importId,
            column('itemCode'),
            column('brand'),
            column('catalogStatus'),
            column('lastSaleDate'),
            column('onHand'),
            column('committed'),
            column('available'),
            column('inTransit'),
            column('onOrder'),
            column('positions'),
          ],
        )

      insertedItems = insertResult.rowCount ?? 0
    }

    await client.query('COMMIT')

    return {
      receivedItems: records.length,
      insertedItems,
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error(
        'Inventory items rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

/**
 * Finalize check: the item records of the import must be exactly
 * expectedItemCount and their totals must match the positions of the same
 * import. Throws a 422 error with a clear message otherwise.
 */
export async function verifyInventoryItems(
  client,
  importId,
  expectedItemCount,
) {
  const result = await client.query(
    `
      SELECT
        items.item_count,
        items.positions AS item_positions,
        items.on_hand AS item_on_hand,
        items.on_order AS item_on_order,
        snapshots.positions AS snapshot_positions,
        snapshots.on_hand AS snapshot_on_hand,
        snapshots.on_order AS snapshot_on_order
      FROM (
        SELECT
          COUNT(*)::INTEGER AS item_count,
          COALESCE(SUM(positions), 0)::BIGINT AS positions,
          COALESCE(SUM(on_hand), 0) AS on_hand,
          COALESCE(SUM(on_order), 0) AS on_order
        FROM inventory_items
        WHERE import_id = $1
      ) AS items
      CROSS JOIN (
        SELECT
          COUNT(*)::BIGINT AS positions,
          COALESCE(SUM(on_hand), 0) AS on_hand,
          COALESCE(SUM(COALESCE(on_order, 0)), 0) AS on_order
        FROM inventory_snapshots
        WHERE import_id = $1
      ) AS snapshots
    `,
    [importId],
  )
  const row = result.rows[0] ?? {}
  const itemCount = Number(row.item_count ?? 0)
  const problems = []

  if (itemCount !== expectedItemCount) {
    problems.push(
      `artículos esperados ${expectedItemCount}, recibidos ${itemCount}`,
    )
  }

  if (Number(row.item_positions ?? 0) !== Number(row.snapshot_positions ?? 0)) {
    problems.push(
      `posiciones según artículos ${row.item_positions}, posiciones importadas ${row.snapshot_positions}`,
    )
  }

  for (const [label, itemValue, snapshotValue] of [
    ['En Mano', row.item_on_hand, row.snapshot_on_hand],
    ['en orden', row.item_on_order, row.snapshot_on_order],
  ]) {
    if (
      Math.abs(Number(itemValue ?? 0) - Number(snapshotValue ?? 0)) >
      INVENTORY_ITEMS_TOTAL_TOLERANCE
    ) {
      problems.push(
        `${label}: artículos ${itemValue}, posiciones ${snapshotValue}`,
      )
    }
  }

  if (problems.length > 0) {
    throw inventoryHttpError(
      422,
      `La carga de inventario no cuadra y no se aplicó (se conserva la carga anterior): ${problems.join('; ')}`,
    )
  }

  return itemCount
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

    const itemsResult =
      await client.query(
        `
          DELETE
          FROM inventory_items
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
      deletedItems:
        itemsResult.rowCount ?? 0,
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
    // MD-002-HOTFIX1: null for clients that do not send item records.
    expectedItemCount = null,
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
              currency,
              catalog_status,
              last_sale_date
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
              staging.currency,
              staging.catalog_status,
              staging.last_sale_date
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

    // MD-002-HOTFIX1: the item records must match the positions of this
    // import; a mismatch rolls everything back (the previous import stays).
    const itemCount =
      expectedItemCount === null
        ? null
        : await verifyInventoryItems(
          client,
          importId,
          expectedItemCount,
        )

    // Only the item records of the latest import are kept.
    await client.query(
      `
        DELETE
        FROM inventory_items
        WHERE import_id <> $1
      `,
      [importId],
    )

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
              $5::boolean,
              'itemCount',
              $6::integer
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
        itemCount,
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
      itemCount,
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

    // The item records of a failed import are never read; drop them.
    try {
      await client.query(
        `
          DELETE
          FROM inventory_items
          WHERE import_id = $1
        `,
        [importId],
      )
    } catch (cleanupError) {
      console.error(
        'Inventory finalize item cleanup failed:',
        cleanupError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}