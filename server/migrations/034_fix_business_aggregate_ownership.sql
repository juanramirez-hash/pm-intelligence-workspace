BEGIN;

ALTER MATERIALIZED VIEW public.brand_period_metrics
  OWNER TO pm_intelligence;

ALTER MATERIALIZED VIEW public.brand_customer_period_metrics
  OWNER TO pm_intelligence;

ALTER FUNCTION public.refresh_business_aggregates(boolean)
  OWNER TO pm_intelligence;

COMMIT;
