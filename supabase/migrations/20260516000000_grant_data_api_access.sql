-- ============================================================================
-- Migración: Conceder acceso explícito a la API de datos para todas las tablas
-- ============================================================================
-- Requerido por el cambio de Supabase (Mayo 2026):
-- Las tablas nuevas en "public" ya no se exponen automáticamente a la API de datos.
-- A partir del 30 de octubre de 2026 aplica también a proyectos existentes.
-- ============================================================================

-- 1. GRANTS para tablas de solo lectura pública (authenticated puede SELECT)
-- ----------------------------------------------------------------------------

grant select on public.calendarios to anon;
grant select on public.calendarios to authenticated;
grant select on public.calendarios to service_role;

grant select on public.manual_holidays to anon;
grant select on public.manual_holidays to authenticated;
grant select on public.manual_holidays to service_role;

-- 2. GRANTS para tablas de lectura/escritura de authenticated
-- ----------------------------------------------------------------------------

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

grant select, insert, update, delete on public.guardias to authenticated;
grant select, insert, update, delete on public.guardias to service_role;

grant select, insert, update, delete on public.libranzas to authenticated;
grant select, insert, update, delete on public.libranzas to service_role;

grant select, insert, update, delete on public.doblas to authenticated;
grant select, insert, update, delete on public.doblas to service_role;

grant select, insert, update, delete on public.meetings to authenticated;
grant select, insert, update, delete on public.meetings to service_role;

grant select, insert, update, delete on public.alertas to authenticated;
grant select, insert, update, delete on public.alertas to service_role;

grant select, insert on public.avisos to authenticated;
grant select, insert on public.avisos to service_role;

grant select, insert on public.audit_logs to authenticated;
grant select, insert, update, delete on public.audit_logs to service_role;

grant select, insert, update, delete on public.chat_messages to authenticated;
grant select, insert, update, delete on public.chat_messages to service_role;

-- 3. Tabla vacaciones (creada en migración separada)
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.vacaciones to authenticated;
grant select, insert, update, delete on public.vacaciones to service_role;

-- 4. Secuencias (necesario si alguna tabla usa secuencias)
-- ----------------------------------------------------------------------------
grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to service_role;

-- 5. Storage (el bucket chat_media ya tiene sus propias políticas en storage.objects)
-- ----------------------------------------------------------------------------
-- Los GRANTs de storage se gestionan mediante políticas RLS en storage.objects,
-- que ya están creadas en la migración 20260515000000_create_chat_messages.sql

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
