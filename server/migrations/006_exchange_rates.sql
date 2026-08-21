CREATE TABLE IF NOT EXISTS exchange_rates (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

  period_id TEXT NOT NULL,

  source_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,

  rate NUMERIC(18, 8) NOT NULL,

  source_reference TEXT,
  effective_date DATE,

  recorded_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_exchange_rates_identity
    UNIQUE (
      period_id,
      source_currency,
      target_currency,
      effective_date
    )
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_period_id
  ON exchange_rates(period_id);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_pair
  ON exchange_rates(source_currency, target_currency);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_effective_date
  ON exchange_rates(effective_date);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_recorded_at
  ON exchange_rates(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_import_id
  ON exchange_rates(import_id);