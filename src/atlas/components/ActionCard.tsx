import type { LucideIcon } from 'lucide-react'

type ActionTone = 'info' | 'success' | 'warning'

type ActionCardProps = {
  title: string
  description: string
  icon?: LucideIcon
  tone?: ActionTone
}

const toneClasses: Record<
  ActionTone,
  {
    container: string
    title: string
    description: string
    icon: string
  }
> = {
  info: {
    container: 'bg-blue-50',
    title: 'text-blue-950',
    description: 'text-blue-800',
    icon: 'bg-blue-100 text-blue-700',
  },
  success: {
    container: 'bg-emerald-50',
    title: 'text-emerald-950',
    description: 'text-emerald-800',
    icon: 'bg-emerald-100 text-emerald-700',
  },
  warning: {
    container: 'bg-amber-50',
    title: 'text-amber-950',
    description: 'text-amber-800',
    icon: 'bg-amber-100 text-amber-700',
  },
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  tone = 'info',
}: ActionCardProps) {
  const classes = toneClasses[tone]

  return (
    <article className={`rounded-2xl p-4 ${classes.container}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={[
              'flex size-9 shrink-0 items-center justify-center rounded-xl',
              classes.icon,
            ].join(' ')}
          >
            <Icon size={18} />
          </div>
        )}

        <div>
          <h4 className={`text-sm font-semibold ${classes.title}`}>
            {title}
          </h4>

          <p
            className={[
              'mt-2 text-sm leading-6',
              classes.description,
            ].join(' ')}
          >
            {description}
          </p>
        </div>
      </div>
    </article>
  )
}