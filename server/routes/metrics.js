import { Router } from 'express'
import { requireBrandScope,resolveRequestedBrandKey } from '../middleware/requireBrandScope.js'
import { handleRouteError,httpError,pageInteger,periodId } from '../services/actionValidation.js'
import { comparisonWindow,lossWindow } from '../services/metricPeriods.js'
function requestedBrand(req) {
  const key=resolveRequestedBrandKey(req,req.params.brand ?? req.query.brand)
  if (!key) throw httpError(403,'Marca fuera del alcance del usuario')
  return key
}
async function cutoff(pool) {
  const result=await pool.query('SELECT MAX(sale_date)::TEXT AS cutoff FROM sales_facts')
  return result.rows[0]?.cutoff ?? null
}
export function createMetricsRouter(pool) {
  const router=Router()
  router.use(requireBrandScope)
  router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next()})
  router.get('/brands',async(req,res)=>{
    try {
      const params=[],clauses=[]
      if(req.brandScope.mode==='assigned'){params.push(req.brandScope.brandKeys);clauses.push(`brand_key=ANY($${params.length}::TEXT[])`)}
      if(req.query.brand!==undefined){params.push(requestedBrand(req));clauses.push(`brand_key=$${params.length}`)}
      for(const [key,op] of [['from','>='],['to','<=']]){
        if(req.query[key]!==undefined){params.push(periodId(req.query[key]));clauses.push(`period_id ${op} $${params.length}`)}
      }
      if(req.query.from && req.query.to && req.query.from>req.query.to) throw httpError(400,'Rango de periodos inválido')
      const limit=pageInteger(req.query.limit,100,500,1),offset=pageInteger(req.query.offset,0,1000000)
      const result=await pool.query(`SELECT * FROM brand_period_scorecard ${clauses.length?`WHERE ${clauses.join(' AND ')}`:''}
        ORDER BY period_id DESC,brand_key LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,limit+1,offset])
      return res.json({ok:true,comparisonBasis:'monthly-totals',limit,offset,hasMore:result.rows.length>limit,rows:result.rows.slice(0,limit)})
    }catch(error){return handleRouteError(res,error,'No se pudieron consultar las métricas')}
  })
  router.get('/brands/:brand/comparison',async(req,res)=>{
    try {
      const brandKey=requestedBrand(req),period=periodId(req.query.period),dataCutoff=await cutoff(pool)
      const window=dataCutoff?comparisonWindow(period,dataCutoff):null
      if(!window)return res.json({ok:true,brandKey,period,dataCutoff,window:null,rows:[]})
      const result=await pool.query(`WITH windows(label,date_from,date_to) AS (
        VALUES ('previous',$2::DATE,$3::DATE),('current',$4::DATE,$5::DATE))
        SELECT w.label,w.date_from::TEXT,w.date_to::TEXT,COALESCE(SUM(f.revenue),0) AS revenue,
          COALESCE(SUM(f.gross_profit),0) AS gross_profit,
          SUM(f.gross_profit)/NULLIF(SUM(f.revenue),0) AS gross_margin,
          COUNT(DISTINCT NULLIF(f.customer_id,'')) AS active_customers,
          COUNT(DISTINCT NULLIF(f.product_code,'')) AS active_products,
          COUNT(DISTINCT NULLIF(f.document_number,'')) AS documents
        FROM windows w LEFT JOIN sales_facts f ON brand_key(f.brand)=$1 AND f.sale_date BETWEEN w.date_from AND w.date_to
        GROUP BY w.label,w.date_from,w.date_to ORDER BY w.date_from`,
      [brandKey,window.previousFrom,window.previousTo,window.currentFrom,window.currentTo])
      return res.json({ok:true,brandKey,period,dataCutoff,window,rows:result.rows})
    }catch(error){return handleRouteError(res,error,'No se pudo consultar el comparativo')}
  })
  router.get('/brands/:brand/lost-customers',async(req,res)=>{
    try {
      const brandKey=requestedBrand(req),period=periodId(req.query.period)
      const inactivePeriods=pageInteger(req.query.inactivePeriods,2,12,1),basePeriods=pageInteger(req.query.basePeriods,1,24,1)
      const limit=pageInteger(req.query.limit,50,500,1),offset=pageInteger(req.query.offset,0,1000000)
      const dataCutoff=await cutoff(pool),window=dataCutoff?lossWindow(period,dataCutoff,inactivePeriods,basePeriods):null
      if(!window)return res.json({ok:true,brandKey,period,dataCutoff,window:null,rows:[]})
      const result=await pool.query(`SELECT m.customer_id,MIN(m.customer_name) AS customer_name,
        SUM(m.revenue) AS base_revenue,SUM(m.gross_profit) AS base_gross_profit,
        COUNT(DISTINCT m.period_id) AS active_months,MAX(m.last_sale_date) AS last_sale_date,
        ROUND(SUM(m.revenue)/NULLIF(COUNT(DISTINCT m.period_id),0),2) AS avg_monthly_revenue
        FROM brand_customer_period_metrics m WHERE m.brand_key=$1 AND m.period_id BETWEEN $2 AND $3
          AND NOT EXISTS(SELECT 1 FROM brand_customer_period_metrics r WHERE r.brand_key=m.brand_key AND r.customer_id=m.customer_id
            AND r.period_id BETWEEN $4 AND $5)
        GROUP BY m.customer_id HAVING SUM(m.revenue)>0 ORDER BY base_revenue DESC,m.customer_id LIMIT $6 OFFSET $7`,
      [brandKey,window.baseFrom,window.baseTo,window.inactiveFrom,window.inactiveTo,limit+1,offset])
      return res.json({ok:true,brandKey,period,inactivePeriods,basePeriods,dataCutoff,window,limit,offset,
        hasMore:result.rows.length>limit,rows:result.rows.slice(0,limit)})
    }catch(error){return handleRouteError(res,error,'No se pudieron consultar los clientes sin recompra')}
  })
  return router
}
