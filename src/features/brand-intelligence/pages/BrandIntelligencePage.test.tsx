// MB-001B: states of the embedded Inteligencia tab (static markup; the hook is
// mocked). They render inside the brand frame, never as full pages.

import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hook = vi.hoisted(() => ({ useBrandIntelligenceWorkspace: vi.fn() }))

vi.mock('../hooks/useBrandIntelligenceWorkspace', () => hook)

import { BrandIntelligencePage } from './BrandIntelligencePage'

const render = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <BrandIntelligencePage />
    </MemoryRouter>,
  )

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

beforeEach(() => vi.clearAllMocks())

describe('MB-001B Inteligencia states', () => {
  it('access denied is a message inside the frame: no <main>, no "Volver"', () => {
    hook.useBrandIntelligenceWorkspace.mockReturnValue({ accessDenied: true, brandId: 'HIKVISION', workspace: null })

    const html = render()

    expect(html).toContain('data-brand-intelligence-state="access-denied"')
    expect(text(html)).toContain('Acceso restringido')
    expect(text(html)).toContain('La marca HIKVISION no está asignada a tu usuario.')
    expect(html).not.toContain('<main')
    expect(text(html)).not.toContain('Volver')
  })

  it('unavailable is a message inside the frame, with the brand and no full page', () => {
    hook.useBrandIntelligenceWorkspace.mockReturnValue({ accessDenied: false, brandId: 'GEOVISION', workspace: null })

    const html = render()

    expect(html).toContain('data-brand-intelligence-state="unavailable"')
    expect(text(html)).toContain('Inteligencia de la marca no disponible')
    expect(text(html)).toContain('GEOVISION')
    expect(html).not.toContain('<main')
    expect(text(html)).not.toContain('Volver')
  })
})
