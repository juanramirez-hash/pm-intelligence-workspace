# PMC-003 HOTFIX 1

## Corrección

Se completa `brandId` al construir productos desde ambas fuentes de identidad:

- Product Master (`createBusinessProductFromMaster`)
- Ventas sin conciliación (`createFallbackBusinessProduct`)

PMC-002 HOTFIX 1 había dejado `brandId` como campo opcional para conservar compatibilidad con fixtures y módulos legados, pero el builder no lo materializaba. Los índices de PMC-003 podían localizar el producto mediante el fallback `brand`, aunque el objeto retornado conservaba `brandId` como `undefined`.

## Resultado esperado

Las consultas del Product Repository retornan productos con identidad canónica de marca:

- `findByBrand(...)`
- `findByBrandAndModel(...)`
- `findUniqueByBrandAndModel(...)`

No se modifica la API pública ni la estrategia de índices.
