import {
  cancelDataImport,
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

export async function startProjectBillingChunkImport(
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
          'projectBillings',
        fileName,
        uploadedByUserId,
        importMode:
          'upsert',
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

export async function appendProjectBillingChunk(
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
      'Project Billing chunk rows must be an array',
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
        'Project Billing import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'projectBillings'
    ) {
      throw new Error(
        'Import does not belong to projectBillings',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Project Billing import is not processing',
      )
    }

    const existingChunk =
      await client.query(
        `
          SELECT
            row_count
          FROM project_billing_import_chunks
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
    INSERT INTO project_billing_import_staging (
      import_id,
      line_key,
      duplicate_occurrences,
      internal_id,
      project_id,
      project_description,
      end_user,
      customer_id,
      customer_name,
      primary_brand,
      item_code,
      model,
      brand,
      quantity,
      amount,
      billing_date,
      period_id,
      document_number,
      document_type,
      document_status,
      created_from,
      related_document_status,
      currency,
      is_voided,
      estimated_close_date,
      estimated_billing_date,
      estimated_delivery_date,
      sales_representative,
      sales_location,
      assigned_business_developer,
      purchase_description
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
      $31
    )
  `,
  [
    importId,
    row.lineKey,
    row.duplicateOccurrences,
    row.internalId,
    row.projectId,
    row.projectDescription,
    row.endUser,
    row.customerId,
    row.customerName,
    row.primaryBrand,
    row.itemCode,
    row.model,
    row.brand,
    row.quantity,
    row.amount,
    row.date,
    row.periodId,
    row.documentNumber,
    row.documentType,
    row.documentStatus,
    row.createdFrom,
    row.relatedDocumentStatus,
    row.currency,
    row.isVoided,
    row.estimatedCloseDate,
    row.estimatedBillingDate,
    row.estimatedDeliveryDate,
    row.salesRepresentative,
    row.salesLocation,
    row.assignedBusinessDeveloper,
    row.purchaseDescription,
  ],
)

      insertedRows += 1
    }

    await client.query(
      `
        INSERT INTO project_billing_import_chunks (
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
        'Project Billing chunk rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function cancelProjectBillingChunkImport(
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
        'Project Billing import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'projectBillings'
    ) {
      throw new Error(
        'Import does not belong to projectBillings',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Project Billing import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          DELETE
          FROM project_billing_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const chunksResult =
      await client.query(
        `
          DELETE
          FROM project_billing_import_chunks
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
        'Project Billing import could not be cancelled',
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
        'Project Billing cancel rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function finalizeProjectBillingChunkImport(
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
        'Project Billing import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'projectBillings'
    ) {
      throw new Error(
        'Import does not belong to projectBillings'
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Project Billing import is not processing',
      )
    }

           const stagingResult =
      await client.query(
        `
          SELECT
            COUNT(*)::integer AS row_count
          FROM project_billing_import_staging
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
        `Project Billing import row count mismatch: expected ${expectedRows}, received ${stagedRows}`,
      )
    }

    let replacedRows = 0
    let insertedRows = 0

    if (stagedRows > 0) {
      const deleteResult =
  await client.query(
    `
      DELETE
      FROM project_billings
      WHERE internal_id IN (
        SELECT DISTINCT
          internal_id
        FROM project_billing_import_staging
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
      INSERT INTO project_billings (
        import_id,
        line_key,
        duplicate_occurrences,
        internal_id,
        project_id,
        project_description,
        end_user,
        customer_id,
        customer_name,
        primary_brand,
        item_code,
        model,
        brand,
        quantity,
        amount,
        billing_date,
        period_id,
        document_number,
        document_type,
        document_status,
        created_from,
        related_document_status,
        currency,
        is_voided,
        estimated_close_date,
        estimated_billing_date,
        estimated_delivery_date,
        sales_representative,
        sales_location,
        assigned_business_developer,
        purchase_description
      )
      SELECT
        staging.import_id,
        staging.line_key,
        staging.duplicate_occurrences,
        staging.internal_id,
        staging.project_id,
        staging.project_description,
        staging.end_user,
        staging.customer_id,
        staging.customer_name,
        staging.primary_brand,
        staging.item_code,
        staging.model,
        staging.brand,
        staging.quantity,
        staging.amount,
        staging.billing_date,
        staging.period_id,
        staging.document_number,
        staging.document_type,
        staging.document_status,
        staging.created_from,
        staging.related_document_status,
        staging.currency,
        staging.is_voided,
        staging.estimated_close_date,
        staging.estimated_billing_date,
        staging.estimated_delivery_date,
        staging.sales_representative,
        staging.sales_location,
        staging.assigned_business_developer,
        staging.purchase_description
      FROM project_billing_import_staging staging
      WHERE staging.import_id = $1
      ORDER BY
        staging.billing_date,
        staging.document_number,
        staging.line_key
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
        FROM project_billing_import_staging
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query(
      `
        DELETE
        FROM project_billing_import_chunks
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
        'Project Billing finalize rollback failed:',
        rollbackError,
      )
    }

    try {
      await failDataImport(
        client,
        importId,
        error instanceof Error
          ? error.message
          : 'Unknown Project Billing finalize error',
      )
    } catch (auditError) {
      console.error(
        'Project Billing finalize audit update failed:',
        auditError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}
