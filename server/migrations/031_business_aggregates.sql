-- Apply with psql -v ON_ERROR_STOP=1. Migration owner must own the created views.
BEGIN;
-- 031_business_aggregates.sql
-- Mueve al servidor los cálculos que hoy se hacen en el navegador:
-- agregación por marca/periodo, actividad por cliente y comparativos mes contra mes.
--
-- Depende de: 002_sales.sql (sales_facts), 008_targets.sql (brand_targets).

-- ---------------------------------------------------------------------------
-- 1. Normalización de marca (misma regla que usa salesReadService.js)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION brand_key(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT REGEXP_REPLACE(UPPER(value), '[^A-Z0-9]', '', 'g')
$$;

COMMENT ON FUNCTION brand_key(TEXT) IS
  'Clave lógica de marca: mayúsculas sin espacios ni signos. Usada para permisos y joins.';

-- ---------------------------------------------------------------------------
-- 2. Métricas por marca y periodo
-- ---------------------------------------------------------------------------

-- First installation only. Reapplying aborts without dropping existing objects.

CREATE MATERIALIZED VIEW brand_period_metrics AS
SELECT
  brand_key(f.brand)                                    AS brand_key,
  MIN(f.brand)                                          AS brand_label,
  f.period_id,
  SUM(f.revenue)                                        AS revenue,
  SUM(f.gross_profit)                                   AS gross_profit,
  CASE
    WHEN SUM(f.revenue) <> 0
      THEN SUM(f.gross_profit) / SUM(f.revenue)
  END                                                   AS gross_margin,
  SUM(f.quantity)                                       AS quantity,
  COUNT(DISTINCT f.customer_id)
    FILTER (WHERE f.customer_id IS NOT NULL)            AS active_customers,
  COUNT(DISTINCT f.product_code)
    FILTER (WHERE f.product_code IS NOT NULL)           AS active_products,
  COUNT(DISTINCT f.document_number)
    FILTER (WHERE f.document_number IS NOT NULL)        AS documents,
  MIN(f.sale_date)                                      AS first_sale_date,
  MAX(f.sale_date)                                      AS last_sale_date
FROM sales_facts f
GROUP BY
  brand_key(f.brand),
  f.period_id;

-- Índice único: requisito para REFRESH ... CONCURRENTLY.
CREATE UNIQUE INDEX uq_brand_period_metrics
  ON brand_period_metrics (brand_key, period_id);

CREATE INDEX idx_brand_period_metrics_period
  ON brand_period_metrics (period_id);

-- ---------------------------------------------------------------------------
-- 3. Actividad por cliente, marca y periodo
--    Alimenta "clientes perdidos" y "clientes en riesgo" sin bajar el detalle.
-- ---------------------------------------------------------------------------



CREATE MATERIALIZED VIEW brand_customer_period_metrics AS
SELECT
  brand_key(f.brand)                                    AS brand_key,
  f.customer_id,
  MIN(f.customer_name)                                  AS customer_name,
  f.period_id,
  SUM(f.revenue)                                        AS revenue,
  SUM(f.gross_profit)                                   AS gross_profit,
  SUM(f.quantity)                                       AS quantity,
  COUNT(DISTINCT f.document_number)
    FILTER (WHERE f.document_number IS NOT NULL)        AS documents,
  MAX(f.sale_date)                                      AS last_sale_date
FROM sales_facts f
WHERE f.customer_id IS NOT NULL
GROUP BY
  brand_key(f.brand),
  f.customer_id,
  f.period_id;

CREATE UNIQUE INDEX uq_brand_customer_period_metrics
  ON brand_customer_period_metrics (brand_key, customer_id, period_id);

CREATE INDEX idx_brand_customer_period_metrics_brand_period
  ON brand_customer_period_metrics (brand_key, period_id);

-- ---------------------------------------------------------------------------
-- 4. Tablero por marca y periodo: meta, brecha, ritmo y comparativo mensual
--    Vista normal (barata) sobre la vista materializada.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW brand_period_scorecard AS
WITH targets AS (
  -- Multiple spellings may normalize to one brand. Use the latest stored target.
  SELECT DISTINCT ON (brand_key(brand_id), period_id)
    brand_key(brand_id) AS brand_key,period_id,target_revenue,target_gross_profit,target_gross_margin,working_days
  FROM brand_targets ORDER BY brand_key(brand_id),period_id,updated_at DESC,id DESC
)
SELECT m.*,t.target_revenue,t.target_gross_profit,t.target_gross_margin,t.working_days,
  CASE WHEN t.target_revenue>0 THEN m.revenue/t.target_revenue END AS revenue_attainment,
  CASE WHEN t.target_revenue IS NOT NULL THEN GREATEST(t.target_revenue-m.revenue,0) END AS revenue_gap,
  CASE WHEN t.target_gross_profit IS NOT NULL THEN GREATEST(t.target_gross_profit-m.gross_profit,0) END AS gross_profit_gap,
  p.revenue AS previous_revenue,p.gross_margin AS previous_gross_margin,
  CASE WHEN p.revenue>0 THEN m.revenue/p.revenue-1 END AS revenue_mom,
  m.gross_margin-p.gross_margin AS gross_margin_mom,
  (SELECT AVG(h.revenue) FROM brand_period_metrics h WHERE h.brand_key=m.brand_key
    AND h.period_id>=TO_CHAR(TO_DATE(m.period_id,'YYYY-MM')-INTERVAL '3 months','YYYY-MM')
    AND h.period_id<m.period_id) AS revenue_avg_prev_3,
  p.active_customers AS previous_active_customers
FROM brand_period_metrics m
LEFT JOIN targets t ON t.brand_key=m.brand_key AND t.period_id=m.period_id
LEFT JOIN brand_period_metrics p ON p.brand_key=m.brand_key
  AND p.period_id=TO_CHAR(TO_DATE(m.period_id,'YYYY-MM')-INTERVAL '1 month','YYYY-MM');

COMMENT ON VIEW brand_period_scorecard IS
  'Venta, GP, margen, meta, brecha y variación mes contra mes por marca. Calculado en el servidor.';

-- ---------------------------------------------------------------------------
-- 5. Refresco de agregados
--    Llamar al finalizar cada importación de ventas o metas.
-- ---------------------------------------------------------------------------

-- Runs as the migration owner with a fixed search path. No dynamic SQL.
-- Sales finalization calls FALSE in the same transaction as the data changes.
CREATE OR REPLACE FUNCTION public.refresh_business_aggregates(p_concurrently BOOLEAN DEFAULT FALSE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  -- One refresh at a time. Ordinary refresh is intentionally used in the import transaction.
  PERFORM pg_advisory_xact_lock(310032);
  REFRESH MATERIALIZED VIEW public.brand_period_metrics;
  REFRESH MATERIALIZED VIEW public.brand_customer_period_metrics;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_business_aggregates(BOOLEAN) FROM PUBLIC;
GRANT SELECT ON TABLE public.brand_period_metrics,public.brand_customer_period_metrics,public.brand_period_scorecard TO pm_intelligence;
GRANT EXECUTE ON FUNCTION public.brand_key(TEXT) TO pm_intelligence;
GRANT EXECUTE ON FUNCTION public.refresh_business_aggregates(BOOLEAN) TO pm_intelligence;
-- CREATE MATERIALIZED VIEW already populated the initial data; no duplicate refresh.

COMMIT;
