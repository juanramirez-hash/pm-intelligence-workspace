export type WorkspaceThemeName =
  | 'sales'
  | 'brand'
  | 'customer'
  | 'product'
  | 'inventory'
  | 'forecast'
  | 'pricing'

export interface WorkspaceTheme {
  name: WorkspaceThemeName
  hero: string
  icon: string
  glowPrimary: string
  glowSecondary: string
}

export const workspaceThemes: Record<WorkspaceThemeName, WorkspaceTheme> = {
  sales: {
    name: 'sales',
    hero: 'border-blue-200/80 bg-gradient-to-br from-white via-blue-50/70 to-cyan-100/60',
    icon: 'border-blue-100 bg-white/85 text-blue-700',
    glowPrimary: 'bg-blue-300/20',
    glowSecondary: 'bg-cyan-200/20',
  },
  brand: {
    name: 'brand',
    hero: 'border-violet-200/80 bg-gradient-to-br from-white via-violet-50/70 to-indigo-100/60',
    icon: 'border-violet-100 bg-white/85 text-violet-700',
    glowPrimary: 'bg-violet-300/20',
    glowSecondary: 'bg-sky-200/20',
  },
  customer: {
    name: 'customer',
    hero: 'border-sky-200/80 bg-gradient-to-br from-white via-sky-50/70 to-cyan-100/60',
    icon: 'border-sky-100 bg-white/85 text-sky-700',
    glowPrimary: 'bg-sky-300/20',
    glowSecondary: 'bg-cyan-200/20',
  },
  product: {
    name: 'product',
    hero: 'border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/70 to-teal-100/60',
    icon: 'border-emerald-100 bg-white/85 text-emerald-700',
    glowPrimary: 'bg-emerald-300/20',
    glowSecondary: 'bg-teal-200/20',
  },
  inventory: {
    name: 'inventory',
    hero: 'border-amber-200/80 bg-gradient-to-br from-white via-amber-50/70 to-orange-100/60',
    icon: 'border-amber-100 bg-white/85 text-amber-700',
    glowPrimary: 'bg-amber-300/20',
    glowSecondary: 'bg-orange-200/20',
  },
  forecast: {
    name: 'forecast',
    hero: 'border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/70 to-blue-100/60',
    icon: 'border-indigo-100 bg-white/85 text-indigo-700',
    glowPrimary: 'bg-indigo-300/20',
    glowSecondary: 'bg-blue-200/20',
  },
  pricing: {
    name: 'pricing',
    hero: 'border-rose-200/80 bg-gradient-to-br from-white via-rose-50/70 to-pink-100/60',
    icon: 'border-rose-100 bg-white/85 text-rose-700',
    glowPrimary: 'bg-rose-300/20',
    glowSecondary: 'bg-pink-200/20',
  },
}

export function getWorkspaceTheme(name: WorkspaceThemeName): WorkspaceTheme {
  return workspaceThemes[name]
}
