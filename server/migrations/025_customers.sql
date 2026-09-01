CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_customers_customer_id
    UNIQUE (customer_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_internal_id
  ON customers(internal_id)
  WHERE internal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_name
  ON customers(name);

CREATE INDEX IF NOT EXISTS idx_customers_category
  ON customers(category);

CREATE INDEX IF NOT EXISTS idx_customers_sales_rep
  ON customers(sales_rep);

CREATE INDEX IF NOT EXISTS idx_customers_sales_rep_location
  ON customers(sales_rep_location);

CREATE INDEX IF NOT EXISTS idx_customers_assigned_kam
  ON customers(assigned_kam);

CREATE INDEX IF NOT EXISTS idx_customers_location
  ON customers(location);

CREATE INDEX IF NOT EXISTS idx_customers_price_level
  ON customers(price_level);

CREATE INDEX IF NOT EXISTS idx_customers_service_segment
  ON customers(service_segment);

CREATE INDEX IF NOT EXISTS idx_customers_tax_id
  ON customers(tax_id);

CREATE INDEX IF NOT EXISTS idx_customers_sales_classification
  ON customers(sales_classification);

CREATE INDEX IF NOT EXISTS idx_customers_frequency_classification
  ON customers(frequency_classification);

CREATE INDEX IF NOT EXISTS idx_customers_purchase_amount_classification
  ON customers(purchase_amount_classification);

CREATE INDEX IF NOT EXISTS idx_customers_last_sale_date
  ON customers(last_sale_date);

CREATE INDEX IF NOT EXISTS idx_customers_inactive_date
  ON customers(inactive_date);

CREATE INDEX IF NOT EXISTS idx_customers_registration_date
  ON customers(registration_date);

CREATE INDEX IF NOT EXISTS idx_customers_import_id
  ON customers(import_id);