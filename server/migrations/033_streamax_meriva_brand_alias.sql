BEGIN;

-- 033_streamax_meriva_brand_alias.sql
--
-- Historical identity consolidation:
--
--   MERIVA TECHNOLOGY - STREAMAX
--              ->
--   STREAMAX - MERIVA
--
-- sales_facts.brand remains untouched.
-- Historical source labels are preserved in the raw sales facts.

-- ---------------------------------------------------------------------------
-- 1. Canonical logical brand identity
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
  'Logical brand key. MERIVA TECHNOLOGY - STREAMAX is an historical alias of STREAMAX - MERIVA.';

-- ---------------------------------------------------------------------------
-- 2. Consolidate PM assignments
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
-- 3. Canonicalize historical PM actions
-- ---------------------------------------------------------------------------

UPDATE pm_actions
SET brand_id = 'STREAMAX - MERIVA'
WHERE UPPER(TRIM(brand_id)) =
  'MERIVA TECHNOLOGY - STREAMAX';

-- ---------------------------------------------------------------------------
-- 4. Rebuild brand period metrics with canonical visible label
-- ---------------------------------------------------------------------------

DROP VIEW IF EXISTS brand_period_scorecard;

DROP MATERIALIZED VIEW IF EXISTS brand_period_metrics;

CREATE MATERIALIZED VIEW brand_period_metrics AS
SELECT
  brand_key(f.brand) AS brand_key,

  CASE
    WHEN brand_key(f.brand) = 'STREAMAXMERIVA'
      THEN 'STREAMAX - MERIVA'
    ELSE MIN(f.brand)
  END AS brand_label,

  f.period_id,

  SUM(f.revenue) AS revenue,
  SUM(f.gross_profit) AS gross_profit,

  CASE
    WHEN SUM(f.revenue) <> 0
      THEN SUM(f.gross_profit) / SUM(f.revenue)
  END AS gross_margin,

  SUM(f.quantity) AS quantity,

  COUNT(DISTINCT f.customer_id)
    FILTER (
      WHERE f.customer_id IS NOT NULL
    ) AS active_customers,

  COUNT(
    DISTINCT NULLIF(
      UPPER(BTRIM(f.product_name)),
      ''
    )
  ) AS active_products,

  COUNT(DISTINCT f.document_number)
    FILTER (
      WHERE f.document_number IS NOT NULL
    ) AS documents,

  MIN(f.sale_date) AS first_sale_date,
  MAX(f.sale_date) AS last_sale_date

FROM sales_facts f

GROUP BY
  brand_key(f.brand),
  f.period_id;

CREATE UNIQUE INDEX uq_brand_period_metrics
  ON brand_period_metrics (
    brand_key,
    period_id
  );

CREATE INDEX idx_brand_period_metrics_period
  ON brand_period_metrics (
    period_id
  );

-- ---------------------------------------------------------------------------
-- 5. Refresh customer-level brand aggregates
-- ---------------------------------------------------------------------------

REFRESH MATERIALIZED VIEW brand_customer_period_metrics;

-- ---------------------------------------------------------------------------
-- 6. Recreate scorecard dependent on brand_period_metrics
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW brand_period_scorecard AS
WITH targets AS (
  SELECT DISTINCT ON (
    brand_key(brand_id),
    period_id
  )
    brand_key(brand_id) AS brand_key,
    period_id,
    target_revenue,
    target_gross_profit,
    target_gross_margin,
    working_days
  FROM brand_targets
  ORDER BY
    brand_key(brand_id),
    period_id,
    updated_at DESC,
    id DESC
)
SELECT
  m.*,
  t.target_revenue,
  t.target_gross_profit,
  t.target_gross_margin,
  t.working_days,

  CASE
    WHEN t.target_revenue > 0
      THEN m.revenue / t.target_revenue
  END AS revenue_attainment,

  CASE
    WHEN t.target_revenue IS NOT NULL
      THEN GREATEST(
        t.target_revenue - m.revenue,
        0
      )
  END AS revenue_gap,

  CASE
    WHEN t.target_gross_profit IS NOT NULL
      THEN GREATEST(
        t.target_gross_profit - m.gross_profit,
        0
      )
  END AS gross_profit_gap,

  p.revenue AS previous_revenue,
  p.gross_margin AS previous_gross_margin,

  CASE
    WHEN p.revenue > 0
      THEN m.revenue / p.revenue - 1
  END AS revenue_mom,

  m.gross_margin - p.gross_margin
    AS gross_margin_mom,

  (
    SELECT AVG(h.revenue)
    FROM brand_period_metrics h
    WHERE h.brand_key = m.brand_key
      AND h.period_id >= TO_CHAR(
        TO_DATE(
          m.period_id,
          'YYYY-MM'
        ) - INTERVAL '3 months',
        'YYYY-MM'
      )
      AND h.period_id < m.period_id
  ) AS revenue_avg_prev_3,

  p.active_customers
    AS previous_active_customers

FROM brand_period_metrics m

LEFT JOIN targets t
  ON t.brand_key = m.brand_key
  AND t.period_id = m.period_id

LEFT JOIN brand_period_metrics p
  ON p.brand_key = m.brand_key
  AND p.period_id = TO_CHAR(
    TO_DATE(
      m.period_id,
      'YYYY-MM'
    ) - INTERVAL '1 month',
    'YYYY-MM'
  );

COMMENT ON VIEW brand_period_scorecard IS
  'Sales, GP, margin, target, gap and month-over-month variation by brand. Calculated on the server.';

-- ---------------------------------------------------------------------------
-- 7. Restore access after rebuilding the materialized view
-- ---------------------------------------------------------------------------

GRANT SELECT
ON TABLE
  brand_period_metrics,
  brand_customer_period_metrics,
  brand_period_scorecard
TO pm_intelligence;

GRANT EXECUTE
ON FUNCTION brand_key(TEXT)
TO pm_intelligence;

COMMIT;
