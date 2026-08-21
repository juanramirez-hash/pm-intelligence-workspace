CREATE TABLE IF NOT EXISTS project_billings (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

  line_key TEXT NOT NULL UNIQUE,
  duplicate_occurrences INTEGER NOT NULL DEFAULT 0,

  internal_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  project_description TEXT,

  end_user TEXT,
  customer_id TEXT,
  customer_name TEXT,
  primary_brand TEXT,

  item_code TEXT,
  model TEXT,
  brand TEXT,

  quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  amount NUMERIC(18, 4) NOT NULL DEFAULT 0,

  billing_date DATE NOT NULL,
  period_id TEXT NOT NULL,

  document_number TEXT NOT NULL,

  document_type TEXT NOT NULL
    CHECK (
      document_type IN (
        'invoice',
        'credit_note',
        'other'
      )
    ),

  document_status TEXT,
  created_from TEXT,
  related_document_status TEXT,
  currency TEXT,

  is_voided BOOLEAN NOT NULL DEFAULT FALSE,

  estimated_close_date DATE,
  estimated_billing_date DATE,
  estimated_delivery_date DATE,

  sales_representative TEXT,
  sales_location TEXT,
  assigned_business_developer TEXT,
  purchase_description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_billings_internal_id
  ON project_billings(internal_id);

CREATE INDEX IF NOT EXISTS idx_project_billings_project_id
  ON project_billings(project_id);

CREATE INDEX IF NOT EXISTS idx_project_billings_billing_date
  ON project_billings(billing_date);

CREATE INDEX IF NOT EXISTS idx_project_billings_period_id
  ON project_billings(period_id);

CREATE INDEX IF NOT EXISTS idx_project_billings_document_number
  ON project_billings(document_number);

CREATE INDEX IF NOT EXISTS idx_project_billings_document_type
  ON project_billings(document_type);

CREATE INDEX IF NOT EXISTS idx_project_billings_customer_id
  ON project_billings(customer_id);

CREATE INDEX IF NOT EXISTS idx_project_billings_brand
  ON project_billings(brand);

CREATE INDEX IF NOT EXISTS idx_project_billings_item_code
  ON project_billings(item_code);

CREATE INDEX IF NOT EXISTS idx_project_billings_import_id
  ON project_billings(import_id);