DROP INDEX IF EXISTS uq_inventory_snapshot_position_null_date;

CREATE UNIQUE INDEX
  uq_inventory_snapshot_position_null_date
ON inventory_snapshots (
  product_name,
  location
)
WHERE snapshot_date IS NULL;