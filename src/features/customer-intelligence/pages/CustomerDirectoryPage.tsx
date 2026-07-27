import {
  Search,
  Users,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  WorkspaceHeader,
} from '../../../components/workspace/header'

import {
  useWorkspaceContext,
} from '../../workspaces/shared/hooks/useWorkspaceContext'

export function CustomerDirectoryPage() {
  const navigate = useNavigate()
  const context = useWorkspaceContext()
  const [query, setQuery] = useState('')

  const customers = useMemo(() => {
    const normalized = query
      .trim()
      .toLocaleUpperCase('es-MX')

    return (
      context.repository?.getCustomers() ?? []
    )
      .filter((customer) =>
        !normalized ||
        customer.id.includes(normalized) ||
        customer.name
          .toLocaleUpperCase('es-MX')
          .includes(normalized),
      )
      .sort(
        (a, b) => b.revenue - a.revenue,
      )
      .slice(0, 100)
  }, [context.repository, query])

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
        <WorkspaceHeader
          connected={Boolean(context.repository)}
          description="Selecciona un cliente y analiza su relación consolidada o específica por marca."
          eyebrow="Customer Intelligence"
          icon={Users}
          title="Directorio inteligente de clientes"
          tone="violet"
        />

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <Search className="text-slate-400" size={20} />
            <input
              className="w-full bg-transparent text-sm outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por número o nombre del cliente"
              value={query}
            />
          </label>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {customers.map((customer) => (
              <button
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50"
                key={customer.id}
                onClick={() => navigate(`/customers/${encodeURIComponent(customer.id)}`)}
                type="button"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-violet-600">{customer.id}</p>
                <h2 className="mt-2 font-semibold text-slate-950">{customer.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{customer.brands.size} marcas · {customer.products.size} productos</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
