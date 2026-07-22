import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CircleDashed,
  RefreshCw,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'

import type {
  BrandIntelligenceSummary,
} from '../../../core/analytics/brands'

import type {
  CustomerIntelligenceSummary,
} from '../../../core/analytics/customers'

interface ExecutiveAttentionCenterProps {
  customers:
    CustomerIntelligenceSummary | null

  brands:
    BrandIntelligenceSummary | null
}

function formatNumber(
  value: number,
): string {
  return value.toLocaleString('es-MX')
}

export function ExecutiveAttentionCenter({
  customers,
  brands,
}: ExecutiveAttentionCenterProps) {
  const hasCustomerIntelligence =
    customers !== null

  const hasBrandIntelligence =
    brands !== null

  const customersRequiringAttention =
    customers?.customersRequiringAttention ??
    0

  const brandsRequiringAttention =
    brands?.brandsRequiringAttention ??
    0

  const inactiveAndLostCustomers =
    (customers?.inactiveCustomers ?? 0) +
    (customers?.lostCustomers ?? 0)

  const inactiveAndLostBrands =
    (brands?.inactiveBrands ?? 0) +
    (brands?.lostBrands ?? 0)

  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
          Centro de atención
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Prioridades que requieren revisión
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article
          className={[
            'group rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',

            hasBrandIntelligence
              ? brandsRequiringAttention > 0
                ? 'border-amber-200'
                : 'border-emerald-200'
              : 'border-slate-200',
          ].join(' ')}
        >
          <div className="flex items-start justify-between">
            <div
              className={[
                'flex size-11 items-center justify-center rounded-xl',

                hasBrandIntelligence
                  ? brandsRequiringAttention > 0
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              <Building2 size={21} />
            </div>

            <ArrowRight
              className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
              size={19}
            />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">
              Marcas
            </p>

            {hasBrandIntelligence ? (
              <span
                className={[
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold',

                  brandsRequiringAttention > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700',
                ].join(' ')}
              >
                Análisis activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                <CircleDashed size={12} />

                Sin datos
              </span>
            )}
          </div>

          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            {hasBrandIntelligence
              ? formatNumber(
                  brandsRequiringAttention,
                )
              : 'Pendiente'}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {hasBrandIntelligence
              ? 'marcas requieren atención'
              : 'Esperando información de ventas'}
          </p>

          {brands && (
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <div className="rounded-xl bg-emerald-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <ArrowUpRight size={14} />

                  En crecimiento
                </div>

                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {formatNumber(
                    brands.growingBrands,
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
                  <ArrowDownRight size={14} />

                  En caída
                </div>

                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {formatNumber(
                    brands.decliningBrands,
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                  <RefreshCw size={14} />

                  Recuperadas
                </div>

                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {formatNumber(
                    brands.recoveredBrands,
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-violet-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700">
                  <Building2 size={14} />

                  Nuevas
                </div>

                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {formatNumber(
                    brands.newBrands,
                  )}
                </p>
              </div>

              <div className="col-span-2 rounded-xl bg-rose-50/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
                    <AlertTriangle size={14} />

                    Inactivas o perdidas
                  </div>

                  <p className="text-lg font-semibold text-slate-950">
                    {formatNumber(
                      inactiveAndLostBrands,
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </article>

        <article
          className={[
            'group rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',

            hasCustomerIntelligence
              ? customersRequiringAttention > 0
                ? 'border-amber-200'
                : 'border-emerald-200'
              : 'border-slate-200',
          ].join(' ')}
        >
          <div className="flex items-start justify-between">
            <div
              className={[
                'flex size-11 items-center justify-center rounded-xl',

                hasCustomerIntelligence
                  ? customersRequiringAttention > 0
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              <Users size={21} />
            </div>

            <ArrowRight
              className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600"
              size={19}
            />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">
              Clientes
            </p>

            {hasCustomerIntelligence ? (
              <span
                className={[
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold',

                  customersRequiringAttention > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700',
                ].join(' ')}
              >
                Análisis activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                <CircleDashed size={12} />

                Sin datos
              </span>
            )}
          </div>

          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            {hasCustomerIntelligence
              ? formatNumber(
                  customersRequiringAttention,
                )
              : 'Pendiente'}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {hasCustomerIntelligence
              ? 'clientes requieren atención'
              : 'Esperando información de ventas'}
          </p>

          {customers && (
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <div className="rounded-xl bg-emerald-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <UserPlus size={14} />

                  Nuevos
                </div>

                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {formatNumber(
                    customers.newCustomers,
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                  <UserCheck size={14} />

                  Recuperados
                </div>

                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {formatNumber(
                    customers.recoveredCustomers,
                  )}
                </p>
              </div>

              <div className="col-span-2 rounded-xl bg-rose-50/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
                    <UserMinus size={14} />

                    Inactivos o perdidos
                  </div>

                  <p className="text-lg font-semibold text-slate-950">
                    {formatNumber(
                      inactiveAndLostCustomers,
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </article>

        <article className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle size={21} />
            </div>

            <ArrowRight
              className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-600"
              size={19}
            />
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Productos
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-950">
            Pendiente
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Señalaremos productos con caída,
            aceleración o comportamiento
            comercial atípico.
          </p>
        </article>
      </div>
    </section>
  )
}