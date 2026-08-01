# FW-006 Hotfix 1 - Executive Outlook Objective Wording

## Incidencia

La prueba del resumen ejecutivo valida que la perspectiva comercial mencione explícitamente el objetivo mensual. Para el estado `on-track`, la narrativa productiva utilizaba la frase:

```text
en ritmo de cumplimiento
```

El mensaje era semánticamente correcto, pero no declaraba de forma explícita el objeto del cumplimiento.

## Corrección

`targetStatusText('on-track')` ahora devuelve:

```text
en ritmo de cumplimiento del objetivo
```

La perspectiva resultante conserva el resto de la narrativa y satisface el contrato determinístico del resumen ejecutivo.

## Impacto

El hotfix no modifica:

- Forecast Baseline Engine;
- Forecast Inventory Intelligence;
- escenarios conservador, esperado o acelerado;
- KPIs, filtros o rankings;
- estructura o contenido numérico de las seis hojas Excel;
- reglas de inventario, sustitución o Purchasing futuro.

Solo cambia la redacción del estado `on-track`.
