BEGIN;

-- Rollback de 042_sales_facts_brand_key_index.sql
DROP INDEX IF EXISTS public.idx_sales_facts_brand_key_sale_date;

COMMIT;
