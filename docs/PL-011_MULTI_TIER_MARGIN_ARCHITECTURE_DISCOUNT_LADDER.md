# PL-011 — Multi-Tier Margin Architecture & Discount Ladder

## Motivo

PL-010 analiza varios factores comunes contra un conjunto de descuentos, pero
conserva un solo objetivo para toda la matriz. En la operación comercial real,
cada nivel puede requerir un objetivo distinto: algunos niveles se controlan por
margen mínimo y otros por GP unitario mínimo.

PL-011 incorpora una escalera comercial explícita y editable. Los nombres de los
niveles son etiquetas de simulación; no contienen descuentos, márgenes, GP,
factores ni reglas ocultas.

## Metodología

```text
price-tier-ladder-v1
```

La arquitectura evalúa:

```text
Factor común × Nivel comercial × Producto
```

Cada nivel declara:

- etiqueta comercial;
- descuento;
- tipo de objetivo;
- valor mínimo del objetivo;
- notas opcionales.

Los objetivos disponibles son:

- Gross Margin mínimo;
- GP unitario mínimo.

## Factor mínimo por nivel

Para cada producto del nivel se calcula el factor de lista necesario para
alcanzar el objetivo explícito después de aplicar el descuento del nivel.

```text
Factor mínimo del nivel = mayor factor requerido entre sus productos
```

El resultado identifica el producto que determina ese mínimo.

## Factor mínimo global

```text
Factor mínimo global = mayor factor mínimo entre todos los niveles
```

El nivel que aporta ese valor se publica como nivel limitante. El factor mínimo
global es un umbral matemático; no constituye recomendación, aprobación ni
instrucción para publicar precios.

## Factores candidatos

El usuario puede capturar cero o más factores candidatos. Cuando no captura
factores, el motor calcula únicamente los mínimos matemáticos por nivel.

Cuando existen candidatos, cada celda `Factor × Nivel` publica:

- factor evaluado;
- descuento y objetivo del nivel;
- mínimo requerido y diferencia contra el candidato;
- productos que cumplen o incumplen;
- cobertura;
- costo, lista, venta y GP agregados;
- Gross Margin agregado;
- margen mínimo y máximo entre productos;
- factibilidad total, parcial, nula o inválida.

El orden de captura se conserva. El laboratorio no ordena candidatos por
conveniencia ni selecciona un ganador.

## Interfaz

La escalera se integra dentro de la matriz por lote de PL-009. Permite:

- agregar o eliminar niveles;
- capturar etiquetas como Comercial, Silver, Gold o Platinum;
- capturar descuentos y objetivos diferentes;
- agregar explícitamente el factor actual de PL-009;
- agregar explícitamente el mínimo global calculado;
- revisar mínimos, nivel limitante, producto limitante y cobertura;
- exportar o imprimir el análisis.

No se precargan niveles ni valores numéricos.

## Exportación

PL-011 genera un libro Excel de seis hojas:

1. `Resumen Ejecutivo`;
2. `Escalera Comercial`;
3. `Matriz Factor Nivel`;
4. `Detalle por Producto`;
5. `Resumen por Factor`;
6. `Metadatos`.

También genera una vista independiente para impresión o PDF. Ambas salidas
incluyen:

```text
SIMULACIÓN SIN EFECTO COMERCIAL
```

Los agregados consideran una unidad de cada producto. No representan mezcla,
volumen, presupuesto o Forecast.

## Aislamiento

```ts
executionMode: 'simulation-only'

isolation: {
  mutatesCatalogPrice: false,
  createsProductsOrBrands: false,
  persistsLadder: false,
  writesBusinessRepository: false,
  writesOtherWorkspaces: false,
}
```

PL-011 no:

- crea productos, marcas o niveles comerciales persistentes;
- registra costos, factores o precios;
- modifica la matriz PL-009 o la sensibilidad PL-010;
- escribe en Product Master, Data Center, IndexedDB o Business Repository;
- afecta Sales, Inventory, Forecast u otros Workspaces;
- recomienda, aprueba o publica un factor;
- transmite información al ERP.

## Cobertura

Las pruebas incorporadas validan:

- niveles con objetivos distintos de margen y GP;
- mínimo matemático por nivel;
- nivel y producto limitantes;
- factibilidad de factores candidatos;
- escalera sin factores candidatos ocultos;
- descuentos duplicados e inputs inválidos;
- aislamiento e inmutabilidad;
- borrador visual y conversión de porcentajes;
- exportación Excel de seis hojas;
- renderizado del analizador interactivo.
