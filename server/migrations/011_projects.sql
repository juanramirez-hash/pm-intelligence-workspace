CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

  internal_id TEXT NOT NULL,
  project_id TEXT NOT NULL,

  name TEXT NOT NULL,

  end_user TEXT,
  customer_id TEXT,
  customer_name TEXT,

  sales_executive TEXT,
  location TEXT,
  assigned_business_developer TEXT,
  assigned_product_manager TEXT,
  project_group TEXT,
  primary_brand TEXT,

  source_created_at TIMESTAMPTZ,
  elapsed_days NUMERIC(18, 4),
  currency TEXT,

  status_code TEXT NOT NULL
    CHECK (
      status_code IN (
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
        '07',
        '08',
        'unknown'
      )
    ),

  status_label TEXT NOT NULL,

  forecast_stage TEXT NOT NULL
    CHECK (
      forecast_stage IN (
        'early',
        'potential',
        'mature',
        'realized',
        'cancelled',
        'unknown'
      )
    ),

  closing_probability NUMERIC(12, 6),

  estimated_close_date DATE,
  estimated_billing_date DATE,

  amount_to_close NUMERIC(18, 4),

  observations TEXT,
  assigned_engineer TEXT,

  approximate_amount NUMERIC(18, 4),
  invoiced_amount NUMERIC(18, 4),
  report_amount_to_invoice NUMERIC(18, 4),
  amount_to_invoice NUMERIC(18, 4),

  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_projects_project_id
    UNIQUE (project_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_projects_internal_id
  ON projects(internal_id);

CREATE INDEX IF NOT EXISTS idx_projects_status_code
  ON projects(status_code);

CREATE INDEX IF NOT EXISTS idx_projects_forecast_stage
  ON projects(forecast_stage);

CREATE INDEX IF NOT EXISTS idx_projects_customer_id
  ON projects(customer_id);

CREATE INDEX IF NOT EXISTS idx_projects_primary_brand
  ON projects(primary_brand);

CREATE INDEX IF NOT EXISTS idx_projects_estimated_close_date
  ON projects(estimated_close_date);

CREATE INDEX IF NOT EXISTS idx_projects_estimated_billing_date
  ON projects(estimated_billing_date);

CREATE INDEX IF NOT EXISTS idx_projects_import_id
  ON projects(import_id);