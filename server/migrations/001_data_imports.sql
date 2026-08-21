CREATE TABLE IF NOT EXISTS data_imports (
  id BIGSERIAL PRIMARY KEY,

  dataset_type TEXT NOT NULL,
  file_name TEXT NOT NULL,

  uploaded_by_user_id BIGINT
    REFERENCES app_users(id)
    ON DELETE SET NULL,

  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  import_mode TEXT NOT NULL
    CHECK (
      import_mode IN (
        'append',
        'upsert',
        'replace-periods',
        'replace-snapshot',
        'replace-all'
      )
    ),

  period_start DATE,
  period_end DATE,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled'
      )
    ),

  source_row_count INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  inserted_rows INTEGER NOT NULL DEFAULT 0,
  updated_rows INTEGER NOT NULL DEFAULT 0,
  replaced_rows INTEGER NOT NULL DEFAULT 0,
  ignored_rows INTEGER NOT NULL DEFAULT 0,
  rejected_rows INTEGER NOT NULL DEFAULT 0,

  checksum_sha256 TEXT,

  error_message TEXT,

  completed_at TIMESTAMPTZ,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_data_imports_dataset_type
  ON data_imports(dataset_type);

CREATE INDEX IF NOT EXISTS idx_data_imports_uploaded_at
  ON data_imports(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_imports_uploaded_by
  ON data_imports(uploaded_by_user_id);

CREATE INDEX IF NOT EXISTS idx_data_imports_status
  ON data_imports(status);

CREATE INDEX IF NOT EXISTS idx_data_imports_period
  ON data_imports(period_start, period_end);