CREATE TABLE IF NOT EXISTS inventory_import_staging (
  id BIGSERIAL PRIMARY KEY,

  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  source_row_number INTEGER NOT NULL,

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

  CONSTRAINT uq_inventory_import_staging_row
    UNIQUE (
      import_id,
      source_row_number
    )
);

CREATE INDEX IF NOT EXISTS idx_inventory_import_staging_import
  ON inventory_import_staging(import_id);

CREATE INDEX IF NOT EXISTS idx_inventory_import_staging_snapshot
  ON inventory_import_staging(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_inventory_import_staging_import_snapshot
  ON inventory_import_staging(
    import_id,
    snapshot_date
  );


CREATE TABLE IF NOT EXISTS inventory_import_chunks (
  import_id BIGINT NOT NULL
    REFERENCES data_imports(id)
    ON DELETE CASCADE,

  chunk_index INTEGER NOT NULL,

  row_count INTEGER NOT NULL DEFAULT 0,

  checksum_sha256 TEXT,

  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (
    import_id,
    chunk_index
  )
);

CREATE INDEX IF NOT EXISTS idx_inventory_import_chunks_import
  ON inventory_import_chunks(import_id);