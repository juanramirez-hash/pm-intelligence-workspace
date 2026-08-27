BEGIN;

CREATE TABLE IF NOT EXISTS project_billing_import_staging (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  line_key TEXT NOT NULL,
  duplicate_occurrences INTEGER NOT NULL DEFAULT 0,

  internal_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  project_description TEXT,

  end_user TEXT,
  customer_id TEXT,
  customer_name TEXT,
  primary_brand TEXT,

  item_code TEXT,
  model TEXT,
  brand TEXT,

  quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  amount NUMERIC(18, 4) NOT NULL DEFAULT 0,

  billing_date DATE NOT NULL,
  period_id TEXT NOT NULL,
  document_number TEXT NOT NULL,

  document_type TEXT NOT NULL
    CHECK (
      document_type IN (
        'invoice',
        'credit_note',
        'other'
      )
    ),

  document_status TEXT,
  created_from TEXT,
  related_document_status TEXT,
  currency TEXT,

  is_voided BOOLEAN NOT NULL DEFAULT FALSE,

  estimated_close_date DATE,
  estimated_billing_date DATE,
  estimated_delivery_date DATE,

  sales_representative TEXT,
  sales_location TEXT,
  assigned_business_developer TEXT,
  purchase_description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_project_billing_import_staging_line_key
    UNIQUE (import_id, line_key)
);

CREATE INDEX IF NOT EXISTS idx_project_billing_import_staging_import_id
  ON project_billing_import_staging(import_id);

CREATE INDEX IF NOT EXISTS idx_project_billing_import_staging_internal_id
  ON project_billing_import_staging(import_id, internal_id);

CREATE TABLE IF NOT EXISTS project_billing_import_chunks (
  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  chunk_index INTEGER NOT NULL,
  row_count INTEGER NOT NULL,
  checksum_sha256 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (
    import_id,
    chunk_index
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE
ON
  project_billing_import_staging,
  project_billing_import_chunks
TO pm_intelligence;

GRANT USAGE, SELECT
ON SEQUENCE project_billing_import_staging_id_seq
TO pm_intelligence;

COMMIT;