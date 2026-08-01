# PL-010 — Batch Pricing Sensitivity & Common Factor Feasibility

## Motivo

PL-009 determina un factor común para una marca nueva mediante una estrategia
seleccionada. Sin embargo, el trabajo de ingeniería de precios también requiere
comparar varios factores posibles contra todos los descuentos y productos antes
de decidir qué parámetro continuará fuera del laboratorio.

PL-010 incorpora una capa de sensibilidad sobre la matriz por lote. El análisis
permanece en memoria, no cambia la matriz de origen y no convierte un resultado
matemático en recomendación o aprobación comercial.

## Metodología

```text
price-batch-sensitivity-v1
```

La matriz evalúa explícitamente:

```text
Factor común × Descuento × Producto
```

Cada combinación utiliza `price-design-v1` para calcular:

- precio de lista;
- precio neto;
- factor neto;
- GP unitario;
- Gross Margin;
- cumplimiento del objetivo de la matriz de origen.

No se precargan factores ocultos. El usuario puede escribir varios factores o
agregar explícitamente el factor calculado en PL-009.

## Factor mínimo matemático

Para cada descuento se calcula el factor requerido por cada producto. El mínimo
del nivel se define como:

```text
Factor mínimo por descuento = máximo factor individual requerido
```

El factor mínimo global se define como:

```text
Factor mínimo global = máximo de los mínimos por descuento
```

Ambos valores son umbrales matemáticos derivados del costo, descuento y objetivo
explícito. No representan un factor recomendado, autorizado o publicado.

## Matriz de factibilidad

Cada celda `Factor × Descuento` publica:

- factor capturado;
- descuento;
- factor mínimo requerido;
- diferencia contra el mínimo;
- banda respecto al mínimo;
- productos calculables;
- productos que cumplen;
- productos debajo del objetivo;
- cobertura de cumplimiento;
- costo, lista, venta y GP agregados;
- Gross Margin agregado;
- margen mínimo y máximo entre productos.

Las bandas son:

- debajo del mínimo;
- en el mínimo;
- arriba del mínimo;
- mínimo no disponible.

La factibilidad se clasifica como:

- totalmente factible;
- parcialmente factible;
- no factible;
- no calculable.

## Resumen por factor

Para cada factor se conserva:

- descuentos totalmente factibles;
- descuentos parcialmente factibles;
- descuentos no factibles;
- cantidad total de incumplimientos;
- cobertura mínima;
- cobertura promedio;
- condición de factibilidad para todos los descuentos.

El orden de captura se conserva. El laboratorio no ordena factores por conveniencia
ni selecciona un ganador.

## Exportación

PL-010 genera un libro Excel de seis hojas:

1. `Resumen Ejecutivo`;
2. `Matriz Sensibilidad`;
3. `Mínimos por Descuento`;
4. `Resumen por Factor`;
5. `Detalle por Producto`;
6. `Metadatos`.

También genera una vista independiente para impresión o PDF. Ambas salidas
incluyen:

```text
SIMULACIÓN SIN EFECTO COMERCIAL
```

Los agregados consideran una unidad de cada producto. No representan Forecast,
volumen, presupuesto o mezcla comercial.

## Aislamiento

```ts
executionMode: 'simulation-only'

isolation: {
  mutatesCatalogPrice: false,
  createsProductsOrBrands: false,
  persistsSensitivity: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

PL-010 no:

- crea productos, marcas, costos o precios;
- modifica la matriz PL-009;
- guarda factores o resultados;
- escribe en Product Master, Data Center, IndexedDB o Business Repository;
- afecta Sales, Inventory, Forecast u otros Workspaces;
- recomienda, aprueba o publica un factor;
- transmite información al ERP.

## Cobertura

Las pruebas incorporadas validan:

- matriz Factor por Descuento;
- mínimos matemáticos por descuento y global;
- factibilidad total, parcial y no factible;
- cobertura y resúmenes por factor;
- ausencia de un factor plenamente factible;
- validación de factores duplicados o inválidos;
- aislamiento e inmutabilidad;
- borrador sin supuestos ocultos;
- exportación Excel de seis hojas;
- documento imprimible;
- renderizado del analizador interactivo.

## Continuidad hacia PL-011

PL-011 reutiliza los productos y costos temporales de la matriz PL-009, pero
reemplaza el objetivo único de PL-010 por una escalera donde cada nivel comercial
tiene su propio descuento y objetivo mínimo explícito. La sensibilidad de PL-010
permanece disponible y no se modifica.
