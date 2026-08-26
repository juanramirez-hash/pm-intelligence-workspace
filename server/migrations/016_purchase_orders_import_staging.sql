CREATE TABLE IF NOT EXISTS purchase_order_import_staging (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  source_row_number INTEGER NOT NULL,
  duplicate_occurrences INTEGER NOT NULL DEFAULT 0,

  line_key TEXT NOT NULL,

  purchase_order_number TEXT NOT NULL,
  source_internal_id TEXT,
  source_secondary_internal_id TEXT,
  purchase_order_reference TEXT,

  purchase_order_date DATE NOT NULL,
  period_id TEXT NOT NULL,
  expected_receipt_date DATE,

  status TEXT,
  main_memo TEXT,

  supplier_id TEXT,
  supplier_name TEXT,
  currency TEXT,

  line_type TEXT NOT NULL
    CHECK (
      line_type IN (
        'product',
        'tax',
        'discount',
        'adjustment'
      )
    ),

  item_code TEXT,
  brand TEXT,
  line_memo TEXT,

  quantity NUMERIC(18, 4),
  amount_foreign_currency NUMERIC(18, 4),
  weight NUMERIC(18, 4),

  supplier_lead_time_days NUMERIC(18, 4),
  supplier_express_lead_time_days NUMERIC(18, 4),
  inventory_days NUMERIC(18, 4),

  shipment_number TEXT,
  shipment_status TEXT,
  zone TEXT,
  purchasing_executive TEXT,

  coff_date DATE,
  atd_date DATE,
  ata_date DATE,
  atw_date DATE,

  department TEXT,
  value_classification TEXT,
  value_score NUMERIC(18, 4),
  amount_classification TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_purchase_order_import_staging_row
    UNIQUE (
      import_id,
      source_row_number
    )
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_import_staging_import_id
  ON purchase_order_import_staging(import_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_import_staging_order_number
  ON purchase_order_import_staging(
    import_id,
    purchase_order_number
  );

CREATE TABLE IF NOT EXISTS purchase_order_import_chunks (
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
  purchase_order_import_staging,
  purchase_order_import_chunks
TO pm_intelligence;

GRANT USAGE, SELECT
ON SEQUENCE purchase_order_import_staging_id_seq
TO pm_intelligence;