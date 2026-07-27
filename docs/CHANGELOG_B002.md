# CHANGELOG B-002

## v0.10.0-B002

- Se agregó Executive Score explicable para marcas.
- Se agregó AI Commercial Summary determinístico.
- Se agregó ranking Top 5 de acciones comerciales.
- Se agregaron impacto estimado, probabilidad, urgencia y evidencia.
- React continúa consumiendo únicamente BrandWorkspaceViewModel.
## v0.10.1-B002 — Pérdidas consolidadas y claridad ejecutiva

- Corrige clientes y productos perdidos: requieren dos meses completos consecutivos sin actividad.
- Excluye el mes actual de la confirmación cuando el archivo contiene un corte parcial.
- Agrega metadatos auditables de la ventana de pérdida.
- Conserva el mes parcial para KPIs y comparativo del periodo actual.
- Expone razones e impacto del Commercial Priority Score.
- Agrega severidad visible a riesgos.
- Agrega variaciones visuales de venta, GP, clientes y productos.
- Corrige la resolución de `currentPeriodId` para utilizar el catálogo mensual del Repository.

