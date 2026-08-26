import {
  cancelDataImport,
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

export async function startPurchaseOrderChunkImport(
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
          'purchases',
        fileName,
        uploadedByUserId,
        importMode:
          'replace-orders',
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

export async function appendPurchaseOrderChunk(
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
      'Purchase Order chunk rows must be an array',
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
        'Purchase Order import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'purchases'
    ) {
      throw new Error(
        'Import does not belong to purchases',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Purchase Order import is not processing',
      )
    }

    const existingChunk =
      await client.query(
        `
          SELECT
            row_count
          FROM purchase_order_import_chunks
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
          INSERT INTO purchase_order_import_staging (
            import_id,
            source_row_number,
            duplicate_occurrences,
            line_key,
            purchase_order_number,
            source_internal_id,
            source_secondary_internal_id,
            purchase_order_reference,
            purchase_order_date,
            period_id,
            expected_receipt_date,
            status,
            main_memo,
            supplier_id,
            supplier_name,
            currency,
            line_type,
            item_code,
            brand,
            line_memo,
            quantity,
            amount_foreign_currency,
            weight,
            supplier_lead_time_days,
            supplier_express_lead_time_days,
            inventory_days,
            shipment_number,
            shipment_status,
            zone,
            purchasing_executive,
            coff_date,
            atd_date,
            ata_date,
            atw_date,
            department,
            value_classification,
            value_score,
            amount_classification
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38
          )
        `,
        [
          importId,
          row.sourceRowNumber,
          row.duplicateOccurrences,
          row.lineKey,
          row.purchaseOrderNumber,
          row.sourceInternalId,
          row.sourceSecondaryInternalId,
          row.purchaseOrderReference,
          row.purchaseOrderDate,
          row.periodId,
          row.expectedReceiptDate,
          row.status,
          row.mainMemo,
          row.supplierId,
          row.supplierName,
          row.currency,
          row.lineType,
          row.itemCode,
          row.brand,
          row.lineMemo,
          row.quantity,
          row.amountForeignCurrency,
          row.weight,
          row.supplierLeadTimeDays,
          row.supplierExpressLeadTimeDays,
          row.inventoryDays,
          row.shipmentNumber,
          row.shipmentStatus,
          row.zone,
          row.purchasingExecutive,
          row.coffDate,
          row.atdDate,
          row.ataDate,
          row.atwDate,
          row.department,
          row.valueClassification,
          row.valueScore,
          row.amountClassification,
        ],
      )

      insertedRows += 1
    }

    await client.query(
      `
        INSERT INTO purchase_order_import_chunks (
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
        'Purchase Order chunk rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function cancelPurchaseOrderChunkImport(
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
        'Purchase Order import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'purchases'
    ) {
      throw new Error(
        'Import does not belong to purchases',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Purchase Order import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          DELETE
          FROM purchase_order_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const chunksResult =
      await client.query(
        `
          DELETE
          FROM purchase_order_import_chunks
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
        'Purchase Order import could not be cancelled',
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
        'Purchase Order cancel rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function finalizePurchaseOrderChunkImport(
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
        'Purchase Order import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'purchases'
    ) {
      throw new Error(
        'Import does not belong to purchases',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Purchase Order import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          SELECT
            COUNT(*)::integer AS row_count
          FROM purchase_order_import_staging
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
        `Purchase Order import row count mismatch: expected ${expectedRows}, received ${stagedRows}`,
      )
    }

    let replacedRows = 0
    let insertedRows = 0

    if (stagedRows > 0) {
      const deleteResult =
        await client.query(
          `
            DELETE
            FROM purchase_orders
            WHERE purchase_order_number IN (
              SELECT DISTINCT
                purchase_order_number
              FROM purchase_order_import_staging
              WHERE import_id = $1
            )
          `,
          [importId],
        )

      replacedRows =
        deleteResult.rowCount ?? 0

      const insertResult =
        await client.query(
          `
            INSERT INTO purchase_orders (
              import_id,
              line_key,
              source_row_number,
              duplicate_occurrences,
              purchase_order_number,
              source_internal_id,
              source_secondary_internal_id,
              purchase_order_reference,
              purchase_order_date,
              period_id,
              expected_receipt_date,
              status,
              main_memo,
              supplier_id,
              supplier_name,
              currency,
              line_type,
              item_code,
              brand,
              line_memo,
              quantity,
              amount_foreign_currency,
              weight,
              supplier_lead_time_days,
              supplier_express_lead_time_days,
              inventory_days,
              shipment_number,
              shipment_status,
              zone,
              purchasing_executive,
              coff_date,
              atd_date,
              ata_date,
              atw_date,
              department,
              value_classification,
              value_score,
              amount_classification
            )
            SELECT
              staging.import_id,
              staging.line_key,
              staging.source_row_number,
              staging.duplicate_occurrences,
              staging.purchase_order_number,
              staging.source_internal_id,
              staging.source_secondary_internal_id,
              staging.purchase_order_reference,
              staging.purchase_order_date,
              staging.period_id,
              staging.expected_receipt_date,
              staging.status,
              staging.main_memo,
              staging.supplier_id,
              staging.supplier_name,
              staging.currency,
              staging.line_type,
              staging.item_code,
              staging.brand,
              staging.line_memo,
              staging.quantity,
              staging.amount_foreign_currency,
              staging.weight,
              staging.supplier_lead_time_days,
              staging.supplier_express_lead_time_days,
              staging.inventory_days,
              staging.shipment_number,
              staging.shipment_status,
              staging.zone,
              staging.purchasing_executive,
              staging.coff_date,
              staging.atd_date,
              staging.ata_date,
              staging.atw_date,
              staging.department,
              staging.value_classification,
              staging.value_score,
              staging.amount_classification
            FROM purchase_order_import_staging staging
            WHERE staging.import_id = $1
            ORDER BY
              staging.purchase_order_date,
              staging.purchase_order_number,
              staging.source_row_number
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
            stagedRows,
          insertedRows,
          replacedRows,
          ignoredRows,
        },
      )

    await client.query(
      `
        DELETE
        FROM purchase_order_import_staging
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query(
      `
        DELETE
        FROM purchase_order_import_chunks
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query('COMMIT')

    return {
      import: completed,
      insertedRows,
      replacedRows,
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error(
        'Purchase Order finalize rollback failed:',
        rollbackError,
      )
    }

    try {
      await failDataImport(
        client,
        importId,
        error instanceof Error
          ? error.message
          : 'Unknown Purchase Order finalize error',
      )
    } catch (auditError) {
      console.error(
        'Purchase Order finalize audit update failed:',
        auditError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}