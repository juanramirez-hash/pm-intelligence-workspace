CREATE TABLE IF NOT EXISTS product_import_staging (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  source_row_number INTEGER NOT NULL,

  erp_internal_id TEXT,

  name TEXT NOT NULL,
  code TEXT NOT NULL,
  model TEXT NOT NULL,
  brand TEXT NOT NULL,

  vendor_code TEXT,
  vendor_name TEXT,

  description TEXT,
  classification TEXT,
  commercial_status TEXT,
  trend TEXT,

  category TEXT,
  subcategory1 TEXT,
  subcategory2 TEXT,

  source_created_at TIMESTAMPTZ,
  source_updated_at TIMESTAMPTZ,

  average_cost_usd NUMERIC(18, 4),
  total_value NUMERIC(18, 4),
  currency TEXT,
  inventory_value_mxn NUMERIC(18, 4),
  inventory_value_usd NUMERIC(18, 4),

  last_purchase_date DATE,
  last_sale_date DATE,
  units_sold_last_90_days NUMERIC(18, 4),

  preferred_vendor TEXT,
  product_class TEXT,
  secondary_category1 TEXT,
  secondary_category2 TEXT,

  quantity_pricing_schedule TEXT,
  formula_text TEXT,

  on_hand NUMERIC(18, 4),
  on_order NUMERIC(18, 4),

  catalog_status TEXT,
  inactive_for_purchases BOOLEAN,
  show_on_portal BOOLEAN,

  superseded_by TEXT,
  block_purchase_requests BOOLEAN,
  direct_substitute TEXT,

  benchmark_s TEXT,
  benchmark_t TEXT,
  benchmark_o TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_product_import_staging_row
    UNIQUE (import_id, source_row_number)
);

CREATE INDEX IF NOT EXISTS idx_product_import_staging_import_id
  ON product_import_staging(import_id);

CREATE TABLE IF NOT EXISTS product_import_chunks (
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
ON product_import_staging, product_import_chunks
TO pm_intelligence;

GRANT USAGE, SELECT
ON SEQUENCE product_import_staging_id_seq
TO pm_intelligence;