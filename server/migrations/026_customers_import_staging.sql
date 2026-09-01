BEGIN;

CREATE TABLE IF NOT EXISTS customer_import_staging (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  source_row_number INTEGER NOT NULL,

  internal_id TEXT,
  customer_id TEXT NOT NULL,
  name TEXT NOT NULL,

  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,

  primary_contact TEXT,

  category TEXT,
  sales_rep TEXT,
  sales_rep_location TEXT,
  assigned_kam TEXT,

  last_sale_date DATE,
  inactive_date DATE,

  phone TEXT,
  email TEXT,

  location TEXT,
  has_physical_location BOOLEAN NOT NULL DEFAULT FALSE,
  department TEXT,

  specialty_brands TEXT,
  previous_sales_rep TEXT,
  customer_registration_form TEXT,

  price_level TEXT,

  whatsapp TEXT,
  service_segment TEXT,

  tax_id TEXT,

  catalog_delivered BOOLEAN NOT NULL DEFAULT FALSE,

  registration_date DATE,

  portal_access_blocked BOOLEAN NOT NULL DEFAULT FALSE,

  contact_letter TEXT,
  billing_version TEXT,

  sales_classification TEXT,
  frequency_classification TEXT,
  purchase_amount_classification TEXT,

  permanent_free_local_shipping BOOLEAN
    NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_customer_import_staging_row
    UNIQUE (
      import_id,
      source_row_number
    ),

  CONSTRAINT uq_customer_import_staging_customer
    UNIQUE (
      import_id,
      customer_id
    ),

  CONSTRAINT uq_customer_import_staging_internal_id
    UNIQUE (
      import_id,
      internal_id
    )
);

CREATE INDEX IF NOT EXISTS idx_customer_import_staging_import_id
  ON customer_import_staging(import_id);

CREATE INDEX IF NOT EXISTS idx_customer_import_staging_customer_id
  ON customer_import_staging(customer_id);

CREATE TABLE IF NOT EXISTS customer_import_chunks (
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
  customer_import_staging,
  customer_import_chunks
TO pm_intelligence;

GRANT USAGE, SELECT
ON SEQUENCE customer_import_staging_id_seq
TO pm_intelligence;

COMMIT;