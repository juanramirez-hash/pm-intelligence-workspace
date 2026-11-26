// MD-003: the 5 priority actions: open statuses, the user's brands,
// priority (critical > high > medium > low) and then due date.

import { describe, expect, it } from 'vitest'

import type { MyDayAction } from '../api/myDayTypes'

import {
  resolveActionBrandKeys,
  selectPriorityActions,
} from './selectPriorityActions'

let nextId = 1

function action(overrides: Partial<MyDayAction>): MyDayAction {
  return {
    id: nextId++,
    brand_id: 'UNV (UNIVIEW)',
    brand_key: 'UNVUNIVIEW',
    title: 'Acción',
    priority: 'medium',
    status: 'open',
    due_date: '2026-12-01',
    owner_name: 'PM',
    days_overdue: 0,
    ...overrides,
  }
}

describe('MD-003 priority actions', () => {
  it('orders open actions by priority and then due date, 5 at most', () => {
    const rows = [
      action({ title: 'low', priority: 'low', due_date: '2026-11-01' }),
      action({ title: 'high-late', priority: 'high', due_date: '2026-12-10' }),
      action({ title: 'critical', priority: 'critical', due_date: '2026-12-31' }),
      action({ title: 'high-soon', priority: 'high', due_date: '2026-11-30' }),
      action({ title: 'medium', priority: 'medium' }),
      action({ title: 'done', priority: 'critical', status: 'done' }),
      action({ title: 'blocked', priority: 'medium', status: 'blocked', due_date: '2026-11-15' }),
      action({ title: 'in-progress', priority: 'low', status: 'in_progress', due_date: '2026-10-01' }),
    ]

    expect(selectPriorityActions(rows, null).map((row) => row.title)).toEqual([
      'critical', 'high-soon', 'high-late', 'blocked', 'medium',
    ])
  })

  it('keeps only the user brands with view=mine', () => {
    const rows = [
      action({ title: 'unv', brand_key: 'UNVUNIVIEW' }),
      action({ title: 'hik', brand_key: 'HIKVISION' }),
      action({ title: 'streamax', brand_key: 'MERIVATECHNOLOGYSTREAMAX' }),
    ]

    expect(resolveActionBrandKeys({ brandIds: ['UNV (UNIVIEW)', 'STREAMAX - MERIVA'] }, 'mine')).toEqual([
      'UNVUNIVIEW', 'STREAMAXMERIVA',
    ])
    expect(
      selectPriorityActions(rows, resolveActionBrandKeys({ brandIds: ['UNV (UNIVIEW)', 'STREAMAX - MERIVA'] }, 'mine'))
        .map((row) => row.title),
    ).toEqual(['unv', 'streamax'])
  })

  it('shows every brand of the user scope with view=all or without assignments', () => {
    expect(resolveActionBrandKeys({ brandIds: ['UNV'] }, 'all')).toBeNull()
    expect(resolveActionBrandKeys({ brandIds: [] }, 'mine')).toBeNull()
  })
})
