import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ExecutiveShell } from './ExecutiveShell'

describe('ExecutiveShell', () => {
  it('renders the shared executive page structure', () => {
    const markup = renderToStaticMarkup(
      <ExecutiveShell
        header={<div>Header</div>}
        beforeContent={<nav>Ruta</nav>}
      >
        <section>Workspace</section>
      </ExecutiveShell>,
    )

    expect(markup).toContain(
      'data-atlas-component="executive-shell"',
    )
    expect(markup).toContain('data-width="wide"')
    expect(markup).toContain('Ruta')
    expect(markup).toContain('Header')
    expect(markup).toContain('Workspace')
  })
})
