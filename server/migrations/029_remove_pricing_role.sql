UPDATE app_roles
SET role_name = 'Gerente de Ingeniería',
    updated_at = NOW()
WHERE role_key = 'manager';

UPDATE app_users
SET role = 'pm'
WHERE role = 'pricing';

DELETE FROM app_roles
WHERE role_key = 'pricing';

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
        'engineering'::text
      ]
    )
  );