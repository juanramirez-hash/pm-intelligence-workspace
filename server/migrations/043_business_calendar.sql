BEGIN;

-- 043_business_calendar.sql
-- Calendario de dias no laborables (CAL-001).
--
-- Dias habiles = lunes a viernes MENOS los dias de esta tabla: feriados
-- oficiales ('official') y dias de la empresa ('company'). Cambian cada anio;
-- el administrador los carga desde Configuracion > Calendario.
--
-- Mi dia, la ficha de marca (incluido el comparativo anio contra anio y sus
-- ventanas equivalentes) y la cartera cuentan los dias con esta tabla
-- (server/services/businessCalendar.js). Las ventas de un dia no laborable se
-- siguen sumando: solo cambia el conteo de dias.
--
-- Un anio sin ningun renglon NO se supone sin feriados: las pantallas avisan
-- (calendarMissingYears) y cuentan lunes a viernes.
--
-- Carga inicial: 2024, 2025 y 2026 (35 fechas). INSERT ... ON CONFLICT DO
-- NOTHING: volver a aplicar la migracion no pisa lo que el administrador haya
-- cargado o corregido desde la pantalla.
--
-- No modifica datos de negocio: no sube data_cache_version (el calendario no
-- pasa por /api/data/*).
--
-- Se aplica como postgres (apply-migration.sh): la tabla queda a nombre de
-- postgres y se otorgan permisos a pm_intelligence (leccion de la 037).
--
-- ROLLBACK: rollback/043_business_calendar.rollback.sql BORRA la tabla y con
-- ella los dias cargados desde la pantalla (por ejemplo 2027). Respaldar antes.

CREATE TABLE IF NOT EXISTS public.business_calendar (
  calendar_date DATE PRIMARY KEY,
  day_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by BIGINT NULL,
  CONSTRAINT chk_business_calendar_day_type
    CHECK (day_type IN ('official', 'company')),
  CONSTRAINT chk_business_calendar_description
    CHECK (BTRIM(description) <> ''),
  CONSTRAINT fk_business_calendar_created_by
    FOREIGN KEY (created_by)
    REFERENCES app_users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_business_calendar_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES app_users(id)
    ON DELETE SET NULL
);

INSERT INTO public.business_calendar (calendar_date, day_type, description)
VALUES
  ('2024-01-01', 'official', 'Año Nuevo'),
  ('2024-02-05', 'official', 'Día de la Constitución'),
  ('2024-03-18', 'official', 'Natalicio de Benito Juárez'),
  ('2024-03-28', 'company', 'Semana Santa'),
  ('2024-03-29', 'company', 'Semana Santa'),
  ('2024-05-01', 'official', 'Día del Trabajo'),
  ('2024-09-16', 'official', 'Día de la Independencia'),
  ('2024-10-01', 'official', 'Transmisión del Poder Ejecutivo'),
  ('2024-10-03', 'company', 'Rosh Hashaná'),
  ('2024-10-04', 'company', 'Rosh Hashaná'),
  ('2024-11-18', 'official', 'Día de la Revolución'),
  ('2024-12-25', 'official', 'Navidad'),
  ('2025-01-01', 'official', 'Año Nuevo'),
  ('2025-02-03', 'official', 'Día de la Constitución'),
  ('2025-03-17', 'official', 'Natalicio de Benito Juárez'),
  ('2025-04-17', 'company', 'Semana Santa'),
  ('2025-04-18', 'company', 'Semana Santa'),
  ('2025-05-01', 'official', 'Día del Trabajo'),
  ('2025-09-16', 'official', 'Día de la Independencia'),
  ('2025-09-23', 'company', 'Rosh Hashaná'),
  ('2025-09-24', 'company', 'Rosh Hashaná'),
  ('2025-10-02', 'company', 'Yom Kipur'),
  ('2025-11-17', 'official', 'Día de la Revolución'),
  ('2025-12-25', 'official', 'Navidad'),
  ('2026-01-01', 'official', 'Año Nuevo'),
  ('2026-02-02', 'official', 'Día de la Constitución'),
  ('2026-03-16', 'official', 'Natalicio de Benito Juárez'),
  ('2026-04-02', 'company', 'Semana Santa'),
  ('2026-04-03', 'company', 'Semana Santa'),
  ('2026-05-01', 'official', 'Día del Trabajo'),
  ('2026-09-16', 'official', 'Día de la Independencia'),
  ('2026-09-21', 'company', 'Yom Kipur'),
  ('2026-11-16', 'official', 'Día de la Revolución'),
  ('2026-12-25', 'official', 'Navidad'),
  ('2026-12-31', 'company', 'Fin de año')
ON CONFLICT (calendar_date) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.business_calendar
  TO pm_intelligence;

COMMIT;
