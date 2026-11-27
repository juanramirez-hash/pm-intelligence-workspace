BEGIN;

-- 040_assistant_role.sql
-- Rol "Auxiliar" vinculado a sus PMs (NAV-002, pendiente R3 de la auditoría).
--
-- Una auxiliar apoya a uno o más PMs y ve las marcas de ellos: sus marcas
-- efectivas son sus asignaciones propias más las de sus PMs vinculados que
-- estén activos y tengan rol pm. El backend las calcula al cargar el
-- usuario (server/services/effectiveBrands.js); requireBrandScope y
-- resolveCostScope no cambian.
--
-- - Alcance 'assigned', escritura (solo afecta a Acciones), sin costos
--   (cost_access se puede activar después en Configuración, sin código).
--   No importa ni entra al Centro de datos: eso exige alcance 'all'.
-- - Sin datos de usuarios: las auxiliares y sus PMs se capturan después en
--   Configuración.
-- - Los roles legacy analyst y viewer no cambian (se retiran en NAV-002B).
--
-- Se aplica como postgres (apply-migration.sh): app_users, app_roles y
-- app_user_brand_assignments son de postgres (lección de la 037). La tabla
-- nueva también queda de postgres; la aplicación (pm_intelligence) recibe
-- SELECT, INSERT y DELETE.
--
-- ORDEN DE DESPLIEGUE OBLIGATORIO
-- Aplicar esta migración ANTES de reiniciar el backend con NAV-002: la
-- carga del usuario lee app_user_pm_links en cada petición y la
-- verificación de esquema al arrancar no deja iniciar sin la tabla.
--
-- No modifica datos de negocio: no sube data_cache_version.

SET LOCAL lock_timeout = '10s';

INSERT INTO app_roles (
  role_key,
  role_name,
  description,
  scope,
  write_access,
  cost_access,
  active,
  system_role
)
VALUES (
  'assistant',
  'Auxiliar',
  'Apoyo de uno o más PMs: ve las marcas de sus PMs vinculados.',
  'assigned',
  TRUE,
  FALSE,
  TRUE,
  FALSE
)
ON CONFLICT (role_key) DO NOTHING;

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

CREATE TABLE IF NOT EXISTS public.app_user_pm_links (
  assistant_user_id BIGINT NOT NULL,
  pm_user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT NULL,

  CONSTRAINT pk_app_user_pm_links
    PRIMARY KEY (assistant_user_id, pm_user_id),

  CONSTRAINT fk_app_user_pm_links_assistant
    FOREIGN KEY (assistant_user_id)
    REFERENCES app_users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_app_user_pm_links_pm
    FOREIGN KEY (pm_user_id)
    REFERENCES app_users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_app_user_pm_links_created_by
    FOREIGN KEY (created_by)
    REFERENCES app_users(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_app_user_pm_links_not_self
    CHECK (assistant_user_id <> pm_user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_user_pm_links_pm_user_id
  ON public.app_user_pm_links(pm_user_id);

GRANT SELECT, INSERT, DELETE
  ON TABLE public.app_user_pm_links
  TO pm_intelligence;

COMMIT;
