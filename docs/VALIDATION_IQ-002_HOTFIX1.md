# Validación — IQ-002 HOTFIX 1

## Pruebas añadidas

- Mapeo exacto de `Name (Grouped)` desde un encabezado NetSuite real.
- Conciliación de un producto histórico ausente del catálogo vigente.
- Cobertura de identidad incluyendo productos históricos por Name.

## Validación local requerida

```bat
npm run build
npm run lint
npm test
```

Baseline esperado:

- Test Files: 47
- Tests: 192

El conteo definitivo es el reportado por Vitest; todas las pruebas descubiertas deben aprobarse.

## Validación funcional

1. Reimportar Ventas.
2. Confirmar que desaparezca el aviso de Name no materializado.
3. Revisar `Por Name — catálogo actual` y `Histórico por Name`.
4. Confirmar que los productos descontinuados no figuren como `Producto no encontrado`.
5. Exportar excepciones y verificar que permanezcan únicamente ambigüedades o identidades realmente faltantes.
