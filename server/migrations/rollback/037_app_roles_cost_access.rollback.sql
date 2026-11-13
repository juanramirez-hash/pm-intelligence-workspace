-- Rollback de 037_app_roles_cost_access.sql
--
-- ANTES de aplicar este rollback, volver el backend al código anterior a
-- SEC-003A y reiniciarlo: el código de SEC-003A lee app_roles.cost_access y,
-- sin la columna, todas las rutas autenticadas responden 500.
--
-- Aplicar con: psql -v ON_ERROR_STOP=1 -1 -f 037_app_roles_cost_access.rollback.sql
-- Sin CASCADE a propósito: si algún otro objeto depende de la columna, debe
-- fallar en lugar de borrar dependencias en silencio.

BEGIN;

SET LOCAL lock_timeout = '10s';

ALTER TABLE app_roles
  DROP COLUMN IF EXISTS cost_access;

COMMIT;
