-- Rollback de 040_assistant_role.sql
--
-- ANTES de aplicar este rollback:
--   1. Restaurar el frontend anterior a NAV-002.
--   2. Volver el backend al código anterior (git revert del commit de
--      NAV-002 desde la máquina local, git pull en el servidor) y
--      reiniciarlo: el código de NAV-002 lee app_user_pm_links en cada
--      petición y la verificación de esquema no deja iniciar sin ella.
--
-- Efecto: las auxiliares vuelven al rol analyst (Analyst · Legacy, sin
-- acceso comercial) y pierden las marcas heredadas de sus PMs; sus
-- asignaciones propias se conservan. Los vínculos auxiliar–PM se borran.
--
-- Aplicar con: sudo -u postgres psql -d pm_intelligence_db -v ON_ERROR_STOP=1 -1 -f server/migrations/rollback/040_assistant_role.rollback.sql
-- Sin CASCADE a propósito: si algún otro objeto depende de la tabla o del
-- rol, debe fallar en lugar de borrar dependencias en silencio.

BEGIN;

SET LOCAL lock_timeout = '10s';

UPDATE app_users
SET role = 'analyst'
WHERE role = 'assistant';

ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_check
  CHECK (
    role = ANY (
      ARRAY[
        'admin'::text,
        'analyst'::text,
        'viewer'::text,
        'manager'::text,
        'pm'::text,
        'engineering'::text
      ]
    )
  );

DROP TABLE IF EXISTS public.app_user_pm_links;

DELETE FROM app_roles
WHERE role_key = 'assistant';

COMMIT;
