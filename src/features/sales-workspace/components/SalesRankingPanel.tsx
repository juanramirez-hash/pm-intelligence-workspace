import type {
  LucideIcon,
} from 'lucide-react'

import {
  ExecutivePanel,
} from '../../../atlas/widgets/panel'

import type {
  SalesWorkspaceRankingItem,
} from '../types'

import {
  formatSalesCurrency,
  formatSalesPercentage,
} from '../utils'

interface SalesRankingPanelProps {
  title: string
  subtitle: string
  items: SalesWorkspaceRankingItem[]
  icon: LucideIcon
  selectedId?: string | null
  onSelect?: (id: string) => void
}

export function SalesRankingPanel({
  title,
  subtitle,
  items,
  icon: Icon,
  selectedId = null,
  onSelect,
}: SalesRankingPanelProps) {
  return (
    <ExecutivePanel
      className="h-full"
      count={items.length}
      icon={<Icon size={19} />}
      subtitle={subtitle}
      title={title}
    >
      {items.length === 0 ? (
        <div className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-sm text-slate-500">
          Sin resultados para el periodo seleccionado.
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map(
            (item, index) => (
              <li
                className={[
                  'rounded-2xl border transition',
                  selectedId === item.id
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-slate-100 bg-slate-50/70',
                ].join(' ')}
                key={item.id}
              >
                <button
                  className="flex w-full items-center gap-3 p-3 text-left"
                  disabled={!onSelect}
                  onClick={() => onSelect?.(item.id)}
                  type="button"
                >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-semibold text-slate-500 shadow-sm">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.label}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatSalesCurrency(item.revenue)} · {formatSalesPercentage(item.participation)}
                  </p>
                </div>
                </button>
              </li>
            ),
          )}
        </ol>
      )}
    </ExecutivePanel>
  )
}
