# IQ-002 HOTFIX 1 — Name (Grouped) & Historical Product Identity

## Correcciones

- Reconoce el encabezado real de NetSuite `Name (Grouped)` como `productName`.
- Mantiene `Marca` y `Modelo` como atributos de validación independientes.
- Clasifica un `Name` válido que ya no existe en el Product Master actual como `historical_unlisted`.
- Las identidades históricas cuentan dentro de la cobertura de identidad y no bloquean Inventory Workspace por haber sido descontinuadas.
- Materializa productos históricos como `historical_unlisted`, separados de productos vigentes, ambigüedades y fallbacks sin Name.
- Añade indicadores de filas y valor de productos históricos en Product Identity Quality Gate.

## Regla de resolución

1. `Name` único en Product Master actual.
2. Código alterno/legado.
3. Marca + Modelo únicos.
4. `Name` presente en ventas pero ausente del catálogo actual: identidad histórica reconocida.
5. Ambiguo o identidad faltante.

## Acción requerida

Después de instalar el hotfix, reimportar Ventas para que `Name (Grouped)` quede materializado en IndexedDB y se recalcule el Quality Gate.
