import {
  cancelDataImport,
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

export async function startPurchaseRequestChunkImport(
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
          'purchaseRequests',
        fileName,
        uploadedByUserId,
        importMode:
          'replace-requests',
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

export async function appendPurchaseRequestChunk(
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
      'Purchase Request chunk rows must be an array',
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
        'Purchase Request import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'purchaseRequests'
    ) {
      throw new Error(
        'Import does not belong to purchase requests',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Purchase Request import is not processing',
      )
    }

    const existingChunk =
      await client.query(
        `
          SELECT
            row_count
          FROM purchase_request_import_chunks
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
          INSERT INTO purchase_request_import_staging (
            import_id,
            source_row_number,
            duplicate_occurrences,
            request_key,
            purchase_request_number,
            source_internal_id,
            request_date,
            period_id,
            sales_order_number,
            related_purchase_order_number,
            request_status,
            source_item_status,
            order_status,
            item_code,
            brand,
            model,
            description,
            quantity,
            cash_authorization_status,
            advance_payment_note,
            already_ordered_status,
            executive_name,
            stock_quantity,
            available_for_sale_quantity,
            cash_release_date,
            request_expiration_date,
            expected_purchase_order_arrival_date,
            preferred_supplier_name,
            actual_supplier_name,
            branch,
            item_blocked_for_request_status,
            rma_order_status,
            purchasing_traffic_comments,
            project_id,
            project_estimated_delivery_date,
            request_estimated_delivery_date,
            created_by,
            source_elapsed_days,
            express_shipping_paid_status,
            project_warehouse_order_status,
            assigned_buyer,
            process_date
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
            $41, $42
          )
        `,
        [
          importId,
          row.sourceRowNumber,
          row.duplicateOccurrences,
          row.requestKey,
          row.purchaseRequestNumber,
          row.sourceInternalId,
          row.requestDate,
          row.periodId,
          row.salesOrderNumber,
          row.relatedPurchaseOrderNumber,
          row.requestStatus,
          row.sourceItemStatus,
          row.orderStatus,
          row.itemCode,
          row.brand,
          row.model,
          row.description,
          row.quantity,
          row.cashAuthorizationStatus,
          row.advancePaymentNote,
          row.alreadyOrderedStatus,
          row.executiveName,
          row.stockQuantity,
          row.availableForSaleQuantity,
          row.cashReleaseDate,
          row.requestExpirationDate,
          row.expectedPurchaseOrderArrivalDate,
          row.preferredSupplierName,
          row.actualSupplierName,
          row.branch,
          row.itemBlockedForRequestStatus,
          row.rmaOrderStatus,
          row.purchasingTrafficComments,
          row.projectId,
          row.projectEstimatedDeliveryDate,
          row.requestEstimatedDeliveryDate,
          row.createdBy,
          row.sourceElapsedDays,
          row.expressShippingPaidStatus,
          row.projectWarehouseOrderStatus,
          row.assignedBuyer,
          row.processDate,
        ],
      )

      insertedRows += 1
    }

    await client.query(
      `
        INSERT INTO purchase_request_import_chunks (
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
        'Purchase Request chunk rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function cancelPurchaseRequestChunkImport(
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
        'Purchase Request import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'purchaseRequests'
    ) {
      throw new Error(
        'Import does not belong to purchase requests',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Purchase Request import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          DELETE
          FROM purchase_request_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const chunksResult =
      await client.query(
        `
          DELETE
          FROM purchase_request_import_chunks
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
        'Purchase Request import could not be cancelled',
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
        'Purchase Request cancel rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function finalizePurchaseRequestChunkImport(
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
        'Purchase Request import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'purchaseRequests'
    ) {
      throw new Error(
        'Import does not belong to purchase requests'
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Purchase Request import is not processing',
      )
    }

        const stagingResult =
      await client.query(
        `
          SELECT
            COUNT(*)::integer AS row_count
          FROM purchase_request_import_staging
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
        `Purchase Request import row count mismatch: expected ${expectedRows}, received ${stagedRows}`,
      )
    }

    let replacedRows = 0
    let insertedRows = 0

    if (stagedRows > 0) {
      const deleteResult =
        await client.query(
          `
            DELETE
            FROM purchase_requests
            WHERE purchase_request_number IN (
              SELECT DISTINCT
                purchase_request_number
              FROM purchase_request_import_staging
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
            INSERT INTO purchase_requests (
              import_id,
              request_key,
              source_row_number,
              duplicate_occurrences,
              purchase_request_number,
              source_internal_id,
              request_date,
              period_id,
              sales_order_number,
              related_purchase_order_number,
              request_status,
              source_item_status,
              order_status,
              item_code,
              brand,
              model,
              description,
              quantity,
              cash_authorization_status,
              advance_payment_note,
              already_ordered_status,
              executive_name,
              stock_quantity,
              available_for_sale_quantity,
              cash_release_date,
              request_expiration_date,
              expected_purchase_order_arrival_date,
              preferred_supplier_name,
              actual_supplier_name,
              branch,
              item_blocked_for_request_status,
              rma_order_status,
              purchasing_traffic_comments,
              project_id,
              project_estimated_delivery_date,
              request_estimated_delivery_date,
              created_by,
              source_elapsed_days,
              express_shipping_paid_status,
              project_warehouse_order_status,
              assigned_buyer,
              process_date
            )
            SELECT
              staging.import_id,
              staging.request_key,
              staging.source_row_number,
              staging.duplicate_occurrences,
              staging.purchase_request_number,
              staging.source_internal_id,
              staging.request_date,
              staging.period_id,
              staging.sales_order_number,
              staging.related_purchase_order_number,
              staging.request_status,
              staging.source_item_status,
              staging.order_status,
              staging.item_code,
              staging.brand,
              staging.model,
              staging.description,
              staging.quantity,
              staging.cash_authorization_status,
              staging.advance_payment_note,
              staging.already_ordered_status,
              staging.executive_name,
              staging.stock_quantity,
              staging.available_for_sale_quantity,
              staging.cash_release_date,
              staging.request_expiration_date,
              staging.expected_purchase_order_arrival_date,
              staging.preferred_supplier_name,
              staging.actual_supplier_name,
              staging.branch,
              staging.item_blocked_for_request_status,
              staging.rma_order_status,
              staging.purchasing_traffic_comments,
              staging.project_id,
              staging.project_estimated_delivery_date,
              staging.request_estimated_delivery_date,
              staging.created_by,
              staging.source_elapsed_days,
              staging.express_shipping_paid_status,
              staging.project_warehouse_order_status,
              staging.assigned_buyer,
              staging.process_date
            FROM purchase_request_import_staging staging
            WHERE staging.import_id = $1
            ORDER BY
              staging.request_date,
              staging.purchase_request_number,
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
        FROM purchase_request_import_staging
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query(
      `
        DELETE
        FROM purchase_request_import_chunks
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
        'Purchase Request finalize rollback failed:',
        rollbackError,
      )
    }

    try {
      await failDataImport(
        client,
        importId,
        error instanceof Error
          ? error.message
          : 'Unknown Purchase Request finalize error',
      )
    } catch (auditError) {
      console.error(
        'Purchase Request finalize audit update failed:',
        auditError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}
