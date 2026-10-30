-- Rollback de 035_sales_fallback_owner_candidates.sql
--
-- PRERREQUISITO: el backend debe estar corriendo con código que NO use la caché
-- (sin las llamadas a refresh_sales_fallback_owner_candidates() en los servicios
-- de importación y sin leer public.sales_fallback_owner_candidates en
-- salesAnalyticsService.js). Si se ejecuta con el código de SQL-002 activo,
-- las importaciones de ventas/productos y la analítica de ventas fallarán.
--
-- Aplicar con: psql -v ON_ERROR_STOP=1 -1 -f server/migrations/rollback/035_sales_fallback_owner_candidates.rollback.sql
-- Sin CASCADE a propósito: si algún otro objeto depende de la vista, debe fallar
-- en lugar de borrar dependencias en silencio.

BEGIN;

-- No esperar indefinidamente si una consulta de analítica tiene tomada la vista.
SET LOCAL lock_timeout = '10s';

DROP FUNCTION IF EXISTS
  public.refresh_sales_fallback_owner_candidates(BOOLEAN);

-- Borra también sus 3 índices, comentarios y permisos.
DROP MATERIALIZED VIEW IF EXISTS
  public.sales_fallback_owner_candidates;

COMMIT;
