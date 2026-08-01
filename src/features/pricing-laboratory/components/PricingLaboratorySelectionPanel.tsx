import {
  Search,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import type {
  PricingLaboratoryCurrencyOption,
  PricingLaboratoryProductOption,
} from '../types'

import {
  formatPricingMoney,
  formatPricingPercentage,
} from '../utils'

export interface PricingLaboratorySelectionPanelProps {
  products: readonly PricingLaboratoryProductOption[]
  currencies: readonly PricingLaboratoryCurrencyOption[]
  selectedProductId: string
  selectedCurrency: string | null
  onProductChange: (productId: string) => void
  onCurrencyChange: (currency: string | null) => void
}

function matchesProduct(
  product: PricingLaboratoryProductOption,
  search: string,
): boolean {
  const normalized = search.trim().toLocaleUpperCase('es-MX')

  if (!normalized) {
    return true
  }

  return [
    product.label,
    product.productId,
    product.model ?? '',
    product.sku ?? '',
    product.brandId,
  ].some((value) =>
    value.toLocaleUpperCase('es-MX').includes(normalized),
  )
}

export function PricingLaboratorySelectionPanel({
  products,
  currencies,
  selectedProductId,
  selectedCurrency,
  onProductChange,
  onCurrencyChange,
}: PricingLaboratorySelectionPanelProps) {
  const [search, setSearch] = useState('')

  const visibleProducts = useMemo(() => {
    const filtered = products
      .filter((product) => matchesProduct(product, search))
      .slice(0, 150)
    const selected = products.find(
      (product) => product.productId === selectedProductId,
    )

    if (
      selected &&
      !filtered.some((product) => product.productId === selected.productId)
    ) {
      return [selected, ...filtered]
    }

    return filtered
  }, [products, search, selectedProductId])

  return (
    <div data-pricing-component="selection-panel">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
        <div>
          <label
            className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
            htmlFor="pricing-product-search"
          >
            Buscar producto
          </label>

          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />

            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
              id="pricing-product-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Modelo, SKU, marca o ID"
              type="search"
              value={search}
            />
          </div>

          <label
            className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
            htmlFor="pricing-product-select"
          >
            Producto con información de Pricing
          </label>

          <select
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            id="pricing-product-select"
            onChange={(event) => {
              onProductChange(event.target.value)
              setSearch('')
            }}
            value={selectedProductId}
          >
            <option value="">Selecciona un producto</option>
            {visibleProducts.map((product) => (
              <option
                key={product.productId}
                value={product.productId}
              >
                {product.label} · {product.brandId} · {product.currencies.join('/')}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-slate-500">
            {products.length.toLocaleString('es-MX')} producto(s) disponibles. La búsqueda visual limita la lista a 150 coincidencias.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Moneda independiente
          </p>

          {currencies.length > 0 ? (
            <div className="mt-2 grid gap-2">
              {currencies.map((option) => {
                const selected = option.currency === selectedCurrency

                return (
                  <button
                    aria-pressed={selected}
                    className={[
                      'rounded-2xl border p-3.5 text-left transition',
                      selected
                        ? 'border-rose-300 bg-rose-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50/60',
                    ].join(' ')}
                    key={option.currency}
                    onClick={() => onCurrencyChange(option.currency)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {option.currency}
                        </p>
                        <p className={[
                          'mt-1 text-xs',
                          selected ? 'text-rose-100' : 'text-slate-500',
                        ].join(' ')}>
                          Precio vigente {formatPricingMoney(option.sellingPrice, option.currency)}
                        </p>
                      </div>

                      <span className={[
                        'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
                        selected
                          ? 'bg-white/15 text-white'
                          : 'bg-slate-100 text-slate-600',
                      ].join(' ')}>
                        {formatPricingPercentage(option.grossMargin)} margen
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Selecciona un producto para consultar sus canales monetarios.
            </div>
          )}

          <p className="mt-3 text-xs leading-5 text-slate-500">
            MXN y USD se evalúan por separado. El laboratorio no convierte ni mezcla monedas.
          </p>
        </div>
      </div>
    </div>
  )
}
