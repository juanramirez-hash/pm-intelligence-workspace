BEGIN;

-- 037_app_roles_cost_access.sql
-- Visibilidad de costos por rol (SEC-003A, hallazgo S1 de la auditoría).
--
-- cost_access decide si un rol ve costos en /api/data/*:
--   - pricing: filas de pricing_records;
--   - inventory: unit_cost e inventory_value;
--   - products: average_cost_usd, total_value, inventory_value_mxn e
--     inventory_value_usd;
--   - purchases: amount_foreign_currency.
-- Con alcance 'all' se ven todos los costos; con 'assigned', solo los de las
-- marcas asignadas. Clientes, proyectos y facturación de proyectos no cambian.
--
-- admin, manager y pm ven costos; engineering no.
--
-- ORDEN DE DESPLIEGUE OBLIGATORIO
-- Aplicar esta migración ANTES de reiniciar el backend con SEC-003A: el
-- backend lee app_roles.cost_access al cargar el usuario autenticado y, sin
-- la columna, todas las rutas autenticadas responden 500.
--
-- No modifica tablas de datos: no sube data_cache_version. El ETag de los
-- datasets con costos ya incluye el alcance de costos del usuario y la
-- versión de formato de respuesta sube a 2 en el código.

ALTER TABLE app_roles
  ADD COLUMN IF NOT EXISTS cost_access BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE app_roles
SET
  cost_access = TRUE,
  updated_at = NOW()
WHERE role_key IN ('admin', 'manager', 'pm');

COMMIT;
