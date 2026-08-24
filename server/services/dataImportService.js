export async function createDataImport(
  client,
  {
    datasetType,
    fileName,
    uploadedByUserId,
    importMode,
    periodStart = null,
    periodEnd = null,
    sourceRowCount = 0,
    checksumSha256 = null,
    metadata = {},
  },
) {
  const result = await client.query(
    `
      INSERT INTO data_imports (
        dataset_type,
        file_name,
        uploaded_by_user_id,
        import_mode,
        period_start,
        period_end,
        status,
        source_row_count,
        checksum_sha256,
        metadata
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'processing',
        $7,
        $8,
        $9::jsonb
      )
      RETURNING
        id,
        dataset_type,
        file_name,
        uploaded_by_user_id,
        uploaded_at,
        import_mode,
        period_start,
        period_end,
        status,
        source_row_count
    `,
    [
      datasetType,
      fileName,
      uploadedByUserId,
      importMode,
      periodStart,
      periodEnd,
      sourceRowCount,
      checksumSha256,
      JSON.stringify(metadata),
    ],
  )

  return result.rows[0]
}

export async function completeDataImport(
  client,
  importId,
  {
    processedRows = 0,
    insertedRows = 0,
    updatedRows = 0,
    replacedRows = 0,
    ignoredRows = 0,
    rejectedRows = 0,
  } = {},
) {
  const result = await client.query(
    `
      UPDATE data_imports
      SET
        status = 'completed',
        processed_rows = $2,
        inserted_rows = $3,
        updated_rows = $4,
        replaced_rows = $5,
        ignored_rows = $6,
        rejected_rows = $7,
        completed_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      importId,
      processedRows,
      insertedRows,
      updatedRows,
      replacedRows,
      ignoredRows,
      rejectedRows,
    ],
  )

  return result.rows[0] ?? null
}

export async function failDataImport(
  client,
  importId,
  errorMessage,
) {
  const result = await client.query(
    `
      UPDATE data_imports
      SET
        status = 'failed',
        error_message = $2,
        completed_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      importId,
      errorMessage,
    ],
  )

  return result.rows[0] ?? null
}

export async function cancelDataImport(
  client,
  importId,
  reason = 'Import cancelled by user',
) {
  const result = await client.query(
    `
      UPDATE data_imports
      SET
        status = 'cancelled',
        error_message = $2,
        completed_at = NOW()
      WHERE
        id = $1
        AND status = 'processing'
      RETURNING *
    `,
    [
      importId,
      reason,
    ],
  )

  return result.rows[0] ?? null
}