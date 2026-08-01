# PL-004 Hotfix 1 — Safe Template Catalog Test

## Objetivo

Eliminar la advertencia `eslint(no-unsafe-optional-chaining)` detectada por Oxlint en `pricingTemplateCatalog.test.ts`.

## Causa

La prueba intentaba mutar `first[0]?.suggestedBasisTypes`. Si el optional chaining devolvía `undefined`, la llamada posterior a `splice()` podía lanzar un `TypeError`.

## Corrección

La prueba ahora:

1. obtiene explícitamente la primera plantilla;
2. verifica que exista;
3. falla con un mensaje determinístico si el catálogo no la publica;
4. muta únicamente la copia local para comprobar aislamiento.

## Frontera funcional

El hotfix no modifica:

- el catálogo estándar;
- descuentos, márgenes o precios;
- guardrails;
- `price-engineering-v1`;
- persistencia;
- Data Center;
- ningún Workspace.

Es una corrección exclusiva de calidad estática y seguridad del test.
