// MD-003: the brand page link uses the same brand id as the business model.

import { describe, expect, it } from 'vitest'

import {
  normalizeBrandIdentifier,
} from '../../../core/business/builders/buildBusinessDataModel'

import {
  brandPageId,
  brandPagePath,
} from './brandPagePath'

describe('MD-003 brand page link', () => {
  it('matches normalizeBrandIdentifier of the business model', () => {
    for (const label of [
      'UNV (UNIVIEW)',
      ' unv  (uniview) ',
      'STREAMAX - MERIVA',
      'MERIVA TECHNOLOGY - STREAMAX',
      'Meriva Technology - Streamax',
      '- Unassigned -',
      'Hikvision',
      'TP-LINK',
      'Ñandú Ácido',
    ]) {
      expect(brandPageId(label)).toBe(normalizeBrandIdentifier(label))
    }
  })

  it('builds the URL of the three reference brands', () => {
    expect(brandPagePath('UNV (UNIVIEW)')).toBe('/brands/UNV%20(UNIVIEW)')
    expect(brandPagePath('STREAMAX - MERIVA')).toBe('/brands/STREAMAX%20-%20MERIVA')
    expect(brandPagePath('MERIVA TECHNOLOGY - STREAMAX')).toBe('/brands/STREAMAX%20-%20MERIVA')
    expect(brandPagePath('- Unassigned -')).toBe('/brands/-%20UNASSIGNED%20-')
    expect(brandPagePath('  ')).toBeNull()
    expect(brandPagePath(null)).toBeNull()
  })
})
