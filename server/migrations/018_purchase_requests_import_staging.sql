BEGIN;

CREATE TABLE IF NOT EXISTS purchase_request_import_staging (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  source_row_number INTEGER NOT NULL,
  duplicate_occurrences INTEGER NOT NULL DEFAULT 0,

  request_key TEXT NOT NULL,

  purchase_request_number TEXT NOT NULL,
  source_internal_id TEXT,

  request_date DATE NOT NULL,
  period_id TEXT NOT NULL,

  sales_order_number TEXT,
  related_purchase_order_number TEXT,

  request_status TEXT,
  source_item_status TEXT,
  order_status TEXT,

  item_code TEXT,
  brand TEXT,
  model TEXT,
  description TEXT,
  quantity NUMERIC(18, 4),

  cash_authorization_status TEXT,
  advance_payment_note TEXT,
  already_ordered_status TEXT,
  executive_name TEXT,

  stock_quantity NUMERIC(18, 4),
  available_for_sale_quantity NUMERIC(18, 4),

  cash_release_date DATE,
  request_expiration_date DATE,
  expected_purchase_order_arrival_date DATE,

  preferred_supplier_name TEXT,
  actual_supplier_name TEXT,

  branch TEXT,
  item_blocked_for_request_status TEXT,
  rma_order_status TEXT,
  purchasing_traffic_comments TEXT,

  project_id TEXT,
  project_estimated_delivery_date DATE,
  request_estimated_delivery_date DATE,

  created_by TEXT,
  source_elapsed_days INTEGER,
  express_shipping_paid_status TEXT,
  project_warehouse_order_status TEXT,
  assigned_buyer TEXT,
  process_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_purchase_request_import_staging_row
    UNIQUE (
      import_id,
      source_row_number
    )
);

CREATE INDEX IF NOT EXISTS idx_purchase_request_import_staging_import_id
  ON purchase_request_import_staging(import_id);

CREATE INDEX IF NOT EXISTS idx_purchase_request_import_staging_request_number
  ON purchase_request_import_staging(
    import_id,
    purchase_request_number
  );

CREATE TABLE IF NOT EXISTS purchase_request_import_chunks (
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
  purchase_request_import_staging,
  purchase_request_import_chunks
TO pm_intelligence;

GRANT USAGE, SELECT
ON SEQUENCE purchase_request_import_staging_id_seq
TO pm_intelligence;

ALTER TABLE data_imports
  DROP CONSTRAINT IF EXISTS data_imports_import_mode_check;

ALTER TABLE data_imports
  ADD CONSTRAINT data_imports_import_mode_check
  CHECK (
    import_mode IN (
      'append',
      'upsert',
      'replace-periods',
      'replace-snapshot',
      'replace-all',
      'replace-orders',
      'replace-requests'
    )
  );

COMMIT;