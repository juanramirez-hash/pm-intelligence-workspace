// NAV-002: "PMs a cargo" of an assistant (Configuración, admin only) and
// its effective brands, read only: own assignments plus the brands of each
// active linked PM, telling where each one comes from.

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  loadSettingsUserPms,
  updateSettingsUserPms,
  type SettingsUser,
  type SettingsUserPms,
} from './settingsUsersRepository'

import {
  displayName,
  effectiveBrandOrigin,
  selectablePms,
} from './assistantPms'

interface AssistantPmsPanelProps {
  userId: number
  users: readonly SettingsUser[]
}

export function AssistantPmsPanel({ userId, users }: AssistantPmsPanelProps) {
  const [data, setData] = useState<SettingsUserPms | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const loaded = await loadSettingsUserPms(userId)

      setData(loaded)
      setSelected(loaded.pmUserIds)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los PMs a cargo.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    try {
      setSaving(true)
      setError(null)
      setMessage(null)
      await updateSettingsUserPms(userId, selected)
      await load()
      setMessage('PMs a cargo actualizados.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar los PMs a cargo.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = (pmId: number) => {
    setSelected((current) =>
      current.includes(pmId)
        ? current.filter((id) => id !== pmId)
        : [...current, pmId],
    )
  }

  return (
    <AssistantPmsPanelView
      users={users}
      userId={userId}
      data={data}
      selected={selected}
      loading={loading}
      saving={saving}
      error={error}
      message={message}
      onToggle={toggle}
      onSave={() => void save()}
    />
  )
}

interface AssistantPmsPanelViewProps {
  users: readonly SettingsUser[]
  userId: number
  data: SettingsUserPms | null
  selected: readonly number[]
  loading: boolean
  saving: boolean
  error: string | null
  message: string | null
  onToggle: (pmId: number) => void
  onSave: () => void
}

export function AssistantPmsPanelView({
  users,
  userId,
  data,
  selected,
  loading,
  saving,
  error,
  message,
  onToggle,
  onSave,
}: AssistantPmsPanelViewProps) {
  const pms = selectablePms(users, userId)
  // Linked users that are no longer active PMs (kept, but they give no brands).
  const inactiveLinks = (data?.pms ?? []).filter((pm) => !pm.counts)

  return (
    <section
      data-assistant-pms="true"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p className="text-lg font-semibold text-slate-900">
        PMs a cargo
      </p>
      <p className="mt-1 text-sm text-slate-500">
        La auxiliar ve las marcas de los PMs que selecciones, además de las suyas. Solo cuentan los PMs activos.
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {loading && !data ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Cargando PMs a cargo…
        </p>
      ) : (
        <>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {pms.map((pm) => (
              <li key={pm.id}>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selected.includes(pm.id)}
                    onChange={() => onToggle(pm.id)}
                    disabled={saving}
                  />
                  <span className="min-w-0 truncate">
                    {displayName(pm)}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {pms.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No hay usuarios con rol Product Manager activos.
            </p>
          ) : null}

          {inactiveLinks.length > 0 ? (
            <p className="mt-3 text-xs text-amber-700">
              Vinculados que ya no son PM activos (no aportan marcas): {inactiveLinks.map(displayName).join(', ')}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar PMs a cargo'}
          </button>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">
              Marcas efectivas ({data?.effectiveBrands.length ?? 0})
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Solo lectura: propias más las heredadas de cada PM.
            </p>

            {data && data.effectiveBrands.length > 0 ? (
              <ul data-effective-brands="true" className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {data.effectiveBrands.map((brand) => (
                  <li key={brand.brandId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-800">
                      {brand.brandId}
                    </span>
                    <span className="text-xs text-slate-500">
                      {effectiveBrandOrigin(brand)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Sin marcas: vincula PMs con marcas o asígnale marcas propias.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
