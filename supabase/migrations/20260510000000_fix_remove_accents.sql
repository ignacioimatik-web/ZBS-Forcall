-- ===========================================================================
-- Migración: Eliminar TODAS las tildes - usar medica/enfermeria sin acentos
-- ===========================================================================

-- 1. Actualizar tipos en guardias
UPDATE guardias SET type = 'medica' WHERE type IN ('Médica', 'Médica', 'medica');
UPDATE guardias SET type = 'enfermeria' WHERE type IN ('Enfermería', 'Enfermería', 'enfermeria');

-- 2. Actualizar tipos en libranzas
UPDATE libranzas SET type = 'medica' WHERE type IN ('Médica', 'Médica', 'medica');
UPDATE libranzas SET type = 'enfermeria' WHERE type IN ('Enfermería', 'Enfermería', 'enfermeria');

-- 3. Actualizar tipos en doblas
UPDATE doblas SET type = 'medica' WHERE type IN ('Médica', 'Médica', 'medica');
UPDATE doblas SET type = 'enfermeria' WHERE type IN ('Enfermería', 'Enfermería', 'enfermeria');

-- 4. Actualizar CHECK constraints (recrear)
ALTER TABLE guardias DROP CONSTRAINT guardias_type_check;
ALTER TABLE guardias ADD CONSTRAINT guardias_type_check CHECK (type IN ('medica', 'enfermeria'));

ALTER TABLE libranzas DROP CONSTRAINT libranzas_type_check;
ALTER TABLE libranzas ADD CONSTRAINT libranzas_type_check CHECK (type IN ('medica', 'enfermeria'));

ALTER TABLE doblas DROP CONSTRAINT doblas_type_check;
ALTER TABLE doblas ADD CONSTRAINT doblas_type_check CHECK (type IN ('medica', 'enfermeria'));

-- 5. Actualizar función generadora de calendario (Edge Function) si es necesario
-- (ya usa medica/enfermeria sin acentos)

-- 6. Verificación (opcional)
-- SELECT DISTINCT type FROM guardias;
-- SELECT DISTINCT type FROM libranzas;
-- SELECT DISTINCT type FROM doblas;
