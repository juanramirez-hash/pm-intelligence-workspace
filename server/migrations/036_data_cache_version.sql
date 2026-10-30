BEGIN;

-- 036_data_cache_version.sql
-- Versión manual de datos para la caché HTTP de /api/data/* (SQL-003, etapa A2).
--
-- El ETag de cada GET /api/data/<dataset> combina:
--   - el estado de los imports completados del dataset en data_imports
--     (MAX(id), MAX(completed_at) y COUNT(*));
--   - el alcance y las marcas asignadas del usuario (solo ventas);
--   - la versión de formato de respuesta definida en el código del servidor;
--   - la versión de esta tabla.
-- Si el ETag coincide con If-None-Match, el servidor responde 304 sin
-- consultar las tablas de datos y el navegador reutiliza su copia.
--
-- CUÁNDO SUBIR LA VERSIÓN
-- Siempre que los datos que devuelve /api/data/* cambien SIN pasar por un
-- import del Data Center, por ejemplo:
--   - una migración que haga INSERT, UPDATE o DELETE sobre tablas de datos
--     (sales_facts, customers, products, inventory_snapshots, etc.);
--   - una corrección manual con psql;
--   - una restauración parcial de tablas de datos.
-- No hace falta para imports, cambios de marcas asignadas o de roles en
-- Settings, ni para refrescar vistas materializadas: el ETag ya los detecta.
-- Si hay duda, subirla: el único costo es que cada usuario descarga los datos
-- una vez más.
--
-- CÓMO SUBIRLA A MANO (en producción, después del respaldo con pg_dump)
--   psql -U pm_intelligence -h 127.0.0.1 -d pm_intelligence_db -v ON_ERROR_STOP=1 -c "UPDATE public.data_cache_version SET version = version + 1, updated_at = NOW(), note = 'motivo' WHERE id = 1;"
--
-- Toda migración que modifique datos debe terminar, antes de su COMMIT, con:
--   UPDATE public.data_cache_version
--   SET version = version + 1, updated_at = NOW(), note = 'NNN_descripcion'
--   WHERE id = 1;

CREATE TABLE public.data_cache_version (
  id SMALLINT PRIMARY KEY DEFAULT 1
    CHECK (id = 1),

  version INTEGER NOT NULL DEFAULT 1
    CHECK (version > 0),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  note TEXT
);

INSERT INTO public.data_cache_version (
  id,
  version,
  note
)
VALUES (
  1,
  1,
  '036_data_cache_version'
);

COMMENT ON TABLE public.data_cache_version IS
  'Single-row manual data version included in /api/data/* ETags. Bump it whenever data changes outside a Data Center import.';

-- La aplicación y las migraciones usan el mismo usuario de PostgreSQL
-- (pm_intelligence), que queda como dueño de esta tabla. No hay permisos que
-- impidan escribir en ella: la restricción es de código. El backend solo la
-- lee y nunca escribe en ella; la versión se sube a mano o desde una migración.

COMMIT;
