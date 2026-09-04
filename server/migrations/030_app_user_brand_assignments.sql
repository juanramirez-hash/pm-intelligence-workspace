CREATE TABLE IF NOT EXISTS app_user_brand_assignments (
  user_id BIGINT NOT NULL,
  brand_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT NULL,

  CONSTRAINT pk_app_user_brand_assignments
    PRIMARY KEY (user_id, brand_id),

  CONSTRAINT fk_app_user_brand_assignments_user
    FOREIGN KEY (user_id)
    REFERENCES app_users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_app_user_brand_assignments_created_by
    FOREIGN KEY (created_by)
    REFERENCES app_users(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_app_user_brand_assignments_brand_id
    CHECK (LENGTH(TRIM(brand_id)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_app_user_brand_assignments_brand_id
  ON app_user_brand_assignments(brand_id);

CREATE INDEX IF NOT EXISTS idx_app_user_brand_assignments_created_by
  ON app_user_brand_assignments(created_by);

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE app_user_brand_assignments
TO pm_intelligence;