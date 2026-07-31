# FW-002 Hotfix 1 — Recent Trend Rate Test Contract

## Problema detectado

La implementación calculaba correctamente la tasa de tendencia reciente contra el último periodo cerrado, pero una prueba esperaba una tasa calculada contra el promedio histórico.

Caso de referencia:

```text
Último periodo cerrado: 120
Proyección lineal reciente: 140
Promedio histórico: 110
```

Contrato oficial:

```text
recentTrendRate = (140 - 120) / 120 = 0.1667
```

El promedio histórico no es el denominador porque la explainability declara explícitamente que la variación se compara contra el último periodo cerrado.

## Alcance del hotfix

- Ajusta la expectativa de `forecastBaselineEngine.test.ts` de `0.1818` a `0.1667`.
- Añade una prueba directa de `calculateTrendRate()`.
- Actualiza versión y documentación a `0.30.1`.

## Sin impacto funcional

No cambia:

- `ForecastBaselineEngine`;
- pesos de los métodos;
- proyección esperada;
- escenarios;
- confianza;
- objetivos;
- API de `repository.forecast`.

La proyección del caso de referencia permanece en `176.13`.
