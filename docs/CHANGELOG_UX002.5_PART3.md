# UX-002.5 — Parte 3

## Opportunity Radar Integration

Versión: `0.19.0-UX002.5-P3`

### Integración

- Se conecta `OpportunityEngine` con `WorkspaceContext`.
- Se expone `opportunityRadar` desde `useBrandWorkspace`.
- Se renderiza `OpportunityRadarCard` en Brand Workspace.
- El Radar aparece después del Executive Brief y antes de los KPI secundarios.
- La interfaz consume exclusivamente el modelo generado por Business Core.
- Se mantienen score, prioridad, impacto, confianza y explicabilidad sin cálculos en React.

### Flujo

```text
Business Repository
        ↓
Brand Intelligence Summary
        ↓
Opportunity Engine
        ↓
Workspace Context
        ↓
Brand Workspace
        ↓
Atlas Opportunity Radar
```
