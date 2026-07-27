import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ShellActionsGroup } from './ShellActionsGroup'

describe('ShellActionsGroup', () => {
  it('groups related actions with an accessible label', () => {
    const markup = renderToStaticMarkup(
      <ShellActionsGroup label="Exportación">
        <button type="button">PDF</button>
        <button type="button">Excel</button>
      </ShellActionsGroup>,
    )

    expect(markup).toContain('data-atlas-component="shell-actions-group"')
    expect(markup).toContain('role="group"')
    expect(markup).toContain('aria-label="Exportación"')
    expect(markup).toContain('Excel')
  })

  it('supports a segmented visual treatment', () => {
    const markup = renderToStaticMarkup(
      <ShellActionsGroup variant="segmented">
        <button type="button">Vista</button>
      </ShellActionsGroup>,
    )

    expect(markup).toContain('data-variant="segmented"')
  })
})
