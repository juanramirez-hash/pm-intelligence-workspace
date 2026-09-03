import {
  CheckCircle2,
  Database,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  AtlasCard,
} from '../../atlas/components/AtlasCard'

import {
  PageHeader,
} from '../../atlas/layout/PageHeader'

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
  return (
    <AtlasCard className="p-6">
      <div className="max-w-3xl">
        <p className="text-lg font-semibold text-slate-900">
          Administración de usuarios
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Esta sección concentrará altas, estado,
          asignación de rol y relación con Product
          Manager, Ingeniería o Pricing.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-800">
            Foundation preparada
          </p>
          <p className="mt-1 text-sm text-slate-500">
            La administración persistente de usuarios
            se conectará al modelo de seguridad de la
            plataforma.
          </p>
        </div>
      </div>
    </AtlasCard>
  )
}

function RolesSettings() {
  const roles = [
    {
      name: 'Gerente de Marcas',
      scope: 'Acceso total',
      access: 'Lectura y escritura',
    },
    {
      name: 'Product Manager',
      scope: 'Marcas y productos asignados',
      access: 'Lectura y escritura',
    },
    {
      name: 'Ingeniero de Marca',
      scope:
        'Ventas, clientes, productos e inventario asignados',
      access: 'Solo lectura',
    },
    {
      name: 'Pricing',
      scope: 'Pricing Laboratory',
      access: 'Lectura y escritura',
    },
  ]

  return (
    <AtlasCard className="overflow-hidden">
      <div className="border-b border-slate-200 p-6">
        <p className="text-lg font-semibold text-slate-900">
          Roles y permisos
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Modelo base de acceso previsto para PM
          Intelligence Workspace.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Alcance
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Permisos
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {roles.map((role) => (
              <tr key={role.name}>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                  {role.name}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {role.scope}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {role.access}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AtlasCard>
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