# UX-002.5 — Parte 1

## Opportunity Radar Core

Versión: `0.19.0-UX002.5-P1`

Se incorpora un motor determinístico de priorización comercial para Brand Intelligence.

### Incluye

- Contratos públicos de Opportunity Radar.
- Score ponderado y clasificación de prioridad.
- Reglas de recuperación, crecimiento, cobertura y protección de portafolio.
- Ordenamiento por score e impacto.
- Explicabilidad mediante regla, razonamiento y evidencia.
- Pruebas unitarias del score y del motor.

La implementación consume `BrandIntelligenceSummary`; no accede a filas normalizadas ni introduce lógica de negocio en React.
