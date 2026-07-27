# UX-002.2 — Intelligent KPI Cards

**Versión:** `0.17.1-UX002.2`

## Objetivo

Transformar los indicadores secundarios de Brand Intelligence en widgets ejecutivos reutilizables, con jerarquía visual, semántica de estado, contexto e identificación de fuente, sin incorporar lógica de negocio en React.

## Componentes Atlas añadidos

- `IntelligentKpiCard`
- `KpiStatusBadge`
- `KpiTrend`
- `KpiSparkline`
- `KpiInsight`
- `KpiFooter`
- `defineKpiRegistry`

## Integración

El bloque de indicadores secundarios de Brand Intelligence ahora utiliza un registro declarativo de KPI y tarjetas Atlas inteligentes para:

- Nuevas
- Recuperadas
- En crecimiento
- En descenso

Cada tarjeta expone:

- tono semántico;
- icono funcional;
- estado;
- explicación del indicador;
- periodo contextual;
- fuente `Business Repository`.

## Decisiones arquitectónicas

- No se calcularon tendencias ni históricos artificiales en React.
- `KpiTrend` y `KpiSparkline` quedan preparados para consumir datos futuros del ViewModel.
- `defineKpiRegistry` sólo organiza definiciones de presentación; no interpreta reglas comerciales.
- Business Repository, Decision Core y ViewModels permanecen sin cambios.

## Validación prevista

```bash
npm run build
npm run lint
npm test
```
