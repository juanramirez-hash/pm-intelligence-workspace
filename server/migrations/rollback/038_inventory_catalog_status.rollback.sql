-- Rollback de 038_inventory_catalog_status.sql
--
-- ANTES de aplicar este rollback, volver el backend al código anterior a
-- MD-002 y reiniciarlo: el código de MD-002 escribe y lee estas columnas, y
-- la verificación de esquema al arrancar no deja iniciar sin ellas.
--
-- Borra el estatus y la fecha de última venta cargados desde el inventario;
-- se recuperan recargando el inventario después de volver a aplicar la 038.
--
-- Aplicar con: psql -v ON_ERROR_STOP=1 -1 -f 038_inventory_catalog_status.rollback.sql
-- Sin CASCADE a propósito: si algún otro objeto depende de las columnas,
-- debe fallar en lugar de borrar dependencias en silencio.

BEGIN;

SET LOCAL lock_timeout = '10s';

ALTER TABLE inventory_import_staging
  DROP COLUMN IF EXISTS last_sale_date,
  DROP COLUMN IF EXISTS catalog_status;

ALTER TABLE inventory_snapshots
  DROP COLUMN IF EXISTS last_sale_date,
  DROP COLUMN IF EXISTS catalog_status;

COMMIT;
