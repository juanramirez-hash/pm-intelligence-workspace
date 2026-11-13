import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  normalizeBrandKey as normalizeServerBrandKey,
} from '../../server/middleware/requireBrandScope.js'
import {
  normalizeBrandKey as normalizeClientBrandKey,
} from '../../src/features/auth/brandAccess'

describe('brand key parity between server and frontend', () => {
  it.each([
    'MERIVA TECHNOLOGY - STREAMAX',
    'STREAMAX - MERIVA',
    'meriva technology streamax',
    'UNV (UNIVIEW)',
    'TP-LINK',
    'Hikvision',
    '  -  ',
    '',
    null,
    42,
  ])('normalizes %j the same way', (value) => {
    expect(normalizeClientBrandKey(value)).toBe(
      normalizeServerBrandKey(value),
    )
  })
})
