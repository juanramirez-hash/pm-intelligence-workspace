CREATE TABLE IF NOT EXISTS sales_import_staging (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  source_row_number INTEGER NOT NULL,

  sale_date DATE NOT NULL,
  period_id TEXT NOT NULL,

  brand TEXT NOT NULL,

  revenue NUMERIC(18, 4) NOT NULL DEFAULT 0,
  gross_profit NUMERIC(18, 4) NOT NULL DEFAULT 0,

  customer_id TEXT,
  customer_name TEXT,

  product_name TEXT,
  product_code TEXT,
  model TEXT,

  product_status TEXT
    CHECK (
      product_status IS NULL
      OR product_status IN (
        'A',
        'B',
        'C',
        'D',
        'E'
      )
    ),

  quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,

  document_number TEXT,
  location TEXT,
  sales_rep TEXT,
  currency TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_sales_import_staging_row
    UNIQUE (
      import_id,
      source_row_number
    )
);

CREATE INDEX IF NOT EXISTS idx_sales_import_staging_import
  ON sales_import_staging(import_id);

CREATE INDEX IF NOT EXISTS idx_sales_import_staging_period
  ON sales_import_staging(period_id);

CREATE INDEX IF NOT EXISTS idx_sales_import_staging_import_period
  ON sales_import_staging(
    import_id,
    period_id
  );


CREATE TABLE IF NOT EXISTS sales_import_chunks (
  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  chunk_index INTEGER NOT NULL,

  row_count INTEGER NOT NULL DEFAULT 0,

  checksum_sha256 TEXT,

  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (
    import_id,
    chunk_index
  )
);

CREATE INDEX IF NOT EXISTS idx_sales_import_chunks_import
  ON sales_import_chunks(import_id);