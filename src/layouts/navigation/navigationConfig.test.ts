// NAV-001: the menu of each role, the reserved and temporary entries and the
// screen titles.

import { describe, expect, it } from 'vitest'

import type {
  AuthenticatedUser,
  AuthenticatedUserRole,
  AuthenticatedUserScope,
} from '../../features/auth/authTypes'

import {
  canAccessWorkspace,
} from '../../features/auth/workspaceAccess'

import {
  NAVIGATION,
  accessibleScreens,
  buildNavigation,
  screenTitle,
} from './navigationConfig'

const SCOPES: Record<AuthenticatedUserRole, AuthenticatedUserScope> = {
  admin: 'all',
  manager: 'all',
  pm: 'assigned',
  engineering: 'assigned',
  assistant: 'assigned',
}

function user(role: AuthenticatedUserRole): AuthenticatedUser {
  return {
    id: 1,
    email: `${role}@example.com`,
    name: role,
    role,
    roleName: role,
    scope: SCOPES[role],
    writeAccess: true,
    costAccess: true,
    brandIds: [],
  }
}

function menu(role: AuthenticatedUserRole) {
  return Object.fromEntries(
    buildNavigation(user(role)).map((section) => [
      section.label,
      section.items.map((item) => item.label),
    ]),
  )
}

describe('NAV-001 menu by role', () => {
  it('shows admin every section, Proyectos still hidden', () => {
    expect(menu('admin')).toEqual({
      Inicio: ['Mi día'],
      'Mi trabajo': ['Marcas', 'Clientes', 'Productos', 'Acciones'],
      'Análisis': ['Ventas', 'Pronóstico', 'Inventario'],
      Gerencia: ['Panorama ejecutivo', 'Pricing Lab', 'Compras'],
      'Administración': ['Centro de datos', 'Calidad de producto', 'Configuración'],
    })
  })

  it('shows manager everything but Configuración', () => {
    expect(menu('manager')).toEqual({
      Inicio: ['Mi día'],
      'Mi trabajo': ['Marcas', 'Clientes', 'Productos', 'Acciones'],
      'Análisis': ['Ventas', 'Pronóstico', 'Inventario'],
      Gerencia: ['Panorama ejecutivo', 'Pricing Lab', 'Compras'],
      'Administración': ['Centro de datos', 'Calidad de producto'],
    })
  })

  it('hides Gerencia from a PM without removing the access', () => {
    expect(menu('pm')).toEqual({
      Inicio: ['Mi día'],
      'Mi trabajo': ['Marcas', 'Clientes', 'Productos', 'Acciones'],
      'Análisis': ['Ventas', 'Pronóstico', 'Inventario'],
    })

    // Permissions unchanged in NAV-001: still reachable by URL.
    for (const workspace of ['executive', 'pricing', 'purchasing'] as const) {
      expect(canAccessWorkspace(user('pm'), workspace)).toBe(true)
    }
  })

  it('shows engineering only what it can open', () => {
    expect(menu('engineering')).toEqual({
      Inicio: ['Mi día'],
      'Mi trabajo': ['Marcas', 'Clientes', 'Productos', 'Acciones'],
      'Análisis': ['Ventas', 'Inventario'],
    })
  })

  it('shows an assistant the PM menu, without Gerencia nor Administración (NAV-002)', () => {
    expect(menu('assistant')).toEqual(menu('pm'))
    expect(menu('assistant')).toEqual({
      Inicio: ['Mi día'],
      'Mi trabajo': ['Marcas', 'Clientes', 'Productos', 'Acciones'],
      'Análisis': ['Ventas', 'Pronóstico', 'Inventario'],
    })

    // Unlike a PM, no URL access to Gerencia or Administración either.
    for (const workspace of ['executive', 'pricing', 'purchasing', 'data-center', 'product-quality', 'settings'] as const) {
      expect(canAccessWorkspace(user('assistant'), workspace)).toBe(false)
    }

    expect(accessibleScreens(user('assistant')).map((item) => item.id)).toEqual([
      'my-day', 'brands', 'customers', 'products', 'actions', 'sales', 'forecast', 'inventory',
    ])
  })

  it('has a menu for exactly the five current roles (NAV-002B)', () => {
    const roles = Object.keys(SCOPES).sort()

    expect(roles).toEqual(['admin', 'assistant', 'engineering', 'manager', 'pm'])

    for (const role of roles as AuthenticatedUserRole[]) {
      expect(buildNavigation(user(role)).length).toBeGreaterThan(0)
    }
  })

  it('marks the analysis entries as temporary and reserves Proyectos', () => {
    const items = NAVIGATION.flatMap((section) => section.items)

    expect(items.filter((item) => item.temporary).map((item) => item.id)).toEqual([
      'sales', 'forecast', 'inventory',
    ])
    expect(items.find((item) => item.id === 'projects')).toMatchObject({ reserved: true })
    expect(accessibleScreens(user('admin')).some((item) => item.id === 'projects')).toBe(false)
  })

  it('lists for a PM every screen it can open, Gerencia included', () => {
    expect(accessibleScreens(user('pm')).map((item) => item.id)).toEqual([
      'my-day', 'brands', 'customers', 'products', 'actions', 'sales', 'forecast',
      'inventory', 'executive', 'pricing', 'purchasing',
    ])
  })
})

describe('NAV-001 screen titles', () => {
  it('titles every screen in Spanish', () => {
    expect([
      '/', '/executive', '/executive/attention/brands', '/brands', '/brands/UNV',
      '/customers', '/customers/C-1', '/products', '/products/P-1', '/actions',
      '/sales', '/forecast', '/inventory', '/pricing', '/purchasing', '/data-center',
      '/data-quality/products', '/settings', '/desconocida',
    ].map(screenTitle)).toEqual([
      'Mi día', 'Panorama ejecutivo', 'Cola de atención', 'Marcas', 'Ficha de marca',
      'Clientes', 'Ficha de cliente', 'Productos', 'Ficha de producto', 'Acciones',
      'Ventas', 'Pronóstico', 'Inventario', 'Pricing Lab', 'Compras', 'Centro de datos',
      'Calidad de producto', 'Configuración', 'PM Intelligence',
    ])
  })
})
