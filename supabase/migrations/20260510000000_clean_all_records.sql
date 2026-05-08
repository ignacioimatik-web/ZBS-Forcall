-- ============================================================================
-- Migración: Borrar todos los registros y reiniciar secuencias
-- ============================================================================

-- 1. Borrar registros de todas las tablas relacionadas
DELETE FROM audit_logs;
DELETE FROM doblas;
DELETE FROM libranzas;
DELETE FROM guardias;
DELETE FROM avisos;
DELETE FROM meetings;
DELETE FROM alertas;

-- 2. Reiniciar secuencias (si las hubiera)
-- ALTER SEQUENCE guardias_id_seq RESTART WITH 1;
-- ALTER SEQUENCE libranzas_id_seq RESTART WITH 1;
-- ALTER SEQUENCE doblas_id_seq RESTART WITH 1;

-- 3. Verificación (opcional)
-- SELECT 'guardias' as tabla, count(*) FROM guardias
-- UNION ALL
-- SELECT 'libranzas', count(*) FROM libranzas
-- UNION ALL
-- SELECT 'doblas', count(*) FROM doblas
-- UNION ALL
-- SELECT 'audit_logs', count(*) FROM audit_logs;
