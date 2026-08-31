CREATE TABLE IF NOT EXISTS pricing_import_staging (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  source_price_id TEXT,

  product_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  currency TEXT NOT NULL,

  cost NUMERIC(18, 4) NOT NULL,
  list_price NUMERIC(18, 4) NOT NULL,
  selling_price NUMERIC(18, 4),

  pricing_group_id TEXT,
  effective_date DATE,

  source TEXT,
  source_reference TEXT,

  source_row_number INTEGER NOT NULL,

  source_channel TEXT NOT NULL
    CHECK (
      source_channel IN (
        'canonical',
        'mxn',
        'usd'
      )
    ),

  model TEXT,
  purchase_currency TEXT,
  quantity_pricing_schedule TEXT,

  usd_channel_skipped_for_currency_mismatch BOOLEAN
    NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT uq_pricing_import_staging_row
    UNIQUE (
      import_id,
      source_row_number,
      source_channel
    )
);

CREATE INDEX IF NOT EXISTS
  idx_pricing_import_staging_import_id
  ON pricing_import_staging(import_id);

CREATE TABLE IF NOT EXISTS pricing_import_chunks (
  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  chunk_index INTEGER NOT NULL,
  row_count INTEGER NOT NULL,
  checksum_sha256 TEXT,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  PRIMARY KEY (
    import_id,
    chunk_index
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE
ON pricing_import_staging, pricing_import_chunks
TO pm_intelligence;

GRANT USAGE, SELECT
ON SEQUENCE pricing_import_staging_id_seq
TO pm_intelligence;