# 0.24.4 — Product Classification Import Fix

- Fortalece la normalización de encabezados del importador de ventas.
- Reconoce saltos de línea, espacios no separables y signos invisibles en `CLASIFICACION VALOR`.
- Añade lectura de respaldo directamente desde la fila cuando el mapa de columnas no contiene `productStatus`.
- Mantiene la clasificación A/B/C/D/E en `NormalizedSalesRow` y `BusinessProduct.commercialStatus`.
