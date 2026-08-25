import {
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

function getSnapshotDates(
  rows,
) {
  return [
    ...new Set(
      rows
        .map(
          (row) =>
            row.snapshotDate,
        )
        .filter(Boolean),
    ),
  ].sort()
}

function getPeriodBounds(
  snapshotDates,
) {
  if (
    snapshotDates.length === 0
  ) {
    return {
      periodStart: null,
      periodEnd: null,
    }
  }

  return {
    periodStart:
      snapshotDates[0],

    periodEnd:
      snapshotDates[
        snapshotDates.length - 1
      ],
  }
}

export async function importInventoryDataset(
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
      'Inventory rows must be an array',
    )
  }

  if (
    typeof fileName !== 'string' ||
    fileName.trim() === ''
  ) {
    throw new TypeError(
      'Inventory fileName is required',
    )
  }

  if (
    uploadedByUserId === null ||
    uploadedByUserId === undefined
  ) {
    throw new TypeError(
      'Inventory uploadedByUserId is required',
    )
  }

  const snapshotDates =
    getSnapshotDates(rows)

  const {
    periodStart,
    periodEnd,
  } = getPeriodBounds(
    snapshotDates,
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
            'inventory',

          fileName,

          uploadedByUserId,

          importMode:
            'replace-snapshot',

          periodStart,

          periodEnd,

          sourceRowCount:
            rows.length +
            ignoredRows,

          checksumSha256,

          metadata: {
            snapshotDates,
            containsNullSnapshot:
              rows.some(
                (row) =>
                  row.snapshotDate === null,
              ),
          },
        },
      )

    await client.query(
      'BEGIN',
    )

    let replacedRows = 0

    if (
      snapshotDates.length > 0
    ) {
      const deleted =
        await client.query(
          `
            DELETE
            FROM inventory_snapshots
            WHERE
              snapshot_date =
              ANY($1::date[])
          `,
          [
            snapshotDates,
          ],
        )

      replacedRows +=
        deleted.rowCount ?? 0
    }

    const containsNullSnapshot =
      rows.some(
        (row) =>
          row.snapshotDate === null,
      )

    if (
      containsNullSnapshot
    ) {
      const deleted =
        await client.query(
          `
            DELETE
            FROM inventory_snapshots
            WHERE
              snapshot_date IS NULL
          `,
        )

      replacedRows +=
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
            $15
          )
        `,
        [
          importRecord.id,
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
      snapshotDates,
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
        'Inventory import rollback failed:',
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
            : 'Unknown inventory import error',
        )
      } catch (
        auditError
      ) {
        console.error(
          'Inventory import audit update failed:',
          auditError,
        )
      }
    }

    throw error
  } finally {
    client.release()
  }
}