CREATE TABLE IF NOT EXISTS sales_facts (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

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
      OR product_status IN ('A', 'B', 'C', 'D', 'E')
    ),

  quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,

  document_number TEXT,
  location TEXT,
  sales_rep TEXT,
  currency TEXT,

  source_row_number INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_facts_sale_date
  ON sales_facts(sale_date);

CREATE INDEX IF NOT EXISTS idx_sales_facts_period_id
  ON sales_facts(period_id);

CREATE INDEX IF NOT EXISTS idx_sales_facts_brand
  ON sales_facts(brand);

CREATE INDEX IF NOT EXISTS idx_sales_facts_customer_id
  ON sales_facts(customer_id);

CREATE INDEX IF NOT EXISTS idx_sales_facts_document_number
  ON sales_facts(document_number);

CREATE INDEX IF NOT EXISTS idx_sales_facts_product_name
  ON sales_facts(product_name);

CREATE INDEX IF NOT EXISTS idx_sales_facts_import_id
  ON sales_facts(import_id);

CREATE INDEX IF NOT EXISTS idx_sales_facts_period_brand
  ON sales_facts(period_id, brand);