-- Rollback de 039_inventory_items.sql
--
-- ANTES de aplicar este rollback:
--   1. Restaurar el frontend anterior a MD-002-HOTFIX1 (el nuevo sube los
--      registros por artículo a /api/data/inventory/imports/:id/items).
--   2. Volver el backend al código anterior y reiniciarlo: el código de
--      MD-002-HOTFIX1 lee y escribe esta tabla, y la verificación de esquema
--      al arrancar no deja iniciar sin ella.
--
-- Borra los registros por artículo; inventory_snapshots no cambia. "Mi día"
-- vuelve a leer las posiciones (sin los artículos que no traen ninguna
-- cantidad).
--
-- Aplicar con: sudo -u postgres psql -d pm_intelligence_db -v ON_ERROR_STOP=1 -1 -f server/migrations/rollback/039_inventory_items.rollback.sql
-- Sin CASCADE a propósito: si algún otro objeto depende de la tabla, debe
-- fallar en lugar de borrar dependencias en silencio.

BEGIN;

SET LOCAL lock_timeout = '10s';

DROP TABLE IF EXISTS public.inventory_items;

COMMIT;
