ADR-007: Business Cube 1.0

Estado: Proposed

Versión: 1.0

Fecha: 2026-07-23

Proyecto: PM Intelligence Workspace

1. Contexto

PM Intelligence Workspace ha evolucionado desde una aplicación de análisis de ventas hacia una plataforma analítica con un Business Core centralizado.

Actualmente, BusinessDataModel contiene entidades e índices como:

customers

customerPeriods

brands

brandPeriods

products

periods

totals

Durante la migración de Customer Intelligence al Business Repository se comprobó que las consultas repetitivas sobre colecciones completas pueden producir problemas graves de rendimiento. El caso de customerPeriods mostró que recorrer todos los periodos por cada cliente genera una complejidad cercana a O(n²).

La solución aplicada fue construir un índice precomputado:

customerId -> BusinessCustomerPeriod[]

Este patrón debe generalizarse antes de incorporar Product Intelligence, Forecast Intelligence, Pricing Intelligence e Inventory Intelligence.

2. Decisión

Se adopta Business Cube 1.0 como la capa analítica multidimensional oficial de PM Intelligence Workspace.

El Business Cube se ubicará entre el Business Repository y los módulos de inteligencia.

Excel / CSV / ERP / APIs
          |
          v
Importación y normalización
          |
          v
BusinessDataModel
          |
          v
BusinessRepository
          |
          v
Business Cube
          |
          +--> Customer Intelligence
          +--> Brand Intelligence
          +--> Product Intelligence
          +--> Pricing Intelligence
          +--> Forecast Intelligence
          +--> Inventory Intelligence
          +--> Executive Workspace

El Cube no sustituye al Business Core. Lo complementa como capa de consulta y agregación multidimensional.

3. Propósito

El Business Cube deberá:

Proporcionar una estructura analítica compartida.

Evitar recorridos repetitivos del modelo completo.

Centralizar relaciones entre dimensiones.

Reutilizar métricas oficiales.

Mantener consistencia entre módulos.

Permitir filtros y agregaciones multidimensionales.

Escalar a grandes volúmenes de datos sin degradación cuadrática.

4. Alcance

Incluido

Dimensiones analíticas.

Índices precomputados.

Consultas multidimensionales.

Agregaciones por periodo y entidad.

Métricas compartidas.

Filtros combinables.

Ordenamiento y ranking.

Compatibilidad con Business Repository.

Pruebas unitarias y de rendimiento.

Excluido

El Business Cube no será responsable de:

Importar Excel o CSV.

Validar encabezados.

Normalizar datos transaccionales.

Gestionar estado de React.

Renderizar componentes.

Ejecutar reglas de presentación.

Persistir datos en navegador o servidor.

Generar pronósticos por sí mismo.

Aplicar reglas comerciales específicas de un módulo.

5. Principios arquitectónicos

5.1 Una sola fuente de verdad

Toda la información del Cube debe provenir del BusinessDataModel y del BusinessRepository.

El Cube nunca deberá leer directamente:

NormalizedSalesRow[]

archivos Excel;

archivos CSV;

estructuras del Data Center;

estado de Zustand.

5.2 Índices construidos una sola vez

Toda consulta que pueda ejecutarse repetidamente deberá usar índices preconstruidos.

Queda prohibido recorrer una colección completa por cada entidad consultada.

Ejemplo prohibido:

for (const customer of customers) {
  const periods = allCustomerPeriods.filter(
    period => period.customerId === customer.id,
  )
}

Patrón aprobado:

Map<string, BusinessCustomerPeriod[]>

5.3 Complejidad controlada

Las consultas repetitivas deberán aspirar a:

O(1) para búsqueda exacta;

O(log n) para estructuras ordenadas;

O(k) para recorrer únicamente los elementos relacionados;

O(n) para construir índices una sola vez.

No se aceptará O(n²) en rutas de procesamiento ordinario.

5.4 Separación de responsabilidades

BusinessDataModel: almacena la verdad empresarial consolidada.

BusinessRepository: expone consultas de entidades.

Business Cube: resuelve consultas multidimensionales y agregaciones.

Business Metrics: calcula métricas oficiales.

Intelligence: interpreta métricas y aplica reglas analíticas.

Workspace/UI: presenta resultados.

5.5 Contratos estables

Las capas superiores no deberán depender de estructuras internas del Cube.

El Cube expondrá interfaces y resultados tipados, evitando filtrar sus mapas internos.

5.6 Inmutabilidad de resultados

Las consultas deberán devolver copias o estructuras de solo lectura cuando exista riesgo de modificar accidentalmente los índices internos.

6. Dimensiones oficiales

Business Cube 1.0 contemplará las siguientes dimensiones.

6.1 Time

Jerarquía prevista:

Year
  -> Quarter
    -> Month
      -> Day

Identificadores mínimos:

YYYY
YYYY-QN
YYYY-MM
YYYY-MM-DD

La primera versión operará principalmente a nivel mensual.

6.2 Customer

Atributos base:

customerId

customerName

firstPurchase

lastPurchase

Extensiones futuras:

segment

lifecycle

account tier

sales representative

territory

6.3 Brand

Atributos base:

brandId

brandName

Extensiones futuras:

category

subcategory

business unit

supplier

6.4 Product

Atributos base:

productId

model

brand

Extensiones futuras:

SKU

family

category

lifecycle

inventory class

6.5 Sales Representative

Atributos base:

salesRepresentativeId

salesRepresentativeName

6.6 Location

Atributos base:

locationId

locationName

Extensiones futuras:

city

state

region

warehouse

6.7 Currency

Atributos base:

currencyCode

La versión inicial no realizará conversión cambiaria. Las métricas deberán conservar trazabilidad de moneda cuando el dataset contenga más de una.

7. Métricas oficiales

7.1 Métricas aditivas

revenue

grossProfit

quantity

Estas métricas pueden sumarse entre dimensiones y periodos compatibles.

7.2 Métricas semiaditivas

documents

customers

products

brands

Estas métricas requieren deduplicación según el contexto de consulta.

7.3 Métricas derivadas

grossMargin

averageTicket

revenueVariation

revenueVariationPercentage

growthRate

averageRevenuePerCustomer

averageGrossProfitPerDocument

Ejemplo:

grossMargin =
grossProfit / revenue

Las divisiones entre cero deberán devolver un valor explícitamente definido por contrato: 0, null o una condición without_comparison.

7.4 Métricas futuras

forecast

targetAttainment

inventoryTurnover

daysOfInventory

priceVariance

discountImpact

customerHealthScore

businessHealthScore

Estas métricas no formarán parte del núcleo inicial hasta contar con su ADR o contrato específico.

8. Estructura conceptual

El Cube deberá permitir consultas equivalentes a:

Metric
  filtered by Time
  grouped by Dimension
  filtered by one or more Dimensions

Ejemplos:

Revenue by Brand by Month
Gross Profit by Customer for Brand UNV
Quantity by Product in CDMX
Documents by Sales Representative in 2026-Q2
Revenue by Customer and Product during the last 12 months

9. Modelo de consulta

La API final podrá evolucionar, pero deberá conservar un contrato declarativo.

Ejemplo conceptual:

cube.query({
  metrics: ['revenue', 'grossProfit'],
  groupBy: ['period', 'brand'],
  filters: {
    customerIds: ['100001'],
    periodFrom: '2026-01',
    periodTo: '2026-07',
  },
})

Resultado conceptual:

interface CubeQueryResult {
  dimensions: Record<string, string>
  revenue: number
  grossProfit: number
  grossMargin: number | null
  quantity: number
  documents: number
}

La primera implementación no necesita soportar un lenguaje genérico completo. Puede comenzar con consultas tipadas y específicas.

10. Índices internos

Business Cube 1.0 deberá evaluar y construir únicamente los índices realmente necesarios.

Índices candidatos:

customerPeriodsByCustomerId
brandPeriodsByBrandId
productPeriodsByProductId
periodsByPeriodId
customersByBrandId
productsByBrandId
salesByLocation
salesBySalesRepresentative
salesByCurrency

Reglas:

Cada índice se construye una sola vez por instancia del Cube.

No debe duplicarse información sin justificación.

Debe medirse el costo de memoria.

Las colecciones temporales deberán ordenarse durante construcción, no en cada consulta.

La creación de un índice debe estar respaldada por una consulta real.

11. Estrategia de implementación

11.1 Implementación incremental

No se construirá un motor OLAP genérico completo desde el inicio.

La evolución será:

Fase 1 — Cube Foundation

Interfaces base.

Índices existentes de Customer y Brand.

Métricas comunes.

Consulta por periodo.

Pruebas.

Fase 2 — Product Dimension

productPeriods.

Índice por producto.

Product Intelligence.

Fase 3 — Cross-Dimension Queries

Brand + Customer.

Brand + Product.

Customer + Product.

Period + Location.

Fase 4 — Inventory, Pricing y Forecast

Cada módulo reutilizará el Cube, pero mantendrá sus reglas de inteligencia fuera de él.

11.2 Compatibilidad

Los contratos actuales de:

Customer Intelligence;

Brand Intelligence;

Business Metrics;

Business Intelligence Model;

deberán conservarse durante la introducción del Cube.

Las migraciones serán por sustitución controlada, con pruebas antes y después.

12. Dependencias permitidas

Business Cube
  -> BusinessRepository
  -> BusinessDataModel
  -> Business entities and metric contracts

13. Dependencias prohibidas

Business Cube no podrá depender de:

React;

React Router;

HeroUI;

Zustand;

TanStack Query;

Axios;

componentes;

páginas;

archivos importados;

NormalizedSalesRow;

servicios externos;

localStorage.

14. Rendimiento

14.1 Objetivos

Con un dataset típico de Tecnosinergia:

miles de clientes;

decenas de marcas;

miles de productos;

múltiples años de ventas;

la construcción del Business Core y Cube deberá completarse en segundos razonables dentro del navegador.

Las consultas interactivas deberán sentirse inmediatas.

14.2 Presupuesto inicial

Objetivos de referencia, sujetos a medición:

Construcción de índices: O(n).

Búsqueda exacta: O(1).

Timeline de una entidad: O(k).

Ranking: O(n log n) o mejor.

Filtros combinados: proporcional a la colección más pequeña disponible.

14.3 Pruebas de rendimiento

Se deberán agregar datasets sintéticos para detectar regresiones.

Casos mínimos:

10,000 clientes.

100,000 customerPeriods.

100,000 productPeriods.

consultas repetidas de timelines.

rankings sobre colecciones grandes.

Las pruebas no deberán depender únicamente de tiempos absolutos inestables. También deberán validar que una consulta no recorra colecciones completas repetidamente.

15. Manejo de documentos únicos

documents es una métrica semiaditiva.

Un mismo documento puede aparecer en varias filas por contener varios productos.

Por tanto:

se deduplica por entidad y contexto;

un documento puede contar una vez en cada periodo distinto;

un documento histórico de cliente se cuenta una sola vez;

la combinación de dimensiones puede requerir una clave compuesta.

Ejemplo conceptual:

periodId::customerId::documentNumber

No se sumarán contadores de documentos de agregados incompatibles sin verificar duplicidad.

16. Fechas y periodos

La fecha de análisis deberá derivarse del rango válido del BusinessDataModel.

El Cube deberá usar formatos ISO estables:

YYYY-MM-DD
YYYY-MM

Las comparaciones mensuales podrán realizarse lexicográficamente siempre que se mantenga ese formato.

Todas las funciones de fecha deberán reutilizar utilidades compartidas.

17. Monedas

Business Cube 1.0 no mezclará silenciosamente monedas.

Cuando existan varias monedas:

la consulta deberá filtrar por moneda; o

devolver resultados separados por moneda; o

utilizar una capa explícita de conversión futura.

No se permitirá sumar MXN y USD y presentar el resultado como una sola cifra sin una política de conversión documentada.

18. Testing

Toda dimensión o índice nuevo deberá incluir:

Prueba de construcción.

Prueba de consulta exacta.

Prueba de timeline.

Prueba de ordenamiento.

Prueba de deduplicación.

Prueba de filtros vacíos.

Prueba de identificadores normalizados.

Prueba de compatibilidad con módulos existentes.

Prueba de rendimiento o complejidad cuando aplique.

19. Observabilidad

La construcción del Cube deberá poder medirse.

En desarrollo podrán registrarse:

businessDataModelBuildMs
businessCubeBuildMs
customerIntelligenceBuildMs
brandIntelligenceBuildMs
productIntelligenceBuildMs
rowCount
customerCount
periodCount
cubeIndexCount

La instrumentación no debe quedar acoplada a console.log permanente. Se definirá una interfaz de telemetría o logger cuando sea necesario.

20. Gestión de memoria

Los índices pueden acelerar consultas, pero también duplicar referencias.

Reglas:

Preferir referencias a entidades existentes.

No copiar objetos completos sin necesidad.

No crear todos los cruces posibles de dimensiones.

Crear índices bajo demanda solo si el costo de consulta lo justifica.

Medir memoria con datasets reales.

Liberar instancias anteriores al importar un nuevo dataset.

21. Persistencia

Business Cube 1.0 será inicialmente una estructura en memoria.

La persistencia futura podrá considerar:

IndexedDB;

archivos preprocesados;

backend SQL;

DuckDB;

almacenamiento columnar;

API analítica.

Cualquier mecanismo de persistencia deberá conservar los contratos del Cube y tendrá su propio ADR.

22. Seguridad

El Cube no define autorización ni control de acceso.

Sin embargo, futuras consultas por usuario deberán aplicarse antes de exponer resultados sensibles.

No se asumirán permisos implícitos por estar ejecutándose en el navegador.

23. North Star Architecture

                         PM Intelligence Workspace
+-------------------------------------------------------------------+
|                        Executive Workspace                         |
+-------------------------------------------------------------------+
| Customer | Brand | Product | Pricing | Forecast | Inventory | AI  |
+-------------------------------------------------------------------+
|                  Business Cube - Multidimensional                  |
+-------------------------------------------------------------------+
| Repository | Metrics | Insights | KPI Engine | Rules Engine       |
+-------------------------------------------------------------------+
|                  Business Core - Source of Truth                   |
+-------------------------------------------------------------------+
| Import Engine | Normalization | Validation | Data Center          |
+-------------------------------------------------------------------+
| Excel | CSV | ERP | APIs | Google Sheets | SQL | Web Services     |
+-------------------------------------------------------------------+

El Cube es una capa intermedia. No deberá absorber responsabilidades de Repository, Metrics, Intelligence o UI.

24. Consecuencias positivas

Menor duplicación de lógica.

Consultas más rápidas.

Métricas consistentes.

Escalabilidad para nuevos módulos.

Arquitectura más mantenible.

Menor riesgo de algoritmos cuadráticos.

Base sólida para análisis cruzados.

Facilita Forecast, Pricing e Inventory.

25. Consecuencias y riesgos

25.1 Mayor complejidad arquitectónica

Se introduce una nueva capa que debe justificarse mediante consultas reales.

25.2 Consumo de memoria

Demasiados índices pueden aumentar el uso de memoria del navegador.

25.3 Sobregeneralización

Existe riesgo de intentar construir un motor OLAP completo antes de necesitarlo.

Mitigación: implementación incremental y tipada.

25.4 Duplicación con Repository

Cube y Repository pueden solaparse.

Mitigación:

Repository consulta entidades y relaciones directas.

Cube realiza agregaciones y filtros multidimensionales.

25.5 Métricas semiaditivas

Documentos, clientes y productos pueden duplicarse si se suman agregados incorrectamente.

Mitigación: contratos explícitos y pruebas de deduplicación.

26. Alternativas consideradas

A. Crear índices independientes por módulo

Ejemplos:

customerPeriods;

brandPeriods;

productPeriods;

inventoryPeriods.

Rechazada como estrategia general, porque puede duplicar infraestructura y producir implementaciones inconsistentes.

Algunos índices específicos seguirán existiendo, pero deberán integrarse al diseño del Cube.

B. Consultar siempre BusinessDataModel

Rechazada para consultas repetitivas, debido al riesgo de recorridos completos y complejidad cuadrática.

C. Usar una biblioteca OLAP externa

Pospuesta. La plataforma todavía requiere contratos específicos del negocio y una implementación incremental.

D. Mover todo a backend desde ahora

Pospuesta. La arquitectura actual funciona en navegador y primero debe estabilizarse el modelo analítico.

27. Reglas de evolución

Toda nueva dimensión o capacidad deberá:

Justificar su caso de uso.

Definir contrato de datos.

Identificar métricas aditivas y semiaditivas.

Evitar dependencia de filas normalizadas.

Construir índices una sola vez.

Incluir pruebas.

Medir impacto de memoria y tiempo.

Preservar compatibilidad.

Documentar decisiones significativas mediante ADR.

Compilar y ejecutar pruebas antes de commit.

28. Roadmap

Business Cube 1.0

Fundamentos.

Time.

Customer.

Brand.

Métricas base.

Índices precomputados.

Contratos de consulta.

Business Cube 1.1

Product.

productPeriods.

Product Intelligence.

Business Cube 1.2

Location.

Sales Representative.

Consultas cruzadas.

Business Cube 1.3

Inventory.

Inventory periods.

Rotación y cobertura.

Business Cube 1.4

Pricing.

Descuentos.

GP y variaciones de precio.

Business Cube 1.5

Forecast.

Ventanas móviles.

Tendencias.

Proyecciones.

Business Cube 2.0

KPI Engine.

Executive Analytics.

Business Health Score.

Persistencia o backend analítico.

29. Criterios de aceptación

Business Cube 1.0 se considerará implementado cuando:

exista una interfaz oficial del Cube;

se construya desde Business Core;

Customer y Brand puedan consultarse sin recorrer colecciones completas;

las métricas base sean reutilizables;

las pruebas de regresión estén en verde;

el build sea exitoso;

el rendimiento con el dataset real sea aceptable;

no exista dependencia de NormalizedSalesRow[];

se conserve compatibilidad con los módulos actuales.

30. Resultado

A partir de esta decisión, PM Intelligence Workspace adoptará un modelo analítico multidimensional compartido.

Los nuevos módulos no deberán construir motores paralelos ni recorrer repetidamente el dataset transaccional.

El Business Cube será la capa oficial para consultas analíticas cruzadas, mientras que el Business Core seguirá siendo la fuente de verdad y los módulos de Intelligence conservarán las reglas específicas de negocio.