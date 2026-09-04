ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_check
  CHECK (
    role = ANY (
      ARRAY[
        'admin'::text,
        'analyst'::text,
        'viewer'::text,
        'manager'::text,
        'pm'::text,
        'engineering'::text,
        'pricing'::text
      ]
    )
  );