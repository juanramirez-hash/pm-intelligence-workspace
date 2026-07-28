# SW-005 — Commercial Opportunity Engine

## Added

- Motor determinístico de oportunidades comerciales dentro de Sales Workspace.
- Priorización por impacto, urgencia, probabilidad, cobertura y riesgo.
- Oportunidades de cinco tipos:
  - brecha de cuota por marca;
  - recuperación de clientes;
  - crecimiento de clientes;
  - crecimiento de productos;
  - protección de margen.
- Estimación de impacto económico y venta diaria requerida.
- Evidencia explicable para cada recomendación.
- Acción recomendada específica por oportunidad.
- Navegación desde una oportunidad hacia el segmento de marca, cliente o producto.
- Panel ejecutivo con impacto detectado, volumen de oportunidades y prioridades críticas/altas.

## Business rules

- Las brechas de cuota se generan únicamente cuando la marca tiene objetivo y una proyección inferior al 100%.
- La recuperación de clientes exige una caída material frente al periodo comparable.
- El crecimiento de clientes y productos exige tracción positiva por encima de los umbrales de materialidad.
- La protección de margen se activa cuando el margen real queda más de un punto porcentual debajo del objetivo.
- Los cálculos respetan periodo, comparación y filtros activos del Sales Workspace.
- El impacto es una estimación analítica bruta y no representa venta garantizada ni debe interpretarse como una suma libre de solapamientos.

## Architecture

```text
BusinessRepository
  ├── salesSegmentation
  ├── targets
  └── brand periods
          ↓
Sales Workspace Engine
          ↓
Commercial Opportunity Engine
          ↓
Prioritized actions + segment drill-down
```

SW-005 no modifica entidades, builders ni repositorios del Business Core. Se ejecuta sobre el estado validado de SW-003; SW-004 permanece como bloque independiente pendiente y podrá enriquecer posteriormente la explicación de contribuciones.
