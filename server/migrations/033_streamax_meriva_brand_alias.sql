BEGIN;

-- 033_streamax_meriva_brand_alias.sql
--
-- Consolida la identidad histórica:
--
--   MERIVA TECHNOLOGY - STREAMAX
--              ↓
--   STREAMAX - MERIVA
--
-- No modifica sales_facts.brand.
-- El dato histórico crudo permanece intacto.
-- La canonicalización ocurre mediante brand_key().

-- ---------------------------------------------------------------------------
-- 1. Identidad lógica de marca
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION brand_key(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN REGEXP_REPLACE(
      UPPER(value),
      '[^A-Z0-9]',
      '',
      'g'
    ) = 'MERIVATECHNOLOGYSTREAMAX'
      THEN 'STREAMAXMERIVA'

    ELSE REGEXP_REPLACE(
      UPPER(value),
      '[^A-Z0-9]',
      '',
      'g'
    )
  END
$$;

COMMENT ON FUNCTION brand_key(TEXT) IS
  'Clave lógica de marca. Consolida aliases históricos; MERIVA TECHNOLOGY - STREAMAX pertenece a STREAMAX - MERIVA.';

-- ---------------------------------------------------------------------------
-- 2. Consolidar asignaciones de PM
-- ---------------------------------------------------------------------------

INSERT INTO app_user_brand_assignments (
  user_id,
  brand_id,
  created_at,
  created_by
)
SELECT
  user_id,
  'STREAMAX - MERIVA',
  created_at,
  created_by
FROM app_user_brand_assignments
WHERE UPPER(TRIM(brand_id)) =
  'MERIVA TECHNOLOGY - STREAMAX'
ON CONFLICT (user_id, brand_id)
DO NOTHING;

DELETE FROM app_user_brand_assignments
WHERE UPPER(TRIM(brand_id)) =
  'MERIVA TECHNOLOGY - STREAMAX';

-- ---------------------------------------------------------------------------
-- 3. Canonicalizar acciones históricas
-- ---------------------------------------------------------------------------
--
-- En producción actualmente no existen acciones con el nombre histórico,
-- pero se normalizan otros ambientes y datos futuros de migración.

UPDATE pm_actions
SET brand_id = 'STREAMAX - MERIVA'
WHERE UPPER(TRIM(brand_id)) =
  'MERIVA TECHNOLOGY - STREAMAX';

-- ---------------------------------------------------------------------------
-- 4. Reconstruir agregados históricos
-- ---------------------------------------------------------------------------

REFRESH MATERIALIZED VIEW brand_period_metrics;

REFRESH MATERIALIZED VIEW brand_customer_period_metrics;

COMMIT;