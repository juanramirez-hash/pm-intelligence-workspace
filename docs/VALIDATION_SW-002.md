# Validación — SW-002

## Comandos requeridos

```bash
npm run build
npm run lint
npm test
```

## Casos cubiertos

- consolidación de objetivos por marca para el periodo seleccionado;
- cumplimiento mensual de venta y Gross Profit;
- margen objetivo consolidado;
- días laborables transcurridos al último corte de ventas;
- esperado acumulado y brecha contra plan;
- ritmo diario real y requerido;
- proyección de cierre y cumplimiento proyectado;
- priorización de marcas con mayor rezago;
- cobertura de objetivos sobre marcas activas;
- comportamiento operativo cuando no existen cuotas importadas.

## Resultado esperado

Partiendo del cierre validado de SW-001:

```text
Test Files  37 passed (37)
Tests       163 passed (163)
```

El resultado definitivo debe validarse en el entorno local del proyecto.

## Criterio de aceptación

- `npm run build` finaliza sin errores.
- `npm run lint` finaliza con cero errores y cero advertencias.
- Todas las pruebas pasan.
- `/sales` muestra el bloque de desempeño contra objetivo cuando existe una cuota para el periodo.
- Si no existen objetivos, el Workspace conserva sus KPIs de ventas y muestra un estado informativo no bloqueante.
