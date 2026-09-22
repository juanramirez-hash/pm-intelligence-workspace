import { Router } from 'express'
import { requireBrandScope, resolveRequestedBrandKey } from '../middleware/requireBrandScope.js'
import { requireWriteAccess, isTeamWideRole } from '../middleware/requireWriteAccess.js'
import {
  ACTION_HORIZONS,ACTION_METRIC_KINDS,ACTION_PRIORITIES,ACTION_STATUSES,
  addActionComment,createAction,defaultDueDate,getActionById,listActionEvents,listActions,loadActionScorecard,updateAction,
} from '../services/actionService.js'
import { allowed,handleRouteError,httpError,isoDate,numericValue,periodId,positiveId,textValue } from '../services/actionValidation.js'

const origins = new Set(['rule','manual','f2f'])
const entities = new Set(['customer','product','brand','project'])
function bodyObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw httpError(400,'Cuerpo JSON inválido')
  return value
}
function list(value, values) {
  if (value === undefined) return []
  if (typeof value !== 'string') throw httpError(400,'Filtro inválido')
  return value.split(',').map((item) => allowed(item.trim(),values,'Filtro'))
}
function ownerFilter(req) {
  if (req.query.owner === undefined) return undefined
  if (req.query.owner === 'me') return positiveId(req.authUser.id)
  if (!isTeamWideRole(req.authUser)) throw httpError(403,'Filtrar otro responsable requiere alcance total')
  return positiveId(req.query.owner,'owner')
}
function brand(req, value) {
  const key = resolveRequestedBrandKey(req,value)
  if (!key) throw httpError(403,'Marca fuera del alcance del usuario')
  return key
}
export function createActionsRouter(pool) {
  const router = Router()
  router.use(requireBrandScope)
  router.use((_req,res,next) => { res.set('Cache-Control','no-store'); next() })
  router.get('/', async (req,res) => {
    try {
      if (req.query.overdue !== undefined && !['true','false'].includes(req.query.overdue)) throw httpError(400,'overdue inválido')
      const filters = {
        statuses: list(req.query.status,ACTION_STATUSES),horizons: list(req.query.horizon,ACTION_HORIZONS),
        onlyOverdue: req.query.overdue === 'true',ownerUserId: ownerFilter(req),
      }
      if (req.query.brand !== undefined) filters.brandKey = brand(req,req.query.brand)
      if (req.query.period !== undefined) filters.periodId = periodId(req.query.period)
      return res.json({ok:true,...await listActions(pool,req.brandScope,filters,{limit:req.query.limit,offset:req.query.offset})})
    } catch (error) { return handleRouteError(res,error,'No se pudieron consultar las acciones') }
  })
  router.get('/scorecard', async (req,res) => {
    try {
      const filters = { ownerUserId: ownerFilter(req) }
      if (req.query.period !== undefined) filters.periodId = periodId(req.query.period)
      const rows = await loadActionScorecard(pool,{...req.brandScope,selfUserId:req.authUser.id},filters)
      return res.json({ok:true,rows})
    } catch (error) { return handleRouteError(res,error,'No se pudo consultar el cumplimiento') }
  })
  router.get('/:id', async (req,res) => {
    try {
      const id = positiveId(req.params.id)
      const action = await getActionById(pool,req.brandScope,id)
      if (!action) throw httpError(404,'Acción no encontrada')
      return res.json({ok:true,action,events:await listActionEvents(pool,id)})
    } catch (error) { return handleRouteError(res,error,'No se pudo consultar la acción') }
  })
  router.post('/',requireWriteAccess, async (req,res) => {
    try {
      const body = bodyObject(req.body)
      brand(req,body.brandId)
      const origin = allowed(body.origin ?? 'rule',origins,'origin')
      const originRuleCode = textValue(body.originRuleCode,'originRuleCode',200,origin !== 'rule')
      const originEntityType = body.originEntityType == null ? null : allowed(body.originEntityType,entities,'originEntityType')
      const originEntityId = textValue(body.originEntityId,'originEntityId',300,true)
      if (Boolean(originEntityType) !== Boolean(originEntityId)) throw httpError(400,'La entidad requiere tipo e identificador')
      if (body.evidence != null && (typeof body.evidence !== 'object' || Array.isArray(body.evidence))) throw httpError(400,'evidence debe ser un objeto')
      if (JSON.stringify(body.evidence ?? {}).length > 50000) throw httpError(400,'evidence excede el tamaño permitido')
      const horizon = allowed(body.horizon,ACTION_HORIZONS,'horizon')
      const ownerUserId = positiveId(body.ownerUserId ?? req.authUser.id,'ownerUserId')
      if (!isTeamWideRole(req.authUser) && String(ownerUserId) !== String(req.authUser.id)) throw httpError(403,'No puedes asignar acciones a otro usuario')
      const result = await createAction(pool,{
        brandId:textValue(body.brandId,'brandId',300),periodId:periodId(body.periodId),origin,originRuleCode,originEntityType,originEntityId,
        evidence:body.evidence ?? {},title:textValue(body.title,'title',300),description:textValue(body.description,'description',5000,true),
        horizon,priority:allowed(body.priority ?? 'medium',ACTION_PRIORITIES,'priority'),ownerUserId,createdByUserId:positiveId(req.authUser.id),
        dueDate:isoDate(body.dueDate ?? defaultDueDate(horizon)),metricKind:allowed(body.metricKind ?? 'revenue',ACTION_METRIC_KINDS,'metricKind'),
        baselineValue:numericValue(body.baselineValue ?? null,'baselineValue'),targetValue:numericValue(body.targetValue ?? null,'targetValue'),
      })
      return res.status(result.created?201:200).json({ok:true,...result})
    } catch (error) { return handleRouteError(res,error,'No se pudo crear la acción') }
  })
  router.patch('/:id',requireWriteAccess, async (req,res) => {
    try {
      const body = bodyObject(req.body)
      const changes = {}
      const validators = {
        status:(value)=>allowed(value,ACTION_STATUSES,'status'),priority:(value)=>allowed(value,ACTION_PRIORITIES,'priority'),
        dueDate:isoDate,ownerUserId:(value)=>positiveId(value,'ownerUserId'),resultValue:(value)=>numericValue(value,'resultValue'),
        note:(value)=>textValue(value,'note',5000,true),
      }
      for (const key of Object.keys(body)) {
        if (!Object.hasOwn(validators,key)) throw httpError(400,`Campo no editable: ${key}`)
        changes[key] = validators[key](body[key])
      }
      if (changes.ownerUserId !== undefined && !isTeamWideRole(req.authUser)) throw httpError(403,'Reasignar requiere alcance total')
      const result = await updateAction(pool,positiveId(req.params.id),changes,positiveId(req.authUser.id))
      return res.json({ok:true,...result})
    } catch (error) { return handleRouteError(res,error,'No se pudo actualizar la acción') }
  })
  router.post('/:id/comments',requireWriteAccess, async (req,res) => {
    try {
      const result = await addActionComment(pool,positiveId(req.params.id),positiveId(req.authUser.id),textValue(req.body?.note,'note',5000))
      return res.status(201).json({ok:true,...result})
    } catch (error) { return handleRouteError(res,error,'No se pudo registrar el comentario') }
  })
  return router
}
