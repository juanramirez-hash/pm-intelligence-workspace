import {
  CheckCircle2,
  Database,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import {
  AtlasCard,
} from '../../atlas/components/AtlasCard'

import {
  PageHeader,
} from '../../atlas/layout/PageHeader'

import {
  createSettingsUser,
  loadSettingsUsers,
  updateSettingsUser,
  type SettingsUser,
  type SettingsUserRole,
} from './settingsUsersRepository'

import {
  loadSettingsRoles,
  updateSettingsRole,
  type SettingsRole,
  type SettingsRoleScope,
} from './settingsRolesRepository'

type SettingsSection =
  | 'general'
  | 'users'
  | 'roles'
  | 'system'

const sections: Array<{
  id: SettingsSection
  label: string
  description: string
  icon: typeof Settings2
}> = [
  {
    id: 'general',
    label: 'General',
    description:
      'Preferencias globales de la plataforma.',
    icon: Settings2,
  },
  {
    id: 'users',
    label: 'Usuarios',
    description:
      'Usuarios, estado y asignaciones.',
    icon: Users,
  },
  {
    id: 'roles',
    label: 'Roles y permisos',
    description:
      'Alcance y permisos por perfil.',
    icon: ShieldCheck,
  },
  {
    id: 'system',
    label: 'Sistema y datos',
    description:
      'Configuración técnica y estado operativo.',
    icon: Database,
  },
]

function GeneralSettings() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AtlasCard className="p-6">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Identidad de la plataforma
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Parámetros generales usados en la
              experiencia de PM Intelligence.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nombre de aplicación
              </label>
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                PM Intelligence Workspace
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Zona horaria
              </label>
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                America/Mexico_City
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Moneda predeterminada
              </label>
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                MXN
              </div>
            </div>
          </div>
        </div>
      </AtlasCard>

      <AtlasCard className="p-6">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Calendario comercial
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Fuente utilizada para medir avance
              comercial y días laborables.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={20}
                className="mt-0.5 text-emerald-600"
              />

              <div>
                <p className="font-semibold text-emerald-900">
                  Sales Targets / Cuotas
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  Los días laborables mensuales se
                  obtienen del dataset de objetivos
                  comerciales. No existe un calendario
                  independiente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AtlasCard>
    </div>
  )
}

function UsersSettings() {
  const [
    users,
    setUsers,
  ] =
    useState<SettingsUser[]>([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    savingUserId,
    setSavingUserId,
  ] =
    useState<number | null>(null)

  const [
    error,
    setError,
  ] =
    useState<string | null>(null)

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(null)

  const [
    email,
    setEmail,
  ] =
    useState('')

  const [
    name,
    setName,
  ] =
    useState('')

  const [
    role,
    setRole,
  ] =
    useState<SettingsUserRole>(
      'viewer',
    )

  const [
    creating,
    setCreating,
  ] =
    useState(false)

  const roleOptions: Array<{
    value: SettingsUserRole
    label: string
  }> = [
    {
      value: 'admin',
      label: 'Administrador',
    },
    {
      value: 'manager',
      label: 'Gerente de Marcas',
    },
    {
      value: 'pm',
      label: 'Product Manager',
    },
    {
      value: 'engineering',
      label: 'Ingeniero de Marca',
    },
    {
      value: 'pricing',
      label: 'Pricing',
    },
    {
      value: 'analyst',
      label: 'Analyst · Legacy',
    },
    {
      value: 'viewer',
      label: 'Viewer · Legacy',
    },
  ]

  const getRoleLabel = (
    value: SettingsUserRole,
  ) =>
    roleOptions.find(
      (option) =>
        option.value === value,
    )?.label ?? value

  const refreshUsers =
    async () => {
      try {
        setLoading(true)
        setError(null)

        const loadedUsers =
          await loadSettingsUsers()

        setUsers(loadedUsers)
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No fue posible cargar los usuarios.',
        )
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    void refreshUsers()
  }, [])

  const handleCreateUser =
    async (
      event:
        React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      try {
        setCreating(true)
        setError(null)
        setSuccessMessage(null)

        const created =
          await createSettingsUser({
            email,
            name:
              name.trim() === ''
                ? null
                : name.trim(),
            role,
            active: true,
          })

        setUsers(
          (current) =>
            [
              ...current,
              created,
            ].sort(
              (left, right) =>
                (
                  left.name ??
                  left.email
                ).localeCompare(
                  right.name ??
                    right.email,
                  'es-MX',
                ),
            ),
        )

        setEmail('')
        setName('')
        setRole('viewer')

        setSuccessMessage(
          `Usuario ${created.email} autorizado.`,
        )
      } catch (createError) {
        setError(
          createError instanceof Error
            ? createError.message
            : 'No fue posible crear el usuario.',
        )
      } finally {
        setCreating(false)
      }
    }

  const handleRoleChange =
    async (
      user: SettingsUser,
      nextRole: SettingsUserRole,
    ) => {
      try {
        setSavingUserId(user.id)
        setError(null)
        setSuccessMessage(null)

        const updated =
          await updateSettingsUser(
            user.id,
            {
              role: nextRole,
            },
          )

        setUsers(
          (current) =>
            current.map(
              (item) =>
                item.id === updated.id
                  ? updated
                  : item,
            ),
        )

        setSuccessMessage(
          `Rol actualizado para ${updated.email}.`,
        )
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : 'No fue posible actualizar el rol.',
        )
      } finally {
        setSavingUserId(null)
      }
    }

  const handleActiveChange =
    async (
      user: SettingsUser,
    ) => {
      try {
        setSavingUserId(user.id)
        setError(null)
        setSuccessMessage(null)

        const updated =
          await updateSettingsUser(
            user.id,
            {
              active: !user.active,
            },
          )

        setUsers(
          (current) =>
            current.map(
              (item) =>
                item.id === updated.id
                  ? updated
                  : item,
            ),
        )

        setSuccessMessage(
          updated.active
            ? `Acceso habilitado para ${updated.email}.`
            : `Acceso deshabilitado para ${updated.email}.`,
        )
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : 'No fue posible cambiar el estado del usuario.',
        )
      } finally {
        setSavingUserId(null)
      }
    }

  const formatLastLogin = (
    value: string | null,
  ) => {
    if (!value) {
      return 'Nunca'
    }

    const date = new Date(value)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value
    }

    return new Intl.DateTimeFormat(
      'es-MX',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone:
          'America/Mexico_City',
      },
    ).format(date)
  }

  return (
    <div className="space-y-6">
      <AtlasCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              Administración de usuarios
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Autoriza cuentas, asigna roles y
              habilita o revoca acceso a PM
              Intelligence Workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void refreshUsers()
            }
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Actualizando...'
              : 'Actualizar'}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}
      </AtlasCard>

      <AtlasCard className="p-6">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Autorizar nuevo usuario
          </p>
          <p className="mt-1 text-sm text-slate-500">
            La cuenta podrá autenticarse con
            Google después de ser registrada y
            habilitada.
          </p>
        </div>

        <form
          className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr_0.8fr_auto]"
          onSubmit={
            handleCreateUser
          }
        >
          <div>
            <label
              htmlFor="settings-user-email"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Correo
            </label>

            <input
              id="settings-user-email"
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="usuario@tecnosinergia.com"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400"
            />
          </div>

          <div>
            <label
              htmlFor="settings-user-name"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Nombre
            </label>

            <input
              id="settings-user-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Nombre completo"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400"
            />
          </div>

          <div>
            <label
              htmlFor="settings-user-role"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Rol
            </label>

            <select
              id="settings-user-role"
              value={role}
              onChange={(event) =>
                setRole(
                  event.target
                    .value as SettingsUserRole,
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-400"
            >
              {roleOptions.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating
                ? 'Guardando...'
                : 'Autorizar'}
            </button>
          </div>
        </form>
      </AtlasCard>

      <AtlasCard className="overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-900">
            Usuarios autorizados
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {users.length} cuentas registradas
            en la plataforma.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No hay usuarios registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Último acceso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map(
                  (user) => {
                    const isSaving =
                      savingUserId ===
                      user.id

                    return (
                      <tr
                        key={user.id}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {user.name ??
                              'Sin nombre'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {user.email}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={
                              user.role
                            }
                            disabled={
                              isSaving
                            }
                            onChange={(
                              event,
                            ) =>
                              void handleRoleChange(
                                user,
                                event
                                  .target
                                  .value as SettingsUserRole,
                              )
                            }
                            aria-label={`Rol de ${user.email}`}
                            className="min-w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 disabled:opacity-50"
                          >
                            {roleOptions.map(
                              (
                                option,
                              ) => (
                                <option
                                  key={
                                    option.value
                                  }
                                  value={
                                    option.value
                                  }
                                >
                                  {
                                    option.label
                                  }
                                </option>
                              ),
                            )}
                          </select>

                          <p className="mt-1 text-xs text-slate-400">
                            {getRoleLabel(
                              user.role,
                            )}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatLastLogin(
                            user.last_login_at,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                              user.active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500',
                            ].join(
                              ' ',
                            )}
                          >
                            {user.active
                              ? 'Habilitado'
                              : 'Deshabilitado'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            disabled={
                              isSaving
                            }
                            onClick={() =>
                              void handleActiveChange(
                                user,
                              )
                            }
                            className={[
                              'rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                              user.active
                                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                            ].join(
                              ' ',
                            )}
                          >
                            {isSaving
                              ? 'Guardando...'
                              : user.active
                                ? 'Deshabilitar'
                                : 'Habilitar'}
                          </button>
                        </td>
                      </tr>
                    )
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </AtlasCard>
    </div>
  )
}

function RolesSettings() {
  const [roles, setRoles] =
    useState<SettingsRole[]>([])

  const [loading, setLoading] =
    useState(true)

  const [savingRoleKey, setSavingRoleKey] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null)

  const scopeOptions: Array<{
    value: SettingsRoleScope
    label: string
  }> = [
    {
      value: 'all',
      label: 'Acceso total',
    },
    {
      value: 'assigned',
      label: 'Entidades asignadas',
    },
    {
      value: 'pricing',
      label: 'Pricing',
    },
    {
      value: 'legacy',
      label: 'Legacy',
    },
  ]

  const refreshRoles = async () => {
    try {
      setLoading(true)
      setError(null)

      setRoles(
        await loadSettingsRoles(),
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar los roles.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshRoles()
  }, [])

  const handleUpdateRole = async (
    role: SettingsRole,
    changes: {
      scope?: SettingsRoleScope
      writeAccess?: boolean
      active?: boolean
    },
  ) => {
    try {
      setSavingRoleKey(
        role.role_key,
      )
      setError(null)
      setSuccessMessage(null)

      const updated =
        await updateSettingsRole(
          role.role_key,
          changes,
        )

      setRoles(
        (current) =>
          current.map(
            (item) =>
              item.role_key ===
              updated.role_key
                ? updated
                : item,
          ),
      )

      setSuccessMessage(
        `Rol ${updated.role_name} actualizado.`,
      )
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'No fue posible actualizar el rol.',
      )
    } finally {
      setSavingRoleKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <AtlasCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              Roles y permisos
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Administra alcance, escritura y
              disponibilidad de los perfiles.
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void refreshRoles()
            }
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {loading
              ? 'Actualizando...'
              : 'Actualizar'}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}
      </AtlasCard>

      <AtlasCard className="overflow-hidden">
        <div className="border-b border-slate-200 p-6">
          <p className="text-sm font-semibold text-slate-900">
            Catálogo de roles
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {roles.length} perfiles configurados.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Cargando roles...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Alcance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Escritura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {roles.map((role) => {
                  const isSaving =
                    savingRoleKey ===
                    role.role_key

                  const protectedRole =
                    role.system_role

                  return (
                    <tr key={role.role_key}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {role.role_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {role.description ??
                            'Sin descripción'}
                        </p>

                        <p className="mt-1 text-[11px] uppercase text-slate-400">
                          {role.role_key}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={role.scope}
                          disabled={
                            isSaving ||
                            protectedRole
                          }
                          onChange={(event) =>
                            void handleUpdateRole(
                              role,
                              {
                                scope:
                                  event.target
                                    .value as SettingsRoleScope,
                              },
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50"
                        >
                          {scopeOptions.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          disabled={
                            isSaving ||
                            protectedRole
                          }
                          onClick={() =>
                            void handleUpdateRole(
                              role,
                              {
                                writeAccess:
                                  !role.write_access,
                              },
                            )
                          }
                          className={[
                            'rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50',
                            role.write_access
                              ? 'bg-violet-50 text-violet-700'
                              : 'bg-slate-100 text-slate-500',
                          ].join(' ')}
                        >
                          {role.write_access
                            ? 'Lectura y escritura'
                            : 'Solo lectura'}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          disabled={
                            isSaving ||
                            protectedRole
                          }
                          onClick={() =>
                            void handleUpdateRole(
                              role,
                              {
                                active:
                                  !role.active,
                              },
                            )
                          }
                          className={[
                            'rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50',
                            role.active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500',
                          ].join(' ')}
                        >
                          {isSaving
                            ? 'Guardando...'
                            : role.active
                              ? 'Activo'
                              : 'Inactivo'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AtlasCard>
    </div>
  )
}


function SystemSettings() {
  const settings = [
    {
      label: 'Versión de aplicación',
      value: '0.56.0',
    },
    {
      label: 'Persistencia canónica',
      value: 'PostgreSQL',
    },
    {
      label: 'Política de importación',
      value:
        'Staging → Validación → Transformación → Carga',
    },
    {
      label: 'API',
      value: 'pm-intelligence-api',
    },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AtlasCard className="p-6">
        <p className="text-lg font-semibold text-slate-900">
          Plataforma
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Información técnica de solo lectura.
        </p>

        <div className="mt-6 space-y-3">
          {settings.map((setting) => (
            <div
              key={setting.label}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"
            >
              <span className="text-sm text-slate-500">
                {setting.label}
              </span>
              <span className="text-right text-sm font-semibold text-slate-900">
                {setting.value}
              </span>
            </div>
          ))}
        </div>
      </AtlasCard>

      <AtlasCard className="p-6">
        <p className="text-lg font-semibold text-slate-900">
          Estado operativo
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Componentes principales de la arquitectura.
        </p>

        <div className="mt-6 space-y-3">
          {[
            'Frontend',
            'API',
            'PostgreSQL',
            'Data Center',
          ].map((service) => (
            <div
              key={service}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
            >
              <span className="text-sm font-medium text-slate-800">
                {service}
              </span>

              <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Configurado
              </span>
            </div>
          ))}
        </div>
      </AtlasCard>
    </div>
  )
}

export function SettingsPage() {
  const [
    activeSection,
    setActiveSection,
  ] =
    useState<SettingsSection>('general')

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform Administration"
        title="Settings"
        description="Administra la configuración general, usuarios, permisos y parámetros operativos de PM Intelligence Workspace."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive =
            section.id === activeSection

          return (
            <button
              key={section.id}
              type="button"
              onClick={() =>
                setActiveSection(section.id)
              }
              className={[
                'rounded-2xl border p-4 text-left transition',
                isActive
                  ? 'border-violet-300 bg-violet-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    'rounded-xl p-2',
                    isActive
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  <Icon size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {section.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {section.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {activeSection === 'general' && (
        <GeneralSettings />
      )}

      {activeSection === 'users' && (
        <UsersSettings />
      )}

      {activeSection === 'roles' && (
        <RolesSettings />
      )}

      {activeSection === 'system' && (
        <SystemSettings />
      )}
    </div>
  )
}