CREATE TABLE IF NOT EXISTS app_roles (
  role_key TEXT PRIMARY KEY,
  role_name TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL,
  write_access BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_roles (
  role_key,
  role_name,
  description,
  scope,
  write_access,
  active,
  system_role
)
VALUES
  (
    'admin',
    'Administrador',
    'Administración técnica y acceso total a la plataforma.',
    'all',
    TRUE,
    TRUE,
    TRUE
  ),
  (
    'manager',
    'Gerente de Marcas',
    'Acceso total a PM Intelligence Workspace.',
    'all',
    TRUE,
    TRUE,
    FALSE
  ),
  (
    'pm',
    'Product Manager',
    'Acceso a marcas y productos asignados.',
    'assigned',
    TRUE,
    TRUE,
    FALSE
  ),
  (
    'engineering',
    'Ingeniero de Marca',
    'Consulta de ventas, clientes, productos e inventario asignados.',
    'assigned',
    FALSE,
    TRUE,
    FALSE
  ),
  (
    'pricing',
    'Pricing',
    'Acceso a Pricing Laboratory y consultas autorizadas.',
    'pricing',
    TRUE,
    TRUE,
    FALSE
  ),
  (
    'analyst',
    'Analyst · Legacy',
    'Rol heredado temporalmente compatible.',
    'legacy',
    FALSE,
    TRUE,
    TRUE
  ),
  (
    'viewer',
    'Viewer · Legacy',
    'Rol heredado temporalmente compatible.',
    'legacy',
    FALSE,
    TRUE,
    TRUE
  )
ON CONFLICT (role_key) DO NOTHING;