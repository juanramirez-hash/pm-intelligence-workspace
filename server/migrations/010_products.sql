CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_products_name
    UNIQUE (name)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_products_erp_internal_id
  ON products(erp_internal_id)
  WHERE erp_internal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_code
  ON products(code);

CREATE INDEX IF NOT EXISTS idx_products_model
  ON products(model);

CREATE INDEX IF NOT EXISTS idx_products_brand
  ON products(brand);

CREATE INDEX IF NOT EXISTS idx_products_commercial_status
  ON products(commercial_status);

CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(category);

CREATE INDEX IF NOT EXISTS idx_products_last_sale_date
  ON products(last_sale_date);

CREATE INDEX IF NOT EXISTS idx_products_import_id
  ON products(import_id);