import {
  cancelDataImport,
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

export async function startProjectChunkImport(
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
          'projects',
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

export async function appendProjectChunk(
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
      'Project chunk rows must be an array',
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
        'Project import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'projects'
    ) {
      throw new Error(
        'Import does not belong to projects',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Project import is not processing',
      )
    }

    const existingChunk =
      await client.query(
        `
          SELECT
            row_count
          FROM project_import_chunks
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
          INSERT INTO project_import_staging (
            import_id,
            internal_id,
            project_id,
            name,
            end_user,
            customer_id,
            customer_name,
            sales_executive,
            location,
            assigned_business_developer,
            assigned_product_manager,
            project_group,
            primary_brand,
            source_created_at,
            elapsed_days,
            currency,
            status_code,
            status_label,
            forecast_stage,
            closing_probability,
            estimated_close_date,
            estimated_billing_date,
            amount_to_close,
            observations,
            assigned_engineer,
            approximate_amount,
            invoiced_amount,
            report_amount_to_invoice,
            amount_to_invoice,
            is_duplicate
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
          )
        `,
        [
          importId,
          row.internalId,
          row.projectId,
          row.name,
          row.endUser,
          row.customerId,
          row.customerName,
          row.salesExecutive,
          row.location,
          row.assignedBusinessDeveloper,
          row.assignedProductManager,
          row.group,
          row.primaryBrand,
          row.createdAt,
          row.elapsedDays,
          row.currency,
          row.statusCode,
          row.statusLabel,
          row.forecastStage,
          row.closingProbability,
          row.estimatedCloseDate,
          row.estimatedBillingDate,
          row.amountToClose,
          row.observations,
          row.assignedEngineer,
          row.approximateAmount,
          row.invoicedAmount,
          row.reportAmountToInvoice,
          row.amountToInvoice,
          row.isDuplicate,
        ],
      )

      insertedRows += 1
    }

    await client.query(
      `
        INSERT INTO project_import_chunks (
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
        'Project chunk rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function cancelProjectChunkImport(
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
        'Project import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'projects'
    ) {
      throw new Error(
        'Import does not belong to projects',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Project import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          DELETE
          FROM project_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const chunksResult =
      await client.query(
        `
          DELETE
          FROM project_import_chunks
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
        'Project import could not be cancelled',
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
        'Project cancel rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function finalizeProjectChunkImport(
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
        'Project import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'projects'
    ) {
      throw new Error(
        'Import does not belong to projects'
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Project import is not processing',
      )
    }

           const stagingResult =
      await client.query(
        `
          SELECT
            COUNT(*)::integer AS row_count
          FROM project_import_staging
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
        `Project import row count mismatch: expected ${expectedRows}, received ${stagedRows}`,
      )
    }

    let replacedRows = 0
    let insertedRows = 0

    if (stagedRows > 0) {
      const identityConflictResult =
        await client.query(
          `
            SELECT
              staging.internal_id,
              staging.project_id,
              existing.internal_id
                AS existing_internal_id
            FROM project_import_staging staging
            INNER JOIN projects existing
              ON existing.project_id =
                staging.project_id
              AND existing.internal_id <>
                staging.internal_id
            WHERE staging.import_id = $1
            LIMIT 1
          `,
          [importId],
        )

      const identityConflict =
        identityConflictResult.rows[0]

      if (identityConflict) {
        throw new Error(
          `Project identity conflict: projectId ${identityConflict.project_id} belongs to internalId ${identityConflict.existing_internal_id}, not ${identityConflict.internal_id}`,
        )
      }

      const deleteResult =
        await client.query(
          `
            DELETE
            FROM projects
            WHERE internal_id IN (
              SELECT
                internal_id
              FROM project_import_staging
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
            INSERT INTO projects (
              import_id,
              internal_id,
              project_id,
              name,
              end_user,
              customer_id,
              customer_name,
              sales_executive,
              location,
              assigned_business_developer,
              assigned_product_manager,
              project_group,
              primary_brand,
              source_created_at,
              elapsed_days,
              currency,
              status_code,
              status_label,
              forecast_stage,
              closing_probability,
              estimated_close_date,
              estimated_billing_date,
              amount_to_close,
              observations,
              assigned_engineer,
              approximate_amount,
              invoiced_amount,
              report_amount_to_invoice,
              amount_to_invoice,
              is_duplicate
            )
            SELECT
              staging.import_id,
              staging.internal_id,
              staging.project_id,
              staging.name,
              staging.end_user,
              staging.customer_id,
              staging.customer_name,
              staging.sales_executive,
              staging.location,
              staging.assigned_business_developer,
              staging.assigned_product_manager,
              staging.project_group,
              staging.primary_brand,
              staging.source_created_at,
              staging.elapsed_days,
              staging.currency,
              staging.status_code,
              staging.status_label,
              staging.forecast_stage,
              staging.closing_probability,
              staging.estimated_close_date,
              staging.estimated_billing_date,
              staging.amount_to_close,
              staging.observations,
              staging.assigned_engineer,
              staging.approximate_amount,
              staging.invoiced_amount,
              staging.report_amount_to_invoice,
              staging.amount_to_invoice,
              staging.is_duplicate
            FROM project_import_staging staging
            WHERE staging.import_id = $1
            ORDER BY
              staging.project_id
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
        FROM project_import_staging
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query(
      `
        DELETE
        FROM project_import_chunks
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
        'Project finalize rollback failed:',
        rollbackError,
      )
    }

    try {
      await failDataImport(
        client,
        importId,
        error instanceof Error
          ? error.message
          : 'Unknown Project finalize error',
      )
    } catch (auditError) {
      console.error(
        'Project finalize audit update failed:',
        auditError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}
