BEGIN;

-- Rollback de 043_business_calendar.sql
--
-- ATENCION: esto BORRA la tabla business_calendar y, con ella, TODOS los dias
-- no laborables, incluidos los que se cargaron desde Configuracion > Calendario
-- despues de la carga inicial (por ejemplo 2027). Hacer un pg_dump antes.
--
-- ANTES de aplicarlo:
--   1. Volver el frontend y el backend al codigo anterior a CAL-001A (git
--      revert del commit desde la maquina local, git pull en el servidor):
--      el codigo nuevo lee esta tabla y no arranca sin ella.
--   2. Reiniciar el backend despues de retirar la tabla.

DROP TABLE IF EXISTS public.business_calendar;

COMMIT;
