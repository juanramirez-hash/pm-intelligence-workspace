BEGIN;

ALTER TABLE purchase_requests
  ALTER COLUMN source_elapsed_days
  TYPE NUMERIC(18, 4)
  USING source_elapsed_days::NUMERIC(18, 4);

ALTER TABLE purchase_request_import_staging
  ALTER COLUMN source_elapsed_days
  TYPE NUMERIC(18, 4)
  USING source_elapsed_days::NUMERIC(18, 4);

COMMIT;