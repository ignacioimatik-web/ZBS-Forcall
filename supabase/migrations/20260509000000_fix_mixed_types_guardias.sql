-- ============================================================================
-- Migración: Corregir tipos de guardias mezclados
-- ============================================================================

-- 1. Actualizar guardias: asegurar que el tipo coincida con el personal
UPDATE guardias 
SET type = 'Médica' 
WHERE personnel_name IN (
  'Elena Benages', 'Delia Mestre', 'Frank Castillo', 
  'Fernando Sierra', 'Jorge Ramón', 'Ilie Popov', 'Externo/a'
) AND type != 'Médica';

UPDATE guardias 
SET type = 'Enfermería' 
WHERE personnel_name IN (
  'Xelo García', 'Yolanda Lainez', 'Maite Beltrán', 
  'Yolanda García', 'Rosa Carbó', 'Externo/a'
) AND type != 'Enfermería';

-- 2. Actualizar libranzas y doblas también
UPDATE libranzas 
SET type = 'Médica' 
WHERE personnel_name IN (
  'Elena Benages', 'Delia Mestre', 'Frank Castillo', 
  'Fernando Sierra', 'Jorge Ramón', 'Ilie Popov', 'Externo/a'
) AND type != 'Médica';

UPDATE libranzas 
SET type = 'Enfermería' 
WHERE personnel_name IN (
  'Xelo García', 'Yolanda Lainez', 'Maite Beltrán', 
  'Yolanda García', 'Rosa Carbó', 'Externo/a'
) AND type != 'Enfermería';

UPDATE doblas 
SET type = 'Médica' 
WHERE personnel_name IN (
  'Elena Benages',2 'Delia Mestre', 'Frank Castillo', 
  'Fernando Sierra', 'Jorge Ramón', 'Ilie Popov', 'Externo/a'
) AND type != 'Médica';

UPDATE doblas 
SET type = 'Enfermería' 
WHERE personnel_name IN (
  'Xelo García', 'Yolanda Lainez', 'Maite Beltrán', 
  'Yolanda García', 'Rosa Carbó', 'Externo/a'
) AND type != 'Enfermería';

-- 3. Verificación (opcional, para debug)
-- SELECT personnel_name, type FROM guardias ORDER BY personnel_name;
