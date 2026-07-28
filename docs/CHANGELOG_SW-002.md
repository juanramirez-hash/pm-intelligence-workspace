# SW-002 — Sales Performance Analytics

## Versión

`0.26.0`

## Objetivo

Convertir Sales Workspace en un tablero de seguimiento contra cuota mensual, incorporando avance por días laborables, proyección de cierre y brecha de desempeño por marca.

## Cambios

- Se agregan métricas consolidadas de objetivo de venta, Gross Profit y margen.
- Se calcula cumplimiento mensual, variación absoluta y cobertura de objetivos sobre marcas activas.
- Se incorpora ritmo diario actual, ritmo diario requerido, esperado al corte y brecha contra plan.
- Se calcula proyección de cierre y cumplimiento proyectado.
- Se agrega tabla priorizada de brecha por marca con venta real, objetivo, cumplimiento, proyección y margen.
- Se mantiene la selección global de periodo de SW-001.
- Se agregan cinco pruebas del motor de Sales Performance Analytics.

## Regla de corte laboral

- Para el último periodo con ventas, el corte se toma de `BusinessRepository.getDataPeriodEnd()`.
- Para periodos históricos anteriores, se considera el cierre completo del mes.
- Los días transcurridos se calculan de lunes a viernes y se limitan al total de días laborables importado para el periodo.
- El cálculo no depende del reloj del dispositivo, por lo que es determinístico y reproducible.

## Regla arquitectónica

SW-002 no modifica el Business Core. Consume exclusivamente:

- `BusinessRepository.revenue`;
- `BusinessRepository.targets`;
- `BusinessRepository.brand`;
- funciones públicas de `core/business/attainment`.

No accede a `NormalizedSalesRow[]`, `Map` ni `Set` desde la UI.
