# UX-002.1 — Executive Hero

Versión: `0.17.0-UX002.1`

## Alcance

- Nuevo `ExecutiveHero` reutilizable para workspaces ejecutivos.
- Nuevo `ExecutiveHealthScore` con soporte explícito para score no disponible.
- Nuevos `ExecutiveHeroMetric` y `ExecutiveHeroSummary`.
- Integración completa en Brand Intelligence.
- Consolidación de acciones, estado, periodo, métricas principales y cobertura en una sola cabecera ejecutiva.
- Se conserva la arquitectura: no se modificaron Business Repository, Decision Engines, importadores ni ViewModels.

## Decisión sobre Commercial Health Score

Brand Intelligence aún no expone un score agregado del workspace desde el Business Core. Para evitar lógica inventada en React, el Hero muestra el estado `Pendiente de modelo`. La interfaz queda lista para conectar un score real cuando el Core lo publique.

## Validación esperada

```bash
npm run build
npm run lint
npm test
```
