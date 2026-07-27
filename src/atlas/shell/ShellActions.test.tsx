import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ShellActions } from './ShellActions'

describe('ShellActions', () => {
  it('renders an accessible toolbar with wrapping actions', () => {
    const markup = renderToStaticMarkup(
      <ShellActions ariaLabel="Acciones de marca">
        <button type="button">Actualizar</button>
        <button type="button">Exportar</button>
      </ShellActions>,
    )

    expect(markup).toContain('data-atlas-component="shell-actions"')
    expect(markup).toContain('role="toolbar"')
    expect(markup).toContain('aria-label="Acciones de marca"')
    expect(markup).toContain('Actualizar')
    expect(markup).toContain('Exportar')
  })

  it('supports vertical orientation without wrapping', () => {
    const markup = renderToStaticMarkup(
      <ShellActions orientation="vertical" wrap={false}>
        <button type="button">Filtros</button>
      </ShellActions>,
    )

    expect(markup).toContain('data-orientation="vertical"')
    expect(markup).toContain('data-wrap="false"')
  })
})
