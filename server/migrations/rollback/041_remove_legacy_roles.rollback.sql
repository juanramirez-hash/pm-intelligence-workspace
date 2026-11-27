-- Rollback de 041_remove_legacy_roles.sql
--
-- ANTES de aplicar este rollback:
--   1. Restaurar el frontend anterior a NAV-002B.
--   2. Volver el backend al código anterior (git revert del commit de
--      NAV-002B desde la máquina local, git pull en el servidor) y
--      reiniciarlo.
--
-- Restaura el CHECK de 7 roles y los roles analyst y viewer con sus valores
-- originales (028_app_roles.sql). No reasigna usuarios: nadie tenía esos
-- roles al aplicar la 041.
--
-- IMPORTANTE para el rollback de la 040: el rollback de la 040 pasa las
-- auxiliares al rol analyst. Si ya aplicaste la 041, aplica ESTE rollback
-- primero; de lo contrario el rol analyst no existe y la 040 no puede
-- retroceder.
--
-- Aplicar con: sudo -u postgres psql -d pm_intelligence_db -v ON_ERROR_STOP=1 -1 -f server/migrations/rollback/041_remove_legacy_roles.rollback.sql

BEGIN;

SET LOCAL lock_timeout = '10s';

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
        'engineering'::text,
        'assistant'::text
      ]
    )
  );

-- cost_access conserva su valor por defecto (FALSE): 037 solo lo activó
-- para admin, manager y pm.
INSERT INTO app_roles (
  role_key,
  role_name,
  description,
  scope,
  write_access,
  active,
  system_role
)
VALUES
  (
    'analyst',
    'Analyst · Legacy',
    'Rol heredado temporalmente compatible.',
    'legacy',
    FALSE,
    TRUE,
    TRUE
  ),
  (
    'viewer',
    'Viewer · Legacy',
    'Rol heredado temporalmente compatible.',
    'legacy',
    FALSE,
    TRUE,
    TRUE
  )
ON CONFLICT (role_key) DO NOTHING;

COMMIT;
