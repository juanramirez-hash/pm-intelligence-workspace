CREATE TABLE IF NOT EXISTS inventory_snapshots (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE RESTRICT,

  snapshot_date DATE,

  product_name TEXT NOT NULL,
  product_code TEXT,
  brand TEXT,
  model TEXT,
  location TEXT NOT NULL,

  on_hand NUMERIC(18, 4) NOT NULL DEFAULT 0,
  available NUMERIC(18, 4),
  committed NUMERIC(18, 4),
  in_transit NUMERIC(18, 4),
  on_order NUMERIC(18, 4),

  unit_cost NUMERIC(18, 4),
  inventory_value NUMERIC(18, 4),
  currency TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_inventory_snapshot_position
    UNIQUE (
      snapshot_date,
      product_name,
      location
    )
);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_date
  ON inventory_snapshots(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_product_name
  ON inventory_snapshots(product_name);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_product_code
  ON inventory_snapshots(product_code);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_brand
  ON inventory_snapshots(brand);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_location
  ON inventory_snapshots(location);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_import_id
  ON inventory_snapshots(import_id);