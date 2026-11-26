BEGIN;

-- 039_inventory_items.sql
-- Un registro por artículo de la última carga de inventario
-- (MD-002-HOTFIX1).
--
-- El export crudo de NetSuite "TS - Reporte de inventario por sucursal"
-- deja vacías las celdas en cero aunque traiga "Show Zeros". El importador
-- solo genera posiciones (artículo × sucursal) con alguna cantidad, así que
-- los artículos sin ninguna cantidad no llegan a inventory_snapshots: con el
-- export del 26 nov 2026 eran 2,584 de 4,682 artículos, entre ellos 321
-- DE LINEA agotados. Esta tabla guarda todos los artículos del archivo con
-- sus totales de todas las sucursales; inventory_snapshots no cambia, así
-- que el Inventory Workspace y /api/data/inventory no cambian.
--
-- Sin costos: no guarda costo unitario ni valor de inventario. Si algún día
-- se necesitan, se agregan pasando por cost_access (SEC-003A).
--
-- Al cerrar una carga de inventario, el servidor compara los totales de esta
-- tabla contra las posiciones de la misma carga y borra los registros de las
-- cargas anteriores: solo queda la última carga.
--
-- La tabla nace vacía: no modifica datos y no sube data_cache_version.
--
-- Se aplica como postgres (apply-migration.sh), así que la tabla es de
-- postgres: la aplicación (pm_intelligence) recibe SELECT, INSERT y DELETE.
-- La inserción por lote usa ON CONFLICT DO NOTHING, que no requiere UPDATE.
--
-- ORDEN DE DESPLIEGUE OBLIGATORIO
-- Aplicar esta migración ANTES de reiniciar el backend con
-- MD-002-HOTFIX1: la verificación de esquema al arrancar
-- (server/db/schemaCheck.js) no deja iniciar sin esta tabla.

SET LOCAL lock_timeout = '10s';

CREATE TABLE IF NOT EXISTS public.inventory_items (
  import_id BIGINT NOT NULL
    REFERENCES public.data_imports(id)
    ON DELETE CASCADE,

  item_code TEXT NOT NULL,
  brand TEXT,
  catalog_status TEXT,
  last_sale_date DATE,

  -- Totales de todas las sucursales; una celda vacía cuenta como 0.
  on_hand NUMERIC(18, 4) NOT NULL DEFAULT 0,
  committed NUMERIC(18, 4) NOT NULL DEFAULT 0,
  available NUMERIC(18, 4) NOT NULL DEFAULT 0,
  in_transit NUMERIC(18, 4) NOT NULL DEFAULT 0,
  on_order NUMERIC(18, 4) NOT NULL DEFAULT 0,

  -- Posiciones (sucursales) importadas a inventory_snapshots; 0 = artículo
  -- sin ninguna cantidad.
  positions INTEGER NOT NULL DEFAULT 0
    CHECK (positions >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (import_id, item_code)
);

GRANT SELECT, INSERT, DELETE
  ON TABLE public.inventory_items
  TO pm_intelligence;

COMMIT;
