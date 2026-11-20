import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  NETSUITE_SOURCES,
} from '../config/netsuiteSources'

import {
  buildNetsuiteSourceRows,
  calendarDaysBetween,
  toLocalDateKey,
} from './netsuiteSourceStatus'

const MEXICO_CITY = 'America/Mexico_City'

// 20:00 on 20 Nov 2026 in Mexico City = 02:00 UTC on 21 Nov.
const EVENING_IN_MEXICO = new Date('2026-11-21T02:00:00.000Z')

function rowsAt(
  dates: Parameters<typeof buildNetsuiteSourceRows>[0],
  now = EVENING_IN_MEXICO,
) {
  return new Map(
    buildNetsuiteSourceRows(dates, now, MEXICO_CITY).map((row) => [
      row.importerId,
      row,
    ]),
  )
}

describe('NetSuite source status (DC-001)', () => {
  it('uses the local date, not the UTC date, at night in Mexico City', () => {
    expect(toLocalDateKey(EVENING_IN_MEXICO, MEXICO_CITY)).toBe('2026-11-20')
    expect(toLocalDateKey(EVENING_IN_MEXICO, 'UTC')).toBe('2026-11-21')

    const rows = rowsAt({
      // Cutoff 7 days before the local date: still up to date.
      sales: { lastImportedAt: null, dataCutoff: '2026-11-13' },
      // 19:30 on 13 Nov in Mexico City is 01:30 UTC on 14 Nov.
      projects: {
        lastImportedAt: '2026-11-14T01:30:00.000Z',
        dataCutoff: null,
      },
    })

    expect(rows.get('sales')).toMatchObject({
      referenceDate: '2026-11-13',
      daysSinceReference: 7,
      status: 'up-to-date',
    })
    expect(rows.get('projects')).toMatchObject({
      referenceDate: '2026-11-13',
      daysSinceReference: 7,
      status: 'up-to-date',
    })
  })

  it('marks a source stale after staleAfterDays', () => {
    const rows = rowsAt({
      sales: { lastImportedAt: null, dataCutoff: '2026-11-12' },
      inventory: { lastImportedAt: null, dataCutoff: '2026-11-20' },
    })

    expect(NETSUITE_SOURCES.sales?.staleAfterDays).toBe(7)
    expect(rows.get('sales')).toMatchObject({
      daysSinceReference: 8,
      status: 'stale',
    })
    expect(rows.get('inventory')).toMatchObject({
      daysSinceReference: 0,
      status: 'up-to-date',
    })
  })

  it('prefers the data cutoff over the last import', () => {
    const rows = rowsAt({
      inventory: {
        // Imported today, but the snapshot is old.
        lastImportedAt: '2026-11-20T15:00:00.000Z',
        dataCutoff: '2026-11-01',
      },
    })

    expect(rows.get('inventory')).toMatchObject({
      referenceDate: '2026-11-01',
      status: 'stale',
    })
  })

  it('shows "Sin datos" for configured sources without dates', () => {
    const rows = rowsAt({})

    expect(rows.get('project-billings')).toMatchObject({
      status: 'no-data',
      referenceDate: null,
    })
  })

  it('shows "Fuente sin configurar" for importers without a NetSuite source', () => {
    const rows = buildNetsuiteSourceRows(
      {
        targets: {
          lastImportedAt: '2026-11-20T15:00:00.000Z',
          dataCutoff: null,
        },
      },
      EVENING_IN_MEXICO,
      MEXICO_CITY,
    )
    const unconfigured = rows
      .filter((row) => row.status === 'unconfigured')
      .map((row) => row.importerId)

    expect(unconfigured.sort()).toEqual([
      'customer-master',
      'exchange-rates',
      'pricing',
      'product-master',
      'purchase-orders',
      'purchase-requests',
      'targets',
    ])
    expect(rows).toHaveLength(11)

    for (const row of rows.filter((item) => item.source === null)) {
      expect(row.help).toBeNull()
    }
  })

  it('gives the export help by source kind', () => {
    const rows = rowsAt({})

    expect(rows.get('sales')?.help).toBe(
      'Ejecutar el reporte y usar Exportar → Excel',
    )
    expect(rows.get('projects')?.help).toBe(
      'Abrir la búsqueda y usar Exportar → CSV',
    )
    expect(rows.get('inventory')?.help).toBe(
      'Ejecutar el reporte, usar Exportar → Excel y arrastrar el archivo tal cual (no hace falta limpiarlo)',
    )
  })

  it('counts calendar days across month and year boundaries', () => {
    expect(calendarDaysBetween('2026-10-31', '2026-11-01')).toBe(1)
    expect(calendarDaysBetween('2026-12-31', '2027-01-07')).toBe(7)
    expect(calendarDaysBetween('bad', '2027-01-07')).toBeNull()
  })
})
