# UX-002.4 · Parte 1 — Executive Brief Core

## Versión

`0.18.0-UX002.4-P1`

## Alcance

Se incorporó el núcleo determinístico del Executive Brief para Brand Workspace.

### Nuevo módulo

`src/core/business/executiveBrief/`

- `executiveBriefTypes.ts`
- `executiveBriefRules.ts`
- `executiveBriefBuilder.ts`
- `executiveBriefEngine.ts`
- `executiveBriefEngine.test.ts`
- `index.ts`

## Decisiones arquitectónicas

- Consume el contrato público `BrandIntelligenceSummary`.
- No accede a filas normalizadas, estado de React ni índices internos del Repository.
- No usa LLM, prompts ni servicios externos.
- Todas las conclusiones son reproducibles mediante reglas identificables.
- Cada item incluye confianza, regla, razonamiento y evidencia.
- El Business Score consolidado permanece en `null`; no se fabrica un indicador aún inexistente.

## Salida del engine

El engine produce:

- resumen ejecutivo;
- highlights;
- riesgos;
- oportunidades;
- recomendaciones;
- explicabilidad por regla y evidencia.

## Validación

Se agregaron pruebas para:

- construcción determinística;
- ausencia de score inventado;
- recomendación neutral cuando no existen señales materiales;
- rechazo de coberturas inconsistentes.
