# Validación — SW-001

## Comandos requeridos

```bash
npm run build
npm run lint
npm test
```

## Casos cubiertos

- selección automática del último periodo;
- selección manual de un periodo histórico;
- comparación contra periodo anterior;
- comparación contra el mismo mes del año anterior;
- cálculo de venta, Gross Profit y margen;
- rankings de marcas, clientes y productos;
- diagnóstico de conciliación con Product Master;
- estado vacío cuando no existe repositorio;
- resolución del tema Atlas `sales`.

## Criterio de aceptación

Los tres comandos deben finalizar sin errores y la ruta `/sales` debe mostrar el Workspace operativo con datos importados o el estado vacío cuando no existe un dataset de ventas.
