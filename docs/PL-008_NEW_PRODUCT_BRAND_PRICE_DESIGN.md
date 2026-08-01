# PL-008 — New Product & Brand Price Design

## Motivo

Después del cierre de PL-007 se identificó una limitación funcional: el
laboratorio interactivo dependía de que existiera un `BusinessPrice` para un
producto de catálogo.

Ese flujo no cubre una actividad habitual de Price Engineering: recibir el
costo de una marca o producto nuevo y calcular qué factor y precio de lista se
requieren para operar a un descuento determinado, por ejemplo 32%, 34% o
cualquier otro nivel explícito.

PL-008 corrige esa limitación sin convertir Pricing Laboratory en un módulo de
altas o administración de precios.

## Dos modos de fuente

La ruta `/pricing` publica ahora dos opciones:

```text
Producto existente
  → Business Repository en modo lectura

Nuevo producto / marca
  → costo y supuestos capturados en memoria
```

El modo nuevo no requiere Product Master, Data Center, Business Repository ni
un modelo previamente importado.

## Metodología

```text
price-design-v1
```

Entradas obligatorias:

- costo unitario;
- moneda;
- descuento a evaluar;
- tipo de objetivo;
- valor explícito del objetivo.

Identidad opcional:

- marca provisional;
- modelo o referencia;
- SKU provisional;
- notas de análisis.

No existe un descuento, margen, GP, factor o precio predeterminado.

## Objetivos de cálculo

### Margen objetivo al descuento

El usuario captura costo, descuento y margen objetivo.

```text
Precio neto = Costo / (1 - Margen objetivo)
Precio de lista = Precio neto / (1 - Descuento)
```

### GP unitario objetivo al descuento

```text
Precio neto = Costo + GP objetivo
Precio de lista = Precio neto / (1 - Descuento)
```

### Precio neto objetivo

```text
Precio de lista = Precio neto objetivo / (1 - Descuento)
```

### Factor de lista conocido

```text
Precio de lista = Costo × Factor de lista
Precio neto = Precio de lista × (1 - Descuento)
```

### Factor neto conocido

```text
Precio neto = Costo × Factor neto
Precio de lista = Precio neto / (1 - Descuento)
```

### Precio de lista conocido

```text
Precio neto = Precio de lista × (1 - Descuento)
```

## Diferencia obligatoria entre factores

PL-008 separa dos conceptos que no deben presentarse como equivalentes:

```text
Factor de lista = Precio de lista / Costo
Factor neto = Precio de venta después del descuento / Costo
```

La matriz siempre muestra ambos.

## Matriz temporal

Cada cálculo se agrega como una fila independiente. Esto permite conservar el
mismo costo y comparar, por ejemplo:

- descuento 32%;
- descuento 34%;
- descuento 37%;
- cualquier otro nivel capturado por el usuario.

Cada fila presenta:

- costo;
- descuento;
- precio de lista;
- factor de lista;
- precio neto;
- factor neto;
- GP unitario;
- Gross Margin;
- objetivo utilizado;
- estado y señales.

La matriz no clasifica un resultado como ganador ni aplica políticas ocultas.

## Artefacto transitorio

Un resultado válido puede materializar internamente un `BusinessPrice` con:

```text
source = manual
effectiveDate = null
sourceReference = Pricing Laboratory / new product design / in-memory
```

Ese objeto solo facilita interoperabilidad futura con Price Engineering. No se
inserta en ningún mapa, repositorio, almacenamiento o dataset.

## Aislamiento

```ts
executionMode: 'simulation-only'

isolation: {
  mutatesCatalogPrice: false,
  persistsDesign: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

PL-008 no:

- crea productos o marcas;
- registra costos, listas o precios;
- actualiza Product Master;
- escribe en Data Center, IndexedDB o Business Repository;
- afecta Sales, Inventory, Forecast u otros Workspaces;
- asigna automáticamente parámetros comerciales;
- recomienda, aprueba o publica un precio.

## Cobertura

Se agregan pruebas para:

- cálculo por margen objetivo;
- cálculo por GP objetivo;
- reconstrucción desde precio neto;
- cálculo desde factor de lista;
- cálculo desde factor neto;
- evaluación de precio de lista conocido;
- advertencia por GP negativo;
- validación de costo, moneda y descuento;
- conversión del borrador visual;
- aislamiento del artefacto transitorio;
- renderizado del modo independiente de catálogo.
