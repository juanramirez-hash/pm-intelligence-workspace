import { PackageSearch, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkspaceHeader } from '../../../components/workspace/header'
import { formatBusinessCurrency } from '../../../core/business'
import { useWorkspaceContext } from '../../workspaces/shared/hooks/useWorkspaceContext'

export function ProductDirectoryPage() {
  const navigate = useNavigate()
  const context = useWorkspaceContext()
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('')

  const products = useMemo(() => {
    const normalized = query.trim().toLocaleUpperCase('es-MX')
    return (context.repository?.getProducts() ?? [])
      .filter((product) =>
        (!normalized || product.id.includes(normalized) || product.model.toLocaleUpperCase('es-MX').includes(normalized)) &&
        (!brand || product.brand === brand),
      )
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 150)
  }, [brand, context.repository, query])

  const brands = useMemo(
    () => [...new Set((context.repository?.getProducts() ?? []).map((product) => product.brand))].sort(),
    [context.repository],
  )

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
        <WorkspaceHeader
          connected={Boolean(context.repository)}
          description="Selecciona un producto para analizar desempeño, clientes, riesgo y potencial de recuperación."
          eyebrow="Product Intelligence"
          icon={PackageSearch}
          title="Directorio inteligente de productos"
          tone="amber"
        />

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_280px]">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <Search className="text-slate-400" size={20} />
              <input className="w-full bg-transparent text-sm outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por modelo o SKU" value={query} />
            </label>
            <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" onChange={(event) => setBrand(event.target.value)} value={brand}>
              <option value="">Todas las marcas</option>
              {brands.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <button className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50" key={product.id} onClick={() => navigate(`/products/${encodeURIComponent(product.id)}`)} type="button">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-600">{product.brand}</p>
                <h2 className="mt-2 font-semibold text-slate-950">{product.model}</h2>
                <p className="mt-1 text-xs text-slate-400">{product.id}</p>
                <p className="mt-3 text-sm text-slate-500">{product.customers.size} clientes · {formatBusinessCurrency(product.revenue)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
