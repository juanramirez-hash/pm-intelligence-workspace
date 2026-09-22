import { describe, it, assert } from 'vitest'
import { createAction,updateAction,loadActionScorecard,listActions,addActionComment } from '../../server/services/actionService.js'
import { requireBrandScope } from '../../server/middleware/requireBrandScope.js'
import { requireWriteAccess } from '../../server/middleware/requireWriteAccess.js'
import { positiveId,periodId,isoDate,pageInteger,numericValue } from '../../server/services/actionValidation.js'
import { lossWindow,comparisonWindow } from '../../server/services/metricPeriods.js'

async function rejected(promise, pattern) {
  let failure
  try { await promise } catch (error) { failure = error }
  assert.instanceOf(failure, Error)
  assert.match(failure.message, pattern)
}

function database({action, existing, permission=true, failEvent=false, scope='assigned'}={}) {
  const calls=[]
  const client={
    async query(sql,params=[]) {
      calls.push({sql,params})
      if(sql.includes('SELECT u.id,u.active')) return {rows:[{id:1,active:true,scope,write_access:permission,role_active:true}]}
      if(sql.includes('SELECT brand_id FROM')) return {rows:[{brand_id:'UNV'}]}
      if(sql.includes('SELECT * FROM pm_actions')) return {rows:action?[action]:[]}
      if(sql.includes('SELECT id FROM pm_actions')) return {rows:existing?[{id:existing}]:[]}
      if(sql.includes('INSERT INTO pm_actions(')) return {rows:[{id:9}]}
      if(sql.includes('INSERT INTO pm_action_events') && failEvent) throw new Error('event failure')
      return {rows:[]}
    },
    release(){calls.push({sql:'RELEASE',params:[]})},
  }
  return {calls,pool:{connect:async()=>client,query:client.query.bind(client)}}
}
const input={brandId:'UNV',periodId:'2026-09',origin:'rule',originRuleCode:'recover',originEntityType:'customer',originEntityId:'C1',evidence:{},title:'Recuperar',description:null,horizon:'short',priority:'high',ownerUserId:1,createdByUserId:1,dueDate:'2026-09-30',metricKind:'revenue',baselineValue:0,targetValue:100}
const action={id:9,brand_id:'UNV',owner_user_id:1,status:'open',priority:'medium',due_date:'2026-09-30',result_value:null}

describe('Action writes and permissions',()=>{
  it('serializes an origin before checking duplicates and commits the audit event',async()=>{
    const db=database(); const result=await createAction(db.pool,input)
    assert.equal(result.actionId,9)
    assert.isBelow(db.calls.findIndex(c=>c.sql.includes('pg_advisory_xact_lock')),db.calls.findIndex(c=>c.sql.includes('SELECT id FROM pm_actions')))
    assert.isBelow(db.calls.findIndex(c=>c.sql.includes('INSERT INTO pm_action_events')),db.calls.findIndex(c=>c.sql==='COMMIT'))
  })
  it('reconfirms an existing origin without inserting another action',async()=>{
    const db=database({existing:5}); assert.deepEqual(await createAction(db.pool,input),{created:false,actionId:5})
    assert.isFalse(db.calls.some(c=>c.sql.includes('INSERT INTO pm_actions(')))
    assert.equal(db.calls.find(c=>c.sql.includes('INSERT INTO pm_action_events')).params[2],'rule_reconfirmed')
  })
  it('rolls back when audit insertion fails',async()=>{
    const db=database({failEvent:true})
    await rejected(createAction(db.pool,input),/event failure/)
    assert.isTrue(db.calls.some(c=>c.sql==='ROLLBACK')); assert.isFalse(db.calls.some(c=>c.sql==='COMMIT'))
    assert.equal(db.calls.at(-1).sql,'RELEASE')
  })
  it('rechecks revoked write access inside the transaction',async()=>{
    const db=database({permission:false})
    await rejected(updateAction(db.pool,9,{priority:'high'},1),/acceso de escritura/)
    assert.isFalse(db.calls.some(c=>c.sql.startsWith('UPDATE')))
  })
  it('checks current ownership while the action is locked',async()=>{
    const db=database({action:{...action,owner_user_id:2}})
    await rejected(updateAction(db.pool,9,{status:'done'},1),/responsable/)
    assert.isTrue(db.calls.some(c=>c.sql.includes('FOR UPDATE')))
  })
  it('hides an action from another brand on update and comment',async()=>{
    const db=database({action:{...action,brand_id:'OTHER'}})
    await rejected(updateAction(db.pool,9,{status:'done'},1),/no encontrada/)
    await rejected(addActionComment(db.pool,9,1,'Nota'),/no encontrada/)
  })
  it('records priority-only changes with before and after values',async()=>{
    const db=database({action});await updateAction(db.pool,9,{priority:'high'},1)
    const event=db.calls.find(c=>c.sql.includes('INSERT INTO pm_action_events'))
    assert.equal(event.params[2],'priority_changed')
    assert.deepEqual(JSON.parse(event.params[6]),{from:'medium',to:'high'})
  })
  it('does not audit a date that has not changed when pg returns a string',async()=>{
    const db=database({action});assert.isTrue((await updateAction(db.pool,9,{dueDate:'2026-09-30'},1)).unchanged)
    assert.isFalse(db.calls.some(c=>c.sql.includes('INSERT INTO pm_action_events')))
  })
  it('filters the scorecard by both assigned brands and the user before grouping',async()=>{
    const db=database();await loadActionScorecard(db.pool,{mode:'assigned',brandKeys:['UNV'],selfUserId:1},{periodId:'2026-09'})
    const query=db.calls[0];assert.include(query.sql,'a.brand_key = ANY($1::TEXT[])');assert.include(query.sql,'a.owner_user_id=$2')
    assert.deepEqual(query.params,[['UNV'],1,'2026-09'])
  })
  it('denies unknown service scopes and invalid paging before querying',async()=>{
    const db=database()
    await rejected(listActions(db.pool,{mode:'invalid'}),/Alcance/)
    await rejected(listActions(db.pool,{mode:'all'},{},{limit:-1}),/inválido/)
    assert.equal(db.calls.length,0)
  })
})
describe('Request validation and middleware',()=>{
  for(const value of ['2026-00','2026-13','bad'])it(`rejects period ${value}`,()=>assert.throws(()=>periodId(value)))
  for(const value of ['2026-02-30','2026-09-31'])it(`rejects date ${value}`,()=>assert.throws(()=>isoDate(value)))
  for(const value of ['1e0','0','1.5',[],9007199254740992])it(`rejects id ${String(value)}`,()=>assert.throws(()=>positiveId(value)))
  it('rejects non-finite values and fractional windows',()=>{assert.throws(()=>numericValue(Infinity,'value'));assert.throws(()=>pageInteger('2.5',2,12,1))})
  it('accepts a leap day and zero result',()=>{assert.equal(isoDate('2024-02-29'),'2024-02-29');assert.equal(numericValue(0,'value'),0)})
  it('denies unauthenticated and unassigned scope and read-only mutations',()=>{
    const statuses=[];const res={status(code){statuses.push(code);return this},json(){return this}}
    const next=()=>{throw new Error('must not continue')}
    requireBrandScope({},res,next)
    requireBrandScope({authUser:{scope:'assigned',brandIds:[]}},res,next)
    requireWriteAccess({authUser:{writeAccess:false}},res,next)
    assert.deepEqual(statuses,[401,403,403])
  })
})
describe('Commercial windows',()=>{
  it('uses July and August as complete inactive months at a September cutoff',()=>{
    assert.deepEqual(lossWindow('2026-09','2026-09-17'),{baseFrom:'2026-06',baseTo:'2026-06',inactiveFrom:'2026-07',inactiveTo:'2026-08'})
  })
  it('uses the selected historical month and handles a year boundary',()=>{
    assert.deepEqual(lossWindow('2026-01','2026-09-17'),{baseFrom:'2025-11',baseTo:'2025-11',inactiveFrom:'2025-12',inactiveTo:'2026-01'})
  })
  it('compares thirteen working days, not a complete previous month',()=>{
    const window=comparisonWindow('2026-09','2026-09-17')
    assert.equal(window.previousTo,'2026-08-19');assert.equal(window.currentTo,'2026-09-17');assert.equal(window.basis,'equivalent-working-days')
  })
  it('uses complete months when closed and no window before the period',()=>{
    assert.equal(comparisonWindow('2026-09','2026-09-30').previousTo,'2026-08-31')
    assert.isNull(comparisonWindow('2026-10','2026-09-17'))
  })
})
