CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

  line_key TEXT NOT NULL UNIQUE,

  source_row_number INTEGER,
  duplicate_occurrences INTEGER NOT NULL DEFAULT 0,

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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_number
  ON purchase_orders(purchase_order_number);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date
  ON purchase_orders(purchase_order_date);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_period_id
  ON purchase_orders(period_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
  ON purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id
  ON purchase_orders(supplier_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_name
  ON purchase_orders(supplier_name);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_item_code
  ON purchase_orders(item_code);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_brand
  ON purchase_orders(brand);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipment_number
  ON purchase_orders(shipment_number);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_import_id
  ON purchase_orders(import_id);