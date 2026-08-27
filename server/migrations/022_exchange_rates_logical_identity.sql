BEGIN;

ALTER TABLE exchange_rates
  DROP CONSTRAINT IF EXISTS uq_exchange_rates_identity;

ALTER TABLE exchange_rates
  ADD CONSTRAINT uq_exchange_rates_identity
  UNIQUE (
    period_id,
    source_currency,
    target_currency
  );

COMMIT;