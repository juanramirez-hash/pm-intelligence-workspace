BEGIN;

ALTER TABLE data_imports
  DROP CONSTRAINT IF EXISTS data_imports_import_mode_check;

ALTER TABLE data_imports
  ADD CONSTRAINT data_imports_import_mode_check
  CHECK (
    import_mode IN (
      'append',
      'upsert',
      'replace-periods',
      'replace-snapshot',
      'replace-all',
      'replace-orders'
    )
  );

COMMIT;