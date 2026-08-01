# FW-010 Hotfix 2 — Conciliación temporal y material

## Problema observado

Project Billing Reconciliation trataba cualquier documento histórico faltante o cualquier documento anulado presente en Ventas como incidencia bloqueante. También comparaba un reporte de Facturación de proyectos con corte posterior contra un archivo de Ventas con corte anterior sin distinguir la diferencia temporal.

El resultado era técnicamente conservador, pero demasiado global: una excepción de 2025 o una factura emitida después del corte de Ventas podía impedir publicar el Forecast oficial de 2026-07.

## Política corregida

### Documentos posteriores al corte

Cuando `Fecha de facturación del proyecto > corte máximo de Ventas`, el documento recibe status:

```text
pending_cutoff
```

No se clasifica todavía como venta de proyectos, no se descuenta de la venta transaccional y no bloquea el Forecast. Se espera la siguiente carga de Ventas.

### Excepciones históricas

Los faltantes, conflictos o anulados con impacto de periodos anteriores:

- permanecen visibles para auditoría;
- reducen la cobertura histórica y la confianza;
- no bloquean por sí solos el cierre del periodo actual.

### Periodo actual

Continúan siendo bloqueantes:

- factura de proyecto no localizada dentro del corte vigente;
- documento asociado a más de un proyecto activo;
- nota de crédito con Revenue positivo;
- documento anulado con Revenue, GP o cantidad material;
- tipo de cambio faltante para pipeline maduro;
- proyecto maduro con fecha, monto o moneda inválidos.

### Documentos anulados

La sola presencia en Ventas ya no es suficiente para bloquear:

- impacto financiero distinto de cero: incidencia material;
- Revenue, GP y cantidad en cero: información auditable.

## Coberturas publicadas

El contrato de calidad expone:

- cobertura del periodo actual;
- cobertura histórica;
- corte de Ventas;
- corte de Facturación de proyectos;
- documentos pendientes por diferencia de corte.

Los pendientes por corte quedan fuera del denominador de cobertura porque todavía no son elegibles para conciliación.

## UI y exportación

Data Center muestra los dos cortes, pendientes por corte, anulados con impacto, anulados en cero y excepciones históricas. Forecast Workspace prioriza incidencias actuales y limita el detalle visual a 40 registros; el Excel conserva todas las incidencias.

## Fórmulas preservadas

No cambia la identidad contable:

```text
Venta total = Venta transaccional + Facturación de proyectos conciliada
```

Tampoco cambia la fórmula Project-Aware:

```text
Forecast total = Forecast transaccional + Facturación real de proyectos + Pipeline maduro pendiente
```
