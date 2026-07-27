import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ExecutiveBreadcrumbs } from './ExecutiveBreadcrumbs'

describe('ExecutiveBreadcrumbs', () => {
  it('renders links and marks the final item as the current page', () => {
    const markup = renderToStaticMarkup(
      <ExecutiveBreadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Brand Intelligence', href: '/brands' },
          { label: 'UNV' },
        ]}
      />,
    )

    expect(markup).toContain(
      'data-atlas-component="executive-breadcrumbs"',
    )
    expect(markup).toContain('href="/brands"')
    expect(markup).toContain('aria-current="page"')
    expect(markup).toContain('UNV')
  })

  it('does not render an empty navigation landmark', () => {
    const markup = renderToStaticMarkup(
      <ExecutiveBreadcrumbs items={[]} />,
    )

    expect(markup).toBe('')
  })
})
