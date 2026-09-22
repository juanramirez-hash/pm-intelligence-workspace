-- First installation only; do not use over an already applied version of 032.
BEGIN;
-- 032_pm_actions.sql
-- Centro de Acciones: convierte una recomendación en un compromiso con
-- responsable, horizonte, fecha y resultado medible.
--
-- Depende de: 027_app_users_roles.sql (app_users), 031_business_aggregates.sql (brand_key).

-- ---------------------------------------------------------------------------
-- 1. Acciones
-- ---------------------------------------------------------------------------

CREATE TABLE pm_actions (
  id BIGSERIAL PRIMARY KEY,

  -- Alcance
  brand_id   TEXT NOT NULL CHECK (LENGTH(brand_key(brand_id)) > 0),                       -- etiqueta como la ve el usuario
  brand_key  TEXT GENERATED ALWAYS AS (brand_key(brand_id)) STORED,
  period_id  TEXT NOT NULL CHECK (period_id ~ '^(19|20|21)[0-9]{2}-(0[1-9]|1[0-2])$'),                       -- mes al que pertenece (YYYY-MM)

  -- Origen: qué regla la generó y con qué evidencia
  origin              TEXT NOT NULL DEFAULT 'rule'
    CHECK (origin IN ('rule', 'manual', 'f2f')),
  origin_rule_code    TEXT,
  origin_entity_type  TEXT
    CHECK (
      origin_entity_type IS NULL
      OR origin_entity_type IN ('customer', 'product', 'brand', 'project')
    ),
  origin_entity_id    TEXT,
  evidence            JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Contenido
  title        TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
  description  TEXT,

  horizon TEXT NOT NULL
    CHECK (horizon IN ('immediate', 'short', 'medium')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('critical', 'high', 'medium', 'low')),

  -- Responsables
  owner_user_id BIGINT
    REFERENCES app_users(id) ON DELETE SET NULL,
  created_by_user_id BIGINT
    REFERENCES app_users(id) ON DELETE SET NULL,

  -- Compromiso y estado
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (
      status IN ('open', 'in_progress', 'blocked', 'done', 'cancelled', 'auto_resolved')
    ),

  -- Medición
  metric_kind TEXT NOT NULL DEFAULT 'revenue'
    CHECK (metric_kind IN ('revenue', 'gross_profit', 'gross_margin', 'units', 'none')),
  baseline_value NUMERIC(18, 4),
  target_value   NUMERIC(18, 4),
  result_value   NUMERIC(18, 4),

  closed_at    TIMESTAMPTZ,
  closure_note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_pm_actions_closed_consistency
    CHECK (
      (status IN ('done', 'cancelled', 'auto_resolved') AND closed_at IS NOT NULL)
      OR (status IN ('open', 'in_progress', 'blocked') AND closed_at IS NULL)
    ),

  CONSTRAINT chk_pm_actions_rule_origin
    CHECK (origin <> 'rule' OR origin_rule_code IS NOT NULL)
);

-- Deduplicación: una sola acción abierta por regla + entidad + marca.
-- Si la regla vuelve a dispararse, se actualiza la existente en lugar de crear ruido.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pm_actions_open_origin
  ON pm_actions (
    brand_key,
    origin_rule_code,
    COALESCE(origin_entity_type, ''),
    COALESCE(origin_entity_id, '')
  )
  WHERE status IN ('open', 'in_progress', 'blocked')
    AND origin_rule_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pm_actions_owner_status
  ON pm_actions (owner_user_id, status);

CREATE INDEX IF NOT EXISTS idx_pm_actions_brand_period
  ON pm_actions (brand_key, period_id);

CREATE INDEX IF NOT EXISTS idx_pm_actions_due_date
  ON pm_actions (due_date)
  WHERE status IN ('open', 'in_progress', 'blocked');

-- updated_at automático
CREATE OR REPLACE FUNCTION pm_actions_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_actions_updated_at ON pm_actions;

CREATE TRIGGER trg_pm_actions_updated_at
  BEFORE UPDATE ON pm_actions
  FOR EACH ROW
  EXECUTE FUNCTION pm_actions_set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Bitácora: quién hizo qué y cuándo (auditoría y seguimiento en el F2F)
-- ---------------------------------------------------------------------------

CREATE TABLE pm_action_events (
  id BIGSERIAL PRIMARY KEY,

  action_id BIGINT NOT NULL
    REFERENCES pm_actions(id) ON DELETE CASCADE,

  user_id BIGINT
    REFERENCES app_users(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL
    CHECK (
      event_type IN (
        'created', 'status_changed', 'reassigned',
        'due_date_changed', 'priority_changed', 'comment', 'result_recorded', 'rule_reconfirmed'
      )
    ),

  from_status TEXT,
  to_status   TEXT,
  note        TEXT,
  payload     JSONB NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pm_action_events_action
  ON pm_action_events (action_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Cola de trabajo: "Mi mes" ya calculada en el servidor
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW pm_action_queue AS
SELECT
  a.id,
  a.brand_id,
  a.brand_key,
  a.period_id,
  a.title,
  a.description,
  a.horizon,
  a.priority,
  a.status,
  a.due_date,
  a.owner_user_id,
  COALESCE(u.name, 'Sin asignar') AS owner_name,
  u.email       AS owner_email,
  a.metric_kind,
  a.baseline_value,
  a.target_value,
  a.result_value,
  a.origin,
  a.origin_rule_code,
  a.origin_entity_type,
  a.origin_entity_id,
  a.evidence,
  a.created_at,
  a.updated_at,
  a.closed_at,
  (CURRENT_DATE - a.due_date)                          AS days_overdue,
  (a.due_date - CURRENT_DATE)                          AS days_remaining,
  (
    a.status IN ('open', 'in_progress', 'blocked')
    AND a.due_date < CURRENT_DATE
  )                                                    AS is_overdue,
  CASE a.horizon
    WHEN 'immediate' THEN 1
    WHEN 'short'     THEN 2
    ELSE 3
  END                                                  AS horizon_rank,
  CASE a.priority
    WHEN 'critical' THEN 1
    WHEN 'high'     THEN 2
    WHEN 'medium'   THEN 3
    ELSE 4
  END                                                  AS priority_rank,
  (
    SELECT COUNT(*)
    FROM pm_action_events e
    WHERE e.action_id = a.id
      AND e.event_type = 'comment'
  )                                                    AS comment_count
FROM pm_actions a
LEFT JOIN app_users u ON u.id = a.owner_user_id;

-- ---------------------------------------------------------------------------
-- 4. Cumplimiento mensual por PM: insumo directo de la reunión F2F
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW pm_action_monthly_scorecard AS
SELECT
  a.owner_user_id,
  COALESCE(u.name, 'Sin asignar') AS owner_name,
  u.email AS owner_email,
  a.period_id,
  COUNT(*)                                                       AS total_actions,
  COUNT(*) FILTER (WHERE a.status = 'done')                      AS completed,
  COUNT(*) FILTER (WHERE a.status = 'cancelled')                 AS cancelled,
  COUNT(*) FILTER (WHERE a.status = 'auto_resolved')             AS auto_resolved,
  COUNT(*) FILTER (
    WHERE a.status IN ('open', 'in_progress', 'blocked')
  )                                                              AS still_open,
  COUNT(*) FILTER (
    WHERE a.status IN ('open', 'in_progress', 'blocked')
      AND a.due_date < CURRENT_DATE
  )                                                              AS overdue,
  COUNT(*) FILTER (
    WHERE a.status = 'done'
      AND a.closed_at::DATE <= a.due_date
  )                                                              AS completed_on_time,
  ROUND(
    COUNT(*) FILTER (WHERE a.status = 'done')::NUMERIC
      / NULLIF(COUNT(*) FILTER (WHERE a.status <> 'cancelled'), 0),
    4
  )                                                              AS completion_rate,
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (a.closed_at - a.created_at)) / 86400
    ) FILTER (WHERE a.status = 'done'),
    2
  )                                                              AS avg_days_to_close,
  SUM(a.target_value)  FILTER (WHERE a.metric_kind = 'revenue' AND a.status <> 'cancelled') AS revenue_committed,
  SUM(a.result_value)  FILTER (
    WHERE a.metric_kind = 'revenue' AND a.status = 'done'
  )                                                              AS revenue_realized,
  COUNT(*) FILTER (WHERE a.horizon = 'immediate')                AS immediate_actions,
  COUNT(*) FILTER (WHERE a.horizon = 'short')                    AS short_term_actions,
  COUNT(*) FILTER (WHERE a.horizon = 'medium')                   AS medium_term_actions
FROM pm_actions a
LEFT JOIN app_users u ON u.id = a.owner_user_id
GROUP BY
  a.owner_user_id,
  u.name,
  u.email,
  a.period_id;

COMMENT ON VIEW pm_action_monthly_scorecard IS
  'Cumplimiento de acciones por PM y mes: creadas, cerradas, vencidas, a tiempo e impacto declarado.';

-- ---------------------------------------------------------------------------
-- 5. Permisos
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE ON TABLE pm_actions        TO pm_intelligence;
GRANT SELECT, INSERT         ON TABLE pm_action_events  TO pm_intelligence;
GRANT USAGE, SELECT ON SEQUENCE pm_actions_id_seq       TO pm_intelligence;
GRANT USAGE, SELECT ON SEQUENCE pm_action_events_id_seq TO pm_intelligence;
GRANT SELECT ON TABLE pm_action_queue                   TO pm_intelligence;
GRANT SELECT ON TABLE pm_action_monthly_scorecard       TO pm_intelligence;

COMMIT;
