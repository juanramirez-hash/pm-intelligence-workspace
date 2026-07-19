import { Construction } from 'lucide-react'
import { AtlasCard } from './AtlasCard'

type PlaceholderPageProps = {
  title: string
  description: string
}

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-blue-600">
        PM Intelligence
      </p>

      <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
        {title}
      </h2>

      <p className="mt-2 text-slate-500">{description}</p>

      <AtlasCard className="mt-8 flex min-h-80 flex-col items-center justify-center p-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Construction size={26} />
        </div>

        <h3 className="mt-5 text-lg font-semibold text-slate-900">
          Módulo preparado
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          La navegación ya funciona. El contenido operativo se construirá
          durante su sprint correspondiente.
        </p>
      </AtlasCard>
    </div>
  )
}