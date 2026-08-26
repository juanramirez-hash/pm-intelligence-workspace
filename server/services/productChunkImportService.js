import {
  cancelDataImport,
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

export async function startProductChunkImport(
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
          'products',
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

export async function appendProductChunk(
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
      'Product chunk rows must be an array',
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
        'Product import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'products'
    ) {
      throw new Error(
        'Import does not belong to products',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Product import is not processing',
      )
    }

    const existingChunk =
      await client.query(
        `
          SELECT
            row_count
          FROM product_import_chunks
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
          INSERT INTO product_import_staging (
            import_id,
            source_row_number,
            erp_internal_id,
            name,
            code,
            model,
            brand,
            vendor_code,
            vendor_name,
            description,
            classification,
            commercial_status,
            trend,
            category,
            subcategory1,
            subcategory2,
            source_created_at,
            source_updated_at,
            average_cost_usd,
            total_value,
            currency,
            inventory_value_mxn,
            inventory_value_usd,
            last_purchase_date,
            last_sale_date,
            units_sold_last_90_days,
            preferred_vendor,
            product_class,
            secondary_category1,
            secondary_category2,
            quantity_pricing_schedule,
            formula_text,
            on_hand,
            on_order,
            catalog_status,
            inactive_for_purchases,
            show_on_portal,
            superseded_by,
            block_purchase_requests,
            direct_substitute,
            benchmark_s,
            benchmark_t,
            benchmark_o
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
            $41, $42, $43
          )
        `,
        [
          importId,
          sourceRowOffset + index + 1,
          row.erpInternalId,
          row.name,
          row.code,
          row.model,
          row.brand,
          row.vendorCode,
          row.vendorName,
          row.description,
          row.classification,
          row.commercialStatus,
          row.trend,
          row.category,
          row.subcategory1,
          row.subcategory2,
          row.createdAt,
          row.updatedAt,
          row.averageCostUsd,
          row.totalValue,
          row.currency,
          row.inventoryValueMxn,
          row.inventoryValueUsd,
          row.lastPurchaseDate,
          row.lastSaleDate,
          row.unitsSoldLast90Days,
          row.preferredVendor,
          row.productClass,
          row.secondaryCategory1,
          row.secondaryCategory2,
          row.quantityPricingSchedule,
          row.formulaText,
          row.onHand,
          row.onOrder,
          row.catalogStatus,
          row.inactiveForPurchases,
          row.showOnPortal,
          row.supersededBy,
          row.blockPurchaseRequests,
          row.directSubstitute,
          row.benchmarkS,
          row.benchmarkT,
          row.benchmarkO,
        ],
      )

      insertedRows += 1
    }

    await client.query(
      `
        INSERT INTO product_import_chunks (
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
        'Product chunk rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function cancelProductChunkImport(
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
        'Product import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'products'
    ) {
      throw new Error(
        'Import does not belong to products',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Product import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          DELETE
          FROM product_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const chunksResult =
      await client.query(
        `
          DELETE
          FROM product_import_chunks
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
        'Product import could not be cancelled',
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
        'Product cancel rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function finalizeProductChunkImport(
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
        'Product import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'products'
    ) {
      throw new Error(
        'Import does not belong to products',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Product import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          SELECT
            COUNT(*)::integer AS row_count
          FROM product_import_staging
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
        `Product import row count mismatch: expected ${expectedRows}, received ${stagedRows}`,
      )
    }

    const deleted =
      await client.query(
        `
          DELETE
          FROM products
        `,
      )

    const replacedRows =
      deleted.rowCount ?? 0

    let insertedRows = 0

    if (stagedRows > 0) {
      const insertResult =
        await client.query(
          `
            INSERT INTO products (
              import_id,
              erp_internal_id,
              name,
              code,
              model,
              brand,
              vendor_code,
              vendor_name,
              description,
              classification,
              commercial_status,
              trend,
              category,
              subcategory1,
              subcategory2,
              source_created_at,
              source_updated_at,
              average_cost_usd,
              total_value,
              currency,
              inventory_value_mxn,
              inventory_value_usd,
              last_purchase_date,
              last_sale_date,
              units_sold_last_90_days,
              preferred_vendor,
              product_class,
              secondary_category1,
              secondary_category2,
              quantity_pricing_schedule,
              formula_text,
              on_hand,
              on_order,
              catalog_status,
              inactive_for_purchases,
              show_on_portal,
              superseded_by,
              block_purchase_requests,
              direct_substitute,
              benchmark_s,
              benchmark_t,
              benchmark_o
            )
            SELECT
              staging.import_id,
              staging.erp_internal_id,
              staging.name,
              staging.code,
              staging.model,
              staging.brand,
              staging.vendor_code,
              staging.vendor_name,
              staging.description,
              staging.classification,
              staging.commercial_status,
              staging.trend,
              staging.category,
              staging.subcategory1,
              staging.subcategory2,
              staging.source_created_at,
              staging.source_updated_at,
              staging.average_cost_usd,
              staging.total_value,
              staging.currency,
              staging.inventory_value_mxn,
              staging.inventory_value_usd,
              staging.last_purchase_date,
              staging.last_sale_date,
              staging.units_sold_last_90_days,
              staging.preferred_vendor,
              staging.product_class,
              staging.secondary_category1,
              staging.secondary_category2,
              staging.quantity_pricing_schedule,
              staging.formula_text,
              staging.on_hand,
              staging.on_order,
              staging.catalog_status,
              staging.inactive_for_purchases,
              staging.show_on_portal,
              staging.superseded_by,
              staging.block_purchase_requests,
              staging.direct_substitute,
              staging.benchmark_s,
              staging.benchmark_t,
              staging.benchmark_o
            FROM product_import_staging staging
            WHERE staging.import_id = $1
            ORDER BY
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
        FROM product_import_staging
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query(
      `
        DELETE
        FROM product_import_chunks
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
        'Product finalize rollback failed:',
        rollbackError,
      )
    }

    try {
      await failDataImport(
        client,
        importId,
        error instanceof Error
          ? error.message
          : 'Unknown product finalize error',
      )
    } catch (auditError) {
      console.error(
        'Product finalize audit update failed:',
        auditError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}