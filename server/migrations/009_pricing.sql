CREATE TABLE IF NOT EXISTS pricing_records (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

  source_price_id TEXT,

  product_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  currency TEXT NOT NULL,

  cost NUMERIC(18, 4) NOT NULL,
  list_price NUMERIC(18, 4) NOT NULL,
  selling_price NUMERIC(18, 4),

  pricing_group_id TEXT,
  effective_date DATE,

  source TEXT,
  source_reference TEXT,

  source_row_number INTEGER NOT NULL,
  source_channel TEXT NOT NULL
    CHECK (
      source_channel IN (
        'canonical',
        'mxn',
        'usd'
      )
    ),

  model TEXT,
  purchase_currency TEXT,
  quantity_pricing_schedule TEXT,

  usd_channel_skipped_for_currency_mismatch BOOLEAN
    NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_records_source_id
  ON pricing_records(source_price_id)
  WHERE source_price_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pricing_records_fallback_identity
  ON pricing_records(
    product_id,
    currency,
    COALESCE(pricing_group_id, ''),
    COALESCE(effective_date, DATE '0001-01-01'),
    source_channel
  )
  WHERE source_price_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_pricing_records_product_id
  ON pricing_records(product_id);

CREATE INDEX IF NOT EXISTS idx_pricing_records_brand_id
  ON pricing_records(brand_id);

CREATE INDEX IF NOT EXISTS idx_pricing_records_currency
  ON pricing_records(currency);

CREATE INDEX IF NOT EXISTS idx_pricing_records_effective_date
  ON pricing_records(effective_date);

CREATE INDEX IF NOT EXISTS idx_pricing_records_pricing_group
  ON pricing_records(pricing_group_id);

CREATE INDEX IF NOT EXISTS idx_pricing_records_import_id
  ON pricing_records(import_id);