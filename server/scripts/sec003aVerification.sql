-- sec003aVerification.sql
-- Verificación de SEC-003A (visibilidad de costos por rol y marca).
--
-- Solo lectura: todas las consultas son SELECT dentro de una transacción
-- READ ONLY que termina en ROLLBACK.
--
-- Dónde correrlo: pm_intelligence_test, DESPUÉS de aplicar ahí la 037.
--   psql -U pm_intelligence -h 127.0.0.1 -d pm_intelligence_test -v ON_ERROR_STOP=1 -f server/scripts/sec003aVerification.sql
--
-- Para cada rol (pm, engineering y admin) toma el usuario activo con el id
-- más bajo y aplica la misma regla que el backend:
--   - sin cost_access                  -> ningún costo   (cost_mode 'none')
--   - cost_access y alcance 'all'      -> todos          (cost_mode 'all')
--   - cost_access y alcance 'assigned' -> solo sus marcas, comparando
--     brand_key(<marca de la fila>) contra brand_key() de sus asignaciones
--     (cost_mode 'assigned').
-- Para revisar otro usuario, cambia el filtro de sample_users (se repite en
-- cada consulta porque una transacción READ ONLY no permite crear vistas).
--
-- Resultado esperado:
--   - pm: pricing solo de sus marcas; costos no NULL solo en sus marcas.
--   - engineering: pricing con 0 filas visibles; todos los costos NULL.
--   - admin: pricing completo; costos NULL solo donde la base ya es NULL.

BEGIN TRANSACTION READ ONLY;

-- 1. Columna de la 037 y valor por rol.
SELECT
  role_key,
  scope,
  write_access,
  cost_access,
  active
FROM app_roles
ORDER BY
  role_key;

-- 2. Usuarios de ejemplo y su alcance de costos.
WITH sample_users AS (
  SELECT DISTINCT ON (u.role)
    u.id,
    u.email,
    u.role
  FROM app_users u
  WHERE
    u.active = TRUE
    AND u.role IN ('pm', 'engineering', 'admin')
  ORDER BY
    u.role,
    u.id
),
cost_scopes AS (
  SELECT
    s.role,
    s.email,
    r.scope,
    r.cost_access,
    CASE
      WHEN r.cost_access IS NOT TRUE THEN 'none'
      WHEN r.scope = 'all' THEN 'all'
      WHEN r.scope = 'assigned' THEN 'assigned'
      ELSE 'none'
    END AS cost_mode,
    COALESCE(
      ARRAY_AGG(
        DISTINCT brand_key(a.brand_id)
      ) FILTER (
        WHERE a.brand_id IS NOT NULL
      ),
      ARRAY[]::TEXT[]
    ) AS brand_keys
  FROM sample_users s
  JOIN app_roles r
    ON r.role_key = s.role
  LEFT JOIN app_user_brand_assignments a
    ON a.user_id = s.id
  GROUP BY
    s.role,
    s.email,
    r.scope,
    r.cost_access
)
SELECT *
FROM cost_scopes
ORDER BY
  role;

-- 3. Filas de pricing visibles por rol y marca.
WITH sample_users AS (
  SELECT DISTINCT ON (u.role)
    u.id,
    u.email,
    u.role
  FROM app_users u
  WHERE
    u.active = TRUE
    AND u.role IN ('pm', 'engineering', 'admin')
  ORDER BY
    u.role,
    u.id
),
cost_scopes AS (
  SELECT
    s.role,
    s.email,
    r.scope,
    r.cost_access,
    CASE
      WHEN r.cost_access IS NOT TRUE THEN 'none'
      WHEN r.scope = 'all' THEN 'all'
      WHEN r.scope = 'assigned' THEN 'assigned'
      ELSE 'none'
    END AS cost_mode,
    COALESCE(
      ARRAY_AGG(
        DISTINCT brand_key(a.brand_id)
      ) FILTER (
        WHERE a.brand_id IS NOT NULL
      ),
      ARRAY[]::TEXT[]
    ) AS brand_keys
  FROM sample_users s
  JOIN app_roles r
    ON r.role_key = s.role
  LEFT JOIN app_user_brand_assignments a
    ON a.user_id = s.id
  GROUP BY
    s.role,
    s.email,
    r.scope,
    r.cost_access
)
SELECT
  c.role,
  c.cost_mode,
  brand_key(p.brand_id) AS brand_key,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (
    WHERE
      c.cost_mode = 'all'
      OR (
        c.cost_mode = 'assigned'
        AND brand_key(p.brand_id) = ANY(c.brand_keys)
      )
  ) AS visible_rows
FROM cost_scopes c
CROSS JOIN pricing_records p
GROUP BY
  c.role,
  c.cost_mode,
  brand_key(p.brand_id)
ORDER BY
  c.role,
  brand_key;

-- 4. Total de filas de pricing visibles por rol.
WITH sample_users AS (
  SELECT DISTINCT ON (u.role)
    u.id,
    u.email,
    u.role
  FROM app_users u
  WHERE
    u.active = TRUE
    AND u.role IN ('pm', 'engineering', 'admin')
  ORDER BY
    u.role,
    u.id
),
cost_scopes AS (
  SELECT
    s.role,
    s.email,
    r.scope,
    r.cost_access,
    CASE
      WHEN r.cost_access IS NOT TRUE THEN 'none'
      WHEN r.scope = 'all' THEN 'all'
      WHEN r.scope = 'assigned' THEN 'assigned'
      ELSE 'none'
    END AS cost_mode,
    COALESCE(
      ARRAY_AGG(
        DISTINCT brand_key(a.brand_id)
      ) FILTER (
        WHERE a.brand_id IS NOT NULL
      ),
      ARRAY[]::TEXT[]
    ) AS brand_keys
  FROM sample_users s
  JOIN app_roles r
    ON r.role_key = s.role
  LEFT JOIN app_user_brand_assignments a
    ON a.user_id = s.id
  GROUP BY
    s.role,
    s.email,
    r.scope,
    r.cost_access
)
SELECT
  c.role,
  c.cost_mode,
  COUNT(*) FILTER (
    WHERE
      c.cost_mode = 'all'
      OR (
        c.cost_mode = 'assigned'
        AND brand_key(p.brand_id) = ANY(c.brand_keys)
      )
  ) AS visible_pricing_rows,
  COUNT(*) AS total_pricing_rows
FROM cost_scopes c
CROSS JOIN pricing_records p
GROUP BY
  c.role,
  c.cost_mode
ORDER BY
  c.role;

-- 5. Costos NULL contra no NULL por rol, tal como los devuelve el backend.
WITH sample_users AS (
  SELECT DISTINCT ON (u.role)
    u.id,
    u.email,
    u.role
  FROM app_users u
  WHERE
    u.active = TRUE
    AND u.role IN ('pm', 'engineering', 'admin')
  ORDER BY
    u.role,
    u.id
),
cost_scopes AS (
  SELECT
    s.role,
    s.email,
    r.scope,
    r.cost_access,
    CASE
      WHEN r.cost_access IS NOT TRUE THEN 'none'
      WHEN r.scope = 'all' THEN 'all'
      WHEN r.scope = 'assigned' THEN 'assigned'
      ELSE 'none'
    END AS cost_mode,
    COALESCE(
      ARRAY_AGG(
        DISTINCT brand_key(a.brand_id)
      ) FILTER (
        WHERE a.brand_id IS NOT NULL
      ),
      ARRAY[]::TEXT[]
    ) AS brand_keys
  FROM sample_users s
  JOIN app_roles r
    ON r.role_key = s.role
  LEFT JOIN app_user_brand_assignments a
    ON a.user_id = s.id
  GROUP BY
    s.role,
    s.email,
    r.scope,
    r.cost_access
),
cost_values AS (
  SELECT
    c.role,
    'inventory.unit_cost' AS field,
    CASE
      WHEN c.cost_mode = 'all'
        OR (
          c.cost_mode = 'assigned'
          AND brand_key(i.brand) = ANY(c.brand_keys)
        )
      THEN i.unit_cost
    END AS value
  FROM cost_scopes c
  CROSS JOIN inventory_snapshots i

  UNION ALL

  SELECT
    c.role,
    'inventory.inventory_value',
    CASE
      WHEN c.cost_mode = 'all'
        OR (
          c.cost_mode = 'assigned'
          AND brand_key(i.brand) = ANY(c.brand_keys)
        )
      THEN i.inventory_value
    END
  FROM cost_scopes c
  CROSS JOIN inventory_snapshots i

  UNION ALL

  SELECT
    c.role,
    'products.average_cost_usd',
    CASE
      WHEN c.cost_mode = 'all'
        OR (
          c.cost_mode = 'assigned'
          AND brand_key(p.brand) = ANY(c.brand_keys)
        )
      THEN p.average_cost_usd
    END
  FROM cost_scopes c
  CROSS JOIN products p

  UNION ALL

  SELECT
    c.role,
    'purchase_orders.amount_foreign_currency',
    CASE
      WHEN c.cost_mode = 'all'
        OR (
          c.cost_mode = 'assigned'
          AND brand_key(o.brand) = ANY(c.brand_keys)
        )
      THEN o.amount_foreign_currency
    END
  FROM cost_scopes c
  CROSS JOIN purchase_orders o
)
SELECT
  role,
  field,
  COUNT(*) FILTER (WHERE value IS NULL) AS null_values,
  COUNT(*) FILTER (WHERE value IS NOT NULL) AS non_null_values
FROM cost_values
GROUP BY
  role,
  field
ORDER BY
  field,
  role;

ROLLBACK;
