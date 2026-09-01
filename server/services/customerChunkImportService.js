import {
  cancelDataImport,
  completeDataImport,
  createDataImport,
  failDataImport,
} from './dataImportService.js'

export async function startCustomerChunkImport(
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
          'customers',

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

export async function appendCustomerChunk(
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
      'Customer chunk rows must be an array',
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
        'Customer import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'customers'
    ) {
      throw new Error(
        'Import does not belong to customers',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Customer import is not processing',
      )
    }

    const existingChunk =
      await client.query(
        `
          SELECT
            row_count
          FROM customer_import_chunks
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
          INSERT INTO customer_import_staging (
            import_id,
            source_row_number,
            internal_id,
            customer_id,
            name,
            is_duplicate,
            primary_contact,
            category,
            sales_rep,
            sales_rep_location,
            assigned_kam,
            last_sale_date,
            inactive_date,
            phone,
            email,
            location,
            has_physical_location,
            department,
            specialty_brands,
            previous_sales_rep,
            customer_registration_form,
            price_level,
            whatsapp,
            service_segment,
            tax_id,
            catalog_delivered,
            registration_date,
            portal_access_blocked,
            contact_letter,
            billing_version,
            sales_classification,
            frequency_classification,
            purchase_amount_classification,
            permanent_free_local_shipping
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
            $18,
            $19,
            $20,
            $21,
            $22,
            $23,
            $24,
            $25,
            $26,
            $27,
            $28,
            $29,
            $30,
            $31,
            $32,
            $33,
            $34
          )
        `,
        [
          importId,
          (
            chunkIndex *
            500
          ) +
            index +
            1,

          row.internalId ?? null,
          row.customerId,
          row.name,

          Boolean(
            row.isDuplicate,
          ),

          row.primaryContact ?? null,

          row.category ?? null,
          row.salesRep ?? null,
          row.salesRepLocation ?? null,
          row.assignedKam ?? null,

          row.lastSaleDate ?? null,
          row.inactiveDate ?? null,

          row.phone ?? null,
          row.email ?? null,

          row.location ?? null,

          Boolean(
            row.hasPhysicalLocation,
          ),

          row.department ?? null,

          row.specialtyBrands ?? null,
          row.previousSalesRep ?? null,
          row.customerRegistrationForm ?? null,

          row.priceLevel ?? null,

          row.whatsapp ?? null,
          row.serviceSegment ?? null,

          row.taxId ?? null,

          Boolean(
            row.catalogDelivered,
          ),

          row.registrationDate ?? null,

          Boolean(
            row.portalAccessBlocked,
          ),

          row.contactLetter ?? null,
          row.billingVersion ?? null,

          row.salesClassification ?? null,
          row.frequencyClassification ?? null,
          row.purchaseAmountClassification ?? null,

          Boolean(
            row.permanentFreeLocalShipping,
          ),
        ],
      )

      insertedRows += 1
    }

    await client.query(
      `
        INSERT INTO customer_import_chunks (
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
        'Customer chunk rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function cancelCustomerChunkImport(
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
        'Customer import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'customers'
    ) {
      throw new Error(
        'Import does not belong to customers',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Customer import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          DELETE
          FROM customer_import_staging
          WHERE import_id = $1
        `,
        [importId],
      )

    const chunksResult =
      await client.query(
        `
          DELETE
          FROM customer_import_chunks
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
        'Customer import could not be cancelled',
      )
    }

    await client.query('COMMIT')

    return {
      import:
        cancelled,

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
        'Customer cancel rollback failed:',
        rollbackError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}

export async function finalizeCustomerChunkImport(
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
        'Customer import not found',
      )
    }

    if (
      importRecord.dataset_type !==
      'customers'
    ) {
      throw new Error(
        'Import does not belong to customers',
      )
    }

    if (
      importRecord.status !==
      'processing'
    ) {
      throw new Error(
        'Customer import is not processing',
      )
    }

    const stagingResult =
      await client.query(
        `
          SELECT
            COUNT(*)::integer AS row_count
          FROM customer_import_staging
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
        `Customer import row count mismatch: expected ${expectedRows}, received ${stagedRows}`,
      )
    }

    const deleted =
      await client.query(
        `
          DELETE
          FROM customers
        `,
      )

    const replacedRows =
      deleted.rowCount ?? 0

    let insertedRows = 0

    if (stagedRows > 0) {
      const insertResult =
        await client.query(
          `
            INSERT INTO customers (
              import_id,
              internal_id,
              customer_id,
              name,
              is_duplicate,
              primary_contact,
              category,
              sales_rep,
              sales_rep_location,
              assigned_kam,
              last_sale_date,
              inactive_date,
              phone,
              email,
              location,
              has_physical_location,
              department,
              specialty_brands,
              previous_sales_rep,
              customer_registration_form,
              price_level,
              whatsapp,
              service_segment,
              tax_id,
              catalog_delivered,
              registration_date,
              portal_access_blocked,
              contact_letter,
              billing_version,
              sales_classification,
              frequency_classification,
              purchase_amount_classification,
              permanent_free_local_shipping
            )
            SELECT
              import_id,
              internal_id,
              customer_id,
              name,
              is_duplicate,
              primary_contact,
              category,
              sales_rep,
              sales_rep_location,
              assigned_kam,
              last_sale_date,
              inactive_date,
              phone,
              email,
              location,
              has_physical_location,
              department,
              specialty_brands,
              previous_sales_rep,
              customer_registration_form,
              price_level,
              whatsapp,
              service_segment,
              tax_id,
              catalog_delivered,
              registration_date,
              portal_access_blocked,
              contact_letter,
              billing_version,
              sales_classification,
              frequency_classification,
              purchase_amount_classification,
              permanent_free_local_shipping
            FROM customer_import_staging
            WHERE import_id = $1
            ORDER BY
              source_row_number,
              id
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
        FROM customer_import_staging
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query(
      `
        DELETE
        FROM customer_import_chunks
        WHERE import_id = $1
      `,
      [importId],
    )

    await client.query('COMMIT')

    return {
      import:
        completed,

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
        'Customer finalize rollback failed:',
        rollbackError,
      )
    }

    try {
      await failDataImport(
        client,
        importId,
        error instanceof Error
          ? error.message
          : 'Unknown customer finalize error',
      )
    } catch (auditError) {
      console.error(
        'Customer finalize audit update failed:',
        auditError,
      )
    }

    throw error
  } finally {
    client.release()
  }
}