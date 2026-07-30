# Validacion IQ-002

## Validacion realizada en preparacion

- Compilacion TypeScript focalizada del Core, importadores, repositorios y builder: aprobada.
- Compilacion TypeScript focalizada de pruebas modificadas: aprobada.
- Validacion de sintaxis TS/TSX: aprobada.
- Prueba funcional aislada:
  - `Name` se normaliza desde ventas.
  - conciliacion primaria por Name.
  - advertencia por diferencia de Marca.
  - cobertura por Name y cobertura total.

## Validacion requerida en entorno local

```bat
npm run build
npm run lint
npm test
```

## Validacion funcional

1. Aplicar IQ-002.
2. Reimportar **Ventas** para que las filas persistidas incorporen `Name`.
3. No es obligatorio reimportar Product Master; IQ-002 puede leer el catalogo persistido por IQ-001.
4. Abrir `/data-quality/products`.
5. Confirmar que `Por Name` sea mayor que cero.
6. Revisar fallbacks, advertencias, ambiguos y no encontrados.
7. Exportar el CSV de excepciones.

## Criterio esperado

La cobertura debe aumentar frente al baseline IQ-001 de 78.8% por filas y 71.0% por valor. El resultado exacto depende de la calidad real de `Name`, Marca y Modelo en el archivo de Ventas.
