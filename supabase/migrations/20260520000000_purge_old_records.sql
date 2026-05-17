-- ============================================================================
-- Migración: Purgar registros antiguos (> 18 meses) de guardias, libranzas,
--            doblas y vacaciones automáticamente cada día.
-- ============================================================================

-- 1. Habilitar pg_cron (necesario para programar la limpieza automática)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 2. Programar la limpieza diaria a las 3:00 AM
--    Elimina registros cuya fecha sea anterior a 18 meses desde hoy.
-- ----------------------------------------------------------------------------
SELECT cron.schedule(
  'purge-old-records',          -- nombre del trabajo
  '0 3 * * *',                  -- expresión cron: todos los días a las 3 AM
  $$
    DELETE FROM public.guardias WHERE date < (CURRENT_DATE - INTERVAL '18 months');
    DELETE FROM public.libranzas WHERE date < (CURRENT_DATE - INTERVAL '18 months');
    DELETE FROM public.doblas WHERE date < (CURRENT_DATE - INTERVAL '18 months');
    DELETE FROM public.vacaciones WHERE date < (CURRENT_DATE - INTERVAL '18 months');
  $$
);

-- ============================================================================
-- NOTA: Si pg_cron no está disponible o el comando falla, ejecuta
-- manualmente las DELETE en el SQL Editor del dashboard de Supabase:
--
--   DELETE FROM public.guardias WHERE date < (CURRENT_DATE - INTERVAL '18 months');
--   DELETE FROM public.libranzas WHERE date < (CURRENT_DATE - INTERVAL '18 months');
--   DELETE FROM public.doblas WHERE date < (CURRENT_DATE - INTERVAL '18 months');
--   DELETE FROM public.vacaciones WHERE date < (CURRENT_DATE - INTERVAL '18 months');
-- ============================================================================
