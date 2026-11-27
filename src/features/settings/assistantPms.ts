// NAV-002: helpers of "PMs a cargo" (kept out of the component file).

import type {
  SettingsEffectiveBrand,
  SettingsUser,
} from './settingsUsersRepository'

export const displayName = (user: { name: string | null, email: string | null }) =>
  user.name ?? user.email ?? 'Usuario'

/** Active users with the pm role, the only ones that can be linked. */
export function selectablePms(users: readonly SettingsUser[], assistantId: number): SettingsUser[] {
  return users
    .filter((user) => user.role === 'pm' && user.active && user.id !== assistantId)
    .sort((left, right) => displayName(left).localeCompare(displayName(right), 'es-MX'))
}

/** "Propia", "De Luis Mayorga" or "Propia · De Luis Mayorga, Diego Martinez". */
export function effectiveBrandOrigin(brand: SettingsEffectiveBrand): string {
  const parts = [
    brand.own ? 'Propia' : null,
    brand.fromPms.length > 0 ? `De ${brand.fromPms.map(displayName).join(', ')}` : null,
  ]

  return parts.filter(Boolean).join(' · ')
}
