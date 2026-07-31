# FW-002 — Forecast Engine & Baseline Projection

## Objetivo

Convertir las series mensuales de FW-001 en una primera proyección determinista de cierre sin incorporar todavía UI, cobertura futura de inventario, recomendaciones comerciales ni Purchasing detallado.

## Arquitectura

```text
Forecast Data Foundation
        │
        ▼
Forecast Series
        │
        ▼
Forecast Baseline Engine
        │
        ├── Ritmo del periodo
        ├── Promedio histórico
        ├── Tendencia reciente
        └── Referencia estacional
                │
                ▼
      Baseline + Escenarios
```

El Engine opera exclusivamente sobre hechos y contratos del Business Core. No modifica ventas, objetivos, inventario ni Product Master.

## Granularidades activas

- Portafolio.
- Marca.
- Producto.

Cliente conserva su serie contractual de FW-001, pero no genera todavía baseline en FW-002.

## Métodos baseline-v1

### Ritmo del periodo — 50% base

Extrapola el acumulado actual con los días laborales declarados:

```text
Acumulado / días laborales transcurridos × días laborales totales
```

Los días transcurridos siguen el estándar actual de la plataforma: lunes a viernes hasta el corte de ventas, limitados por el total declarado. No se inventa un calendario cuando faltan días laborales y todavía no existe detalle de feriados por fecha.

### Promedio histórico — 25% base

Promedia hasta seis periodos cerrados anteriores. Cuando una marca o producto no tuvo actividad dentro de un mes disponible para el portafolio, ese mes entra como cero; no se promedian únicamente los meses con venta.

### Tendencia reciente — 15% base

Aplica una tendencia lineal sobre hasta cuatro periodos cerrados. Se requieren al menos dos observaciones mensuales alineadas.

### Referencia estacional — 10% base

Utiliza el mismo mes del año anterior cuando existe. No se sustituye por un mes cercano.

Los pesos faltantes se redistribuyen proporcionalmente entre los métodos disponibles. Cuando el periodo está cerrado, la proyección converge al valor real y los escenarios dejan de introducir variación.

## Métricas

Cada método y escenario calcula:

- Venta.
- Gross Profit.
- Cantidad.

El margen esperado se deriva de venta y GP proyectados; no se almacena como hecho independiente.

## Escenarios

- Conservador.
- Esperado.
- Acelerado.

La amplitud depende de la confianza y de la volatilidad histórica de venta. El escenario conservador nunca reduce el cierre por debajo del acumulado real.

## Confianza

La confianza es una puntuación de suficiencia y estabilidad de datos, no una probabilidad estadística de cumplimiento.

Considera:

- cantidad de periodos cerrados;
- continuidad mensual;
- disponibilidad de ritmo laboral;
- avance del periodo;
- referencia estacional;
- volatilidad histórica.

Niveles:

- Baja: menos de 50.
- Media: de 50 a menos de 75.
- Alta: 75 o más.

## Objetivos

- Portafolio: suma de objetivos de venta por marca para el periodo.
- Marca: objetivo directo de la marca.
- Producto: sin objetivo propio; conserva el calendario de su marca cuando está disponible.

El Engine calcula cumplimiento esperado, brecha restante y venta diaria necesaria cuando existen objetivo y días restantes.

## API pública

```ts
repository.forecast.getPortfolioBaselineProjection()
repository.forecast.getBaselineProjections('brand')
repository.forecast.getBaselineProjections('product')
repository.forecast.findBaselineProjection('brand', brandId)
repository.forecast.findBaselineProjection('product', productId)
```

Todas las respuestas se clonan antes de entregarse al consumidor.

## Integración arquitectónica

La función de conteo de días laborables se centraliza en Forecast y Brand Decision Engine la reutiliza. De esta forma, Brand Workspace y Forecast no mantienen fórmulas paralelas para el avance mensual.

## Fuera de alcance

FW-002 no incluye:

- interfaz visual;
- forecast por cliente;
- cobertura o agotamiento de inventario;
- entradas de Purchasing por fecha;
- recomendaciones de compra;
- override manual;
- aprendizaje automático;
- probabilidades estadísticas.

## Siguiente entrega

FW-003 construirá el análisis de Forecast por marca y producto sobre `baseline-v1`, incluyendo comparativos, rankings y priorización sin duplicar cálculos.
