BEGIN;

-- 041_remove_legacy_roles.sql
-- Retiro de los roles heredados analyst ("Analyst · Legacy") y viewer
-- ("Viewer · Legacy") (NAV-002B, pendiente R3 de la auditoría).
--
-- Quedaron sin usuarios cuando las auxiliares pasaron al rol assistant
-- (NAV-002). Desde entonces el alcance 'legacy' no lo usa ningún rol.
--
-- GUARDA DE SEGURIDAD: si algún usuario conserva uno de estos roles, la
-- migración falla con un mensaje claro y no cambia nada (la transacción se
-- revierte completa). Pasa esos usuarios a otro rol desde Configuración y
-- vuelve a aplicarla.
--
-- Los roles se BORRAN de app_roles (no se desactivan): no hay llaves
-- foráneas hacia app_roles (app_users.role solo se valida con el CHECK) y
-- un rol inactivo seguiría listándose en Configuración. analyst es
-- system_role, pero esa protección (SEC-003B) solo bloquea editar su
-- alcance, escritura y estado desde la API de Configuración; un DELETE de
-- migración no pasa por ella. El rollback los restaura con sus valores
-- originales (028).
--
-- No modifica datos de negocio: no sube data_cache_version.
-- No toca el alcance 'pricing': ningún rol lo usa desde la 029; se reporta
-- aparte.
--
-- Se aplica como postgres (apply-migration.sh): app_users y app_roles son de
-- postgres (lección de la 037).
--
-- ORDEN DE DESPLIEGUE
-- Aplicar ANTES de reiniciar el backend con NAV-002B: el código nuevo ya no
-- acepta analyst ni viewer, y esta migración borra los roles que el código
-- anterior todavía permitía asignar.

SET LOCAL lock_timeout = '10s';

DO $$
DECLARE
  remaining TEXT;
BEGIN
  SELECT STRING_AGG(role || ': ' || users, ', ' ORDER BY role)
    INTO remaining
    FROM (
      SELECT role, COUNT(*) AS users
        FROM app_users
       WHERE role IN ('analyst', 'viewer')
       GROUP BY role
    ) AS legacy_users;

  IF remaining IS NOT NULL THEN
    RAISE EXCEPTION
      'No se pueden retirar los roles analyst y viewer: todavía tienen usuarios (%). Pasa esos usuarios a otro rol en Configuración y vuelve a aplicar la migración 041.',
      remaining;
  END IF;
END
$$;

ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_check
  CHECK (
    role = ANY (
      ARRAY[
        'admin'::text,
        'manager'::text,
        'pm'::text,
        'engineering'::text,
        'assistant'::text
      ]
    )
  );

DELETE FROM app_roles
WHERE role_key IN ('analyst', 'viewer');

COMMIT;
