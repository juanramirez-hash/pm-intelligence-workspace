import {
  ArrowUpRight,
  GitBranch,
  PackageCheck,
  PackageX,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import type {
  ProductCatalogReplacementReference,
  ProductCatalogReplacementViewModel,
} from '../engine/productCatalogReplacement'

function formatNumber(value: number): string {
  return value.toLocaleString('es-MX', {
    maximumFractionDigits: 1,
  })
}

function statusClasses(
  tone: ProductCatalogReplacementViewModel['tone'],
): string {
  if (tone === 'critical') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  if (tone === 'attention') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function ReferenceCard({
  label,
  reference,
  currentProductId,
}: {
  label: string
  reference: ProductCatalogReplacementReference | null
  currentProductId: string
}) {
  if (!reference) {
    return (
      <article className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center gap-2 text-slate-400">
          <PackageX size={17} />
          <p className="text-xs font-semibold uppercase tracking-[0.12em]">
            {label}
          </p>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">
          Sin registro
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          El Product Master no contiene una referencia para este campo.
        </p>
      </article>
    )
  }

  const canOpen = Boolean(
    reference.productId &&
      reference.productId !== currentProductId,
  )

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 break-words text-lg font-bold text-slate-950">
            {reference.reference}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {reference.model ??
              reference.productName ??
              (reference.resolved
                ? 'Producto conciliado'
                : 'No localizado en Product Master')}
          </p>
        </div>
        <div className={[
          'flex size-9 shrink-0 items-center justify-center rounded-xl',
          reference.resolved
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700',
        ].join(' ')}>
          <PackageCheck size={17} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
            Disponible
          </p>
          <p className="mt-1 text-sm font-bold text-slate-950">
            {formatNumber(reference.available)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
            Existencia
          </p>
          <p className="mt-1 text-sm font-bold text-slate-950">
            {formatNumber(reference.onHand)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
            Ubicaciones
          </p>
          <p className="mt-1 text-sm font-bold text-slate-950">
            {formatNumber(reference.locations)}
          </p>
        </div>
      </div>

      {canOpen && (
        <Link
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-violet-700 transition hover:text-violet-900"
          to={`/products/${encodeURIComponent(reference.productId!)}`}
        >
          Abrir producto sustituto
          <ArrowUpRight size={14} />
        </Link>
      )}
    </article>
  )
}

export function ProductCatalogReplacementPanel({
  replacement,
  currentProductId,
}: {
  replacement: ProductCatalogReplacementViewModel
  currentProductId: string
}) {
  return (
    <ExecutivePanel
      icon={<GitBranch size={19} />}
      subtitle="Cruce con Product Master e inventario activo"
      title="Ruta de sustitución de catálogo"
      tone={replacement.tone}
    >
      <div className={[
        'rounded-2xl border px-4 py-3',
        statusClasses(replacement.tone),
      ].join(' ')}>
        <p className="text-xs font-bold uppercase tracking-[0.12em]">
          {replacement.statusLabel}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {replacement.description}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ReferenceCard
          currentProductId={currentProductId}
          label="Superseded By"
          reference={replacement.supersededBy}
        />
        <ReferenceCard
          currentProductId={currentProductId}
          label="Sustituto directo"
          reference={replacement.directSubstitute}
        />
      </div>
    </ExecutivePanel>
  )
}
