-- ============================================================================
-- Migración: Eliminar CHECK constraints de tipos (dejar que la app controle)
-- ============================================================================

-- 1. Eliminar CHECK constraints (que causan errores al insertar)
ALTER TABLE guardias DROP CONSTRAINT IF EXISTS guardias_type_check;
ALTER TABLE libranzas DROP CONSTRAINT IF EXISTS libranzas_type_check;
ALTER TABLE doblas DROP CONSTRAINT IF EXISTS doblas_type_check;

-- 2. Verificación (opcional)
-- SELECT DISTINCT type FROM guardias;
-- SELECT DISTINCT type FROM libranzas;
-- SELECT DISTINCT type FROM doblas;
