-- Rollback de 036_data_cache_version.sql
--
-- Efecto en el backend: si el código de la caché de /api/data/* sigue activo,
-- no puede leer la versión y deja de usar la caché. Las rutas responden 200
-- con Cache-Control: no-store, igual que antes de la 036. No devuelven error.
-- Aun así, conviene reiniciar el backend con el código anterior a la etapa A2.
--
-- Aplicar con: psql -v ON_ERROR_STOP=1 -1 -f 036_data_cache_version.rollback.sql
-- Sin CASCADE a propósito: si algún otro objeto depende de la tabla, debe
-- fallar en lugar de borrar dependencias en silencio.

BEGIN;

SET LOCAL lock_timeout = '10s';

DROP TABLE IF EXISTS
  public.data_cache_version;

COMMIT;
