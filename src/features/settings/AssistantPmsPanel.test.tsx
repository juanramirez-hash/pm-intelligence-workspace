// NAV-002: "PMs a cargo" and "Marcas efectivas" in Configuración.

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { AssistantPmsPanelView } from './AssistantPmsPanel'
import { effectiveBrandOrigin, selectablePms } from './assistantPms'
import type { SettingsUser } from './settingsUsersRepository'

const user = (id: number, role: SettingsUser['role'], active = true, name: string | null = `Usuario ${id}`): SettingsUser => ({
  id, email: `u${id}@example.test`, name, role, active, created_at: '2026-01-01', last_login_at: null,
})

const USERS = [
  user(5, 'assistant', true, 'Olivia Lopez'),
  user(7, 'pm', true, 'Luis Mayorga'),
  user(8, 'pm', true, 'Diego Martinez'),
  user(9, 'pm', false, 'PM inactivo'),
  user(10, 'manager', true, 'Gerente'),
]

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

describe('NAV-002 PMs a cargo', () => {
  it('offers only active PMs, sorted by name', () => {
    expect(selectablePms(USERS, 5).map((pm) => pm.name)).toEqual(['Diego Martinez', 'Luis Mayorga'])
  })

  it('tells where each effective brand comes from', () => {
    expect(effectiveBrandOrigin({ brandId: 'A', own: true, fromPms: [] })).toBe('Propia')
    expect(effectiveBrandOrigin({
      brandId: 'A', own: true, fromPms: [{ id: 7, name: 'Luis Mayorga', email: null }, { id: 8, name: null, email: 'd@x.test' }],
    })).toBe('Propia · De Luis Mayorga, d@x.test')
  })

  it('shows the selected PMs, the inactive links and the effective brands read only', () => {
    const html = renderToStaticMarkup(
      <AssistantPmsPanelView
        users={USERS}
        userId={5}
        data={{
          role: 'assistant',
          pmUserIds: [7, 9],
          pms: [
            { id: 7, name: 'Luis Mayorga', email: 'u7@example.test', counts: true },
            { id: 9, name: 'PM inactivo', email: 'u9@example.test', counts: false },
          ],
          effectiveBrands: [
            { brandId: 'HIKVISION', own: false, fromPms: [{ id: 7, name: 'Luis Mayorga', email: 'u7@example.test' }] },
            { brandId: 'UNV (UNIVIEW)', own: true, fromPms: [] },
          ],
        }}
        selected={[7]}
        loading={false}
        saving={false}
        error={null}
        message={null}
        onToggle={vi.fn()}
        onSave={vi.fn()}
      />,
    )
    const content = text(html)

    expect(content).toContain('PMs a cargo')
    expect(html.match(/type="checkbox"/g)).toHaveLength(2)
    expect(html.match(/checked=""/g)).toHaveLength(1)
    expect(content).not.toContain('Gerente')
    expect(content).toContain('Vinculados que ya no son PM activos (no aportan marcas): PM inactivo')
    expect(content).toContain('Marcas efectivas (2)')
    expect(content).toContain('HIKVISION De Luis Mayorga')
    expect(content).toContain('UNV (UNIVIEW) Propia')
  })

  it('explains an assistant without brands', () => {
    const content = text(renderToStaticMarkup(
      <AssistantPmsPanelView
        users={USERS}
        userId={5}
        data={{ role: 'assistant', pmUserIds: [], pms: [], effectiveBrands: [] }}
        selected={[]}
        loading={false}
        saving={false}
        error={null}
        message={null}
        onToggle={vi.fn()}
        onSave={vi.fn()}
      />,
    ))

    expect(content).toContain('Sin marcas: vincula PMs con marcas o asígnale marcas propias.')
  })
})
