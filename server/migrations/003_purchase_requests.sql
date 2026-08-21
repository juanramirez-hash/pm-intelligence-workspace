CREATE TABLE IF NOT EXISTS purchase_requests (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

  request_key TEXT NOT NULL UNIQUE,

  source_row_number INTEGER,
  duplicate_occurrences INTEGER NOT NULL DEFAULT 0,

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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_request_date
  ON purchase_requests(request_date);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_period_id
  ON purchase_requests(period_id);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_number
  ON purchase_requests(purchase_request_number);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_related_po
  ON purchase_requests(related_purchase_order_number);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_item_code
  ON purchase_requests(item_code);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_brand
  ON purchase_requests(brand);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_status
  ON purchase_requests(request_status);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_project_id
  ON purchase_requests(project_id);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_assigned_buyer
  ON purchase_requests(assigned_buyer);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_import_id
  ON purchase_requests(import_id);