# C-001.2 — Customer Decision Engine

## Versión

`0.21.1-C001.2`

## Alcance

- Customer Health Score determinístico y explicable.
- Detección de riesgos por inactividad, caída de venta, frecuencia y contracción de portafolio.
- Detección de oportunidades de recuperación, crecimiento, productos abandonados y ampliación de marcas.
- Recomendaciones priorizadas con resultado esperado y trazabilidad hacia las reglas que las originan.
- Evidencias y nivel de confianza de decisión.
- Compatibilidad con análisis consolidado y análisis específico por marca.
- Conservación de los campos anteriores para no romper Customer Workspace.

## Arquitectura

`BusinessRepository → customerPeriods/customerBrandPeriods → CustomerDecisionEngine → CustomerDecisionModel`

La lógica de decisión no consume `NormalizedSalesRow[]`; ese tipo permanece exclusivamente en la frontera de importación y en fixtures de prueba del pipeline.
