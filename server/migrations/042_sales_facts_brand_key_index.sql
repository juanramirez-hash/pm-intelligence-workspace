BEGIN;

-- 042_sales_facts_brand_key_index.sql
-- Indice por marca logica para la ficha de marca (MB-001).
--
-- Las consultas de /api/brands filtran sales_facts con brand_key(brand) = $1.
-- brand_key() (migracion 033, REGEXP_REPLACE) se evaluaba sobre ~500 mil filas
-- porque solo existia idx_sales_facts_brand sobre el texto crudo: el comparativo
-- anual tardaba ~1.1-1.4 s. Este indice sobre la MISMA expresion deja que
-- PostgreSQL ubique las filas de la marca y el rango de fechas sin recorrer
-- toda la tabla.
--
-- IMPORTANTE: si una migracion futura cambia la definicion de brand_key(), debe
-- hacer REINDEX INDEX public.idx_sales_facts_brand_key_sale_date en la misma
-- migracion; de lo contrario el indice quedaria con claves de la version vieja.
--
-- No modifica datos de negocio: no sube data_cache_version.
-- No se agrega a REQUIRED_SCHEMA: un indice faltante no rompe el codigo, solo
-- lo hace mas lento.
-- Sin CONCURRENTLY: no puede ir dentro de una transaccion. Bloquea las
-- escrituras de sales_facts mientras se crea; aplicar fuera de horario y fuera
-- de una importacion de ventas.
--
-- Se aplica como postgres (apply-migration.sh).

CREATE INDEX IF NOT EXISTS idx_sales_facts_brand_key_sale_date
  ON public.sales_facts (brand_key(brand), sale_date);

ANALYZE public.sales_facts;

COMMIT;
