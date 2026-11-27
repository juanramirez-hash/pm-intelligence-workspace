// MB-001: Inteligencia tab. It keeps the current browser calculation
// (Decision Core over the /api/data/* datasets), so its route is inside
// DataHydrationGate; the same frame (title, period, tabs) goes around it.
// Own file and chunk: Ventas, Clientes and Productos never load this code.

import {
  BrandIntelligencePage,
} from '../../brand-intelligence/pages/BrandIntelligencePage'

import {
  BrandFrame,
} from '../components/BrandFrame'

export function BrandIntelligenceRoute() {
  return (
    <BrandFrame>
      <BrandIntelligencePage />
    </BrandFrame>
  )
}
