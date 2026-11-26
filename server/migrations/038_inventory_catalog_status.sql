BEGIN;

-- 038_inventory_catalog_status.sql
-- Estatus de catálogo y fecha de última venta por artículo desde el
-- inventario (MD-002, disponibilidad de "Mi día").
--
-- El export crudo de NetSuite "TS - Reporte de inventario por sucursal"
-- trae por artículo las columnas "Estatus" (DE LINEA, ULTIMAS PIEZAS, ...) y
-- "Fecha de ultima venta". El Product Master se carga con menos frecuencia,
-- así que el estatus y la marca de "Mi día" salen del último inventario.
--
-- Columnas nuevas que aceptan NULL y no tienen valor por defecto: el ALTER
-- es instantáneo y no reescribe las tablas. Las filas existentes quedan en
-- NULL hasta la siguiente carga de inventario; "Mi día" reporta el estatus
-- como faltante, nunca lo infiere.
--
-- No modifica datos: no sube data_cache_version.
--
-- ORDEN DE DESPLIEGUE OBLIGATORIO
-- Aplicar esta migración ANTES de reiniciar el backend con MD-002: el
-- importador de inventario escribe estas columnas y la verificación de
-- esquema al arrancar (server/db/schemaCheck.js) no deja iniciar sin ellas.

SET LOCAL lock_timeout = '10s';

ALTER TABLE inventory_snapshots
  ADD COLUMN IF NOT EXISTS catalog_status TEXT,
  ADD COLUMN IF NOT EXISTS last_sale_date DATE;

ALTER TABLE inventory_import_staging
  ADD COLUMN IF NOT EXISTS catalog_status TEXT,
  ADD COLUMN IF NOT EXISTS last_sale_date DATE;

COMMIT;
