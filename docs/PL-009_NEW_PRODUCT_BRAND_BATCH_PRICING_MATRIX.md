# PL-009 — New Product & Brand Batch Pricing Matrix

## Motivo

PL-008 habilitó el diseño de un producto nuevo desde costo, pero cada cálculo
seguía siendo individual. El trabajo de alta de una marca o familia requiere
revisar varios modelos, múltiples costos y más de un descuento comercial antes
de definir un factor de lista consistente.

PL-009 incorpora una matriz por lote dentro de Pricing Laboratory. La matriz
permanece separada de Product Master, Data Center, Business Repository y toda
persistencia.

## Metodología

```text
price-batch-design-v1
```

La metodología reutiliza `price-design-v1` para cada combinación de:

```text
Producto × Descuento
```

Entradas explícitas:

- marca provisional;
- moneda común;
- modelos, SKU y costos;
- uno o varios descuentos;
- objetivo común;
- estrategia para determinar el factor de lista común.

No existen descuentos, márgenes, factores, costos o precios predeterminados.

## Objetivos disponibles

La matriz acepta los mismos objetivos matemáticos de PL-008:

- Gross Margin objetivo;
- GP unitario objetivo;
- precio neto objetivo;
- factor de lista objetivo;
- factor neto objetivo;
- precio de lista conocido.

Cada combinación calcula primero el factor individual requerido. Ese valor se
conserva para compararlo contra el factor común aplicado al lote.

## Estrategias de factor común

### Proteger todos

```text
Factor común = máximo factor individual requerido
```

La estrategia busca que todas las combinaciones calculables alcancen al menos
el objetivo capturado. No es una recomendación automática: es una regla
matemática seleccionada explícitamente por el usuario.

### Promedio de factores requeridos

```text
Factor común = promedio simple de factores individuales
```

La matriz identifica las combinaciones que quedan debajo del objetivo. El
promedio no pondera inventario, demanda, volumen ni mezcla comercial.

### Factor explícito

El usuario captura el factor común que desea evaluar. El motor no lo ajusta y
publica qué productos o descuentos cumplen el objetivo.

## Resumen agregado

Para cada descuento se suman, considerando una unidad de cada producto:

- costo;
- precio de lista;
- venta neta;
- GP;
- Gross Margin agregado;
- cantidad de productos debajo del objetivo.

Estos totales no representan Forecast, presupuesto, demanda ni proyección de
volumen.

## Matriz detallada

Cada fila muestra:

- modelo y SKU;
- costo;
- descuento;
- factor individual requerido;
- factor común;
- diferencia entre ambos factores;
- precio de lista con factor común;
- precio neto;
- factor neto;
- GP unitario;
- Gross Margin;
- cumplimiento del objetivo.

La matriz no ordena ni clasifica un producto como ganador.

## Captura por lote

La interfaz permite agregar filas manualmente o pegar datos desde Excel.

Orden recomendado:

```text
Modelo    SKU    Costo    Notas
```

También acepta dos columnas:

```text
Modelo    Costo
```

Los datos pegados solo viven en el estado React de la sesión.

## Exportación

PL-009 genera un libro Excel de cinco hojas:

1. `Resumen Ejecutivo`;
2. `Matriz de Pricing`;
3. `Resumen por Descuento`;
4. `Productos y Supuestos`;
5. `Metadatos`.

También genera una vista imprimible independiente para PDF. Ambas salidas
incluyen el aviso obligatorio:

```text
SIMULACIÓN SIN EFECTO COMERCIAL
```

## Aislamiento

```ts
executionMode: 'simulation-only'

isolation: {
  mutatesCatalogPrice: false,
  createsProductsOrBrands: false,
  persistsBatch: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

PL-009 no:

- crea productos, marcas o SKU;
- registra costos o precios;
- actualiza Product Master;
- escribe en Data Center, IndexedDB o Business Repository;
- afecta Sales, Inventory, Forecast u otros Workspaces;
- publica precios hacia ERP;
- recomienda, aprueba o aplica un factor.

## Cobertura

Las pruebas incorporadas validan:

- matriz producto por descuento;
- factor máximo para proteger todos;
- promedio y detección de incumplimientos;
- factor común explícito;
- agregados por descuento;
- costos y descuentos inválidos;
- aislamiento e inmutabilidad;
- construcción del borrador visual;
- pegado tabular desde Excel;
- libro Excel de cinco hojas;
- documento imprimible;
- renderizado de la interfaz por lote.

## Evolución PL-010

PL-010 consume el resultado temporal de esta matriz para evaluar varios factores
comunes contra todos los descuentos. Publica mínimos matemáticos, cobertura y
factibilidad sin modificar el lote de origen ni seleccionar un factor ganador.
