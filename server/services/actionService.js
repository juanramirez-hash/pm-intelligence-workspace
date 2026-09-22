import { normalizeBrandKey, normalizeBrandKeys } from '../middleware/requireBrandScope.js'
import { httpError, pageInteger, positiveId } from './actionValidation.js'

const OPEN_STATUSES = ['open', 'in_progress', 'blocked']
const CLOSED_STATUSES = ['done', 'cancelled', 'auto_resolved']
export const ACTION_HORIZONS = new Set(['immediate', 'short', 'medium'])
export const ACTION_PRIORITIES = new Set(['critical', 'high', 'medium', 'low'])
export const ACTION_STATUSES = new Set([...OPEN_STATUSES, ...CLOSED_STATUSES])
export const ACTION_METRIC_KINDS = new Set(['revenue', 'gross_profit', 'gross_margin', 'units', 'none'])
export function defaultDueDate(horizon, from = new Date()) {
  const date = new Date(from)
  date.setUTCDate(date.getUTCDate() + ({ immediate: 7, short: 30, medium: 90 }[horizon] ?? 30))
  return date.toISOString().slice(0, 10)
}
function scopeFilter(scope, params, alias = '') {
  if (scope?.mode === 'all') return 'TRUE'
  if (scope?.mode !== 'assigned' || !Array.isArray(scope.brandKeys) || !scope.brandKeys.length) throw httpError(403, 'Alcance de marca inválido')
  params.push(scope.brandKeys)
  return `${alias}brand_key = ANY($${params.length}::TEXT[])`
}
function filtersSql(scope, filters, params) {
  const clauses = [scopeFilter(scope, params)]
  for (const [field, value] of [['brand_key', filters.brandKey], ['owner_user_id', filters.ownerUserId], ['period_id', filters.periodId]]) {
    if (value !== undefined) { params.push(value); clauses.push(`${field} = $${params.length}`) }
  }
  for (const [field, values] of [['status', filters.statuses], ['horizon', filters.horizons]]) {
    if (values?.length) { params.push(values); clauses.push(`${field} = ANY($${params.length}::TEXT[])`) }
  }
  if (filters.onlyOverdue) clauses.push('is_overdue = TRUE')
  return clauses.join(' AND ')
}
export async function listActions(pool, scope, filters = {}, paging = {}) {
  const limit = pageInteger(paging.limit, 100, 500, 1)
  const offset = pageInteger(paging.offset, 0, 1000000)
  const params = []
  const where = filtersSql(scope, filters, params)
  const result = await pool.query(`SELECT * FROM pm_action_queue WHERE ${where}
    ORDER BY CASE WHEN status IN ('open','in_progress','blocked') THEN 0 ELSE 1 END,
      horizon_rank, priority_rank, due_date, id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset])
  const count = await pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_overdue) AS overdue,
    COUNT(*) FILTER (WHERE horizon = 'immediate' AND status IN ('open','in_progress','blocked')) AS immediate_open
    FROM pm_action_queue WHERE ${where}`, params)
  return { rows: result.rows, summary: count.rows[0], limit, offset }
}
export async function getActionById(pool, scope, actionId) {
  const params = [actionId]
  const where = scopeFilter(scope, params)
  const result = await pool.query(`SELECT * FROM pm_action_queue WHERE id = $1 AND ${where}`, params)
  return result.rows[0] ?? null
}
export async function listActionEvents(pool, actionId) {
  const result = await pool.query(`SELECT e.id,e.event_type,e.from_status,e.to_status,e.note,e.payload,e.created_at,
    u.name AS user_name,u.email AS user_email FROM pm_action_events e
    LEFT JOIN app_users u ON u.id=e.user_id WHERE e.action_id=$1 ORDER BY e.created_at DESC,e.id DESC`, [actionId])
  return result.rows
}
async function transaction(pool, task) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await task(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try { await client.query('ROLLBACK') } catch (rollbackError) { console.error('Action rollback failed', rollbackError) }
    throw error
  } finally { client.release() }
}
// Reload roles and assignments in the transaction; HTTP middleware is not the final authority.
async function lockUser(client, id) {
  const result = await client.query(`SELECT u.id,u.active,r.scope,r.write_access,r.active AS role_active
    FROM app_users u JOIN app_roles r ON r.role_key=u.role WHERE u.id=$1 FOR SHARE OF u,r`, [id])
  const user = result.rows[0]
  if (!user || !user.active || !user.role_active || !user.write_access || !['all','assigned'].includes(user.scope)) {
    throw httpError(403, 'El usuario no tiene acceso de escritura vigente')
  }
  const assignments = await client.query('SELECT brand_id FROM app_user_brand_assignments WHERE user_id=$1 ORDER BY brand_id FOR SHARE', [id])
  return { ...user, keys: normalizeBrandKeys(assignments.rows.map((row) => row.brand_id)) }
}
function checkBrand(user, brandId, status = 403) {
  const key = normalizeBrandKey(brandId)
  if (!key || (user.scope !== 'all' && !user.keys.includes(key))) throw httpError(status, status === 404 ? 'Acción no encontrada' : 'Marca fuera del alcance del usuario')
}
async function event(client, actionId, userId, type, data = {}) {
  await client.query(`INSERT INTO pm_action_events(action_id,user_id,event_type,from_status,to_status,note,payload)
    VALUES($1,$2,$3,$4,$5,$6,$7::JSONB)`, [actionId,userId,type,data.from ?? null,data.to ?? null,data.note ?? null,JSON.stringify(data.payload ?? {})])
}
export async function createAction(pool, input) {
  return transaction(pool, async (client) => {
    const actor = await lockUser(client, input.createdByUserId)
    checkBrand(actor, input.brandId)
    if (actor.scope !== 'all' && String(input.ownerUserId) !== String(actor.id)) throw httpError(403, 'No puedes asignar acciones a otro usuario')
    const owner = String(input.ownerUserId) === String(actor.id) ? actor : await lockUser(client, input.ownerUserId)
    checkBrand(owner, input.brandId)
    if (input.originRuleCode) {
      // Serialize equal origins before checking existence, including two first-time requests.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [JSON.stringify([normalizeBrandKey(input.brandId), input.originRuleCode, input.originEntityType ?? '', input.originEntityId ?? ''])])
      const existing = await client.query(`SELECT id FROM pm_actions WHERE brand_key=brand_key($1)
        AND origin_rule_code=$2 AND COALESCE(origin_entity_type,'')=COALESCE($3,'')
        AND COALESCE(origin_entity_id,'')=COALESCE($4,'') AND status IN ('open','in_progress','blocked') FOR UPDATE`,
      [input.brandId,input.originRuleCode,input.originEntityType,input.originEntityId])
      if (existing.rows.length) {
        const id = existing.rows[0].id
        await event(client,id,actor.id,'rule_reconfirmed',{ payload: input.evidence })
        return { created: false, actionId: id }
      }
    }
    const result = await client.query(`INSERT INTO pm_actions(brand_id,period_id,origin,origin_rule_code,origin_entity_type,origin_entity_id,evidence,
      title,description,horizon,priority,owner_user_id,created_by_user_id,due_date,metric_kind,baseline_value,target_value)
      VALUES($1,$2,$3,$4,$5,$6,$7::JSONB,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
    [input.brandId,input.periodId,input.origin,input.originRuleCode,input.originEntityType,input.originEntityId,JSON.stringify(input.evidence ?? {}),
      input.title,input.description,input.horizon,input.priority,input.ownerUserId,actor.id,input.dueDate,input.metricKind,input.baselineValue,input.targetValue])
    const id = result.rows[0].id
    await event(client,id,actor.id,'created',{ to: 'open', note: input.description, payload: input.evidence })
    return { created: true, actionId: id }
  })
}
export async function updateAction(pool, actionId, changes, actorUserId) {
  return transaction(pool, async (client) => {
    const actor = await lockUser(client, actorUserId)
    const result = await client.query('SELECT * FROM pm_actions WHERE id=$1 FOR UPDATE', [actionId])
    const before = result.rows[0]
    if (!before) throw httpError(404, 'Acción no encontrada')
    checkBrand(actor, before.brand_id, 404)
    if (actor.scope !== 'all' && String(before.owner_user_id) !== String(actor.id)) throw httpError(403, 'Solo el responsable puede modificar la acción')
    const sets = [], params = [], events = []
    const set = (field,value) => { params.push(value); sets.push(`${field}=$${params.length}`) }
    if (changes.ownerUserId !== undefined && String(changes.ownerUserId) !== String(before.owner_user_id)) {
      if (actor.scope !== 'all') throw httpError(403, 'Reasignar requiere alcance total')
      const owner = await lockUser(client, positiveId(changes.ownerUserId, 'ownerUserId'))
      checkBrand(owner, before.brand_id)
      set('owner_user_id',owner.id)
      events.push(['reassigned',{ note: changes.note, payload: { from: before.owner_user_id,to: owner.id } }])
    }
    if (changes.status !== undefined && changes.status !== before.status) {
      set('status',changes.status)
      sets.push(CLOSED_STATUSES.includes(changes.status) ? 'closed_at=NOW()' : 'closed_at=NULL')
      set('closure_note', CLOSED_STATUSES.includes(changes.status) ? changes.note ?? null : null)
      events.push(['status_changed',{ from: before.status,to: changes.status,note: changes.note }])
    }
    const beforeDate = before.due_date instanceof Date ? before.due_date.toISOString().slice(0,10) : String(before.due_date).slice(0,10)
    for (const [key,field,type,old] of [
      ['dueDate','due_date','due_date_changed',beforeDate],
      ['priority','priority','priority_changed',before.priority],
      ['resultValue','result_value','result_recorded',before.result_value === null ? null : Number(before.result_value)],
    ]) {
      if (changes[key] !== undefined && changes[key] !== old) {
        set(field,changes[key]); events.push([type,{ note: changes.note,payload: { from: old,to: changes[key] } }])
      }
    }
    if (!sets.length) return { unchanged: true, actionId }
    params.push(actionId)
    await client.query(`UPDATE pm_actions SET ${sets.join(',')} WHERE id=$${params.length}`,params)
    for (const [type,data] of events) await event(client,actionId,actor.id,type,data)
    return { unchanged: false,actionId }
  })
}
export async function addActionComment(pool, actionId, userId, note) {
  return transaction(pool,async (client) => {
    const actor = await lockUser(client,userId)
    const action = await client.query('SELECT * FROM pm_actions WHERE id=$1 FOR SHARE',[actionId])
    if (!action.rows.length) throw httpError(404,'Acción no encontrada')
    checkBrand(actor,action.rows[0].brand_id,404)
    await event(client,actionId,actor.id,'comment',{note})
    return { actionId }
  })
}
export async function loadActionScorecard(pool, scope, filters = {}) {
  const params = []
  const clauses = [scopeFilter(scope,params,'a.')]
  if (scope.mode === 'assigned') {
    params.push(positiveId(scope.selfUserId)); clauses.push(`a.owner_user_id=$${params.length}`)
  }
  for (const [field,value] of [['period_id',filters.periodId],['owner_user_id',filters.ownerUserId]]) {
    if (value !== undefined) { params.push(value); clauses.push(`a.${field}=$${params.length}`) }
  }
  // Filter underlying actions BEFORE grouping; the team view cannot enforce brand scope.
  const result = await pool.query(`SELECT a.owner_user_id,COALESCE(u.name,'Sin asignar') AS owner_name,u.email AS owner_email,a.period_id,
    COUNT(*) AS total_actions,
    COUNT(*) FILTER(WHERE a.status='done') AS completed,
    COUNT(*) FILTER(WHERE a.status='cancelled') AS cancelled,
    COUNT(*) FILTER(WHERE a.status='auto_resolved') AS auto_resolved,
    COUNT(*) FILTER(WHERE a.status IN ('open','in_progress','blocked')) AS still_open,
    COUNT(*) FILTER(WHERE a.status IN ('open','in_progress','blocked') AND a.due_date<CURRENT_DATE) AS overdue,
    COUNT(*) FILTER(WHERE a.status='done' AND a.closed_at::DATE<=a.due_date) AS completed_on_time,
    ROUND(COUNT(*) FILTER(WHERE a.status='done')::NUMERIC/NULLIF(COUNT(*) FILTER(WHERE a.status<>'cancelled'),0),4) AS completion_rate,
    ROUND(AVG(EXTRACT(EPOCH FROM(a.closed_at-a.created_at))/86400) FILTER(WHERE a.status='done'),2) AS avg_days_to_close,
    SUM(a.target_value) FILTER(WHERE a.metric_kind='revenue' AND a.status<>'cancelled') AS revenue_committed,
    SUM(a.result_value) FILTER(WHERE a.metric_kind='revenue' AND a.status='done') AS revenue_realized,
    COUNT(*) FILTER(WHERE a.horizon='immediate') AS immediate_actions,
    COUNT(*) FILTER(WHERE a.horizon='short') AS short_term_actions,
    COUNT(*) FILTER(WHERE a.horizon='medium') AS medium_term_actions
    FROM pm_actions a LEFT JOIN app_users u ON u.id=a.owner_user_id WHERE ${clauses.join(' AND ')}
    GROUP BY a.owner_user_id,u.name,u.email,a.period_id ORDER BY a.period_id DESC,owner_name`,params)
  return result.rows
}
