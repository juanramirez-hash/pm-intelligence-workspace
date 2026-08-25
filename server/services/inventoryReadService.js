export async function loadInventoryDataset(
  pool,
) {
  const client =
    await pool.connect()

  try {
    const rowsResult =
      await client.query(
        `
          SELECT
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
          FROM inventory_snapshots
          ORDER BY
            snapshot_date NULLS FIRST,
            product_name,
            location,
            id
        `,
      )

    const importResult =
      await client.query(
        `
          SELECT
            file_name,
            uploaded_at
          FROM data_imports
          WHERE
            dataset_type = 'inventory'
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
          snapshotDate:
            row.snapshot_date
              ? row.snapshot_date
                  .toISOString()
                  .slice(0, 10)
              : null,

          productName:
            row.product_name,

          productCode:
            row.product_code,

          brand:
            row.brand,

          model:
            row.model,

          location:
            row.location,

          onHand:
            Number(
              row.on_hand,
            ),

          available:
            row.available === null
              ? null
              : Number(
                  row.available,
                ),

          committed:
            row.committed === null
              ? null
              : Number(
                  row.committed,
                ),

          inTransit:
            row.in_transit === null
              ? null
              : Number(
                  row.in_transit,
                ),

          onOrder:
            row.on_order === null
              ? null
              : Number(
                  row.on_order,
                ),

          unitCost:
            row.unit_cost === null
              ? null
              : Number(
                  row.unit_cost,
                ),

          inventoryValue:
            row.inventory_value === null
              ? null
              : Number(
                  row.inventory_value,
                ),

          currency:
            row.currency,
        }),
      )

    return {
      normalizedRows,

      lastImportedFile:
        latestImport?.file_name ??
        'PostgreSQL Inventory',

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