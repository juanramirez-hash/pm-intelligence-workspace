CREATE TABLE IF NOT EXISTS brand_targets (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

  brand_id TEXT NOT NULL,
  period_id TEXT NOT NULL,

  target_revenue NUMERIC(18, 4),
  target_gross_profit NUMERIC(18, 4),
  target_gross_margin NUMERIC(12, 6),
  working_days INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_brand_targets_identity
    UNIQUE (
      brand_id,
      period_id
    )
);

CREATE INDEX IF NOT EXISTS idx_brand_targets_brand_id
  ON brand_targets(brand_id);

CREATE INDEX IF NOT EXISTS idx_brand_targets_period_id
  ON brand_targets(period_id);

CREATE INDEX IF NOT EXISTS idx_brand_targets_import_id
  ON brand_targets(import_id);