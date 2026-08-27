BEGIN;

CREATE TABLE IF NOT EXISTS project_import_staging (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  internal_id TEXT NOT NULL,
  project_id TEXT NOT NULL,

  name TEXT NOT NULL,

  end_user TEXT,
  customer_id TEXT,
  customer_name TEXT,

  sales_executive TEXT,
  location TEXT,
  assigned_business_developer TEXT,
  assigned_product_manager TEXT,
  project_group TEXT,
  primary_brand TEXT,

  source_created_at TIMESTAMPTZ,
  elapsed_days NUMERIC(18, 4),
  currency TEXT,

  status_code TEXT NOT NULL
    CHECK (
      status_code IN (
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
        '07',
        '08',
        'unknown'
      )
    ),

  status_label TEXT NOT NULL,

  forecast_stage TEXT NOT NULL
    CHECK (
      forecast_stage IN (
        'early',
        'potential',
        'mature',
        'realized',
        'cancelled',
        'unknown'
      )
    ),

  closing_probability NUMERIC(12, 6),

  estimated_close_date DATE,
  estimated_billing_date DATE,

  amount_to_close NUMERIC(18, 4),

  observations TEXT,
  assigned_engineer TEXT,

  approximate_amount NUMERIC(18, 4),
  invoiced_amount NUMERIC(18, 4),
  report_amount_to_invoice NUMERIC(18, 4),
  amount_to_invoice NUMERIC(18, 4),

  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_project_import_staging_internal_id
    UNIQUE (import_id, internal_id),

  CONSTRAINT uq_project_import_staging_project_id
    UNIQUE (import_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_import_staging_import_id
  ON project_import_staging(import_id);

CREATE TABLE IF NOT EXISTS project_import_chunks (
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
  project_import_staging,
  project_import_chunks
TO pm_intelligence;

GRANT USAGE, SELECT
ON SEQUENCE project_import_staging_id_seq
TO pm_intelligence;

COMMIT;