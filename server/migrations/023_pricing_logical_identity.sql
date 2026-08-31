BEGIN;

DROP INDEX IF EXISTS
  uq_pricing_records_fallback_identity;

CREATE UNIQUE INDEX
  uq_pricing_records_fallback_identity
  ON pricing_records (
    product_id,
    currency,
    COALESCE(
      effective_date,
      DATE '0001-01-01'
    )
  )
  WHERE source_price_id IS NULL;

COMMIT;