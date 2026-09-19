import { Link } from 'react-router-dom'
import { buildBrandCommercialPlan } from '../../../core/decision/brands/brandCommercialPlans'
import type { BrandCommercialPlanRequest } from '../../../core/decision/brands/brandCommercialPlans'
import type { BrandWorkspaceViewModel } from '../../../core/decision/brands/brandWorkspaceViewModel'

export function BrandCommercialPlan({ workspace, request }: {
  workspace: BrandWorkspaceViewModel
  request: BrandCommercialPlanRequest
}) {
  const plan = buildBrandCommercialPlan(workspace, request)
  return (
    <details className="group mt-4 rounded-xl border border-blue-200 bg-white text-left text-sm text-slate-700" key={`${workspace.id}-${request.code ?? request.title}-${request.entityId ?? ''}`}>
      <summary className="cursor-pointer rounded-xl px-4 py-3 font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500">
        <span className="group-open:hidden">Ver plan comercial</span>
        <span className="hidden group-open:inline">Ocultar plan comercial</span>
      </summary>
      <div className="space-y-4 border-t border-blue-100 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Propuesta · {workspace.header.brandName} · {workspace.header.currentPeriodId}</p>
        <h4 className="font-semibold text-slate-950">{plan.title}</h4>
        <p>{plan.reason}</p>
        <p className="text-xs leading-5 text-slate-500">Responsables y plazos sugeridos, pendientes de acuerdo. Abrir este plan no asigna tareas ni registra avances.</p>
        <dl className="space-y-2">
          {plan.metrics.map(([label, value]) => (
            <div className="flex flex-wrap justify-between gap-2" key={label}>
              <dt>{label}</dt><dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <ol className="list-decimal space-y-4 pl-5">
          {plan.steps.map((step) => (
            <li key={step.action}>
              <p className="font-medium">{step.action}</p>
              <p className="mt-1 text-xs">Responsable sugerido: {step.owner} · {step.timing}</p>
              <p className="mt-1 text-xs text-slate-500">Resultado a verificar: {step.completion}</p>
            </li>
          ))}
        </ol>
        {(plan.kind === 'customers' || plan.kind === 'products') && (
          <div className="space-y-2 rounded-lg bg-blue-50 p-3">
            <p className="text-xs">{plan.lossContext}</p>
            {plan.customers.map((customer) => (
              <p key={customer.id}>
                <Link className="font-medium text-blue-700 underline" to={`/customers/${encodeURIComponent(customer.id)}?brand=${encodeURIComponent(workspace.header.brandId)}`}>
                  {customer.customerName}
                </Link>
                {' · Venta base de la marca: '}{customer.previousRevenue}
              </p>
            ))}
            {plan.products.map((product) => <p key={product.id}>{product.productModel} · {product.id}</p>)}
            {plan.customers.length === 0 && plan.products.length === 0 && <p>No hay candidatos identificados para este alcance. Revisar el historial antes de definir contactos u ofertas.</p>}
            {(plan.customers.length === 5 || plan.products.length === 5) && <p className="text-xs">Primeros 5 candidatos. El listado completo está en las tablas de esta página.</p>}
          </div>
        )}
      </div>
    </details>
  )
}
